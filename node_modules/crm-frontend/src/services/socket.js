import { io } from "socket.io-client";
import { API_URL } from "../config/api";

let socketInstance = null;
let retryCount = 0;
let errorLogged = false;
const SOCKET_BASE_URL = API_URL.replace(/\/api$/i, "");
const BACKOFF_DELAYS = [1000, 2000, 4000, 8000, 16000, 30000];

function getBackoffDelay() {
  const index = Math.min(retryCount, BACKOFF_DELAYS.length - 1);
  return BACKOFF_DELAYS[index];
}

export function getAppSocket(token) {
  if (!token) return null;

  if (socketInstance && socketInstance.auth?.token === token) {
    return socketInstance;
  }

  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }

  retryCount = 0;
  errorLogged = false;

  socketInstance = io(SOCKET_BASE_URL, {
    transports: ["websocket", "polling"],
    upgrade: true,
    rememberUpgrade: true,
    reconnection: true,
    reconnectionDelay: getBackoffDelay(),
    reconnectionDelayMax: 30000,
    reconnectionAttempts: 10,
    timeout: 10000,
    auth: { token },
  });

  socketInstance.on("connect", () => {
    retryCount = 0;
    errorLogged = false;
  });

  socketInstance.on("connect_error", (err) => {
    if (!errorLogged) {
      console.error("[Socket] Connection failed:", err.message);
      errorLogged = true;
    }
    retryCount += 1;
    if (socketInstance) {
      socketInstance.io.opts.reconnectionDelay = getBackoffDelay();
    }
  });

  socketInstance.on("disconnect", () => {
    retryCount = 0;
  });

  return socketInstance;
}

export function disconnectAppSocket() {
  if (socketInstance) {
    socketInstance.removeAllListeners();
    socketInstance.disconnect();
    socketInstance = null;
  }
  retryCount = 0;
  errorLogged = false;
}

export function getNotificationSocket(token) {
  return getAppSocket(token);
}

export function disconnectNotificationSocket() {
  disconnectAppSocket();
}
