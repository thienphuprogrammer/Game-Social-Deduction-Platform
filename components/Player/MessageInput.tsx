'use client';

import React, { useState } from 'react';

interface MessageInputProps {
  onSend: (content: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

export default function MessageInput({ onSend, placeholder, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && handleSend()}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 px-4 py-3 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent disabled:bg-slate-100"
        />
        <button
          onClick={handleSend}
          disabled={!message.trim() || disabled}
          className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Gửi
        </button>
      </div>
    </div>
  );
}

