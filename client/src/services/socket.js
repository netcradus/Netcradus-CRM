import { io } from "socket.io-client";
import { API_URL } from "../config/api";

let socketInstance = null;
const SOCKET_BASE_URL = API_URL.replace(/\/api$/i, "");

export function getNotificationSocket(token) {
  if (!token) return null;

  if (!socketInstance) {
    socketInstance = io(SOCKET_BASE_URL, {
      transports: ["polling"],
      reconnection: false,
      timeout: 5000,
      auth: { token },
    });
  }

  return socketInstance;
}

export function disconnectNotificationSocket() {
  if (socketInstance) {
    socketInstance.disconnect();
    socketInstance = null;
  }
}
