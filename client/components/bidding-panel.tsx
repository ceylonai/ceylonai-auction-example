"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import type { Bid } from "@/lib/types"
import { cn } from "@/lib/utils"
import { AlertCircle, Clock, Trophy } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

interface BiddingPanelProps {
  bids: Bid[]
  highestBid: Bid | null
  onPlaceBid: (amount: number) => void
  username: string
  timerActive: boolean
  timeRemaining: number
}

export default function BiddingPanel({
  bids,
  highestBid,
  onPlaceBid,
  username,
  timerActive,
  timeRemaining,
}: BiddingPanelProps) {
  const [bidAmount, setBidAmount] = useState("")
  const [error, setError] = useState("")

  const handlePlaceBid = () => {
    const amount = Number.parseFloat(bidAmount)

    if (isNaN(amount) || amount <= 0) {
      setError("Please enter a valid bid amount")
      return
    }

    if (highestBid && amount <= highestBid.amount) {
      setError(`Your bid must be higher than the current highest bid: $${highestBid.amount}`)
      return
    }

    setError("")
    onPlaceBid(amount)
    setBidAmount("")
  }

  const formatTimestamp = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  // Sort bids by amount (highest first)
  const sortedBids = [...bids].sort((a, b) => b.amount - a.amount)

  return (
    <div className="space-y-4">
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex justify-between items-center text-card-foreground">
            <span>Current Auction</span>
            {timerActive && (
              <div className="flex items-center gap-2 text-sm font-normal bg-amber-900 text-amber-100 px-3 py-1 rounded-md">
                <Clock className="h-4 w-4" />
                <span>Ends in: {timeRemaining}s</span>
              </div>
            )}
          </CardTitle>
          <CardDescription className="text-muted-foreground">Place your bid to win the auction</CardDescription>
        </CardHeader>
        <CardContent>
          {highestBid ? (
            <div className="bg-secondary/50 p-4 rounded-lg mb-4">
              <div className="flex items-center gap-2 mb-2">
                <Trophy className="h-5 w-5 text-primary" />
                <h3 className="font-semibold text-lg text-primary">Current Highest Bid</h3>
              </div>
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-2xl font-bold text-primary">${highestBid.amount.toFixed(2)}</p>
                  <p className="text-sm text-muted-foreground">by {highestBid.username}</p>
                </div>
                {highestBid.username === username && (
                  <div className="bg-primary text-primary-foreground text-sm px-3 py-1 rounded-full">Your bid</div>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-muted p-4 rounded-lg mb-4 text-center">
              <p className="text-muted-foreground">No bids yet. Be the first to bid!</p>
            </div>
          )}

          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <div className="flex gap-2">
            <Input
              type="number"
              placeholder="Enter bid amount"
              value={bidAmount}
              onChange={(e) => setBidAmount(e.target.value)}
              min={highestBid ? highestBid.amount + 0.01 : 0.01}
              step="0.01"
              className="bg-input text-foreground"
            />
            <Button onClick={handlePlaceBid} className="bg-primary text-primary-foreground hover:bg-primary/90">
              Place Bid
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="text-card-foreground">Bid History</CardTitle>
          <CardDescription className="text-muted-foreground">
            {sortedBids.length} {sortedBids.length === 1 ? "bid" : "bids"} placed
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            <div className="space-y-2">
              {sortedBids.length > 0 ? (
                sortedBids.map((bid, index) => (
                  <div
                    key={index}
                    className={cn(
                      "p-3 rounded-md border flex justify-between",
                      bid.username === username ? "bg-secondary/50" : "",
                      highestBid && bid.amount === highestBid.amount ? "border-primary" : "border-border",
                    )}
                  >
                    <div>
                      <p className="font-medium text-primary">${bid.amount.toFixed(2)}</p>
                      <p className="text-sm text-muted-foreground">{bid.username}</p>
                    </div>
                    <div className="text-xs text-muted-foreground">{formatTimestamp(bid.timestamp)}</div>
                  </div>
                ))
              ) : (
                <p className="text-center text-muted-foreground py-4">No bids yet</p>
              )}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  )
}

