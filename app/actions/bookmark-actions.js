"use server"
import {
  addBookmark,
  deleteBookmark,
  getBookmarkById,
  getBookmarks,
  updateBookmark,
  updateBookmarkVisit,
  getUserTags,
  getUserFolders,
  batchAddBookmarks,
  batchDeleteBookmarks,
  importBookmarks,
  exportBookmarks,
} from "@/lib/db"
import { extractMetadata, preloadMetadata } from "@/lib/metadata"
import { revalidatePath } from "next/cache"

// Helper to validate user access
const validateUserAccess = async (userId, bookmarkId) => {
  try {
    const bookmark = await getBookmarkById(bookmarkId)
    if (bookmark.userId !== userId) {
      throw new Error("You do not have permission to access this bookmark")
    }
    return bookmark
  } catch (error) {
    throw error
  }
}

export async function getBookmarksAction(userId, options = {}) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }

    const result = await getBookmarks(userId, options)

    // Preload metadata for visible bookmarks to improve perceived performance
    if (result.bookmarks.length > 0) {
      const urls = result.bookmarks
        .filter((b) => !b.metadata?.ogImage)
        .map((b) => b.url)
        .slice(0, 10) // Limit to first 10 bookmarks without metadata

      if (urls.length > 0) {
        // Don't await this - let it happen in the background
        preloadMetadata(urls)
      }
    }

    return {
      success: true,
      data: result.bookmarks,
      pagination: {
        lastVisible: result.lastVisible,
        hasMore: result.hasMore,
      },
    }
  } catch (error) {
    console.error("Error fetching bookmarks:", error)
    return { success: false, error: error.message || "Failed to fetch bookmarks" }
  }
}

export async function getBookmarkByIdAction(userId, id) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }
    if (!id) return { success: false, error: "Bookmark ID is required" }

    const bookmark = await getBookmarkById(id)

    // Verify ownership
    if (bookmark.userId !== userId) {
      return { success: false, error: "You do not have permission to access this bookmark" }
    }

    return { success: true, data: bookmark }
  } catch (error) {
    console.error("Error fetching bookmark:", error)
    return { success: false, error: error.message || "Failed to fetch bookmark" }
  }
}

export async function addBookmarkAction(userId, bookmarkData) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }

    // Validate the URL
    if (!bookmarkData.url) {
      return { success: false, error: "URL is required" }
    }

    // Make sure URL has protocol
    if (!/^https?:\/\//i.test(bookmarkData.url)) {
      bookmarkData.url = `https://${bookmarkData.url}`
    }

    // Extract metadata if needed (title, description, favicon)
    if (!bookmarkData.title || !bookmarkData.description || !bookmarkData.favicon) {
      try {
        const metadata = await extractMetadata(bookmarkData.url)
        bookmarkData = {
          ...bookmarkData,
          title: bookmarkData.title || metadata.title || "Untitled",
          description: bookmarkData.description || metadata.description || "",
          favicon: bookmarkData.favicon || metadata.favicon || "",
          metadata: {
            og: {
              title: metadata.ogTitle,
              description: metadata.ogDescription,
              image: metadata.ogImage,
            },
            twitter: {
              title: metadata.twitterTitle,
              description: metadata.twitterDescription,
              image: metadata.twitterImage,
            },
            domain: metadata.domain,
          },
        }
      } catch (metadataError) {
        console.error("Error extracting metadata:", metadataError)
        // Continue with available data even if metadata extraction fails
      }
    }

    const bookmark = await addBookmark({
      ...bookmarkData,
      userId,
    })

    revalidatePath("/dashboard")
    return { success: true, data: bookmark }
  } catch (error) {
    console.error("Error adding bookmark:", error)
    return { success: false, error: error.message || "Failed to add bookmark" }
  }
}

export async function updateBookmarkAction(userId, id, bookmarkData) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }
    if (!id) return { success: false, error: "Bookmark ID is required" }

    // Fetch the bookmark to verify ownership
    try {
      await validateUserAccess(userId, id)
    } catch (error) {
      return { success: false, error: error.message }
    }

    // Make sure URL has protocol if it's being updated
    if (bookmarkData.url && !/^https?:\/\//i.test(bookmarkData.url)) {
      bookmarkData.url = `https://${bookmarkData.url}`
    }

    await updateBookmark(id, bookmarkData)

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error updating bookmark:", error)
    return { success: false, error: error.message || "Failed to update bookmark" }
  }
}

export async function deleteBookmarkAction(userId, id) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }
    if (!id) return { success: false, error: "Bookmark ID is required" }

    // Fetch the bookmark to verify ownership
    try {
      await validateUserAccess(userId, id)
    } catch (error) {
      return { success: false, error: error.message }
    }

    await deleteBookmark(id)

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error deleting bookmark:", error)
    return { success: false, error: error.message || "Failed to delete bookmark" }
  }
}

export async function recordBookmarkVisitAction(userId, id) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }
    if (!id) return { success: false, error: "Bookmark ID is required" }

    // Fetch the bookmark to verify ownership
    try {
      await validateUserAccess(userId, id)
    } catch (error) {
      return { success: false, error: error.message }
    }

    await updateBookmarkVisit(id)
    return { success: true }
  } catch (error) {
    console.error("Error recording bookmark visit:", error)
    return { success: false, error: error.message || "Failed to record bookmark visit" }
  }
}

export async function getUserTagsAction(userId) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }

    const tags = await getUserTags(userId)
    return { success: true, data: tags }
  } catch (error) {
    console.error("Error fetching tags:", error)
    return { success: false, error: error.message || "Failed to fetch tags" }
  }
}

export async function getUserFoldersAction(userId) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }

    const folders = await getUserFolders(userId)
    return { success: true, data: folders }
  } catch (error) {
    console.error("Error fetching folders:", error)
    return { success: false, error: error.message || "Failed to fetch folders" }
  }
}

// New actions for batch operations
export async function batchAddBookmarksAction(userId, bookmarks) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }
    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      return { success: false, error: "No bookmarks provided" }
    }

    // Add userId to each bookmark
    const bookmarksWithUserId = bookmarks.map((bookmark) => ({
      ...bookmark,
      userId,
    }))

    const result = await batchAddBookmarks(bookmarksWithUserId)

    revalidatePath("/dashboard")
    return { success: true, data: result }
  } catch (error) {
    console.error("Error batch adding bookmarks:", error)
    return { success: false, error: error.message || "Failed to add bookmarks" }
  }
}

export async function batchDeleteBookmarksAction(userId, ids) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }
    if (!Array.isArray(ids) || ids.length === 0) {
      return { success: false, error: "No bookmark IDs provided" }
    }

    // Verify ownership of all bookmarks
    for (const id of ids) {
      try {
        await validateUserAccess(userId, id)
      } catch (error) {
        return { success: false, error: `Error with bookmark ${id}: ${error.message}` }
      }
    }

    await batchDeleteBookmarks(ids)

    revalidatePath("/dashboard")
    return { success: true }
  } catch (error) {
    console.error("Error batch deleting bookmarks:", error)
    return { success: false, error: error.message || "Failed to delete bookmarks" }
  }
}

export async function importBookmarksAction(userId, bookmarks) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }

    const result = await importBookmarks(userId, bookmarks)

    revalidatePath("/dashboard")
    return { success: true, data: { count: result.length } }
  } catch (error) {
    console.error("Error importing bookmarks:", error)
    return { success: false, error: error.message || "Failed to import bookmarks" }
  }
}

export async function exportBookmarksAction(userId) {
  try {
    if (!userId) return { success: false, error: "User ID is required" }

    const bookmarks = await exportBookmarks(userId)
    return { success: true, data: bookmarks }
  } catch (error) {
    console.error("Error exporting bookmarks:", error)
    return { success: false, error: error.message || "Failed to export bookmarks" }
  }
}

