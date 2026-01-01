import { v4 as uuidv4 } from 'uuid';
import {
  Room,
  RoomStatus,
  Player,
  PlayerRole,
  GameType,
  AIGameContent,
  PlayerView,
  HostView,
  Message,
  Vote,
  VotingState,
  VotingResult,
  VotingView,
} from '../games/types';
import { BaseGame } from '../games/base';
import { createGame } from './factory';

export class GameStateManager {
  private rooms: Map<string, Room> = new Map();
  private gameInstances: Map<string, BaseGame> = new Map();

  createRoom(hostName: string): { roomId: string; hostId: string } {
    const roomId = uuidv4().substring(0, 8).toUpperCase();
    const hostId = uuidv4();

    const host: Player = {
      id: hostId,
      name: hostName,
      isHost: true,
      role: 'normal',
      messages: [],
    };

    const room: Room = {
      id: roomId,
      hostId,
      gameType: null,
      status: 'waiting',
      players: new Map([[hostId, host]]),
      gameInstance: null,
      aiContent: null,
      votingState: null,
      createdAt: Date.now(),
    };

    this.rooms.set(roomId, room);
    return { roomId, hostId };
  }

  joinRoom(roomId: string, playerName: string, existingPlayerId?: string): { player: Player | null; error?: string } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { player: null, error: 'Phòng không tồn tại' };
    }

    if (room.status !== 'waiting' && room.status !== 'setup') {
      return { player: null, error: 'Game đã bắt đầu' };
    }

    console.log('[joinRoom] Called with:', { roomId, playerName, existingPlayerId });
    console.log('[joinRoom] Current players:', Array.from(room.players.values()).map(p => ({ id: p.id, name: p.name, isHost: p.isHost })));

    // If existingPlayerId is provided, check if it's a reconnect
    if (existingPlayerId) {
      const existingPlayer = room.players.get(existingPlayerId);
      console.log('[joinRoom] Checking reconnect for playerId:', existingPlayerId, 'Found:', !!existingPlayer);
      if (existingPlayer) {
        // Reconnect: return existing player (allow same name)
        console.log('[joinRoom] Reconnecting existing player:', existingPlayer.name);
        return { player: existingPlayer };
      }
    }

    // If no existingPlayerId, try to find player by name (for reconnect without playerId)
    // This handles the case where player reloads page but doesn't have playerId in URL
    if (!existingPlayerId) {
      const playerByName = Array.from(room.players.values()).find(
        (p) => !p.isHost && p.name.toLowerCase() === playerName.toLowerCase()
      );
      if (playerByName) {
        console.log('[joinRoom] Found existing player by name, allowing reconnect:', playerByName.name);
        return { player: playerByName };
      }
    }

    // Check for name conflict (excluding the reconnecting player and host)
    const conflictingPlayer = Array.from(room.players.values()).find(
      (p) => !p.isHost && // Don't check against host
             p.name.toLowerCase() === playerName.toLowerCase() && 
             (!existingPlayerId || p.id !== existingPlayerId) // Exclude self if reconnecting
    );

    console.log('[joinRoom] Conflicting player:', conflictingPlayer ? { id: conflictingPlayer.id, name: conflictingPlayer.name } : null);

    if (conflictingPlayer) {
      return { player: null, error: 'Tên đã được sử dụng' };
    }

    // If reconnecting with existing ID but player not found, create new
    // (This shouldn't happen, but handle it gracefully)
    if (existingPlayerId && !room.players.has(existingPlayerId)) {
      console.log('[joinRoom] existingPlayerId provided but player not found, creating new player');
    }

    // New player
    const playerId = existingPlayerId || uuidv4();
    const player: Player = {
      id: playerId,
      name: playerName,
      isHost: false,
      role: 'normal',
      messages: [],
    };

    room.players.set(playerId, player);
    console.log('[joinRoom] Created new player:', { id: playerId, name: playerName });
    return { player };
  }

  setGameType(roomId: string, hostId: string, gameType: GameType): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'Phòng không tồn tại' };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: 'Chỉ host mới có thể chọn game' };
    }

    room.gameType = gameType;
    room.status = 'setup';
    return { success: true };
  }

  setAIContent(roomId: string, hostId: string, aiContent: AIGameContent): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'Phòng không tồn tại' };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: 'Chỉ host mới có thể thiết lập game' };
    }

    room.aiContent = aiContent;
    return { success: true };
  }

  startGame(roomId: string, hostId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);

    if (!room) {
      return { success: false, error: 'Phòng không tồn tại' };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: 'Chỉ host mới có thể bắt đầu game' };
    }

    if (!room.gameType) {
      return { success: false, error: 'Chưa chọn loại game' };
    }

    if (!room.aiContent) {
      return { success: false, error: 'Chưa thiết lập nội dung game' };
    }

    const players = Array.from(room.players.values()).filter((p) => !p.isHost);
    if (players.length < 3) {
      return { success: false, error: 'Cần ít nhất 4 người (1 host + 3 người chơi)' };
    }

    // Create game instance
    const gameInstance = createGame(room.gameType, room.aiContent);
    gameInstance.setup(room.players);
    this.gameInstances.set(roomId, gameInstance);

    room.status = 'playing';
    room.gameInstance = gameInstance.getState();

    return { success: true };
  }

  addMessage(
    roomId: string,
    playerId: string,
    content: string
  ): { success: boolean; message?: Message; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Phòng không tồn tại' };
    }

    const gameInstance = this.gameInstances.get(roomId);
    if (!gameInstance) {
      return { success: false, error: 'Game chưa bắt đầu' };
    }

    if (room.status !== 'playing') {
      return { success: false, error: 'Game không ở trạng thái chơi' };
    }

    const message = gameInstance.handleMessage(playerId, content);
    if (!message) {
      return { success: false, error: 'Không thể gửi tin nhắn' };
    }

    // Update room's game state
    room.gameInstance = gameInstance.getState();

    return { success: true, message };
  }

  answerQuestion(
    roomId: string,
    hostId: string,
    messageId: string,
    answer: boolean
  ): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Phòng không tồn tại' };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: 'Chỉ host mới có thể trả lời câu hỏi' };
    }

    const gameInstance = this.gameInstances.get(roomId);
    if (!gameInstance) {
      return { success: false, error: 'Game chưa bắt đầu' };
    }

    if (room.gameType !== 'answer-filter') {
      return { success: false, error: 'Chỉ Answer Filter game mới có tính năng này' };
    }

    const answerFilterGame = gameInstance as any;
    if (typeof answerFilterGame.answerQuestion !== 'function') {
      return { success: false, error: 'Game không hỗ trợ trả lời câu hỏi' };
    }

    const success = answerFilterGame.answerQuestion(messageId, answer);
    if (!success) {
      return { success: false, error: 'Không tìm thấy câu hỏi' };
    }

    // Update room's game state
    room.gameInstance = gameInstance.getState();

    return { success: true };
  }

  getPlayerView(roomId: string, playerId: string): PlayerView | null {
    const room = this.rooms.get(roomId);
    if (!room) return null;

    const currentPlayer = room.players.get(playerId);
    const gameInstance = this.gameInstances.get(roomId);

    const players = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      hasSpoken: p.messages.length > 0,
    }));

    let gameInfo = null;
    let messages: Message[] = [];

    if (gameInstance && currentPlayer) {
      gameInfo = gameInstance.getPlayerInfo(playerId);
      messages = gameInstance.getMessages();
    }

    // Get voting view
    const votingView = this.getVotingView(roomId, playerId);

    return {
      roomId: room.id,
      gameType: room.gameType,
      status: room.status,
      players,
      currentPlayer: currentPlayer
        ? {
            id: currentPlayer.id,
            name: currentPlayer.name,
            role: currentPlayer.role,
            privateInfo: currentPlayer.privateInfo,
          }
        : null,
      gameInfo,
      messages,
      votingView,
    };
  }

  getHostView(roomId: string, hostId: string): HostView | null {
    const room = this.rooms.get(roomId);
    if (!room || room.hostId !== hostId) return null;

    const gameInstance = this.gameInstances.get(roomId);

    const players = Array.from(room.players.values()).map((p) => ({
      id: p.id,
      name: p.name,
      isHost: p.isHost,
      role: p.role,
      privateInfo: p.privateInfo,
      hasSpoken: p.messages.length > 0,
    }));

    let gameInfo = null;
    let messages: Message[] = [];

    if (gameInstance) {
      gameInfo = gameInstance.getHostInfo();
      messages = gameInstance.getMessages();
    }

    // Get voting view for host
    const votingView = this.getVotingView(roomId, hostId);

    return {
      roomId: room.id,
      gameType: room.gameType,
      status: room.status,
      players,
      aiContent: room.aiContent,
      gameInfo,
      messages,
      votingView,
    };
  }

  endGame(roomId: string, hostId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Phòng không tồn tại' };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: 'Chỉ host mới có thể kết thúc game' };
    }

    room.status = 'ended';
    this.gameInstances.delete(roomId);
    return { success: true };
  }

  resetRoom(roomId: string, hostId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Phòng không tồn tại' };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: 'Chỉ host mới có thể reset phòng' };
    }

    // Reset players
    room.players.forEach((player) => {
      player.role = 'normal';
      player.privateInfo = undefined;
      player.messages = [];
    });

    room.status = 'waiting';
    room.gameType = null;
    room.aiContent = null;
    room.gameInstance = null;
    room.votingState = null;
    this.gameInstances.delete(roomId);

    return { success: true };
  }

  // Voting methods
  startVoting(roomId: string, hostId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Phòng không tồn tại' };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: 'Chỉ host mới có thể bắt đầu vote' };
    }

    if (room.status !== 'playing') {
      return { success: false, error: 'Game phải đang chơi để bắt đầu vote' };
    }

    room.status = 'voting';
    room.votingState = {
      votes: new Map(),
      isActive: true,
      startedAt: Date.now(),
    };

    return { success: true };
  }

  castVote(roomId: string, voterId: string, targetId: string): { success: boolean; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Phòng không tồn tại' };
    }

    if (room.status !== 'voting' || !room.votingState?.isActive) {
      return { success: false, error: 'Voting không hoạt động' };
    }

    const voter = room.players.get(voterId);
    if (!voter || voter.isHost) {
      return { success: false, error: 'Chỉ người chơi mới có thể vote' };
    }

    const target = room.players.get(targetId);
    if (!target || target.isHost) {
      return { success: false, error: 'Không thể vote người này' };
    }

    if (voterId === targetId) {
      return { success: false, error: 'Không thể vote chính mình' };
    }

    const vote: Vote = {
      voterId,
      voterName: voter.name,
      targetId,
      timestamp: Date.now(),
    };

    room.votingState.votes.set(voterId, vote);
    return { success: true };
  }

  endVoting(roomId: string, hostId: string): { success: boolean; results?: VotingResult[]; error?: string } {
    const room = this.rooms.get(roomId);
    if (!room) {
      return { success: false, error: 'Phòng không tồn tại' };
    }

    if (room.hostId !== hostId) {
      return { success: false, error: 'Chỉ host mới có thể kết thúc vote' };
    }

    if (!room.votingState) {
      return { success: false, error: 'Không có phiên vote nào' };
    }

    room.votingState.isActive = false;

    // Calculate results
    const voteCounts = new Map<string, { count: number; voters: string[] }>();
    
    room.votingState.votes.forEach((vote) => {
      if (!voteCounts.has(vote.targetId)) {
        voteCounts.set(vote.targetId, { count: 0, voters: [] });
      }
      const entry = voteCounts.get(vote.targetId)!;
      entry.count++;
      entry.voters.push(vote.voterName);
    });

    const results: VotingResult[] = [];
    voteCounts.forEach((value, targetId) => {
      const target = room.players.get(targetId);
      results.push({
        targetId,
        targetName: target?.name || 'Unknown',
        voteCount: value.count,
        voters: value.voters,
      });
    });

    // Sort by vote count descending
    results.sort((a, b) => b.voteCount - a.voteCount);

    return { success: true, results };
  }

  getVotingView(roomId: string, playerId: string): VotingView | null {
    const room = this.rooms.get(roomId);
    if (!room || !room.votingState) return null;

    const player = room.players.get(playerId);
    if (!player) return null;

    const myVote = room.votingState.votes.get(playerId);
    
    // Calculate current vote counts
    const voteCounts: Record<string, number> = {};
    room.votingState.votes.forEach((vote) => {
      voteCounts[vote.targetId] = (voteCounts[vote.targetId] || 0) + 1;
    });

    return {
      isActive: room.votingState.isActive,
      hasVoted: !!myVote,
      myVote: myVote?.targetId,
      voteCounts,
    };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  removeRoom(roomId: string): void {
    this.rooms.delete(roomId);
    this.gameInstances.delete(roomId);
  }
}

export const gameStateManager = new GameStateManager();

