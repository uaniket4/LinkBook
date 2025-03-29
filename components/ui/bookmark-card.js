"use client"

import { useState } from "react"
import Image from "next/image"
import { ExternalLink, Clock, Eye, MoreHorizontal, Edit, Trash2, FolderIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function BookmarkCard({ bookmark, onEdit, onDelete, onVisit }) {
  const [imageError, setImageError] = useState(false)

  const handleVisit = () => {
    window.open(bookmark.url, "_blank")
    onVisit(bookmark.id)
  }

  const getImageUrl = () => {
    if (imageError) return null
    return bookmark.metadata?.og?.image || null
  }

  const getFaviconUrl = () => {
    return bookmark.favicon || `https://www.google.com/s2/favicons?domain=${bookmark.url}`
  }

  const getFormattedDate = (date) => {
    if (!date) return "Never"
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        {getImageUrl() && (
          <div className="relative h-40 w-full overflow-hidden bg-muted">
            <Image
              src={getImageUrl() || "/placeholder.svg"}
              alt={bookmark.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              priority={false}
            />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative h-5 w-5 flex-shrink-0">
            <Image
              src={getFaviconUrl() || "/placeholder.svg"}
              alt=""
              width={20}
              height={20}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=20&width=20"
              }}
            />
          </div>
          <h3 className="font-medium text-lg line-clamp-1" title={bookmark.title}>
            {bookmark.title}
          </h3>
        </div>

        <p className="text-muted-foreground text-sm mb-3 line-clamp-2" title={bookmark.description}>
          {bookmark.description || "No description"}
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
          {bookmark.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {bookmark.tags?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{bookmark.tags.length - 3}
            </Badge>
          )}
        </div>

        {bookmark.folder && (
          <div className="flex items-center mt-1">
            <FolderIcon className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">{bookmark.folder}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center border-t">
        <div className="flex gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {getFormattedDate(bookmark.createdAt)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Added {bookmark.createdAt.toLocaleDateString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {bookmark.visitCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {bookmark.visitCount}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Last visited {getFormattedDate(bookmark.lastVisited)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleVisit}>
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Visit</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(bookmark)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(bookmark.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  )
}

"use client"

import { useState } from "react"
import Image from "next/image"
import { ExternalLink, Clock, Eye, MoreHorizontal, Edit, Trash2, FolderIcon } from "lucide-react"
import { formatDistanceToNow } from "date-fns"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardFooter } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

export function BookmarkCard({ bookmark, onEdit, onDelete, onVisit }) {
  const [imageError, setImageError] = useState(false)

  const handleVisit = () => {
    window.open(bookmark.url, "_blank")
    onVisit(bookmark.id)
  }

  const getImageUrl = () => {
    if (imageError) return null
    return bookmark.metadata?.og?.image || null
  }

  const getFaviconUrl = () => {
    return bookmark.favicon || `https://www.google.com/s2/favicons?domain=${bookmark.url}`
  }

  const getFormattedDate = (date) => {
    if (!date) return "Never"
    return formatDistanceToNow(date, { addSuffix: true })
  }

  return (
    <Card className="overflow-hidden hover:shadow-md transition-shadow">
      <div className="relative">
        {getImageUrl() && (
          <div className="relative h-40 w-full overflow-hidden bg-muted">
            <Image
              src={getImageUrl() || "/placeholder.svg"}
              alt={bookmark.title}
              fill
              className="object-cover"
              onError={() => setImageError(true)}
              priority={false}
            />
          </div>
        )}
      </div>

      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-2">
          <div className="relative h-5 w-5 flex-shrink-0">
            <Image
              src={getFaviconUrl() || "/placeholder.svg"}
              alt=""
              width={20}
              height={20}
              className="object-contain"
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg?height=20&width=20"
              }}
            />
          </div>
          <h3 className="font-medium text-lg line-clamp-1" title={bookmark.title}>
            {bookmark.title}
          </h3>
        </div>

        <p className="text-muted-foreground text-sm mb-3 line-clamp-2" title={bookmark.description}>
          {bookmark.description || "No description"}
        </p>

        <div className="flex flex-wrap gap-1 mb-2">
          {bookmark.tags?.slice(0, 3).map((tag) => (
            <Badge key={tag} variant="secondary" className="text-xs">
              {tag}
            </Badge>
          ))}
          {bookmark.tags?.length > 3 && (
            <Badge variant="outline" className="text-xs">
              +{bookmark.tags.length - 3}
            </Badge>
          )}
        </div>

        {bookmark.folder && (
          <div className="flex items-center mt-1">
            <FolderIcon className="h-3.5 w-3.5 text-muted-foreground mr-1" />
            <span className="text-xs text-muted-foreground">{bookmark.folder}</span>
          </div>
        )}
      </CardContent>

      <CardFooter className="p-4 pt-0 flex justify-between items-center border-t">
        <div className="flex gap-4">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center text-xs text-muted-foreground">
                  <Clock className="h-3.5 w-3.5 mr-1" />
                  {getFormattedDate(bookmark.createdAt)}
                </div>
              </TooltipTrigger>
              <TooltipContent>
                <p>Added {bookmark.createdAt.toLocaleDateString()}</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>

          {bookmark.visitCount > 0 && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Eye className="h-3.5 w-3.5 mr-1" />
                    {bookmark.visitCount}
                  </div>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Last visited {getFormattedDate(bookmark.lastVisited)}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0" onClick={handleVisit}>
            <ExternalLink className="h-4 w-4" />
            <span className="sr-only">Visit</span>
          </Button>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                <MoreHorizontal className="h-4 w-4" />
                <span className="sr-only">More</span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onEdit(bookmark)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem
                className="text-destructive focus:text-destructive"
                onClick={() => onDelete(bookmark.id)}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardFooter>
    </Card>
  )
}

