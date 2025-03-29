"use client"

import { useState } from "react"
import { BookmarkCard } from "@/components/ui/bookmark-card"
import { BookmarkForm } from "@/components/ui/bookmark-form"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useBookmarks } from "@/hooks/use-bookmarks"

export function BookmarkGrid({ initialBookmarks, folder, tag }) {
  const { bookmarks: hookBookmarks, updateBookmark, deleteBookmark, recordVisit } = useBookmarks()
  const [editingBookmark, setEditingBookmark] = useState(null)
  const [deletingBookmarkId, setDeletingBookmarkId] = useState(null)

  // Use initialBookmarks if provided, otherwise use bookmarks from the hook
  const bookmarks = initialBookmarks || hookBookmarks

  // Filter bookmarks if folder or tag is provided
  const filteredBookmarks = bookmarks.filter((bookmark) => {
    if (folder && bookmark.folder !== folder) return false
    if (tag && !bookmark.tags?.includes(tag)) return false
    return true
  })

  const handleEdit = (bookmark) => {
    setEditingBookmark(bookmark)
  }

  const handleUpdate = async (updatedBookmark) => {
    if (!editingBookmark) return

    const result = await updateBookmark(editingBookmark.id, updatedBookmark)

    if (result.success) {
      setEditingBookmark(null)
    }

    return result
  }

  const handleDelete = (id) => {
    setDeletingBookmarkId(id)
  }

  const confirmDelete = async () => {
    if (!deletingBookmarkId) return

    await deleteBookmark(deletingBookmarkId)
    setDeletingBookmarkId(null)
  }

  const handleVisit = (id) => {
    recordVisit(id)
  }

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {filteredBookmarks.map((bookmark) => (
          <BookmarkCard
            key={bookmark.id}
            bookmark={bookmark}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onVisit={handleVisit}
          />
        ))}
      </div>

      {filteredBookmarks.length === 0 && (
        <div className="text-center py-8">
          <p className="text-muted-foreground">No bookmarks found</p>
        </div>
      )}

      {/* Edit Dialog */}
      <Dialog open={!!editingBookmark} onOpenChange={(open) => !open && setEditingBookmark(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Bookmark</DialogTitle>
          </DialogHeader>
          {editingBookmark && (
            <BookmarkForm
              bookmark={editingBookmark}
              onSubmit={handleUpdate}
              onCancel={() => setEditingBookmark(null)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingBookmarkId} onOpenChange={(open) => !open && setDeletingBookmarkId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this bookmark.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} className="bg-destructive text-destructive-foreground">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

