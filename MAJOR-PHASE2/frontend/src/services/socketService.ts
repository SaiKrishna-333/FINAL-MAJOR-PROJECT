import { io, Socket } from "socket.io-client";

let socket: Socket | null = null;

export const initializeSocket = (token: string) => {
  if (socket) {
    socket.disconnect();
  }

  socket = io("http://localhost:5000", {
    auth: {
      token,
    },
    transports: ["websocket", "polling"],
    withCredentials: true,
  });

  socket.on("connect", () => {
    console.log("Socket connected:", socket?.id);
  });

  socket.on("disconnect", () => {
    console.log("Socket disconnected");
  });

  socket.on("connect_error", (error: Error) => {
    console.error("Socket connection error:", error);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initializeSocket first.");
  }
  return socket;
};

export const joinRoom = (userId: string) => {
  if (socket) {
    socket.emit("join", userId);
  }
};

export const joinRoleRoom = (role: string) => {
  if (socket) {
    socket.emit("join-role", role);
  }
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};

export const onNotification = (callback: (data: unknown) => void) => {
  if (socket) {
    socket.on("notification", callback);
  }
};

export const onTheftAlert = (callback: (data: unknown) => void) => {
  if (socket) {
    socket.on("theft_alert", callback);
  }
};

export const onRequestApproved = (callback: (data: unknown) => void) => {
  if (socket) {
    socket.on("request_approved", callback);
  }
};

export const onRequestRejected = (callback: (data: unknown) => void) => {
  if (socket) {
    socket.on("request_rejected", callback);
  }
};

export const onNewRequest = (callback: (data: unknown) => void) => {
  if (socket) {
    socket.on("new_request", callback);
  }
};

export const offNotification = () => {
  if (socket) {
    socket.off("notification");
  }
};

export const offTheftAlert = () => {
  if (socket) {
    socket.off("theft_alert");
  }
};

export const offRequestApproved = () => {
  if (socket) {
    socket.off("request_approved");
  }
};

export const offRequestRejected = () => {
  if (socket) {
    socket.off("request_rejected");
  }
};

export const offNewRequest = () => {
  if (socket) {
    socket.off("new_request");
  }
};
