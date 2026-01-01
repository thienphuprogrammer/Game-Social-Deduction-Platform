'use client';

import { Suspense, useEffect, useState, useRef, useCallback } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { GameType, AIGameContent, HostView, PlayerView as PlayerViewType } from '@/lib/games/types';
import GameSelector from '@/components/Games/GameSelector';
import AIAssistant from '@/components/Host/AIAssistant';
import HostControls from '@/components/Host/HostControls';
import PlayerManager from '@/components/Host/PlayerManager';
import AnswerFilterPanel from '@/components/Host/AnswerFilterPanel';
import PlayerView from '@/components/Player/PlayerView';
import MessageList from '@/components/Player/MessageList';
import ErrorToast from '@/components/UI/ErrorToast';
import SuccessToast from '@/components/UI/SuccessToast';

function RoomPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  
  const roomId = params.id as string;
  const isHost = searchParams.get('host') === 'true';
  const playerName = searchParams.get('name') || '';
  const playerIdParam = searchParams.get('playerId') || '';

  const [hostView, setHostView] = useState<HostView | null>(null);
  const [playerView, setPlayerView] = useState<PlayerViewType | null>(null);
  const [playerId, setPlayerId] = useState(playerIdParam);
  const [selectedGame, setSelectedGame] = useState<GameType | null>(null);
  const [aiContent, setAiContent] = useState<AIGameContent | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [connected, setConnected] = useState(false);
  const [lastMessageResult, setLastMessageResult] = useState<{ valid: boolean; violations?: string[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const isConnecting = useRef(false);

  const sendMessage = useCallback((type: string, payload: any) => {
    console.log('[WS] sendMessage called', { 
      type, 
      hasWs: !!wsRef.current,
      readyState: wsRef.current?.readyState,
      isOpen: wsRef.current?.readyState === WebSocket.OPEN
    });
    
    if (!wsRef.current) {
      const errorMsg = 'WebSocket chưa được khởi tạo';
      console.error('[WS] Error:', errorMsg);
      setError(errorMsg);
      return;
    }
    
    if (wsRef.current.readyState === WebSocket.OPEN) {
      const messageStr = JSON.stringify({ type, payload });
      console.log('[WS] Sending message:', type, 'Payload size:', messageStr.length, 'bytes');
      try {
        wsRef.current.send(messageStr);
        console.log('[WS] Message sent successfully');
      } catch (error) {
        console.error('[WS] Error sending message:', error);
        setError(`Lỗi khi gửi tin nhắn: ${error}`);
      }
    } else {
      const stateNames = {
        [WebSocket.CONNECTING]: 'CONNECTING',
        [WebSocket.OPEN]: 'OPEN',
        [WebSocket.CLOSING]: 'CLOSING',
        [WebSocket.CLOSED]: 'CLOSED'
      };
      const stateName = stateNames[wsRef.current.readyState] || 'UNKNOWN';
      const errorMsg = `WebSocket không kết nối (${stateName}). Đang kết nối lại...`;
      console.warn('[WS] WebSocket not connected:', stateName, 'Cannot send message:', type);
      setError(errorMsg);
    }
  }, []);

  useEffect(() => {
    if (!playerName) {
      router.push('/');
      return;
    }

    // Prevent duplicate connections in React Strict Mode
    if (isConnecting.current || wsRef.current) return;
    isConnecting.current = true;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      setConnected(true);
      
      if (isHost && playerId) {
        ws.send(JSON.stringify({ type: 'get-state', payload: { roomId, playerId, isHost: true } }));
      } else {
        // Include existing playerId if available (for reconnect)
        const payload = { 
          roomId, 
          playerName, 
          existingPlayerId: playerIdParam || undefined 
        };
        console.log('[RoomPage] Sending join-room:', payload);
        ws.send(JSON.stringify({ 
          type: 'join-room', 
          payload
        }));
      }
    };

    ws.onmessage = (event) => {
      const message = JSON.parse(event.data);
      console.log('[WS] Received message:', message.type, message);

      switch (message.type) {
        case 'error':
          setError(message.error);
          if (message.error.includes('không tồn tại')) {
            setTimeout(() => router.push('/'), 2000);
          }
          break;

        case 'room-created':
          setHostView(message.payload.hostView);
          setPlayerId(message.payload.hostId);
          break;

        case 'state-update':
          if (message.payload.hostView) {
            setHostView(message.payload.hostView);
            setSelectedGame(message.payload.hostView.gameType);
            setAiContent(message.payload.hostView.aiContent);
          }
          if (message.payload.playerView) {
            setPlayerView(message.payload.playerView);
            setPlayerId(message.payload.playerView.currentPlayer?.id || playerId);
          }
          break;

        case 'generating-content':
          setIsGenerating(true);
          break;

        case 'content-generated':
          setIsGenerating(false);
          setAiContent(message.payload.aiContent);
          break;

        case 'content-set':
          // Content was set successfully - state will be updated via broadcastRoomState
          console.log('[WS] Content set successfully');
          setSuccessMessage('Đã chấp nhận nội dung thành công!');
          setTimeout(() => setSuccessMessage(null), 3000);
          break;

        case 'message-result':
          // Handle message validation result
          setLastMessageResult({
            valid: message.payload.valid,
            violations: message.payload.violations,
          });
          // Clear after 5 seconds
          setTimeout(() => setLastMessageResult(null), 5000);
          break;
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      setConnected(false);
    };

    ws.onclose = () => {
      setConnected(false);
      isConnecting.current = false;
      wsRef.current = null;
      
      // Attempt to reconnect after 2 seconds if not navigating away
      if (roomId && playerName) {
        setTimeout(() => {
          if (!wsRef.current && !isConnecting.current) {
            isConnecting.current = true;
            const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
            const wsUrl = `${protocol}//${window.location.host}/api/ws`;
            const newWs = new WebSocket(wsUrl);
            wsRef.current = newWs;

            newWs.onopen = () => {
              setConnected(true);
              if (isHost && playerId) {
                newWs.send(JSON.stringify({ type: 'get-state', payload: { roomId, playerId, isHost: true } }));
              } else {
                // Include existing playerId for reconnect
                newWs.send(JSON.stringify({ 
                  type: 'join-room', 
                  payload: { roomId, playerName, existingPlayerId: playerId || undefined } 
                }));
              }
            };

            newWs.onmessage = ws.onmessage;
            newWs.onerror = ws.onerror;
            newWs.onclose = ws.onclose;
          }
        }, 2000);
      }
    };

    return () => {
      // Don't close immediately - allow ongoing operations to complete
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
        wsRef.current = null;
        isConnecting.current = false;
      }, 100);
    };
  }, [roomId, playerName, isHost, playerIdParam, router, playerId, sendMessage]);

  // Handlers
  const handleSelectGame = (gameType: GameType) => {
    setSelectedGame(gameType);
    setAiContent(null);
    sendMessage('select-game', { roomId, hostId: playerId, gameType });
  };

  const handleGenerateContent = () => {
    if (!selectedGame) return;
    setIsGenerating(true);
    sendMessage('generate-content', {
      roomId,
      hostId: playerId,
      gameType: selectedGame,
      playerCount: hostView?.players.length || 6,
    });
  };

  const handleRegenerateContent = (feedback?: string) => {
    if (!selectedGame) return;
    setIsGenerating(true);
    sendMessage('regenerate-content', {
      roomId,
      hostId: playerId,
      gameType: selectedGame,
      playerCount: hostView?.players.length || 6,
      previousContent: aiContent,
      feedback,
    });
  };

  const handleAcceptContent = (content: AIGameContent) => {
    console.log('[Accept] handleAcceptContent called', { 
      playerId, 
      roomId, 
      hasContent: !!content,
      contentKeys: content ? Object.keys(content) : null,
      wsReady: wsRef.current?.readyState,
      wsState: wsRef.current?.readyState === WebSocket.OPEN ? 'OPEN' : wsRef.current?.readyState === WebSocket.CONNECTING ? 'CONNECTING' : wsRef.current?.readyState === WebSocket.CLOSING ? 'CLOSING' : 'CLOSED'
    });
    
    if (!playerId) {
      const errorMsg = 'Chưa có thông tin người chơi. Vui lòng đợi...';
      console.error('[Accept] Error:', errorMsg);
      setError(errorMsg);
      return;
    }
    if (!roomId) {
      const errorMsg = 'Chưa có thông tin phòng. Vui lòng đợi...';
      console.error('[Accept] Error:', errorMsg);
      setError(errorMsg);
      return;
    }
    if (!content) {
      const errorMsg = 'Không có nội dung để chấp nhận';
      console.error('[Accept] Error:', errorMsg);
      setError(errorMsg);
      return;
    }
    
    console.log('[Accept] Setting content and sending message...');
    setAiContent(content);
    sendMessage('set-content', { roomId, hostId: playerId, aiContent: content });
    console.log('[Accept] Message sent');
  };

  const handleEditContent = (content: AIGameContent) => {
    if (!playerId) {
      setError('Chưa có thông tin người chơi. Vui lòng đợi...');
      return;
    }
    if (!roomId) {
      setError('Chưa có thông tin phòng. Vui lòng đợi...');
      return;
    }
    setAiContent(content);
    sendMessage('set-content', { roomId, hostId: playerId, aiContent: content });
  };

  const handleStartGame = () => {
    sendMessage('start-game', { roomId, hostId: playerId });
  };

  const handleEndGame = () => {
    sendMessage('end-game', { roomId, hostId: playerId });
  };

  const handleResetRoom = () => {
    setSelectedGame(null);
    setAiContent(null);
    sendMessage('reset-room', { roomId, hostId: playerId });
  };

  const handleSendPlayerMessage = (content: string) => {
    sendMessage('send-message', { roomId, playerId, content });
  };

  const handleAnswerQuestion = (messageId: string, answer: boolean) => {
    sendMessage('answer-question', { roomId, hostId: playerId, messageId, answer });
  };

  // Loading state
  if (!connected) {
    return (
      <>
        <ErrorToast error={error} onClose={() => setError(null)} />
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-6"></div>
            <p className="text-white text-lg">Đang kết nối...</p>
          </div>
        </div>
      </>
    );
  }

  // Host View
  if (isHost || hostView) {
    const view = hostView;
    if (!view) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-slate-100">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
        </div>
      );
    }

    const status = view.status;
    const showGameSelector = status === 'waiting' || (status === 'setup' && !selectedGame);
    const showAIAssistant = status === 'setup' && selectedGame;
    const showGamePlay = status === 'playing' || status === 'voting' || status === 'ended';

    return (
      <>
        <ErrorToast error={error} onClose={() => setError(null)} />
        <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
          <div className="max-w-7xl mx-auto space-y-6">
          {/* Host Controls */}
          <HostControls
            roomId={roomId}
            status={status}
            playerCount={view.players.length}
            hasGameType={!!selectedGame}
            hasContent={!!aiContent}
            onStartGame={handleStartGame}
            onEndGame={handleEndGame}
            onResetRoom={handleResetRoom}
          />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Game Selector */}
              {showGameSelector && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">🎮 Chọn loại game</h2>
                  <GameSelector
                    selectedGame={selectedGame}
                    onSelectGame={handleSelectGame}
                    disabled={status !== 'waiting' && status !== 'setup'}
                  />
                </div>
              )}

              {/* AI Assistant */}
              {showAIAssistant && selectedGame && (
                <AIAssistant
                  gameType={selectedGame}
                  aiContent={aiContent}
                  isLoading={isGenerating}
                  onGenerate={handleGenerateContent}
                  onRegenerate={handleRegenerateContent}
                  onAccept={handleAcceptContent}
                  onEdit={handleEditContent}
                />
              )}

              {/* Answer Filter Panel - Special UI for Answer Filter game */}
              {showGamePlay && selectedGame === 'answer-filter' && view.messages.length > 0 && (
                <AnswerFilterPanel
                  messages={view.messages}
                  onAnswer={handleAnswerQuestion}
                />
              )}

              {/* Game Messages */}
              {showGamePlay && view.messages.length > 0 && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">💬 Tin nhắn</h2>
                  <MessageList messages={view.messages} currentPlayerId={playerId} />
                </div>
              )}

              {/* Game Info for Host */}
              {showGamePlay && view.gameInfo && (
                <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
                  <h2 className="text-xl font-bold text-slate-800 mb-4">🔒 Thông tin bí mật (chỉ Host thấy)</h2>
                  <div className="bg-amber-50 p-4 rounded-lg border border-amber-200">
                    <p className="text-amber-800">{view.gameInfo.secretInfo}</p>
                  </div>
                </div>
              )}
            </div>

            {/* Sidebar - Players */}
            <div>
              <PlayerManager players={view.players} status={status} />
            </div>
          </div>
        </div>
      </div>
      </>
    );
  }

  // Player View
  if (playerView) {
    return (
      <>
        <ErrorToast error={error} onClose={() => setError(null)} />
        <SuccessToast message={successMessage} onClose={() => setSuccessMessage(null)} />
        <div className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 p-4">
          <div className="max-w-2xl mx-auto">
            <PlayerView 
              view={playerView} 
              onSendMessage={handleSendPlayerMessage}
              lastMessageResult={lastMessageResult}
            />
          </div>
        </div>
      </>
    );
  }

  // Fallback loading
  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-6"></div>
        <p className="text-white text-lg">Đang tải...</p>
      </div>
    </div>
  );
}

export default function RoomPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <RoomPageContent />
    </Suspense>
  );
}
