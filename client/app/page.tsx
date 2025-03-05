"use client"

import { useState, useEffect } from "react"
import Login from "@/components/login"
import AuctionRoom from "@/components/auction-room"
import { Toaster } from "@/components/ui/toaster"
import { initializeSocket, getSocket, disconnectSocket } from "@/lib/socket"
import { useToast } from "@/components/ui/use-toast"

export default function Home() {
  const [username, setUsername] = useState("")
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [isConnected, setIsConnected] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    // Initialize socket connection
    const socket = initializeSocket()

    socket.on("connect", () => {
      setIsConnected(true)
      toast({
        title: "Connected to server",
        description: "You are now connected to the auction server",
      })
    })

    socket.on("connect_error", (err) => {
      toast({
        title: "Connection error",
        description: `Failed to connect: ${err.message}`,
        variant: "destructive",
      })
    })

    socket.on("disconnect", () => {
      setIsConnected(false)
      toast({
        title: "Disconnected",
        description: "You have been disconnected from the server",
        variant: "destructive",
      })
    })

    // Clean up on unmount
    return () => {
      disconnectSocket()
    }
  }, [toast])

  const handleLogin = (name: string) => {
    const socket = getSocket()
    socket.emit("set_username", name)
    setUsername(name)
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between p-4 md:p-8">
      <div className="w-full max-w-6xl mx-auto">
        {!username ? <Login onLogin={handleLogin} /> : <AuctionRoom username={username} />}
      </div>
      <Toaster />
    </main>
  )
}

