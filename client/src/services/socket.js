import { io } from "socket.io-client";
import { API_BASE_URL } from "../config/api";

let socketInstance = null;

export function getNotificationSocket(token) {
  if (!token) return null;

  if (!socketInstance) {
    socketInstance = io(API_BASE_URL, {
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
