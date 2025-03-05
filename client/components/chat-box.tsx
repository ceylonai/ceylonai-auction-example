"use client"

import type React from "react"

import { useState, useRef, useEffect } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Send } from "lucide-react"
import type { Message } from "@/lib/types"
import { cn } from "@/lib/utils"

interface ChatBoxProps {
  messages: Message[]
  username: string
  onSendMessage: (message: string) => void
}

export default function ChatBox({ messages, username, onSendMessage }: ChatBoxProps) {
  const [message, setMessage] = useState("")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollToBottom()
  }, []) // Update dependency array to scroll when messages change

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault()
    if (message.trim()) {
      onSendMessage(message)
      setMessage("")
    }
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  return (
    <div className="flex flex-col h-[60vh]">
      <ScrollArea className="flex-1 p-4 mb-4 border rounded-md border-border">
        <div className="space-y-4">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={cn(
                "flex flex-col max-w-[80%] rounded-lg p-3",
                msg.username === username
                  ? "ml-auto bg-primary text-primary-foreground"
                  : "bg-secondary text-secondary-foreground",
                msg.message?.toLowerCase().startsWith("bid ") && "bg-primary text-amber-100",
              )}
            >
              <div className="flex justify-between items-center mb-1">
                <span className="text-xs font-medium">{msg.username}</span>
                {msg.timestamp && <span className="text-xs opacity-70">{formatTimestamp(msg.timestamp)}</span>}
              </div>
              <p>{msg.message}</p>
            </div>
          ))}
          <div ref={messagesEndRef} />
        </div>
      </ScrollArea>

      <form onSubmit={handleSendMessage} className="flex gap-2">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message or 'bid [amount]'..."
          className="flex-1 bg-input text-foreground"
        />
        <Button type="submit" size="icon" className="bg-primary text-primary-foreground hover:bg-primary/90">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  )
}

