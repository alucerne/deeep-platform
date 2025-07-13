'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Play } from "lucide-react"

export function VideoDialog() {
  const [open, setOpen] = useState(false)

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>
          <Play className="mr-2 h-4 w-4" />
          Watch Tutorial
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[800px]">
        <DialogHeader>
          <DialogTitle>Getting Started with the Make App</DialogTitle>
          <DialogDescription>
            Follow this step-by-step guide to integrate DEEEP with your Make.com workflows.
          </DialogDescription>
        </DialogHeader>
        <div className="mt-4">
          <div className="aspect-video w-full rounded-lg bg-muted">
            <iframe
              className="h-full w-full rounded-lg"
              src="https://www.youtube.com/embed/dQw4w9WgXcQ"
              title="DEEEP Make App Tutorial"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="mt-4 space-y-2">
            <h4 className="font-semibold">What you&apos;ll learn:</h4>
            <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
              <li>How to install and configure the DEEEP Make App</li>
              <li>Setting up authentication with your API key</li>
              <li>Creating automated email validation workflows</li>
              <li>Handling responses and error cases</li>
              <li>Best practices for production use</li>
            </ul>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
} 