'use client';

import React from 'react';
import { GameType, GAME_INFO } from '@/lib/games/types';

interface GameSelectorProps {
  selectedGame: GameType | null;
  onSelectGame: (gameType: GameType) => void;
  disabled?: boolean;
}

export default function GameSelector({ selectedGame, onSelectGame, disabled }: GameSelectorProps) {
  const games = Object.entries(GAME_INFO) as [GameType, typeof GAME_INFO[GameType]][];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {games.map(([type, info]) => (
        <button
          key={type}
          onClick={() => onSelectGame(type)}
          disabled={disabled}
          className={`p-4 rounded-xl border-2 text-left transition-all duration-200 ${
            selectedGame === type
              ? 'border-indigo-500 bg-indigo-50 shadow-lg scale-[1.02]'
              : 'border-slate-200 bg-white hover:border-indigo-300 hover:shadow-md'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
        >
          <h3 className="font-bold text-lg text-slate-800 mb-2">{info.name}</h3>
          <p className="text-sm text-slate-600 mb-3">{info.description}</p>
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <span className="bg-slate-100 px-2 py-1 rounded">
              {info.minPlayers}-{info.maxPlayers} người
            </span>
            <span className="bg-slate-100 px-2 py-1 rounded">
              {info.roles.length} vai trò
            </span>
          </div>
        </button>
      ))}
    </div>
  );
}

