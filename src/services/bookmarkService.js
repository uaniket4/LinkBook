import {
    collection,
    addDoc,
    updateDoc,
    deleteDoc,
    doc,
    query,
    where,
    getDocs,
    orderBy,
    limit,
    serverTimestamp,
  } from "firebase/firestore"
  import { db } from "../firebase"
  
  // Create a new bookmark
  export const createBookmark = async (userId, bookmarkData) => {
    try {
      // Validate bookmark data
      if (!bookmarkData.title) throw new Error("Bookmark title is required")
      if (!bookmarkData.url) throw new Error("Bookmark URL is required")
  
      // Ensure URL has protocol
      if (!/^https?:\/\//i.test(bookmarkData.url)) {
        bookmarkData.url = `https://${bookmarkData.url}`
      }
  
      const newBookmark = {
        ...bookmarkData,
        userId,
        createdAt: serverTimestamp(),
        tags: bookmarkData.tags || [],
        folder: bookmarkData.folder || "",
      }
  
      const docRef = await addDoc(collection(db, "bookmarks"), newBookmark)
      return {
        success: true,
        id: docRef.id,
        data: { ...newBookmark, id: docRef.id },
      }
    } catch (error) {
      console.error("Error creating bookmark:", error)
      return { success: false, error: error.message }
    }
  }
  
  // Update an existing bookmark
  export const updateBookmark = async (bookmarkId, bookmarkData) => {
    try {
      if (!bookmarkId) throw new Error("Bookmark ID is required")
  
      // Validate bookmark data
      if (!bookmarkData.title) throw new Error("Bookmark title is required")
      if (!bookmarkData.url) throw new Error("Bookmark URL is required")
  
      // Ensure URL has protocol
      if (!/^https?:\/\//i.test(bookmarkData.url)) {
        bookmarkData.url = `https://${bookmarkData.url}`
      }
  
      const bookmarkRef = doc(db, "bookmarks", bookmarkId)
      await updateDoc(bookmarkRef, {
        ...bookmarkData,
        updatedAt: serverTimestamp(),
      })
  
      return { success: true }
    } catch (error) {
      console.error("Error updating bookmark:", error)
      return { success: false, error: error.message }
    }
  }
  
  // Delete a bookmark
  export const deleteBookmark = async (bookmarkId) => {
    try {
      if (!bookmarkId) throw new Error("Bookmark ID is required")
  
      const bookmarkRef = doc(db, "bookmarks", bookmarkId)
      await deleteDoc(bookmarkRef)
  
      return { success: true }
    } catch (error) {
      console.error("Error deleting bookmark:", error)
      return { success: false, error: error.message }
    }
  }
  
  // Get bookmarks for a user with pagination
  export const getBookmarks = async (userId, options = {}) => {
    try {
      const { tag, folder, searchTerm, pageSize = 50, lastDoc = null } = options
  
      let q = query(collection(db, "bookmarks"), where("userId", "==", userId), orderBy("createdAt", "desc"))
  
      if (pageSize) {
        q = query(q, limit(pageSize))
      }
  
      const querySnapshot = await getDocs(q)
  
      let bookmarks = querySnapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || null,
      }))
  
      // Client-side filtering for tags, folders, and search
      if (tag) {
        bookmarks = bookmarks.filter((bookmark) => bookmark.tags && bookmark.tags.includes(tag))
      }
  
      if (folder) {
        bookmarks = bookmarks.filter((bookmark) => bookmark.folder === folder)
      }
  
      if (searchTerm) {
        const term = searchTerm.toLowerCase()
        bookmarks = bookmarks.filter(
          (bookmark) =>
            bookmark.title.toLowerCase().includes(term) ||
            bookmark.url.toLowerCase().includes(term) ||
            (bookmark.description && bookmark.description.toLowerCase().includes(term)),
        )
      }
  
      // Extract unique tags and folders
      const uniqueTags = [...new Set(bookmarks.flatMap((b) => b.tags || []).filter(Boolean))]
      const uniqueFolders = [...new Set(bookmarks.map((b) => b.folder).filter(Boolean))]
  
      return {
        success: true,
        bookmarks,
        tags: uniqueTags,
        folders: uniqueFolders,
        hasMore: querySnapshot.docs.length === pageSize,
        lastDoc: querySnapshot.docs[querySnapshot.docs.length - 1] || null,
      }
    } catch (error) {
      console.error("Error fetching bookmarks:", error)
      return { success: false, error: error.message }
    }
  }
  
  // Get bookmark statistics
  export const getBookmarkStats = async (userId) => {
    try {
      const result = await getBookmarks(userId)
  
      if (!result.success) {
        throw new Error(result.error)
      }
  
      const { bookmarks, tags, folders } = result
  
      // Calculate tag usage
      const tagStats = tags
        .map((tag) => {
          const count = bookmarks.filter((b) => b.tags && b.tags.includes(tag)).length
          return {
            name: tag,
            count,
            percentage: Math.round((count / bookmarks.length) * 100),
          }
        })
        .sort((a, b) => b.count - a.count)
  
      // Calculate folder usage
      const folderStats = folders
        .map((folder) => {
          const count = bookmarks.filter((b) => b.folder === folder).length
          return {
            name: folder,
            count,
            percentage: Math.round((count / bookmarks.length) * 100),
          }
        })
        .sort((a, b) => b.count - a.count)
  
      // Calculate domain stats
      const domains = {}
      bookmarks.forEach((bookmark) => {
        try {
          const url = new URL(bookmark.url)
          const domain = url.hostname
          domains[domain] = (domains[domain] || 0) + 1
        } catch (e) {
          // Skip invalid URLs
        }
      })
  
      const domainStats = Object.entries(domains)
        .map(([domain, count]) => ({
          domain,
          count,
          percentage: Math.round((count / bookmarks.length) * 100),
        }))
        .sort((a, b) => b.count - a.count)
  
      return {
        success: true,
        totalBookmarks: bookmarks.length,
        tagStats,
        folderStats,
        domainStats,
        recentBookmarks: bookmarks.slice(0, 5),
      }
    } catch (error) {
      console.error("Error getting bookmark stats:", error)
      return { success: false, error: error.message }
    }
  }

