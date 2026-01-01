import { createServer, IncomingMessage, ServerResponse } from 'http';
import { parse } from 'url';
import next from 'next';
import { wsServer } from './lib/websocket/server';
import { Socket } from 'net';

const dev = process.env.NODE_ENV !== 'production';
const hostname = process.env.HOSTNAME || 'localhost';
const port = parseInt(process.env.PORT || '3000', 10);

const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();

// Store upgrade handlers
const upgradeHandlers: Array<(req: IncomingMessage, socket: Socket, head: Buffer) => boolean> = [];

app.prepare().then(() => {
  const server = createServer(async (req, res) => {
    try {
      const parsedUrl = parse(req.url || '', true);
      await handle(req, res, parsedUrl);
    } catch (err) {
      console.error('Error occurred handling', req.url, err);
      res.statusCode = 500;
      res.end('internal server error');
    }
  });

  // Initialize WebSocket server
  wsServer.initializeStandalone();

  // Handle WebSocket upgrade requests
  server.on('upgrade', (req: IncomingMessage, socket: Socket, head: Buffer) => {
    const { pathname } = parse(req.url || '');
    
    console.log(`[Server] Upgrade request for: ${pathname}`);
    
    if (pathname === '/api/ws') {
      // Game WebSocket
      wsServer.handleUpgrade(req, socket, head);
    } else {
      // For HMR and other Next.js WebSockets, we need to let them through
      // Unfortunately, Next.js with custom server doesn't auto-handle HMR upgrades
      // The HMR errors are expected in dev mode with custom server
      console.log(`[Server] Ignoring upgrade for: ${pathname} (handled by Next.js)`);
    }
  });

  server.listen(port, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});

