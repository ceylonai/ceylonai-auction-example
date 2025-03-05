"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ChatBox from "@/components/chat-box"
import BiddingPanel from "@/components/bidding-panel"
import UsersList from "@/components/users-list"
import { useToast } from "@/components/ui/use-toast"
import type { Bid, Message } from "@/lib/types"
import { getSocket } from "@/lib/socket"

interface AuctionRoomProps {
  username: string
}

export default function AuctionRoom({ username }: AuctionRoomProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [bids, setBids] = useState<Bid[]>([])
  const [highestBid, setHighestBid] = useState<Bid | null>(null)
  const [usersCount, setUsersCount] = useState(0)
  const [usersList, setUsersList] = useState<string[]>([])  // Initialize with empty array
  const [timerActive, setTimerActive] = useState(false)
  const [timeRemaining, setTimeRemaining] = useState(60)
  const { toast } = useToast()
  const socket = getSocket()

  useEffect(() => {
    // Initial setup - request current users list
    socket.emit("get_users_list")
    
    // Listen for chat history when joining
    socket.on("chat_history", (data: { messages: Message[] }) => {
      setMessages(data.messages || [])  // Add fallback empty array
    })

    socket.on("highest_bid", (data: { highest_bid: Bid }) => {
      if (data.highest_bid) {
        setHighestBid(data.highest_bid);
      }
    });

    // Listen for new messages
    socket.on("response", (data: Message) => {
      setMessages((prev) => [...prev, data])
    })

    // Listen for new bids
    socket.on("new_bid", (bid: Bid) => {
      setBids((prev) => {
        const newBids = [...prev, bid]
        // Only update highest bid if we have bids
        if (newBids.length > 0) {
          const highest = newBids.reduce((max, bid) => (bid.amount > max.amount ? bid : max), newBids[0])
          setHighestBid(highest)
        }
        return newBids
      })
    })

    // Listen for user count updates
    socket.on("users_count", (data: { count: number }) => {
      setUsersCount(data.count)
    })

    // Listen for user joined events
    socket.on("user_joined", (data: { username: string; users: string[] }) => {
      // Ensure users array is always defined
      setUsersList(data.users || [])
      toast({
        title: "User joined",
        description: `${data.username} has joined the auction`,
      })
    })

    // Listen for user left events
    socket.on("user_left", (data: { username: string; users: string[] }) => {
      // Ensure users array is always defined
      setUsersList(data.users || [])
      toast({
        title: "User left",
        description: `${data.username} has left the auction`,
      })
    })

    // Listen for users list response
    socket.on("users_list", (data: { users: string[] }) => {
      setUsersList(data.users || [])
    })

    // Listen for bid timer updates
    socket.on("bid_timer", (data: { remaining: number }) => {
      setTimeRemaining(data.remaining);
      setTimerActive(data.remaining > 0);
    });

    // Listen for auction end
    socket.on("auction_end", (data: { winner: string; amount: number } | { message: string }) => {
      if ('winner' in data) {
        toast({
          title: "Auction ended",
          description: `${data.winner} won with a bid of $${data.amount.toFixed(2)}`,
        });
      } else {
        toast({
          title: "Auction ended",
          description: data.message,
        });
      }
      setTimerActive(false);
    });

    // Clean up event listeners on unmount
    return () => {
      socket.off("chat_history")
      socket.off("response")
      socket.off("new_bid")
      socket.off("users_count")
      socket.off("user_joined")
      socket.off("user_left")
      socket.off("users_list")
      socket.off("bid_timer")
      socket.off("auction_end")
      socket.off("highest_bid");
    }
  }, [socket, toast])

  const sendMessage = (message: string) => {
    socket.emit("message", message)
  }

  const sendBid = (amount: number) => {
    const bidMessage = `bid ${amount}`
    socket.emit("message", bidMessage)
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
      <div className="md:col-span-2">
        <Tabs defaultValue="chat" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted">
            <TabsTrigger value="chat" className="data-[state=active]:bg-background">
              Chat
            </TabsTrigger>
            <TabsTrigger value="bidding" className="data-[state=active]:bg-background">
              Bidding
            </TabsTrigger>
          </TabsList>
          <TabsContent value="chat" className="mt-2">
            <Card className="bg-card">
              <CardHeader>
                <CardTitle className="flex justify-between text-card-foreground">
                  <span>Live Chat</span>
                  {timerActive && (
                    <span className="text-sm font-normal bg-amber-900 text-amber-100 px-2 py-1 rounded-md">
                      Auction ends in: {timeRemaining}s
                    </span>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ChatBox messages={messages} username={username} onSendMessage={sendMessage} />
              </CardContent>
            </Card>
          </TabsContent>
          <TabsContent value="bidding" className="mt-2">
            <BiddingPanel
              bids={bids}
              highestBid={highestBid}
              onPlaceBid={sendBid}
              username={username}
              timerActive={timerActive}
              timeRemaining={timeRemaining}
            />
          </TabsContent>
        </Tabs>
      </div>
      <div>
        <UsersList users={usersList} count={usersCount} />
      </div>
    </div>
  )
}