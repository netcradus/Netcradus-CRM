import { io } from "socket.io-client";
import { API_URL } from "../config/api";

let socketInstance = null;
const SOCKET_BASE_URL = API_URL.replace(/\/api$/i, "");

export function getAppSocket(token) {
  if (!token) return null;

  if (!socketInstance || socketInstance.auth?.token !== token) {
    if (socketInstance) {
      socketInstance.disconnect();
    }
    socketInstance = io(SOCKET_BASE_URL, {
      transports: ["websocket", "polling"],
      reconnection: true,
      timeout: 10000,
      auth: { token },
    });
  }

  return socketInstance;
}

export function disconnectAppSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}

export function getNotificationSocket(token) {
  return getAppSocket(token);
}

export function disconnectNotificationSocket() {
  disconnectAppSocket();
}
