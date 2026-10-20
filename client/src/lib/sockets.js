import { io } from "socket.io-client";

// Use the current origin by default. Vite proxies /socket.io during local
// development and Nginx proxies it in production.
const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || window.location.origin;

// Module-level singleton. Every component that needs socket access should
// import `socket` from here — NOT call `io(SOCKET_URL)` again themselves.
// Two components each creating their own client means two separate
// WebSocket connections to the same server, which is what caused the
// "WebSocket closed before the connection is established" errors: one
// client's connect/disconnect cycle was stepping on the other's.
export const socket = io(SOCKET_URL, {
  autoConnect: true,
  withCredentials: true,
});
