'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function Home() {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [mode, setMode] = useState<'create' | 'join'>('create');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleCreateRoom = () => {
    if (!playerName.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }
    router.push(`/room/create?name=${encodeURIComponent(playerName)}`);
  };

  const handleJoinRoom = () => {
    if (!playerName.trim()) {
      setError('Vui lòng nhập tên của bạn');
      return;
    }
    if (!roomId.trim()) {
      setError('Vui lòng nhập mã phòng');
      return;
    }
    router.push(`/room/${roomId.toUpperCase()}?name=${encodeURIComponent(playerName)}`);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-4">
      <div className="bg-white/95 backdrop-blur rounded-2xl shadow-2xl p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-black bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
            Social Deduction
          </h1>
          <p className="text-slate-500">
            Nghi ngờ • Quan sát • Suy luận
          </p>
        </div>

        <div className="mb-6">
          <div className="flex gap-2 mb-6 p-1 bg-slate-100 rounded-xl">
            <button
              onClick={() => {
                setMode('create');
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                mode === 'create'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🎮 Tạo phòng
            </button>
            <button
              onClick={() => {
                setMode('join');
                setError('');
              }}
              className={`flex-1 py-3 px-4 rounded-lg font-semibold transition-all duration-200 ${
                mode === 'join'
                  ? 'bg-white text-indigo-600 shadow-md'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              🚪 Tham gia
            </button>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-semibold text-slate-700 mb-2">
                Tên của bạn
              </label>
              <input
                type="text"
                value={playerName}
                onChange={(e) => {
                  setPlayerName(e.target.value);
                  setError('');
                }}
                placeholder="Nhập tên hiển thị"
                className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    mode === 'create' ? handleCreateRoom() : handleJoinRoom();
                  }
                }}
              />
            </div>

            {mode === 'join' && (
              <div>
                <label className="block text-sm font-semibold text-slate-700 mb-2">
                  Mã phòng
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => {
                    setRoomId(e.target.value.toUpperCase());
                    setError('');
                  }}
                  placeholder="VD: ABC12345"
                  className="w-full px-4 py-3 border-2 border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all uppercase tracking-wider"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleJoinRoom();
                    }
                  }}
                />
              </div>
            )}
          </div>

          {error && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-sm flex items-center gap-2">
              <span>⚠️</span> {error}
            </div>
          )}

          <button
            onClick={mode === 'create' ? handleCreateRoom : handleJoinRoom}
            className="w-full mt-6 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg hover:shadow-xl"
          >
            {mode === 'create' ? '✨ Tạo phòng mới' : '🚀 Vào phòng'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-slate-200">
          <h3 className="font-semibold text-slate-700 mb-3 text-center">6 Game có sẵn:</h3>
          <div className="grid grid-cols-2 gap-2 text-xs text-slate-500">
            <div className="bg-slate-50 p-2 rounded-lg">🔍 Alibi 1 câu</div>
            <div className="bg-slate-50 p-2 rounded-lg">🎭 Perspective</div>
            <div className="bg-slate-50 p-2 rounded-lg">🔒 Truth-Constraint</div>
            <div className="bg-slate-50 p-2 rounded-lg">⛓️ 3-hop Chain</div>
            <div className="bg-slate-50 p-2 rounded-lg">🚫 Banned Words</div>
            <div className="bg-slate-50 p-2 rounded-lg">🔮 Answer Filter</div>
          </div>
        </div>
      </div>
    </div>
  );
}
