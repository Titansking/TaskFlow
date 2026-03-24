"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import type { Project } from "@/lib/types"

interface ProjectModalProps {
  isOpen: boolean
  onClose: () => void
  onSave: (project: Omit<Project, "id">) => void
}

const presetColors = [
  "#3B82F6", // blue
  "#F59E0B", // amber
  "#10B981", // emerald
  "#EF4444", // red
  "#8B5CF6", // violet
  "#EC4899", // pink
  "#06B6D4", // cyan
  "#F97316", // orange
  "#14B8A6", // teal
  "#6366F1", // indigo
  "#84CC16", // lime
  "#A855F7", // purple
]

export function ProjectModal({ isOpen, onClose, onSave }: ProjectModalProps) {
  const [name, setName] = useState("")
  const [color, setColor] = useState(presetColors[0])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    onSave({
      name: name.trim(),
      color,
      members: [],
    })
    setName("")
    setColor(presetColors[0])
    onClose()
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Create New Project</DialogTitle>
          <DialogDescription>
            Add a new project to organize your tasks
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="projectName">Project Name</Label>
            <Input
              id="projectName"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Enter project name"
              required
            />
          </div>

          <div className="space-y-2">
            <Label>Project Color</Label>
            <div className="grid grid-cols-6 gap-2">
              {presetColors.map((c) => (
                <button
                  key={c}
                  type="button"
                  onClick={() => setColor(c)}
                  className={`h-8 w-full rounded-md border-2 transition-all ${
                    color === c
                      ? "border-foreground scale-110 shadow-md"
                      : "border-transparent hover:border-muted-foreground/30"
                  }`}
                  style={{ backgroundColor: c }}
                />
              ))}
            </div>
            <div className="flex items-center gap-2 mt-2">
              <Label htmlFor="customColor" className="text-xs text-muted-foreground whitespace-nowrap">
                Custom:
              </Label>
              <Input
                id="customColor"
                type="color"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                className="h-8 w-12 p-0.5 cursor-pointer"
              />
              <div
                className="h-8 flex-1 rounded-md border"
                style={{ backgroundColor: color }}
              />
              <span className="text-xs text-muted-foreground font-mono">{color}</span>
            </div>
          </div>

          <div className="rounded-lg border p-4">
            <div className="flex items-center gap-3">
              <div
                className="h-4 w-4 rounded-full shrink-0"
                style={{ backgroundColor: color }}
              />
              <span className="font-medium">{name || "Project Preview"}</span>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit">Create Project</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
