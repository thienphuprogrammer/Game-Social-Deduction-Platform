'use client';

import React from 'react';
import { Message } from '@/lib/games/types';

interface AnswerFilterPanelProps {
  messages: Message[];
  onAnswer: (messageId: string, answer: boolean) => void;
}

export default function AnswerFilterPanel({ messages, onAnswer }: AnswerFilterPanelProps) {
  const unansweredQuestions = messages.filter(
    (m) => m.content.includes('?') && (m.hostAnswer === undefined || m.hostAnswer === null)
  );

  const answeredQuestions = messages.filter(
    (m) => m.content.includes('?') && m.hostAnswer !== undefined && m.hostAnswer !== null
  );

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-slate-200">
      <h2 className="text-xl font-bold text-slate-800 mb-4">🔮 Trả lời câu hỏi</h2>

      {/* Unanswered Questions */}
      {unansweredQuestions.length > 0 && (
        <div className="mb-6">
          <h3 className="font-semibold text-slate-700 mb-3">
            Câu hỏi chờ trả lời ({unansweredQuestions.length})
          </h3>
          <div className="space-y-3">
            {unansweredQuestions.map((msg) => (
              <div
                key={msg.id}
                className="bg-amber-50 border border-amber-200 rounded-lg p-4"
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <p className="font-medium text-slate-800 mb-1">
                      {msg.playerName} hỏi:
                    </p>
                    <p className="text-slate-700">{msg.content}</p>
                  </div>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => onAnswer(msg.id, true)}
                    className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium hover:bg-green-700 transition-colors"
                  >
                    ✓ Có
                  </button>
                  <button
                    onClick={() => onAnswer(msg.id, false)}
                    className="px-4 py-2 bg-red-600 text-white rounded-lg font-medium hover:bg-red-700 transition-colors"
                  >
                    ✗ Không
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Answered Questions */}
      {answeredQuestions.length > 0 && (
        <div>
          <h3 className="font-semibold text-slate-700 mb-3">
            Đã trả lời ({answeredQuestions.length})
          </h3>
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {answeredQuestions.map((msg) => (
              <div
                key={msg.id}
                className="bg-slate-50 border border-slate-200 rounded-lg p-3"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-slate-700">
                      {msg.playerName}:
                    </p>
                    <p className="text-sm text-slate-600">{msg.content}</p>
                  </div>
                  <div
                    className={`ml-3 px-3 py-1 rounded-full text-sm font-medium ${
                      msg.hostAnswer
                        ? 'bg-green-100 text-green-700'
                        : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {msg.hostAnswer ? 'Có' : 'Không'}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {unansweredQuestions.length === 0 && answeredQuestions.length === 0 && (
        <div className="text-center py-8 text-slate-500">
          <p>Chưa có câu hỏi nào</p>
        </div>
      )}
    </div>
  );
}

