import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'http';
import { gameStateManager } from '../engine/state';
import { GameType, AIGameContent } from '../games/types';

// Lazy import to avoid initialization errors when OpenAI key is not set
async function getOpenAIFunctions() {
  const { generateGameContent, regenerateGameContent } = await import('../openai/client');
  return { generateGameContent, regenerateGameContent };
}

export interface ExtendedWebSocket extends WebSocket {
  roomId?: string;
  playerId?: string;
  isAlive?: boolean;
}

interface WSMessage {
  type: string;
  payload?: any;
  error?: string;
}

export class WSServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Set<ExtendedWebSocket>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;

  // Initialize WebSocket server without attaching to HTTP server
  initializeStandalone() {
    if (this.wss) return; // Already initialized

    this.wss = new WebSocketServer({
      noServer: true,
    });

    this.setupConnectionHandler();
    this.startHeartbeat();
  }

  // Initialize with HTTP server (old method, kept for compatibility)
  initialize(server?: any) {
    this.initializeStandalone();

    // Handle upgrade requests from HTTP server
    if (server) {
      server.on('upgrade', (request: any, socket: any, head: any) => {
        const { pathname } = require('url').parse(request.url);

        if (pathname === '/api/ws') {
          this.handleUpgrade(request, socket, head);
        }
        // Don't destroy socket for other paths - let Next.js handle them
      });
    }
  }

  // Handle WebSocket upgrade request
  handleUpgrade(request: any, socket: any, head: any) {
    if (!this.wss) {
      this.initializeStandalone();
    }

    console.log('[WS] Handling upgrade request for /api/ws');
    
    this.wss!.handleUpgrade(request, socket, head, (ws: ExtendedWebSocket) => {
      console.log('[WS] Connection established');
      this.wss!.emit('connection', ws, request);
    });
  }

  private setupConnectionHandler() {
    if (!this.wss) return;

    this.wss.on('connection', (ws: ExtendedWebSocket, req: IncomingMessage) => {
      ws.isAlive = true;

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('message', async (data: Buffer) => {
        try {
          const message: WSMessage = JSON.parse(data.toString());
          await this.handleMessage(ws, message);
        } catch (error) {
          this.sendError(ws, 'Invalid message format');
        }
      });

      ws.on('close', () => {
        this.handleDisconnect(ws);
      });

      ws.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    });
  }

  private startHeartbeat() {
    if (this.heartbeatInterval) return;

    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) {
        if (this.heartbeatInterval) {
          clearInterval(this.heartbeatInterval);
          this.heartbeatInterval = null;
        }
        return;
      }

      this.wss.clients.forEach((ws: ExtendedWebSocket) => {
        if (!ws.isAlive) {
          ws.terminate();
          return;
        }
        ws.isAlive = false;
        ws.ping();
      });
    }, 30000);
  }

  private async handleMessage(ws: ExtendedWebSocket, message: WSMessage) {
    switch (message.type) {
      case 'create-room':
        this.handleCreateRoom(ws, message.payload);
        break;
      case 'join-room':
        this.handleJoinRoom(ws, message.payload);
        break;
      case 'select-game':
        this.handleSelectGame(ws, message.payload);
        break;
      case 'generate-content':
        await this.handleGenerateContent(ws, message.payload);
        break;
      case 'regenerate-content':
        await this.handleRegenerateContent(ws, message.payload);
        break;
      case 'set-content':
        this.handleSetContent(ws, message.payload);
        break;
      case 'start-game':
        this.handleStartGame(ws, message.payload);
        break;
      case 'send-message':
        this.handleSendMessage(ws, message.payload);
        break;
      case 'get-state':
        this.handleGetState(ws, message.payload);
        break;
      case 'end-game':
        this.handleEndGame(ws, message.payload);
        break;
      case 'reset-room':
        this.handleResetRoom(ws, message.payload);
        break;
      case 'answer-question':
        this.handleAnswerQuestion(ws, message.payload);
        break;
      default:
        this.sendError(ws, `Unknown message type: ${message.type}`);
    }
  }

  private handleCreateRoom(ws: ExtendedWebSocket, payload: any) {
    const { hostName } = payload;
    if (!hostName) {
      this.sendError(ws, 'Host name is required');
      return;
    }

    const { roomId, hostId } = gameStateManager.createRoom(hostName);
    ws.roomId = roomId;
    ws.playerId = hostId;

    this.addClientToRoom(roomId, ws);

    const hostView = gameStateManager.getHostView(roomId, hostId);

    this.send(ws, {
      type: 'room-created',
      payload: { roomId, hostId, hostView },
    });
  }

  private handleJoinRoom(ws: ExtendedWebSocket, payload: any) {
    const { roomId, playerName } = payload;
    if (!roomId || !playerName) {
      this.sendError(ws, 'Room ID and player name are required');
      return;
    }

    const result = gameStateManager.joinRoom(roomId, playerName);
    if (result.error || !result.player) {
      this.sendError(ws, result.error || 'Failed to join room');
      return;
    }

    ws.roomId = roomId;
    ws.playerId = result.player.id;

    this.addClientToRoom(roomId, ws);
    this.broadcastRoomState(roomId);
  }

  private handleSelectGame(ws: ExtendedWebSocket, payload: any) {
    const { roomId, hostId, gameType } = payload;
    if (!roomId || !hostId || !gameType) {
      this.sendError(ws, 'Room ID, host ID, and game type are required');
      return;
    }

    const result = gameStateManager.setGameType(roomId, hostId, gameType as GameType);
    if (result.error) {
      this.sendError(ws, result.error);
      return;
    }

    this.broadcastRoomState(roomId);
  }

  private async handleGenerateContent(ws: ExtendedWebSocket, payload: any) {
    const { roomId, hostId, gameType, playerCount, options } = payload;
    if (!roomId || !hostId || !gameType) {
      this.sendError(ws, 'Room ID, host ID, and game type are required');
      return;
    }

    try {
      this.send(ws, { type: 'generating-content', payload: { status: 'loading' } });

      const { generateGameContent } = await getOpenAIFunctions();
      const aiContent = await generateGameContent(
        gameType as GameType,
        playerCount || 6,
        options
      );

      this.send(ws, {
        type: 'content-generated',
        payload: { aiContent },
      });
    } catch (error: any) {
      this.sendError(ws, `Failed to generate content: ${error.message}`);
    }
  }

  private async handleRegenerateContent(ws: ExtendedWebSocket, payload: any) {
    const { roomId, hostId, gameType, playerCount, previousContent, feedback } = payload;
    if (!roomId || !hostId || !gameType) {
      this.sendError(ws, 'Room ID, host ID, and game type are required');
      return;
    }

    try {
      this.send(ws, { type: 'generating-content', payload: { status: 'loading' } });

      const { regenerateGameContent } = await getOpenAIFunctions();
      const aiContent = await regenerateGameContent(
        gameType as GameType,
        playerCount || 6,
        previousContent,
        feedback
      );

      this.send(ws, {
        type: 'content-generated',
        payload: { aiContent },
      });
    } catch (error: any) {
      this.sendError(ws, `Failed to regenerate content: ${error.message}`);
    }
  }

  private handleSetContent(ws: ExtendedWebSocket, payload: any) {
    const { roomId, hostId, aiContent } = payload;
    if (!roomId || !hostId || !aiContent) {
      this.sendError(ws, 'Room ID, host ID, and AI content are required');
      return;
    }

    const result = gameStateManager.setAIContent(roomId, hostId, aiContent);
    if (result.error) {
      this.sendError(ws, result.error);
      return;
    }

    this.send(ws, { type: 'content-set', payload: { success: true } });
    this.broadcastRoomState(roomId);
  }

  private handleStartGame(ws: ExtendedWebSocket, payload: any) {
    const { roomId, hostId } = payload;
    if (!roomId || !hostId) {
      this.sendError(ws, 'Room ID and host ID are required');
      return;
    }

    const result = gameStateManager.startGame(roomId, hostId);
    if (result.error) {
      this.sendError(ws, result.error);
      return;
    }

    this.broadcastRoomState(roomId);
  }

  private handleSendMessage(ws: ExtendedWebSocket, payload: any) {
    const { roomId, playerId, content } = payload;
    if (!roomId || !playerId || !content) {
      this.sendError(ws, 'Room ID, player ID, and content are required');
      return;
    }

    const result = gameStateManager.addMessage(roomId, playerId, content);
    if (result.error) {
      this.sendError(ws, result.error);
      return;
    }

    // Send validation result to the sender
    if (result.message) {
      this.send(ws, {
        type: 'message-result',
        payload: {
          valid: result.message.isValid,
          violations: result.message.violations,
        },
      });
    }

    this.broadcastRoomState(roomId);
  }

  private handleGetState(ws: ExtendedWebSocket, payload: any) {
    const { roomId, playerId, isHost } = payload;
    if (!roomId) {
      this.sendError(ws, 'Room ID is required');
      return;
    }

    // Register the WebSocket connection with the room
    ws.roomId = roomId;
    ws.playerId = playerId;
    this.addClientToRoom(roomId, ws);

    if (isHost && playerId) {
      const hostView = gameStateManager.getHostView(roomId, playerId);
      if (!hostView) {
        this.sendError(ws, 'Room not found');
        return;
      }
      this.send(ws, { type: 'state-update', payload: { hostView } });
    } else if (playerId) {
      const playerView = gameStateManager.getPlayerView(roomId, playerId);
      if (!playerView) {
        this.sendError(ws, 'Room not found');
        return;
      }
      this.send(ws, { type: 'state-update', payload: { playerView } });
    }
  }

  private handleEndGame(ws: ExtendedWebSocket, payload: any) {
    const { roomId, hostId } = payload;
    if (!roomId || !hostId) {
      this.sendError(ws, 'Room ID and host ID are required');
      return;
    }

    const result = gameStateManager.endGame(roomId, hostId);
    if (result.error) {
      this.sendError(ws, result.error);
      return;
    }

    this.broadcastRoomState(roomId);
  }

  private handleResetRoom(ws: ExtendedWebSocket, payload: any) {
    const { roomId, hostId } = payload;
    if (!roomId || !hostId) {
      this.sendError(ws, 'Room ID and host ID are required');
      return;
    }

    const result = gameStateManager.resetRoom(roomId, hostId);
    if (result.error) {
      this.sendError(ws, result.error);
      return;
    }

    this.broadcastRoomState(roomId);
  }

  private handleAnswerQuestion(ws: ExtendedWebSocket, payload: any) {
    const { roomId, hostId, messageId, answer } = payload;
    if (!roomId || !hostId || !messageId || answer === undefined) {
      this.sendError(ws, 'Room ID, host ID, message ID, and answer are required');
      return;
    }

    const result = gameStateManager.answerQuestion(roomId, hostId, messageId, answer);
    if (result.error) {
      this.sendError(ws, result.error);
      return;
    }

    this.broadcastRoomState(roomId);
  }

  private broadcastRoomState(roomId: string) {
    const room = gameStateManager.getRoom(roomId);
    if (!room) return;

    const clients = this.clients.get(roomId);
    if (!clients) return;

    clients.forEach((ws) => {
      if (!ws.playerId) return;

      const player = room.players.get(ws.playerId);
      if (!player) return;

      if (player.isHost) {
        const hostView = gameStateManager.getHostView(roomId, ws.playerId);
        if (hostView) {
          this.send(ws, { type: 'state-update', payload: { hostView } });
        }
      } else {
        const playerView = gameStateManager.getPlayerView(roomId, ws.playerId);
        if (playerView) {
          this.send(ws, { type: 'state-update', payload: { playerView } });
        }
      }
    });
  }

  private addClientToRoom(roomId: string, ws: ExtendedWebSocket) {
    if (!this.clients.has(roomId)) {
      this.clients.set(roomId, new Set());
    }
    this.clients.get(roomId)!.add(ws);
  }

  private handleDisconnect(ws: ExtendedWebSocket) {
    if (ws.roomId) {
      const clients = this.clients.get(ws.roomId);
      if (clients) {
        clients.delete(ws);
        if (clients.size === 0) {
          this.clients.delete(ws.roomId);
        }
      }
    }
  }

  private send(ws: ExtendedWebSocket, message: WSMessage) {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify(message));
    }
  }

  private sendError(ws: ExtendedWebSocket, error: string) {
    this.send(ws, { type: 'error', error });
  }

  close() {
    if (this.wss) {
      this.wss.close();
    }
  }
}

export const wsServer = new WSServer();
