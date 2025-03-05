"use client"

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Users } from "lucide-react"

interface UsersListProps {
  users?: string[]
  count: number
}

export default function UsersList({ users = [], count }: UsersListProps) {
  return (
    <Card className="bg-card">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-card-foreground">
          <Users className="h-5 w-5" />
          <span>Online Users ({count})</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {users && users.length > 0 ? (
              users.map((user, index) => (
                <div key={index} className="p-2 rounded-md bg-secondary/50 text-secondary-foreground">
                  {user}
                </div>
              ))
            ) : (
              <p className="text-center text-muted-foreground py-4">No users online</p>
            )}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}