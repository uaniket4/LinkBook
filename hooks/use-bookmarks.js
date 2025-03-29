"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import {
  getBookmarksAction,
  addBookmarkAction,
  updateBookmarkAction,
  deleteBookmarkAction,
  getUserTagsAction,
  getUserFoldersAction,
  recordBookmarkVisitAction,
  batchAddBookmarksAction,
  batchDeleteBookmarksAction,
  importBookmarksAction,
  exportBookmarksAction,
} from "@/app/actions/bookmark-actions"
import { useAuth } from "./use-auth"
import { useToast } from "@/components/ui/use-toast"

export function useBookmarks() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [bookmarks, setBookmarks] = useState([])
  const [tags, setTags] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [pagination, setPagination] = useState({
    lastVisible: null,
    hasMore: true,
  })

  // Refs for tracking current filter state
  const currentFilters = useRef({
    folder: null,
    tags: [],
    searchQuery: "",
    sortBy: "createdAt",
    sortDirection: "desc",
  })

  // Debounce search queries
  const searchTimeout = useRef(null)

  const fetchBookmarks = useCallback(
    async (options = {}, reset = true) => {
      if (!user) return

      try {
        setLoading(true)
        setError(null)

        // Update current filters
        if (reset) {
          currentFilters.current = {
            ...currentFilters.current,
            ...options,
          }
        }

        // Prepare options for the API
        const apiOptions = {
          ...currentFilters.current,
          lastVisible: reset ? null : pagination.lastVisible,
        }

        const result = await getBookmarksAction(user.uid, apiOptions)

        if (result.success) {
          // If reset, replace bookmarks, otherwise append
          setBookmarks((prev) => (reset ? result.data : [...prev, ...result.data]))
          setPagination({
            lastVisible: result.pagination.lastVisible,
            hasMore: result.pagination.hasMore,
          })
        } else {
          setError(result.error)
          toast({
            title: "Error loading bookmarks",
            description: result.error,
            variant: "destructive",
          })
        }
      } catch (err) {
        console.error("Error fetching bookmarks:", err)
        setError("Failed to load bookmarks")
        toast({
          title: "Error",
          description: "Failed to load bookmarks",
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    },
    [user, pagination.lastVisible, toast],
  )

  const loadMore = useCallback(() => {
    if (pagination.hasMore && !loading) {
      fetchBookmarks({}, false)
    }
  }, [fetchBookmarks, pagination.hasMore, loading])

  const fetchTagsAndFolders = useCallback(async () => {
    if (!user) return

    try {
      const [tagsResult, foldersResult] = await Promise.all([
        getUserTagsAction(user.uid),
        getUserFoldersAction(user.uid),
      ])

      if (tagsResult.success) {
        setTags(tagsResult.data)
      }

      if (foldersResult.success) {
        setFolders(foldersResult.data)
      }
    } catch (err) {
      console.error("Error fetching tags and folders:", err)
      toast({
        title: "Error",
        description: "Failed to load tags and folders",
        variant: "destructive",
      })
    }
  }, [user, toast])

  useEffect(() => {
    fetchBookmarks()
    fetchTagsAndFolders()
  }, [fetchBookmarks, fetchTagsAndFolders])

  const addBookmark = useCallback(
    async (bookmarkData) => {
      if (!user) return { success: false, error: "Not authenticated" }

      try {
        setLoading(true)
        const result = await addBookmarkAction(user.uid, bookmarkData)

        if (result.success) {
          // Optimistically update the UI
          setBookmarks((prev) => [result.data, ...prev])
          fetchTagsAndFolders() // Refresh tags and folders
          toast({
            title: "Success",
            description: "Bookmark added successfully",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to add bookmark",
            variant: "destructive",
          })
        }

        return result
      } catch (err) {
        console.error("Error adding bookmark:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to add bookmark",
          variant: "destructive",
        })
        return { success: false, error: err.message }
      } finally {
        setLoading(false)
      }
    },
    [user, fetchTagsAndFolders, toast],
  )

  const updateBookmark = useCallback(
    async (id, bookmarkData) => {
      if (!user) return { success: false, error: "Not authenticated" }

      try {
        const result = await updateBookmarkAction(user.uid, id, bookmarkData)

        if (result.success) {
          // Optimistically update the UI
          setBookmarks((prev) =>
            prev.map((bookmark) =>
              bookmark.id === id ? { ...bookmark, ...bookmarkData, updatedAt: new Date() } : bookmark,
            ),
          )
          fetchTagsAndFolders() // Refresh tags and folders
          toast({
            title: "Success",
            description: "Bookmark updated successfully",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to update bookmark",
            variant: "destructive",
          })
        }

        return result
      } catch (err) {
        console.error("Error updating bookmark:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to update bookmark",
          variant: "destructive",
        })
        return { success: false, error: err.message }
      }
    },
    [user, fetchTagsAndFolders, toast],
  )

  const deleteBookmark = useCallback(
    async (id) => {
      if (!user) return { success: false, error: "Not authenticated" }

      try {
        const result = await deleteBookmarkAction(user.uid, id)

        if (result.success) {
          // Optimistically update the UI
          setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))
          fetchTagsAndFolders() // Refresh tags and folders
          toast({
            title: "Success",
            description: "Bookmark deleted successfully",
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete bookmark",
            variant: "destructive",
          })
        }

        return result
      } catch (err) {
        console.error("Error deleting bookmark:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to delete bookmark",
          variant: "destructive",
        })
        return { success: false, error: err.message }
      }
    },
    [user, fetchTagsAndFolders, toast],
  )

  const recordVisit = useCallback(
    async (id) => {
      if (!user) return

      try {
        await recordBookmarkVisitAction(user.uid, id)

        // Optimistically update the UI
        setBookmarks((prev) =>
          prev.map((bookmark) =>
            bookmark.id === id
              ? {
                  ...bookmark,
                  visitCount: (bookmark.visitCount || 0) + 1,
                  lastVisited: new Date(),
                }
              : bookmark,
          ),
        )
      } catch (err) {
        console.error("Error recording bookmark visit:", err)
      }
    },
    [user],
  )

  // Search with debounce
  const searchBookmarks = useCallback(
    (query) => {
      if (searchTimeout.current) {
        clearTimeout(searchTimeout.current)
      }

      searchTimeout.current = setTimeout(() => {
        fetchBookmarks({ searchQuery: query })
      }, 300)
    },
    [fetchBookmarks],
  )

  // Filter by folder
  const filterByFolder = useCallback(
    (folder) => {
      fetchBookmarks({ folder: folder === "all" ? null : folder })
    },
    [fetchBookmarks],
  )

  // Filter by tag
  const filterByTag = useCallback(
    (tag) => {
      fetchBookmarks({ tags: tag === "all" ? [] : [tag] })
    },
    [fetchBookmarks],
  )

  // Sort bookmarks
  const sortBookmarks = useCallback(
    (sortBy, sortDirection = "desc") => {
      fetchBookmarks({ sortBy, sortDirection })
    },
    [fetchBookmarks],
  )

  // Batch operations
  const batchAddBookmarks = useCallback(
    async (bookmarks) => {
      if (!user) return { success: false, error: "Not authenticated" }

      try {
        setLoading(true)
        const result = await batchAddBookmarksAction(user.uid, bookmarks)

        if (result.success) {
          // Refresh bookmarks instead of optimistic update due to potential large number
          fetchBookmarks()
          fetchTagsAndFolders()
          toast({
            title: "Success",
            description: `${result.data.length} bookmarks added successfully`,
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to add bookmarks",
            variant: "destructive",
          })
        }

        return result
      } catch (err) {
        console.error("Error batch adding bookmarks:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to add bookmarks",
          variant: "destructive",
        })
        return { success: false, error: err.message }
      } finally {
        setLoading(false)
      }
    },
    [user, fetchBookmarks, fetchTagsAndFolders, toast],
  )

  const batchDeleteBookmarks = useCallback(
    async (ids) => {
      if (!user) return { success: false, error: "Not authenticated" }

      try {
        setLoading(true)
        const result = await batchDeleteBookmarksAction(user.uid, ids)

        if (result.success) {
          // Optimistically update the UI
          setBookmarks((prev) => prev.filter((bookmark) => !ids.includes(bookmark.id)))
          fetchTagsAndFolders()
          toast({
            title: "Success",
            description: `${ids.length} bookmarks deleted successfully`,
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to delete bookmarks",
            variant: "destructive",
          })
        }

        return result
      } catch (err) {
        console.error("Error batch deleting bookmarks:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to delete bookmarks",
          variant: "destructive",
        })
        return { success: false, error: err.message }
      } finally {
        setLoading(false)
      }
    },
    [user, fetchTagsAndFolders, toast],
  )

  // Import/Export
  const importBookmarks = useCallback(
    async (bookmarks) => {
      if (!user) return { success: false, error: "Not authenticated" }

      try {
        setLoading(true)
        const result = await importBookmarksAction(user.uid, bookmarks)

        if (result.success) {
          fetchBookmarks()
          fetchTagsAndFolders()
          toast({
            title: "Success",
            description: `${result.data.count} bookmarks imported successfully`,
          })
        } else {
          toast({
            title: "Error",
            description: result.error || "Failed to import bookmarks",
            variant: "destructive",
          })
        }

        return result
      } catch (err) {
        console.error("Error importing bookmarks:", err)
        toast({
          title: "Error",
          description: err.message || "Failed to import bookmarks",
          variant: "destructive",
        })
        return { success: false, error: err.message }
      } finally {
        setLoading(false)
      }
    },
    [user, fetchBookmarks, fetchTagsAndFolders, toast],
  )

  const exportBookmarks = useCallback(async () => {
    if (!user) return { success: false, error: "Not authenticated" }

    try {
      setLoading(true)
      const result = await exportBookmarksAction(user.uid)

      if (result.success) {
        toast({
          title: "Success",
          description: `${result.data.length} bookmarks exported successfully`,
        })
      } else {
        toast({
          title: "Error",
          description: result.error || "Failed to export bookmarks",
          variant: "destructive",
        })
      }

      return result
    } catch (err) {
      console.error("Error exporting bookmarks:", err)
      toast({
        title: "Error",
        description: err.message || "Failed to export bookmarks",
        variant: "destructive",
      })
      return { success: false, error: err.message }
    } finally {
      setLoading(false)
    }
  }, [user, toast])

  return {
    bookmarks,
    tags,
    folders,
    loading,
    error,
    pagination: {
      hasMore: pagination.hasMore,
      loadMore,
    },
    fetchBookmarks,
    addBookmark,
    updateBookmark,
    deleteBookmark,
    recordVisit,
    searchBookmarks,
    filterByFolder,
    filterByTag,
    sortBookmarks,
    batchAddBookmarks,
    batchDeleteBookmarks,
    importBookmarks,
    exportBookmarks,
  }
}

