'use client';

import { VotingResult } from '@/lib/games/types';

interface VotingResultsProps {
  results: VotingResult[];
  revealedRoles?: Record<string, string>; // playerId -> role
  onClose: () => void;
}

export default function VotingResults({
  results,
  revealedRoles,
  onClose,
}: VotingResultsProps) {
  if (!results || results.length === 0) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
          <h2 className="text-2xl font-bold text-center mb-4">🗳️ Kết quả Vote</h2>
          <p className="text-center text-slate-600 mb-6">Không có ai vote.</p>
          <button
            onClick={onClose}
            className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    );
  }

  const topResult = results[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <h2 className="text-2xl font-bold text-center mb-6">🗳️ Kết quả Vote</h2>

        {/* Top voted person */}
        <div className="text-center mb-6 p-4 bg-amber-50 rounded-xl">
          <p className="text-sm text-amber-600 mb-1">Người bị vote nhiều nhất:</p>
          <p className="text-2xl font-bold text-amber-800">{topResult.targetName}</p>
          <p className="text-lg text-amber-600">{topResult.voteCount} vote</p>
          {revealedRoles && revealedRoles[topResult.targetId] && (
            <div className="mt-2 py-2 px-4 bg-amber-200 rounded-lg inline-block">
              <span className="font-bold">
                Vai trò: {revealedRoles[topResult.targetId]}
              </span>
            </div>
          )}
        </div>

        {/* Full results */}
        <div className="space-y-2 mb-6">
          {results.map((result, index) => (
            <div
              key={result.targetId}
              className={`flex justify-between items-center p-3 rounded-lg ${
                index === 0 ? 'bg-amber-100' : 'bg-slate-50'
              }`}
            >
              <div>
                <span className="font-medium">{result.targetName}</span>
                {revealedRoles && revealedRoles[result.targetId] && (
                  <span className="ml-2 text-xs px-2 py-1 bg-slate-200 rounded">
                    {revealedRoles[result.targetId]}
                  </span>
                )}
              </div>
              <div className="text-right">
                <span className="font-bold text-amber-600">{result.voteCount}</span>
                <span className="text-slate-500 text-sm ml-1">vote</span>
              </div>
            </div>
          ))}
        </div>

        {/* Voters breakdown */}
        <details className="mb-6">
          <summary className="cursor-pointer text-sm text-slate-600 hover:text-slate-800">
            Chi tiết người vote
          </summary>
          <div className="mt-2 space-y-2 text-sm">
            {results.map((result) => (
              <div key={result.targetId} className="pl-4">
                <span className="font-medium">{result.targetName}:</span>
                <span className="text-slate-500 ml-2">
                  {result.voters.join(', ') || 'Không có ai'}
                </span>
              </div>
            ))}
          </div>
        </details>

        <button
          onClick={onClose}
          className="w-full py-3 bg-indigo-600 text-white rounded-lg font-bold hover:bg-indigo-700 transition-colors"
        >
          Đóng
        </button>
      </div>
    </div>
  );
}

