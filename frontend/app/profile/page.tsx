"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { authService } from "@/services/auth"
import type { TeamMember } from "@/lib/types"

export default function ProfilePage() {
  const router = useRouter()
  const [user, setUser] = useState<TeamMember | null>(null)
  const [name, setName] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [success, setSuccess] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    const currentUser = authService.getCurrentUser()
    if (!currentUser) {
      router.push("/login")
      return
    }
    setUser(currentUser)
    setName(currentUser.name)
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsLoading(true)
    setSuccess("")
    setError("")

    try {
      const updatedUser = await authService.updateProfile({ name })
      setUser(updatedUser)
      setSuccess("Profile updated successfully")
    } catch (err: any) {
      setError(err.response?.data?.message || "Failed to update profile")
    } finally {
      setIsLoading(false)
    }
  }

  const handleLogout = () => {
    authService.logout()
  }

  if (!user) return null

  return (
    <div className="container mx-auto py-10 max-w-2xl">
      <Card>
        <CardHeader>
          <CardTitle>Profile</CardTitle>
          <CardDescription>Manage your account settings</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex flex-col items-center gap-4">
            <Avatar className="h-24 w-24">
              <AvatarFallback className="text-2xl">{user.avatar}</AvatarFallback>
            </Avatar>
            <div className="text-center">
              <h2 className="text-xl font-bold">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              <p className="text-sm text-muted-foreground capitalize">{user.role}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {success && (
              <div className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 text-sm p-3 rounded-md">
                {success}
              </div>
            )}
            {error && (
              <div className="bg-destructive/15 text-destructive text-sm p-3 rounded-md">
                {error}
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="name">Full Name</Label>
              <Input 
                id="name" 
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input 
                id="email" 
                value={user.email}
                disabled
                className="bg-muted"
              />
            </div>

            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Saving..." : "Save Changes"}
            </Button>
          </form>
        </CardContent>
        <CardFooter className="justify-between border-t p-6">
            <Button variant="outline" onClick={() => router.push("/")}>
                Back to Dashboard
            </Button>
            <Button variant="destructive" onClick={handleLogout}>
                Log out
            </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
