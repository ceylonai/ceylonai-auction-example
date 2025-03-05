"use client"

import { useState, useEffect, useCallback } from "react"
import { io, type Socket } from "socket.io-client"

export const useSocket = (url: string) => {
  const [socket, setSocket] = useState<Socket | null>(null)
  const [isConnected, setIsConnected] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const connect = useCallback(() => {
    const socketInstance = io(url, {
      transports: ["websocket"],
      upgrade: false,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      timeout: 20000,
    })

    socketInstance.on("connect", () => {
      console.log("Socket connected successfully")
      setIsConnected(true)
      setError(null)
    })

    socketInstance.on("connect_error", (err) => {
      console.error("Connection error:", err)
      setError(`Connection error: ${err.message}`)
      setIsConnected(false)
    })

    socketInstance.on("disconnect", (reason) => {
      console.log("Socket disconnected, reason:", reason)
      setIsConnected(false)
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, reconnect manually
        socketInstance.connect()
      }
    })

    setSocket(socketInstance)

    return () => {
      socketInstance.disconnect()
    }
  }, [url])

  useEffect(() => {
    const cleanup = connect()
    return cleanup
  }, [connect])

  const reconnect = useCallback(() => {
    if (socket) {
      socket.disconnect()
    }
    connect()
  }, [socket, connect])

  return { socket, isConnected, error, reconnect }
}

