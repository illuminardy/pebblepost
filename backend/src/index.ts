import { createServer } from 'node:http';
import { app } from './app';
import { initWebSocketServer } from './lib/websocket';

const PORT = process.env.PORT || 3000;

const server = createServer(app);
initWebSocketServer(server);

server.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
