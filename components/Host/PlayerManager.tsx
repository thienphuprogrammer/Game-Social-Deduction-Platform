'use client';

import React from 'react';
import { PlayerRole, RoomStatus } from '@/lib/games/types';

interface PlayerInfo {
  id: string;
  name: string;
  isHost: boolean;
  role: PlayerRole;
  privateInfo?: string;
  hasSpoken: boolean;
}

interface PlayerManagerProps {
  players: PlayerInfo[];
  status: RoomStatus;
}

const ROLE_LABELS: Record<PlayerRole, { label: string; color: string }> = {
  normal: { label: 'Bình thường', color: 'bg-slate-100 text-slate-700' },
  spy: { label: 'Spy', color: 'bg-red-100 text-red-700' },
  culprit: { label: 'Thủ phạm', color: 'bg-red-100 text-red-700' },
  accomplice: { label: 'Đồng phạm', color: 'bg-orange-100 text-orange-700' },
  saboteur: { label: 'Kẻ phá', color: 'bg-purple-100 text-purple-700' },
};

export default function PlayerManager({ players, status }: PlayerManagerProps) {
  const showRoles = status === 'playing' || status === 'voting' || status === 'ended';

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4">
        Người chơi ({players.length})
      </h2>

      <div className="space-y-2">
        {players.map((player) => (
          <div
            key={player.id}
            className={`p-3 rounded-lg border-2 ${
              player.isHost
                ? 'border-purple-300 bg-purple-50'
                : player.hasSpoken
                ? 'border-green-300 bg-green-50'
                : 'border-slate-200 bg-slate-50'
            }`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-slate-800">{player.name}</span>
                {player.isHost && (
                  <span className="text-xs bg-purple-200 text-purple-700 px-2 py-0.5 rounded">
                    Host
                  </span>
                )}
                {player.hasSpoken && !player.isHost && (
                  <span className="text-xs bg-green-200 text-green-700 px-2 py-0.5 rounded">
                    Đã nói
                  </span>
                )}
              </div>

              {showRoles && !player.isHost && (
                <span className={`text-xs px-2 py-1 rounded ${ROLE_LABELS[player.role].color}`}>
                  {ROLE_LABELS[player.role].label}
                </span>
              )}
            </div>

            {showRoles && player.privateInfo && !player.isHost && (
              <p className="text-xs text-slate-500 mt-1 italic">{player.privateInfo}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

