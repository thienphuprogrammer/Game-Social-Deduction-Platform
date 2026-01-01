'use client';

import React from 'react';
import { RoomStatus } from '@/lib/games/types';

interface HostControlsProps {
  roomId: string;
  status: RoomStatus;
  playerCount: number;
  hasGameType: boolean;
  hasContent: boolean;
  onStartGame: () => void;
  onEndGame: () => void;
  onResetRoom: () => void;
}

export default function HostControls({
  roomId,
  status,
  playerCount,
  hasGameType,
  hasContent,
  onStartGame,
  onEndGame,
  onResetRoom,
}: HostControlsProps) {
  const canStart = status === 'setup' && hasGameType && hasContent && playerCount >= 4;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-slate-800">Phòng: {roomId}</h2>
          <p className="text-slate-500 text-sm">
            {playerCount} người chơi • Trạng thái: {status}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => navigator.clipboard.writeText(roomId)}
            className="px-3 py-1 bg-slate-100 text-slate-700 rounded-lg text-sm hover:bg-slate-200 transition-colors"
          >
            📋 Copy mã phòng
          </button>
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        {status === 'setup' && (
          <button
            onClick={onStartGame}
            disabled={!canStart}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              canStart
                ? 'bg-green-600 text-white hover:bg-green-700'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            🎮 Bắt đầu game
          </button>
        )}

        {(status === 'playing' || status === 'voting') && (
          <button
            onClick={onEndGame}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
          >
            🛑 Kết thúc game
          </button>
        )}

        {status === 'ended' && (
          <button
            onClick={onResetRoom}
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors"
          >
            🔄 Chơi lại
          </button>
        )}

        {!canStart && status === 'setup' && (
          <div className="text-sm text-amber-600 flex items-center gap-1">
            <span>⚠️</span>
            {!hasGameType && <span>Chọn game • </span>}
            {!hasContent && <span>Tạo nội dung • </span>}
            {playerCount < 4 && <span>Cần thêm {4 - playerCount} người</span>}
          </div>
        )}
      </div>
    </div>
  );
}

