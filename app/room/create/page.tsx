'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';

function CreateRoomContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const playerName = searchParams.get('name') || '';
  const wsRef = useRef<WebSocket | null>(null);
  const hasNavigated = useRef(false);

  useEffect(() => {
    if (!playerName) {
      router.push('/');
      return;
    }

    // Prevent duplicate connections in React Strict Mode
    if (wsRef.current) return;

    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/ws`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onopen = () => {
      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify({
          type: 'create-room',
          payload: { hostName: playerName },
        }));
      }
    };

    ws.onmessage = (event) => {
      if (hasNavigated.current) return;
      
      const message = JSON.parse(event.data);
      if (message.type === 'room-created') {
        hasNavigated.current = true;
        const { roomId, hostId } = message.payload;
        router.push(`/room/${roomId}?host=true&playerId=${hostId}&name=${encodeURIComponent(playerName)}`);
      } else if (message.type === 'error') {
        alert(message.error);
        router.push('/');
      }
    };

    ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      if (!hasNavigated.current) {
        alert('Không thể kết nối đến server. Vui lòng thử lại.');
        router.push('/');
      }
    };

    return () => {
      // Don't close immediately - allow navigation to complete
      setTimeout(() => {
        if (ws.readyState === WebSocket.OPEN || ws.readyState === WebSocket.CONNECTING) {
          ws.close();
        }
      }, 100);
    };
  }, [playerName, router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-6"></div>
        <p className="text-white text-lg">Đang tạo phòng...</p>
      </div>
    </div>
  );
}

function LoadingFallback() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900">
      <div className="text-center">
        <div className="animate-spin rounded-full h-16 w-16 border-4 border-indigo-500 border-t-transparent mx-auto mb-6"></div>
        <p className="text-white text-lg">Đang tải...</p>
      </div>
    </div>
  );
}

export default function CreateRoomPage() {
  return (
    <Suspense fallback={<LoadingFallback />}>
      <CreateRoomContent />
    </Suspense>
  );
}
