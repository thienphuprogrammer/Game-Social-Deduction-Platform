'use client';

import React from 'react';
import { PlayerView as PlayerViewType, PlayerRole } from '@/lib/games/types';
import MessageInput from './MessageInput';
import MessageList from './MessageList';

interface PlayerViewProps {
  view: PlayerViewType;
  onSendMessage: (content: string) => void;
  lastMessageResult?: { valid: boolean; violations?: string[] } | null;
}

const ROLE_DISPLAY: Record<PlayerRole, { label: string; color: string; icon: string }> = {
  normal: { label: 'Người chơi', color: 'bg-green-100 text-green-700 border-green-300', icon: '👤' },
  spy: { label: 'Spy', color: 'bg-red-100 text-red-700 border-red-300', icon: '🕵️' },
  culprit: { label: 'Thủ phạm', color: 'bg-red-100 text-red-700 border-red-300', icon: '🦹' },
  accomplice: { label: 'Đồng phạm', color: 'bg-orange-100 text-orange-700 border-orange-300', icon: '🤝' },
  saboteur: { label: 'Kẻ phá', color: 'bg-purple-100 text-purple-700 border-purple-300', icon: '💣' },
  liar: { label: 'Kẻ dối', color: 'bg-pink-100 text-pink-700 border-pink-300', icon: '🤥' },
};

export default function PlayerView({ view, onSendMessage, lastMessageResult }: PlayerViewProps) {
  const { currentPlayer, gameInfo, status, players, messages } = view;

  if (!currentPlayer) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center text-slate-500">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600 mx-auto mb-4"></div>
          <p>Đang tải...</p>
        </div>
      </div>
    );
  }

  const roleDisplay = ROLE_DISPLAY[currentPlayer.role];
  const canSendMessage = status === 'playing' || status === 'voting';

  return (
    <div className="space-y-6">
      {/* Role Card */}
      {status !== 'waiting' && status !== 'setup' && (
        <div className={`rounded-xl p-6 border-2 ${roleDisplay.color}`}>
          <div className="flex items-center gap-3 mb-3">
            <span className="text-3xl">{roleDisplay.icon}</span>
            <div>
              <h2 className="text-xl font-bold">{roleDisplay.label}</h2>
              <p className="text-sm opacity-80">Xin chào, {currentPlayer.name}!</p>
            </div>
          </div>

          {currentPlayer.privateInfo && (
            <div className="bg-white bg-opacity-50 rounded-lg p-3 mt-3">
              <p className="font-medium text-sm">🔒 Thông tin bí mật:</p>
              <p className="text-sm">{currentPlayer.privateInfo}</p>
            </div>
          )}
        </div>
      )}

      {/* Game Info & Hints */}
      {gameInfo && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 mb-3">📋 Hướng dẫn</h3>
          
          {gameInfo.topic && (
            <div className="mb-3 p-3 bg-indigo-50 rounded-lg">
              <span className="font-medium text-indigo-700">Chủ đề:</span>
              <span className="ml-2 text-indigo-600">{gameInfo.topic}</span>
            </div>
          )}

          <div className="mb-3 p-3 bg-slate-50 rounded-lg">
            <span className="font-medium text-slate-700">Format câu nói:</span>
            <p className="text-slate-600 italic mt-1">"{gameInfo.promptTemplate}"</p>
          </div>

          {gameInfo.privateConstraint && (
            <div className="mb-3 p-3 bg-amber-50 rounded-lg border border-amber-200">
              <span className="font-medium text-amber-700">⚠️ Ràng buộc của bạn:</span>
              <p className="text-amber-600">{gameInfo.privateConstraint}</p>
            </div>
          )}

          {gameInfo.hints && gameInfo.hints.length > 0 && (
            <div>
              <span className="font-medium text-slate-700">💡 Gợi ý:</span>
              <ul className="mt-2 space-y-1">
                {gameInfo.hints.map((hint, i) => (
                  <li key={i} className="text-sm text-slate-600 flex items-start gap-2">
                    <span className="text-indigo-500">•</span>
                    {hint}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Players List */}
      <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
        <h3 className="font-bold text-lg text-slate-800 mb-3">
          👥 Người chơi ({players.length})
        </h3>
        <div className="flex flex-wrap gap-2">
          {players.map((p) => (
            <div
              key={p.id}
              className={`px-3 py-1 rounded-full text-sm ${
                p.id === currentPlayer.id
                  ? 'bg-indigo-100 text-indigo-700 font-medium'
                  : p.hasSpoken
                  ? 'bg-green-100 text-green-700'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              {p.name}
              {p.isHost && ' 👑'}
              {p.hasSpoken && ' ✓'}
            </div>
          ))}
        </div>
      </div>

      {/* Messages */}
      {messages.length > 0 && (
        <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
          <h3 className="font-bold text-lg text-slate-800 mb-3">💬 Tin nhắn</h3>
          <MessageList messages={messages} currentPlayerId={currentPlayer.id} />
        </div>
      )}

      {/* Validation Feedback */}
      {lastMessageResult && (
        <div className={`rounded-lg p-4 border-2 ${
          lastMessageResult.valid
            ? 'bg-green-50 border-green-200'
            : 'bg-red-50 border-red-200'
        }`}>
          {lastMessageResult.valid ? (
            <div className="flex items-center gap-2 text-green-700">
              <span className="text-xl">✓</span>
              <span className="font-medium">Câu nói hợp lệ!</span>
            </div>
          ) : (
            <div>
              <div className="flex items-center gap-2 text-red-700 mb-2">
                <span className="text-xl">⚠️</span>
                <span className="font-medium">Câu nói vi phạm quy tắc:</span>
              </div>
              <ul className="text-sm text-red-600 space-y-1">
                {lastMessageResult.violations?.map((v, i) => (
                  <li key={i}>• {v}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* Input */}
      {canSendMessage && (
        <MessageInput
          onSend={onSendMessage}
          placeholder={gameInfo?.promptTemplate || 'Nhập câu nói của bạn...'}
        />
      )}

      {/* Waiting state */}
      {(status === 'waiting' || status === 'setup') && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 text-center">
          <div className="text-4xl mb-4">⏳</div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">Đang chờ Host</h3>
          <p className="text-slate-500">
            {status === 'waiting'
              ? 'Host đang chọn loại game...'
              : 'Host đang thiết lập nội dung game...'}
          </p>
        </div>
      )}

      {/* Ended state */}
      {status === 'ended' && (
        <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 text-center">
          <div className="text-4xl mb-4">🏁</div>
          <h3 className="font-bold text-lg text-slate-800 mb-2">Game đã kết thúc!</h3>
          <p className="text-slate-500">Chờ Host bắt đầu vòng mới...</p>
        </div>
      )}
    </div>
  );
}

