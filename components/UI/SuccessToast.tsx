'use client';

import React, { useEffect } from 'react';

interface SuccessToastProps {
  message: string | null;
  onClose: () => void;
  duration?: number;
}

export default function SuccessToast({ message, onClose, duration = 3000 }: SuccessToastProps) {
  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [message, duration, onClose]);

  if (!message) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-green-50 border-2 border-green-200 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <span className="text-2xl">✓</span>
          <div className="flex-1">
            <h3 className="font-semibold text-green-800 mb-1">Thành công</h3>
            <p className="text-sm text-green-700">{message}</p>
          </div>
          <button
            onClick={onClose}
            className="text-green-500 hover:text-green-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

