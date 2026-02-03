"use client"

import { Bell, Globe, Moon, Palette, Shield, Sun } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"

interface SettingsModalProps {
  isOpen: boolean
  onClose: () => void
  isDarkMode: boolean
  onToggleDarkMode: () => void
}

export function SettingsModal({ isOpen, onClose, isDarkMode, onToggleDarkMode }: SettingsModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Settings</DialogTitle>
          <DialogDescription>
            Customize your TaskFlow experience
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Palette className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Appearance</h3>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {isDarkMode ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
                <Label htmlFor="dark-mode">Dark Mode</Label>
              </div>
              <Switch id="dark-mode" checked={isDarkMode} onCheckedChange={onToggleDarkMode} />
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Notifications</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-notif">Email Notifications</Label>
                <Switch id="email-notif" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="push-notif">Push Notifications</Label>
                <Switch id="push-notif" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="task-reminder">Task Reminders</Label>
                <Switch id="task-reminder" defaultChecked />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="mention-notif">Mention Alerts</Label>
                <Switch id="mention-notif" defaultChecked />
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Globe className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Language & Region</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Language</Label>
                <Select defaultValue="en">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="es">Spanish</SelectItem>
                    <SelectItem value="fr">French</SelectItem>
                    <SelectItem value="de">German</SelectItem>
                    <SelectItem value="ja">Japanese</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Timezone</Label>
                <Select defaultValue="utc">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="utc">UTC</SelectItem>
                    <SelectItem value="est">EST (UTC-5)</SelectItem>
                    <SelectItem value="pst">PST (UTC-8)</SelectItem>
                    <SelectItem value="gmt">GMT (UTC+0)</SelectItem>
                    <SelectItem value="ist">IST (UTC+5:30)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Shield className="h-5 w-5 text-muted-foreground" />
              <h3 className="font-semibold">Privacy & Security</h3>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label htmlFor="two-factor">Two-Factor Authentication</Label>
                <Switch id="two-factor" />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="activity-log">Activity Logging</Label>
                <Switch id="activity-log" defaultChecked />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={onClose}>Save Settings</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
