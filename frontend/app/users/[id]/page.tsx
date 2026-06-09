"use client"

import { useState, useEffect } from "react"
import { useRouter, useParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { userService } from "@/services/data"
import type { TeamMember } from "@/lib/types"

export default function UserDetailsPage() {
  const router = useRouter()
  const params = useParams()
  const [user, setUser] = useState<TeamMember | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    const fetchUser = async () => {
      if (!params.id) return
      
      try {
        setLoading(true)
        const userData = await userService.getUser(params.id as string)
        setUser(userData)
      } catch (err) {
        setError("Failed to load user details")
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchUser()
  }, [params.id])

  const roleColors: Record<string, string> = {
    Admin: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
    "Project Manager": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
    "Team Member": "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-300",
  }

  const statusColors: Record<string, string> = {
    online: "bg-green-500",
    away: "bg-yellow-500",
    offline: "bg-gray-400",
  }

  if (loading) {
    return <div className="flex justify-center items-center h-screen">Loading...</div>
  }

  if (error || !user) {
    return (
      <div className="container mx-auto py-10 max-w-2xl text-center">
        <h2 className="text-xl font-bold text-destructive mb-4">{error || "User not found"}</h2>
        <Button onClick={() => router.push("/")}>Back to Dashboard</Button>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 max-w-2xl px-4">
      <Card>
        <CardHeader>
          <CardTitle>Team Member Details</CardTitle>
          <CardDescription>View information about this team member</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="flex flex-col items-center gap-4">
            <div className="relative">
              <Avatar className="h-24 w-24">
                <AvatarFallback className="text-2xl">{user.avatar}</AvatarFallback>
              </Avatar>
              <span
                className={`absolute bottom-1 right-1 h-5 w-5 rounded-full border-4 border-background ${statusColors[user.status] || "bg-gray-400"}`}
              />
            </div>
            <div className="text-center space-y-2">
              <h2 className="text-2xl font-bold">{user.name}</h2>
              <Badge className={roleColors[user.role] || "bg-gray-100"} variant="outline">
                {user.role}
              </Badge>
            </div>
          </div>

          <div className="grid gap-4 border-t pt-6">
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium text-muted-foreground">Email</div>
              <div className="col-span-2">{user.email}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium text-muted-foreground">Status</div>
              <div className="col-span-2 capitalize">{user.status}</div>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div className="font-medium text-muted-foreground">User ID</div>
              <div className="col-span-2 font-mono text-sm text-muted-foreground">{user.id}</div>
            </div>
          </div>
        </CardContent>
        <CardFooter className="justify-between border-t p-6">
          <Button variant="outline" onClick={() => router.push("/")}>
            Back to Dashboard
          </Button>
          <Button onClick={() => window.location.href = `mailto:${user.email}`}>
            Send Message
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
