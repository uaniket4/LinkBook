"use client"

import { useState, useEffect, useContext, createContext, useCallback, useMemo } from "react"
import { auth, db } from "../firebase"
import {
  collection,
  addDoc,
  updateDoc,
  deleteDoc,
  doc,
  query,
  where,
  onSnapshot,
  orderBy,
  limit,
} from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import {
  Edit2Icon,
  Trash2Icon,
  ExternalLinkIcon,
  BookmarkIcon,
  FolderIcon,
  SearchIcon,
  XIcon,
  AlertCircleIcon,
  TagIcon,
  CheckIcon,
} from "lucide-react"

const BookmarkContext = createContext()

export const useBookmarks = () => useContext(BookmarkContext)

export const BookmarkProvider = ({ children }) => {
  const [user] = useAuthState(auth)
  const [bookmarks, setBookmarks] = useState([])
  const [tags, setTags] = useState([])
  const [folders, setFolders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [initialized, setInitialized] = useState(false)

  // Fetch bookmarks with pagination for better performance
  const fetchBookmarks = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const bookmarksRef = collection(db, "bookmarks")
      const q = query(
        bookmarksRef,
        where("userId", "==", user.uid),
        orderBy("createdAt", "desc"),
        limit(50), // Limit to 50 bookmarks initially for faster loading
      )

      // Use onSnapshot for real-time updates
      const unsubscribe = onSnapshot(
        q,
        (snapshot) => {
          const bookmarksData = snapshot.docs.map((doc) => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate() || new Date(),
          }))

          setBookmarks(bookmarksData)

          // Extract unique tags and folders
          const uniqueTags = [...new Set(bookmarksData.flatMap((b) => b.tags || []).filter(Boolean))]
          const uniqueFolders = [...new Set(bookmarksData.map((b) => b.folder).filter(Boolean))]

          setTags(uniqueTags)
          setFolders(uniqueFolders)
          setLoading(false)
          setInitialized(true)
        },
        (err) => {
          console.error("Error fetching bookmarks:", err)
          setError("Failed to load bookmarks. Please try again later.")
          setLoading(false)
        },
      )

      return () => unsubscribe()
    } catch (err) {
      console.error("Error setting up bookmarks listener:", err)
      setError("Failed to connect to the database. Please try again later.")
      setLoading(false)
      return () => {}
    }
  }, [user])

  useEffect(() => {
    const unsubscribeFunction = fetchBookmarks()
    return () => {
      if (typeof unsubscribeFunction === "function") {
        unsubscribeFunction()
      }
    }
  }, [fetchBookmarks])

  const addBookmark = useCallback(
    async (bookmark) => {
      try {
        if (!user) throw new Error("You must be logged in to add bookmarks")

        setLoading(true)

        // Validate bookmark data
        if (!bookmark.title) throw new Error("Bookmark title is required")
        if (!bookmark.url) throw new Error("Bookmark URL is required")

        // Ensure URL has protocol
        if (!/^https?:\/\//i.test(bookmark.url)) {
          bookmark.url = `https://${bookmark.url}`
        }

        const newBookmark = {
          ...bookmark,
          userId: user.uid,
          createdAt: new Date(),
          tags: bookmark.tags || [],
          folder: bookmark.folder || "",
        }

        await addDoc(collection(db, "bookmarks"), newBookmark)

        // Optimistically update the state
        setBookmarks((prev) => [
          { ...newBookmark, id: Date.now().toString() }, // Temporary ID until Firebase returns the real one
          ...prev,
        ])

        setLoading(false)
        return { success: true }
      } catch (error) {
        console.error("Error adding bookmark:", error)
        setLoading(false)
        return { success: false, error: error.message }
      }
    },
    [user],
  )

  const updateBookmark = useCallback(
    async (id, updatedBookmark) => {
      try {
        if (!user) throw new Error("You must be logged in to update bookmarks")
        if (!id) throw new Error("Bookmark ID is required")

        // Validate bookmark data
        if (!updatedBookmark.title) throw new Error("Bookmark title is required")
        if (!updatedBookmark.url) throw new Error("Bookmark URL is required")

        // Ensure URL has protocol
        if (!/^https?:\/\//i.test(updatedBookmark.url)) {
          updatedBookmark.url = `https://${updatedBookmark.url}`
        }

        // Optimistically update the state
        setBookmarks((prev) =>
          prev.map((bookmark) =>
            bookmark.id === id ? { ...bookmark, ...updatedBookmark, updatedAt: new Date() } : bookmark,
          ),
        )

        const bookmarkRef = doc(db, "bookmarks", id)
        await updateDoc(bookmarkRef, {
          ...updatedBookmark,
          updatedAt: new Date(),
        })

        return { success: true }
      } catch (error) {
        console.error("Error updating bookmark:", error)
        return { success: false, error: error.message }
      }
    },
    [user],
  )

  const deleteBookmark = useCallback(
    async (id) => {
      try {
        if (!user) throw new Error("You must be logged in to delete bookmarks")
        if (!id) throw new Error("Bookmark ID is required")

        // Optimistically update the state
        setBookmarks((prev) => prev.filter((bookmark) => bookmark.id !== id))

        const bookmarkRef = doc(db, "bookmarks", id)
        await deleteDoc(bookmarkRef)

        return { success: true }
      } catch (error) {
        console.error("Error deleting bookmark:", error)
        return { success: false, error: error.message }
      }
    },
    [user],
  )

  const contextValue = useMemo(
    () => ({
      bookmarks,
      tags,
      folders,
      addBookmark,
      updateBookmark,
      deleteBookmark,
      loading,
      error,
      initialized,
    }),
    [bookmarks, tags, folders, addBookmark, updateBookmark, deleteBookmark, loading, error, initialized],
  )

  return <BookmarkContext.Provider value={contextValue}>{children}</BookmarkContext.Provider>
}

export const BookmarkForm = ({ bookmark, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(bookmark?.title || "")
  const [url, setUrl] = useState(bookmark?.url || "")
  const [description, setDescription] = useState(bookmark?.description || "")
  const [tags, setTags] = useState(bookmark?.tags?.join(", ") || "")
  const [folder, setFolder] = useState(bookmark?.folder || "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const { folders } = useBookmarks()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")
    setLoading(true)
    setSuccess(false)

    try {
      // Basic validation
      if (!title.trim()) {
        throw new Error("Title is required")
      }

      if (!url.trim()) {
        throw new Error("URL is required")
      }

      const bookmarkData = {
        title: title.trim(),
        url: url.trim(),
        description: description.trim(),
        tags: tags
          .split(",")
          .map((tag) => tag.trim())
          .filter(Boolean),
        folder: folder.trim(),
      }

      const result = await onSubmit(bookmarkData)

      if (result && !result.success) {
        throw new Error(result.error || "Failed to save bookmark")
      }

      setSuccess(true)

      // If it's a new bookmark (not editing), clear the form
      if (!bookmark) {
        setTitle("")
        setUrl("")
        setDescription("")
        setTags("")
        setFolder("")
      }

      // Auto-close the form after showing success message
      setTimeout(() => {
        if (!bookmark) {
          onCancel()
        }
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="form-container">
      <h3 className="form-title">{bookmark ? "Edit Bookmark" : "Add New Bookmark"}</h3>

      {error && (
        <div className="message error">
          <AlertCircleIcon size={18} />
          {error}
        </div>
      )}

      {success && (
        <div className="message success">
          <CheckIcon size={18} />
          Bookmark {bookmark ? "updated" : "added"} successfully!
        </div>
      )}

      <form onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="title" className="form-label">
            Title
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Enter bookmark title"
            required
            className="form-input"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="url" className="form-label">
            URL
          </label>
          <input
            id="url"
            type="text"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://example.com"
            required
            className="form-input"
            disabled={loading}
          />
          <p className="form-help">If you omit https://, it will be added automatically.</p>
        </div>

        <div className="form-group">
          <label htmlFor="description" className="form-label">
            Description
          </label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Enter a brief description"
            className="form-textarea"
            disabled={loading}
          />
        </div>

        <div className="form-group">
          <label htmlFor="tags" className="form-label">
            Tags
          </label>
          <input
            id="tags"
            type="text"
            value={tags}
            onChange={(e) => setTags(e.target.value)}
            placeholder="Enter tags separated by commas"
            className="form-input"
            disabled={loading}
          />
          <p className="form-help">Example: work, reference, tutorial</p>
        </div>

        <div className="form-group">
          <label htmlFor="folder" className="form-label">
            Folder
          </label>
          <input
            id="folder"
            type="text"
            list="folder-options"
            value={folder}
            onChange={(e) => setFolder(e.target.value)}
            placeholder="Enter folder name"
            className="form-input"
            disabled={loading}
          />
          {folders.length > 0 && (
            <datalist id="folder-options">
              {folders.map((f) => (
                <option key={f} value={f} />
              ))}
            </datalist>
          )}
        </div>

        <div className="form-actions">
          <button type="button" onClick={onCancel} className="btn btn-cancel" disabled={loading}>
            Cancel
          </button>
          <button type="submit" className="btn btn-save" disabled={loading}>
            {loading ? "Saving..." : bookmark ? "Update" : "Save"}
          </button>
        </div>
      </form>
    </div>
  )
}

export const BookmarkList = () => {
  const { bookmarks, updateBookmark, deleteBookmark, tags, folders, loading, error, initialized } = useBookmarks()
  const [search, setSearch] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("")
  const [editingBookmark, setEditingBookmark] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSuccessMessage, setShowSuccessMessage] = useState(false)
  const [successMessage, setSuccessMessage] = useState("")

  // Memoize filtered bookmarks for better performance
  const filteredBookmarks = useMemo(() => {
    return bookmarks.filter(
      (bookmark) =>
        bookmark.title.toLowerCase().includes(search.toLowerCase()) &&
        (!selectedTag || bookmark.tags?.includes(selectedTag)) &&
        (!selectedFolder || bookmark.folder === selectedFolder),
    )
  }, [bookmarks, search, selectedTag, selectedFolder])

  const handleEdit = (bookmark) => {
    setEditingBookmark(bookmark)
  }

  const handleUpdate = async (updatedBookmark) => {
    const result = await updateBookmark(editingBookmark.id, updatedBookmark)
    if (result.success) {
      setEditingBookmark(null)
      setSuccessMessage("Bookmark updated successfully!")
      setShowSuccessMessage(true)
      setTimeout(() => setShowSuccessMessage(false), 3000)
    }
    return result
  }

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this bookmark?")) {
      setIsDeleting(true)
      const result = await deleteBookmark(id)
      setIsDeleting(false)

      if (result.success) {
        setSuccessMessage("Bookmark deleted successfully!")
        setShowSuccessMessage(true)
        setTimeout(() => setShowSuccessMessage(false), 3000)
      }
    }
  }

  const clearFilters = () => {
    setSearch("")
    setSelectedTag("")
    setSelectedFolder("")
  }

  // Render skeleton loading state
  if (loading && !initialized) {
    return (
      <div className="loading-state">
        <div className="loading-spinner"></div>
        <p>Loading your bookmarks...</p>

        <div className="bookmark-table-container" style={{ marginTop: "2rem" }}>
          <div style={{ padding: "1.5rem" }}>
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bookmark-skeleton">
                <div className="skeleton bookmark-skeleton-title"></div>
                <div className="skeleton bookmark-skeleton-url"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Render error state
  if (error) {
    return (
      <div className="message error" style={{ marginTop: "2rem" }}>
        <AlertCircleIcon size={24} />
        <div>
          <h3 style={{ margin: "0 0 0.5rem 0" }}>Error Loading Bookmarks</h3>
          <p style={{ margin: 0 }}>{error}</p>
        </div>
      </div>
    )
  }

  return (
    <div>
      {editingBookmark && (
        <BookmarkForm bookmark={editingBookmark} onSubmit={handleUpdate} onCancel={() => setEditingBookmark(null)} />
      )}

      {showSuccessMessage && (
        <div className="message success">
          <CheckIcon size={18} />
          {successMessage}
        </div>
      )}

      <div className="search-filter-container">
        <div style={{ position: "relative", flexGrow: 1 }}>
          <SearchIcon
            size={18}
            style={{
              position: "absolute",
              left: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
            }}
          />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search bookmarks"
            className="search-input"
            style={{ paddingLeft: "40px" }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)} className="filter-select">
            <option value="">All Tags</option>
            {tags.map((tag) => (
              <option key={tag} value={tag}>
                {tag}
              </option>
            ))}
          </select>
          <TagIcon
            size={16}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
              pointerEvents: "none",
            }}
          />
        </div>

        <div style={{ position: "relative" }}>
          <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)} className="filter-select">
            <option value="">All Folders</option>
            {folders.map((folder) => (
              <option key={folder} value={folder}>
                {folder}
              </option>
            ))}
          </select>
          <FolderIcon
            size={16}
            style={{
              position: "absolute",
              right: "12px",
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--text-secondary)",
              pointerEvents: "none",
            }}
          />
        </div>

        {(search || selectedTag || selectedFolder) && (
          <button
            onClick={clearFilters}
            className="btn"
            style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}
          >
            <XIcon size={16} /> Clear
          </button>
        )}
      </div>

      {filteredBookmarks.length === 0 ? (
        <div className="empty-state">
          <BookmarkIcon size={48} className="empty-state-icon" />
          <h3 className="empty-state-title">No bookmarks found</h3>
          <p className="empty-state-text">
            {bookmarks.length === 0
              ? "You haven't added any bookmarks yet."
              : "No bookmarks match your current filters."}
          </p>
          {bookmarks.length === 0 ? (
            <button className="btn" onClick={() => document.querySelector(".add-bookmark-btn").click()}>
              Add Your First Bookmark
            </button>
          ) : (
            <button className="btn" onClick={clearFilters}>
              Clear Filters
            </button>
          )}
        </div>
      ) : (
        <div className="bookmark-table-container">
          <table className="bookmark-table">
            <thead>
              <tr>
                <th style={{ width: "25%" }}>Title</th>
                <th style={{ width: "20%" }}>URL</th>
                <th style={{ width: "20%" }}>Description</th>
                <th style={{ width: "15%" }}>Tags</th>
                <th style={{ width: "10%" }}>Folder</th>
                <th style={{ width: "10%" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredBookmarks.map((bookmark) => (
                <tr key={bookmark.id} className="fade-in">
                  <td>
                    <div className="bookmark-title">{bookmark.title}</div>
                  </td>
                  <td>
                    <a
                      href={bookmark.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="bookmark-url"
                      title={bookmark.url}
                    >
                      {bookmark.url}
                      <ExternalLinkIcon size={14} style={{ marginLeft: "4px", display: "inline" }} />
                    </a>
                  </td>
                  <td>
                    <div className="bookmark-description" title={bookmark.description}>
                      {bookmark.description || "No description"}
                    </div>
                  </td>
                  <td>
                    <div className="bookmark-tags">
                      {bookmark.tags && bookmark.tags.length > 0 ? (
                        bookmark.tags.map((tag) => (
                          <span
                            key={tag}
                            className="bookmark-tag"
                            onClick={() => setSelectedTag(tag)}
                            style={{ cursor: "pointer" }}
                          >
                            {tag}
                          </span>
                        ))
                      ) : (
                        <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>No tags</span>
                      )}
                    </div>
                  </td>
                  <td>
                    {bookmark.folder ? (
                      <span
                        className="bookmark-folder"
                        onClick={() => setSelectedFolder(bookmark.folder)}
                        style={{ cursor: "pointer" }}
                      >
                        {bookmark.folder}
                      </span>
                    ) : (
                      <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>None</span>
                    )}
                  </td>
                  <td>
                    <div className="bookmark-actions">
                      <button onClick={() => handleEdit(bookmark)} className="action-btn" title="Edit">
                        <Edit2Icon size={18} />
                      </button>
                      <button
                        onClick={() => handleDelete(bookmark.id)}
                        className="action-btn delete"
                        title="Delete"
                        disabled={isDeleting}
                      >
                        <Trash2Icon size={18} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {loading && initialized && (
        <div className="loading-indicator">
          <div className="loading-spinner-small"></div>
          <span>Updating bookmarks...</span>
        </div>
      )}
    </div>
  )
}

