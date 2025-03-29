"use client"

import { useState, useEffect, useRef } from "react"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { useSettings } from "@/hooks/use-settings"
import { BookmarkGrid } from "@/components/ui/bookmark-grid"
import { BookmarkForm } from "@/components/ui/bookmark-form"
import { ImportExportBookmarks } from "@/components/ui/import-export"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Card, CardContent } from "@/components/ui/card"
import { Skeleton } from "@/components/ui/skeleton"
import { Plus, Search, TagIcon, FolderIcon, SortAsc, SortDesc, RefreshCw, Download } from "lucide-react"

export default function DashboardPage() {
  const {
    bookmarks,
    tags,
    folders,
    loading,
    pagination,
    addBookmark,
    searchBookmarks,
    filterByFolder,
    filterByTag,
    sortBookmarks,
  } = useBookmarks()

  const { settings } = useSettings()
  const [isAddingBookmark, setIsAddingBookmark] = useState(false)
  const [isImportExportOpen, setIsImportExportOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [selectedTag, setSelectedTag] = useState("all")
  const [selectedFolder, setSelectedFolder] = useState("all")
  const [sortBy, setSortBy] = useState("createdAt")
  const [sortDirection, setSortDirection] = useState("desc")
  const [view, setView] = useState(settings?.defaultView || "grid")

  // Refs for infinite scroll
  const loadingRef = useRef(null)

  // Handle search input with debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      searchBookmarks(searchQuery)
    }, 300)

    return () => clearTimeout(timer)
  }, [searchQuery, searchBookmarks])

  // Handle tag selection
  const handleTagChange = (value) => {
    setSelectedTag(value)
    filterByTag(value)
  }

  // Handle folder selection
  const handleFolderChange = (value) => {
    setSelectedFolder(value)
    filterByFolder(value)
  }

  // Handle sort change
  const handleSortChange = (value) => {
    setSortBy(value)
    sortBookmarks(value, sortDirection)
  }

  // Handle sort direction change
  const handleSortDirectionChange = () => {
    const newDirection = sortDirection === "asc" ? "desc" : "asc"
    setSortDirection(newDirection)
    sortBookmarks(sortBy, newDirection)
  }

  // Handle add bookmark
  const handleAddBookmark = async (bookmarkData) => {
    const result = await addBookmark(bookmarkData)
    if (result.success) {
      setIsAddingBookmark(false)
    }
    return result
  }

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    if (!loadingRef.current || !pagination.hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading && pagination.hasMore) {
          pagination.loadMore()
        }
      },
      { threshold: 0.5 },
    )

    observer.observe(loadingRef.current)

    return () => {
      if (loadingRef.current) {
        observer.unobserve(loadingRef.current)
      }
    }
  }, [loading, pagination])

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h1 className="text-3xl font-bold">Your Bookmarks</h1>

        <div className="flex flex-wrap gap-2">
          <Dialog open={isAddingBookmark} onOpenChange={setIsAddingBookmark}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Bookmark
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New Bookmark</DialogTitle>
              </DialogHeader>
              <BookmarkForm onSubmit={handleAddBookmark} onCancel={() => setIsAddingBookmark(false)} />
            </DialogContent>
          </Dialog>

          <Dialog open={isImportExportOpen} onOpenChange={setIsImportExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="h-4 w-4 mr-2" />
                Import/Export
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px]">
              <DialogHeader>
                <DialogTitle>Import & Export</DialogTitle>
              </DialogHeader>
              <ImportExportBookmarks />
            </DialogContent>
          </Dialog>

          <Button variant="ghost" size="icon" onClick={() => window.location.reload()} title="Refresh">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <div className="mb-6 grid grid-cols-1 md:grid-cols-[1fr_auto_auto] gap-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search bookmarks..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        <div className="flex gap-2">
          <Select value={sortBy} onValueChange={handleSortChange}>
            <SelectTrigger className="min-w-[130px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="createdAt">Date Added</SelectItem>
              <SelectItem value="title">Title</SelectItem>
              <SelectItem value="visitCount">Visit Count</SelectItem>
              <SelectItem value="lastVisited">Last Visited</SelectItem>
            </SelectContent>
          </Select>

          <Button
            variant="outline"
            size="icon"
            onClick={handleSortDirectionChange}
            title={sortDirection === "asc" ? "Ascending" : "Descending"}
          >
            {sortDirection === "asc" ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
          </Button>
        </div>

        <div className="flex gap-2">
          <Select value={selectedTag} onValueChange={handleTagChange}>
            <SelectTrigger className="min-w-[130px]">
              <TagIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Tags" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Tags</SelectItem>
              {tags.map((tag) => (
                <SelectItem key={tag} value={tag}>
                  {tag}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={selectedFolder} onValueChange={handleFolderChange}>
            <SelectTrigger className="min-w-[130px]">
              <FolderIcon className="h-4 w-4 mr-2" />
              <SelectValue placeholder="All Folders" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Folders</SelectItem>
              {folders.map((folder) => (
                <SelectItem key={folder} value={folder}>
                  {folder}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <Tabs value={view} onValueChange={setView} className="mb-6">
        <TabsList>
          <TabsTrigger value="grid">Grid View</TabsTrigger>
          <TabsTrigger value="list">List View</TabsTrigger>
        </TabsList>

        <TabsContent value="grid" className="pt-4">
          {loading && bookmarks.length === 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {Array.from({ length: 8 }).map((_, index) => (
                <Card key={index}>
                  <CardContent className="p-0">
                    <Skeleton className="h-40 w-full rounded-t-lg" />
                    <div className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-2/3" />
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <BookmarkGrid initialBookmarks={bookmarks} />
          )}
        </TabsContent>

        <TabsContent value="list" className="pt-4">
          {/* We'll implement the list view component later */}
          <div className="text-center py-8">
            <p className="text-muted-foreground">List view coming soon</p>
          </div>
        </TabsContent>
      </Tabs>

      {/* Infinite scroll loading indicator */}
      {pagination.hasMore && (
        <div ref={loadingRef} className="flex justify-center items-center py-8">
          {loading && (
            <div className="flex items-center gap-2">
              <div className="animate-spin h-5 w-5 border-2 border-primary border-t-transparent rounded-full"></div>
              <span className="text-muted-foreground">Loading more bookmarks...</span>
            </div>
          )}
        </div>
      )}

      {!loading && bookmarks.length === 0 && (
        <div className="text-center py-12">
          <h3 className="text-xl font-medium mb-2">No bookmarks found</h3>
          <p className="text-muted-foreground mb-6">
            {searchQuery || selectedTag !== "all" || selectedFolder !== "all"
              ? "Try adjusting your filters or search query"
              : "Start by adding your first bookmark"}
          </p>
          <Button onClick={() => setIsAddingBookmark(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Your First Bookmark
          </Button>
        </div>
      )}
    </div>
  )
}

