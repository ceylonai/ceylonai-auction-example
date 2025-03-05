export interface Message {
  username: string
  message: string
  timestamp?: number
  type?: "system" | "user"
}

export interface Bid {
  username: string
  amount: number
  timestamp: number
}

