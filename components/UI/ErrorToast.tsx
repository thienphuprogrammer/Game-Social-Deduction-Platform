'use client';

import React, { useEffect } from 'react';

interface ErrorToastProps {
  error: string | null;
  onClose: () => void;
  duration?: number;
}

export default function ErrorToast({ error, onClose, duration = 5000 }: ErrorToastProps) {
  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        onClose();
      }, duration);
      return () => clearTimeout(timer);
    }
  }, [error, duration, onClose]);

  if (!error) return null;

  return (
    <div className="fixed top-4 right-4 z-50 animate-slide-in">
      <div className="bg-red-50 border-2 border-red-200 rounded-lg shadow-lg p-4 max-w-md">
        <div className="flex items-start gap-3">
          <span className="text-2xl">⚠️</span>
          <div className="flex-1">
            <h3 className="font-semibold text-red-800 mb-1">Lỗi</h3>
            <p className="text-sm text-red-700">{error}</p>
          </div>
          <button
            onClick={onClose}
            className="text-red-500 hover:text-red-700 transition-colors"
          >
            ✕
          </button>
        </div>
      </div>
    </div>
  );
}

