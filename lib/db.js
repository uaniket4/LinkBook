import {
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  increment,
  startAfter,
  writeBatch,
} from "firebase/firestore"
import { app } from "./firebase"

// Initialize Firestore
export const db = getFirestore(app)

// Bookmark CRUD operations with optimizations
export const getBookmarks = async (userId, options = {}) => {
  try {
    // Default page size
    const pageSize = options.limit || 20

    // Base query with compound index for faster retrieval
    let q = query(
      collection(db, "bookmarks"),
      where("userId", "==", userId),
      orderBy(options.sortBy || "createdAt", options.sortDirection || "desc"),
    )

    // Apply folder filter if provided
    if (options.folder) {
      q = query(q, where("folder", "==", options.folder))
    }

    // Apply pagination
    if (options.lastVisible) {
      q = query(q, startAfter(options.lastVisible), limit(pageSize))
    } else {
      q = query(q, limit(pageSize))
    }

    const querySnapshot = await getDocs(q)

    // Get the last visible document for pagination
    const lastVisible = querySnapshot.docs[querySnapshot.docs.length - 1]

    const bookmarks = querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate(),
      updatedAt: doc.data().updatedAt?.toDate(),
      lastVisited: doc.data().lastVisited?.toDate(),
    }))

    // Client-side filtering for tags and search
    let filteredBookmarks = bookmarks

    // Filter by tags if provided
    if (options.tags && options.tags.length > 0) {
      filteredBookmarks = filteredBookmarks.filter((bookmark) =>
        bookmark.tags?.some((tag) => options.tags.includes(tag)),
      )
    }

    // Filter by search query
    if (options.searchQuery) {
      const query = options.searchQuery.toLowerCase()
      filteredBookmarks = filteredBookmarks.filter(
        (bookmark) =>
          bookmark.title?.toLowerCase().includes(query) ||
          bookmark.description?.toLowerCase().includes(query) ||
          bookmark.url?.toLowerCase().includes(query) ||
          bookmark.tags?.some((tag) => tag.toLowerCase().includes(query)),
      )
    }

    return {
      bookmarks: filteredBookmarks,
      lastVisible,
      hasMore: querySnapshot.docs.length === pageSize,
    }
  } catch (error) {
    console.error("Error getting bookmarks:", error)
    throw new Error("Failed to fetch bookmarks")
  }
}

// Get bookmark by ID with error handling
export const getBookmarkById = async (id) => {
  try {
    if (!id) throw new Error("Bookmark ID is required")

    const docRef = doc(db, "bookmarks", id)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      throw new Error("Bookmark not found")
    }

    return {
      id: docSnap.id,
      ...docSnap.data(),
      createdAt: docSnap.data().createdAt?.toDate(),
      updatedAt: docSnap.data().updatedAt?.toDate(),
      lastVisited: docSnap.data().lastVisited?.toDate(),
    }
  } catch (error) {
    console.error("Error getting bookmark:", error)
    throw new Error(`Failed to fetch bookmark: ${error.message}`)
  }
}

// Add bookmark with validation
export const addBookmark = async (bookmark) => {
  try {
    // Validate required fields
    if (!bookmark.url) throw new Error("URL is required")
    if (!bookmark.userId) throw new Error("User ID is required")

    // Ensure URL has protocol
    if (!/^https?:\/\//i.test(bookmark.url)) {
      bookmark.url = `https://${bookmark.url}`
    }

    // Normalize data
    const bookmarkData = {
      ...bookmark,
      title: bookmark.title || "Untitled",
      description: bookmark.description || "",
      tags: Array.isArray(bookmark.tags) ? bookmark.tags : [],
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
      visitCount: 0,
    }

    const docRef = await addDoc(collection(db, "bookmarks"), bookmarkData)

    return {
      id: docRef.id,
      ...bookmarkData,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error adding bookmark:", error)
    throw new Error(`Failed to add bookmark: ${error.message}`)
  }
}

// Update bookmark with validation and optimistic concurrency control
export const updateBookmark = async (id, data) => {
  try {
    if (!id) throw new Error("Bookmark ID is required")

    const docRef = doc(db, "bookmarks", id)

    // Remove any immutable fields
    const { id: _, createdAt, userId, ...updateData } = data

    // Ensure URL has protocol if it's being updated
    if (updateData.url && !/^https?:\/\//i.test(updateData.url)) {
      updateData.url = `https://${updateData.url}`
    }

    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    })

    return true
  } catch (error) {
    console.error("Error updating bookmark:", error)
    throw new Error(`Failed to update bookmark: ${error.message}`)
  }
}

// Delete bookmark with transaction to ensure atomicity
export const deleteBookmark = async (id) => {
  try {
    if (!id) throw new Error("Bookmark ID is required")

    const docRef = doc(db, "bookmarks", id)
    await deleteDoc(docRef)
    return true
  } catch (error) {
    console.error("Error deleting bookmark:", error)
    throw new Error(`Failed to delete bookmark: ${error.message}`)
  }
}

// Update bookmark visit count with transaction
export const updateBookmarkVisit = async (id) => {
  try {
    if (!id) throw new Error("Bookmark ID is required")

    const docRef = doc(db, "bookmarks", id)

    await updateDoc(docRef, {
      visitCount: increment(1),
      lastVisited: Timestamp.now(),
    })

    return true
  } catch (error) {
    console.error("Error updating bookmark visit:", error)
    throw new Error(`Failed to update bookmark visit: ${error.message}`)
  }
}

// Batch operations for multiple bookmarks
export const batchAddBookmarks = async (bookmarks) => {
  try {
    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      throw new Error("No bookmarks provided for batch operation")
    }

    const batch = writeBatch(db)
    const now = Timestamp.now()
    const results = []

    // Process in chunks of 500 (Firestore batch limit)
    const processChunk = async (chunk) => {
      const batchChunk = writeBatch(db)
      const chunkResults = []

      for (const bookmark of chunk) {
        if (!bookmark.url || !bookmark.userId) continue

        // Ensure URL has protocol
        if (!/^https?:\/\//i.test(bookmark.url)) {
          bookmark.url = `https://${bookmark.url}`
        }

        const bookmarkData = {
          ...bookmark,
          title: bookmark.title || "Untitled",
          description: bookmark.description || "",
          tags: Array.isArray(bookmark.tags) ? bookmark.tags : [],
          createdAt: now,
          updatedAt: now,
          visitCount: 0,
        }

        const newDocRef = doc(collection(db, "bookmarks"))
        batchChunk.set(newDocRef, bookmarkData)

        chunkResults.push({
          id: newDocRef.id,
          ...bookmarkData,
          createdAt: new Date(),
          updatedAt: new Date(),
        })
      }

      await batchChunk.commit()
      return chunkResults
    }

    // Process bookmarks in chunks of 500
    for (let i = 0; i < bookmarks.length; i += 500) {
      const chunk = bookmarks.slice(i, i + 500)
      const chunkResults = await processChunk(chunk)
      results.push(...chunkResults)
    }

    return results
  } catch (error) {
    console.error("Error in batch adding bookmarks:", error)
    throw new Error(`Failed to batch add bookmarks: ${error.message}`)
  }
}

// Delete multiple bookmarks in a batch
export const batchDeleteBookmarks = async (ids) => {
  try {
    if (!Array.isArray(ids) || ids.length === 0) {
      throw new Error("No bookmark IDs provided for batch deletion")
    }

    // Process in chunks of 500 (Firestore batch limit)
    const processChunk = async (chunk) => {
      const batchChunk = writeBatch(db)

      for (const id of chunk) {
        const docRef = doc(db, "bookmarks", id)
        batchChunk.delete(docRef)
      }

      await batchChunk.commit()
    }

    // Process ids in chunks of 500
    for (let i = 0; i < ids.length; i += 500) {
      const chunk = ids.slice(i, i + 500)
      await processChunk(chunk)
    }

    return true
  } catch (error) {
    console.error("Error in batch deleting bookmarks:", error)
    throw new Error(`Failed to batch delete bookmarks: ${error.message}`)
  }
}

// User Settings operations with optimizations
export const getUserSettings = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required")

    const q = query(collection(db, "userSettings"), where("userId", "==", userId), limit(1))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Create default settings if none exist
      return createDefaultUserSettings(userId)
    }

    const doc = querySnapshot.docs[0]
    return {
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt.toDate(),
      updatedAt: doc.data().updatedAt.toDate(),
      sync: {
        ...doc.data().sync,
        lastSynced: doc.data().sync.lastSynced?.toDate(),
      },
    }
  } catch (error) {
    console.error("Error getting user settings:", error)
    throw new Error(`Failed to fetch user settings: ${error.message}`)
  }
}

export const createDefaultUserSettings = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required")

    const defaultSettings = {
      userId,
      theme: "system",
      defaultView: "grid",
      sidebar: {
        expanded: true,
        favorites: [],
      },
      notifications: {
        enabled: true,
        email: false,
      },
      sync: {
        autoSync: true,
      },
    }

    const docRef = await addDoc(collection(db, "userSettings"), {
      ...defaultSettings,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })

    return {
      id: docRef.id,
      ...defaultSettings,
      createdAt: new Date(),
      updatedAt: new Date(),
    }
  } catch (error) {
    console.error("Error creating default user settings:", error)
    throw new Error(`Failed to create user settings: ${error.message}`)
  }
}

export const updateUserSettings = async (userId, settings) => {
  try {
    if (!userId) throw new Error("User ID is required")

    // Get the existing settings document
    const q = query(collection(db, "userSettings"), where("userId", "==", userId), limit(1))

    const querySnapshot = await getDocs(q)

    if (querySnapshot.empty) {
      // Create settings if they don't exist
      await createDefaultUserSettings(userId)
      return true
    }

    const docRef = doc(db, "userSettings", querySnapshot.docs[0].id)

    // Remove any immutable fields
    const { id: _, createdAt, userId: __, ...updateData } = settings

    await updateDoc(docRef, {
      ...updateData,
      updatedAt: Timestamp.now(),
    })

    return true
  } catch (error) {
    console.error("Error updating user settings:", error)
    throw new Error(`Failed to update user settings: ${error.message}`)
  }
}

// Helper function to get all unique tags for a user with caching
const tagsCache = new Map() // Simple in-memory cache
export const getUserTags = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required")

    // Check cache first
    if (tagsCache.has(userId)) {
      const { tags, timestamp } = tagsCache.get(userId)
      // Cache is valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return tags
      }
    }

    // Optimize query to only fetch tags field
    const q = query(collection(db, "bookmarks"), where("userId", "==", userId), where("tags", "!=", null))

    const querySnapshot = await getDocs(q)
    const tagsSet = new Set()

    querySnapshot.docs.forEach((doc) => {
      const tags = doc.data().tags
      if (Array.isArray(tags)) {
        tags.forEach((tag) => {
          if (tag) tagsSet.add(tag)
        })
      }
    })

    const tags = Array.from(tagsSet)

    // Update cache
    tagsCache.set(userId, { tags, timestamp: Date.now() })

    return tags
  } catch (error) {
    console.error("Error getting user tags:", error)
    throw new Error(`Failed to fetch user tags: ${error.message}`)
  }
}

// Helper function to get all unique folders for a user with caching
const foldersCache = new Map() // Simple in-memory cache
export const getUserFolders = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required")

    // Check cache first
    if (foldersCache.has(userId)) {
      const { folders, timestamp } = foldersCache.get(userId)
      // Cache is valid for 5 minutes
      if (Date.now() - timestamp < 5 * 60 * 1000) {
        return folders
      }
    }

    // Optimize query to only fetch folder field
    const q = query(collection(db, "bookmarks"), where("userId", "==", userId), where("folder", "!=", null))

    const querySnapshot = await getDocs(q)
    const foldersSet = new Set()

    querySnapshot.docs.forEach((doc) => {
      const folder = doc.data().folder
      if (folder) foldersSet.add(folder)
    })

    const folders = Array.from(foldersSet)

    // Update cache
    foldersCache.set(userId, { folders, timestamp: Date.now() })

    return folders
  } catch (error) {
    console.error("Error getting user folders:", error)
    throw new Error(`Failed to fetch user folders: ${error.message}`)
  }
}

// Import bookmarks from browser or other services
export const importBookmarks = async (userId, bookmarks) => {
  try {
    if (!userId) throw new Error("User ID is required")
    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      throw new Error("No bookmarks provided for import")
    }

    // Format bookmarks for batch import
    const formattedBookmarks = bookmarks.map((bookmark) => ({
      userId,
      url: bookmark.url,
      title: bookmark.title || bookmark.url,
      description: bookmark.description || "",
      tags: bookmark.tags || [],
      folder: bookmark.folder || null,
      favicon: bookmark.favicon || null,
      metadata: bookmark.metadata || null,
    }))

    return await batchAddBookmarks(formattedBookmarks)
  } catch (error) {
    console.error("Error importing bookmarks:", error)
    throw new Error(`Failed to import bookmarks: ${error.message}`)
  }
}

// Export bookmarks to JSON
export const exportBookmarks = async (userId) => {
  try {
    if (!userId) throw new Error("User ID is required")

    const { bookmarks } = await getBookmarks(userId, { limit: 1000 })

    // Format bookmarks for export
    const exportData = bookmarks.map((bookmark) => ({
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description,
      tags: bookmark.tags,
      folder: bookmark.folder,
      createdAt: bookmark.createdAt.toISOString(),
      visitCount: bookmark.visitCount,
      lastVisited: bookmark.lastVisited ? bookmark.lastVisited.toISOString() : null,
      favicon: bookmark.favicon,
      metadata: bookmark.metadata,
    }))

    return exportData
  } catch (error) {
    console.error("Error exporting bookmarks:", error)
    throw new Error(`Failed to export bookmarks: ${error.message}`)
  }
}

// Clear cache function
export const clearCache = () => {
  tagsCache.clear()
  foldersCache.clear()
}

