'use client';

import { useState } from 'react';
import { VotingView } from '@/lib/games/types';

interface VotingPanelProps {
  players: Array<{ id: string; name: string; isHost: boolean }>;
  votingView: VotingView;
  currentPlayerId: string;
  isHost: boolean;
  onCastVote: (targetId: string) => void;
  onStartVoting: () => void;
  onEndVoting: () => void;
}

export default function VotingPanel({
  players,
  votingView,
  currentPlayerId,
  isHost,
  onCastVote,
  onStartVoting,
  onEndVoting,
}: VotingPanelProps) {
  const [selectedTarget, setSelectedTarget] = useState<string | null>(null);

  const eligibleTargets = players.filter(p => !p.isHost && p.id !== currentPlayerId);

  const handleVote = () => {
    if (selectedTarget) {
      onCastVote(selectedTarget);
      setSelectedTarget(null);
    }
  };

  // Host controls
  if (isHost && !votingView.isActive) {
    return (
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
        <h3 className="font-bold text-lg text-slate-800 mb-3">🗳️ Bỏ phiếu</h3>
        <p className="text-sm text-slate-600 mb-4">
          Bắt đầu phiên bỏ phiếu để người chơi vote ai là spy/thủ phạm.
        </p>
        <button
          onClick={onStartVoting}
          className="w-full py-3 bg-amber-500 text-white rounded-lg font-bold hover:bg-amber-600 transition-colors"
        >
          🗳️ Bắt đầu Vote
        </button>
      </div>
    );
  }

  // Voting is active
  if (votingView.isActive) {
    return (
      <div className="bg-white/95 backdrop-blur rounded-xl shadow-lg p-4">
        <h3 className="font-bold text-lg text-slate-800 mb-3">🗳️ Đang Vote</h3>
        
        {votingView.hasVoted ? (
          <div className="text-center py-4">
            <div className="text-4xl mb-2">✅</div>
            <p className="text-slate-600">Bạn đã vote!</p>
            <p className="text-sm text-slate-500 mt-1">
              Đang chờ người khác vote...
            </p>
          </div>
        ) : !isHost ? (
          <div className="space-y-3">
            <p className="text-sm text-slate-600 mb-2">
              Chọn người bạn nghĩ là spy/thủ phạm:
            </p>
            
            <div className="space-y-2">
              {eligibleTargets.map((player) => (
                <button
                  key={player.id}
                  onClick={() => setSelectedTarget(player.id)}
                  className={`w-full p-3 rounded-lg border-2 transition-all text-left ${
                    selectedTarget === player.id
                      ? 'border-amber-500 bg-amber-50'
                      : 'border-slate-200 hover:border-amber-300'
                  }`}
                >
                  <span className="font-medium">{player.name}</span>
                  {votingView.voteCounts && votingView.voteCounts[player.id] > 0 && (
                    <span className="float-right text-amber-600">
                      {votingView.voteCounts[player.id]} vote
                    </span>
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={handleVote}
              disabled={!selectedTarget}
              className={`w-full py-3 rounded-lg font-bold transition-colors ${
                selectedTarget
                  ? 'bg-amber-500 text-white hover:bg-amber-600'
                  : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
            >
              Xác nhận Vote
            </button>
          </div>
        ) : null}

        {/* Vote counts display */}
        <div className="mt-4 pt-4 border-t border-slate-200">
          <h4 className="font-semibold text-sm text-slate-600 mb-2">Số vote hiện tại:</h4>
          <div className="space-y-1">
            {players.filter(p => !p.isHost).map((player) => (
              <div key={player.id} className="flex justify-between text-sm">
                <span>{player.name}</span>
                <span className="font-mono text-amber-600">
                  {votingView.voteCounts?.[player.id] || 0}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Host end voting button */}
        {isHost && (
          <button
            onClick={onEndVoting}
            className="w-full mt-4 py-3 bg-red-500 text-white rounded-lg font-bold hover:bg-red-600 transition-colors"
          >
            🛑 Kết thúc Vote
          </button>
        )}
      </div>
    );
  }

  return null;
}

