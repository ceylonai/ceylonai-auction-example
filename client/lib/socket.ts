import { io, type Socket } from "socket.io-client"

// Create a singleton socket instance
let socket: Socket | null = null

export const initializeSocket = (url = "http://localhost:8000") => {
  if (!socket) {
    socket = io(url, {
      transports: ["websocket"],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    console.log("Socket initialized")
  }
  return socket
}

export const getSocket = () => {
  if (!socket) {
    throw new Error("Socket not initialized. Call initializeSocket first.")
  }
  return socket
}

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect()
    socket = null
    console.log("Socket disconnected")
  }
}

