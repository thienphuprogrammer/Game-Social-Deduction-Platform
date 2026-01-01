'use client';

import React from 'react';
import { Message } from '@/lib/games/types';

interface MessageListProps {
  messages: Message[];
  currentPlayerId: string;
}

export default function MessageList({ messages, currentPlayerId }: MessageListProps) {
  return (
    <div className="space-y-3 max-h-96 overflow-y-auto">
      {messages.map((msg) => (
        <div
          key={msg.id}
          className={`p-3 rounded-lg ${
            msg.playerId === currentPlayerId
              ? 'bg-indigo-50 border border-indigo-200'
              : 'bg-slate-50 border border-slate-200'
          }`}
        >
          <div className="flex items-center justify-between mb-1">
            <span className="font-medium text-slate-800">
              {msg.playerName}
              {msg.playerId === currentPlayerId && (
                <span className="text-xs text-indigo-600 ml-2">(bạn)</span>
              )}
            </span>
            <span className="text-xs text-slate-400">
              {new Date(msg.timestamp).toLocaleTimeString('vi-VN', {
                hour: '2-digit',
                minute: '2-digit',
              })}
            </span>
          </div>
          <p className="text-slate-700">{msg.content}</p>
          
          {/* Host Answer (for Answer Filter game) */}
          {msg.content.includes('?') && msg.hostAnswer !== undefined && msg.hostAnswer !== null && (
            <div className={`mt-2 p-2 rounded border ${
              msg.hostAnswer 
                ? 'bg-green-50 border-green-200' 
                : 'bg-red-50 border-red-200'
            }`}>
              <span className={`text-sm font-medium ${
                msg.hostAnswer ? 'text-green-700' : 'text-red-700'
              }`}>
                👑 Host trả lời: {msg.hostAnswer ? 'Có ✓' : 'Không ✗'}
              </span>
            </div>
          )}

          {/* Validation Violations */}
          {msg.violations && msg.violations.length > 0 && (
            <div className="mt-2 p-2 bg-red-50 rounded border border-red-200">
              <span className="text-xs font-medium text-red-700">⚠️ Vi phạm:</span>
              <ul className="text-xs text-red-600">
                {msg.violations.map((v, i) => (
                  <li key={i}>• {v}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Valid message indicator */}
          {msg.isValid === true && !msg.violations?.length && (
            <div className="mt-1 text-xs text-green-600">✓ Hợp lệ</div>
          )}
        </div>
      ))}
    </div>
  );
}

