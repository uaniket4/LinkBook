import { useState, useEffect, useContext, createContext } from "react"
import { auth, db } from "../firebase"
import { collection, addDoc, updateDoc, deleteDoc, doc, query, where, onSnapshot } from "firebase/firestore"
import { useAuthState } from "react-firebase-hooks/auth"
import { Edit2Icon, Trash2Icon } from "lucide-react"

const BookmarkContext = createContext()

export const useBookmarks = () => useContext(BookmarkContext)

export const BookmarkProvider = ({ children }) => {
  const [user] = useAuthState(auth)
  const [bookmarks, setBookmarks] = useState([])
  const [tags, setTags] = useState([])
  const [folders, setFolders] = useState([])

  useEffect(() => {
    if (user) {
      const bookmarksRef = collection(db, "bookmarks")
      const q = query(bookmarksRef, where("userId", "==", user.uid))
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const bookmarksData = snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }))
        setBookmarks(bookmarksData)

        // Extract unique tags and folders
        const uniqueTags = [...new Set(bookmarksData.flatMap((b) => b.tags))]
        const uniqueFolders = [...new Set(bookmarksData.map((b) => b.folder).filter(Boolean))]
        setTags(uniqueTags)
        setFolders(uniqueFolders)
      })
      return unsubscribe
    }
  }, [user])

  const addBookmark = async (bookmark) => {
    try {
      await addDoc(collection(db, "bookmarks"), {
        ...bookmark,
        userId: user.uid,
        createdAt: new Date(),
      })
    } catch (error) {
      console.error("Error adding bookmark: ", error)
    }
  }

  const updateBookmark = async (id, updatedBookmark) => {
    try {
      const bookmarkRef = doc(db, "bookmarks", id)
      await updateDoc(bookmarkRef, updatedBookmark)
    } catch (error) {
      console.error("Error updating bookmark: ", error)
    }
  }

  const deleteBookmark = async (id) => {
    try {
      const bookmarkRef = doc(db, "bookmarks", id)
      await deleteDoc(bookmarkRef)
    } catch (error) {
      console.error("Error deleting bookmark: ", error)
    }
  }

  return (
    <BookmarkContext.Provider value={{ bookmarks, tags, folders, addBookmark, updateBookmark, deleteBookmark }}>
      {children}
    </BookmarkContext.Provider>
  )
}

export const BookmarkForm = ({ bookmark, onSubmit, onCancel }) => {
  const [title, setTitle] = useState(bookmark?.title || "")
  const [url, setUrl] = useState(bookmark?.url || "")
  const [description, setDescription] = useState(bookmark?.description || "")
  const [tags, setTags] = useState(bookmark?.tags?.join(", ") || "")
  const [folder, setFolder] = useState(bookmark?.folder || "")

  const handleSubmit = (e) => {
    e.preventDefault()
    const bookmarkData = {
      title,
      url,
      description,
      tags: tags
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
      folder: folder.trim(),
    }
    onSubmit(bookmarkData)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-lg shadow-md mb-6">
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="Title"
        required
        className="w-full p-2 border rounded"
      />
      <input
        type="url"
        value={url}
        onChange={(e) => setUrl(e.target.value)}
        placeholder="URL"
        required
        className="w-full p-2 border rounded"
      />
      <textarea
        value={description}
        onChange={(e) => setDescription(e.target.value)}
        placeholder="Description"
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        value={tags}
        onChange={(e) => setTags(e.target.value)}
        placeholder="Tags (comma-separated)"
        className="w-full p-2 border rounded"
      />
      <input
        type="text"
        value={folder}
        onChange={(e) => setFolder(e.target.value)}
        placeholder="Folder"
        className="w-full p-2 border rounded"
      />
      <div className="flex justify-end space-x-2">
        <button type="button" onClick={onCancel} className="px-4 py-2 text-gray-600 bg-gray-200 rounded">
          Cancel
        </button>
        <button type="submit" className="px-4 py-2 text-white bg-blue-500 rounded">
          Save
        </button>
      </div>
    </form>
  )
}

export const BookmarkList = () => {
  const { bookmarks, updateBookmark, deleteBookmark, tags, folders } = useBookmarks()
  const [search, setSearch] = useState("")
  const [selectedTag, setSelectedTag] = useState("")
  const [selectedFolder, setSelectedFolder] = useState("")
  const [editingBookmark, setEditingBookmark] = useState(null)

  const filteredBookmarks = bookmarks.filter(
    (bookmark) =>
      bookmark.title.toLowerCase().includes(search.toLowerCase()) &&
      (!selectedTag || bookmark.tags.includes(selectedTag)) &&
      (!selectedFolder || bookmark.folder === selectedFolder),
  )

  const handleEdit = (bookmark) => {
    setEditingBookmark(bookmark)
  }

  const handleUpdate = (updatedBookmark) => {
    updateBookmark(editingBookmark.id, updatedBookmark)
    setEditingBookmark(null)
  }

  const handleDelete = (id) => {
    if (window.confirm("Are you sure you want to delete this bookmark?")) {
      deleteBookmark(id)
    }
  }

  return (
    <div>
      <div className="search-filter-container">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search bookmarks"
          className="flex-grow"
        />
        <select value={selectedTag} onChange={(e) => setSelectedTag(e.target.value)}>
          <option value="">All Tags</option>
          {tags.map((tag) => (
            <option key={tag} value={tag}>
              {tag}
            </option>
          ))}
        </select>
        <select value={selectedFolder} onChange={(e) => setSelectedFolder(e.target.value)}>
          <option value="">All Folders</option>
          {folders.map((folder) => (
            <option key={folder} value={folder}>
              {folder}
            </option>
          ))}
        </select>
      </div>
      <div className="bookmark-list">
        {filteredBookmarks.map((bookmark) => (
          <div key={bookmark.id} className="bookmark-card">
            {editingBookmark && editingBookmark.id === bookmark.id ? (
              <BookmarkForm bookmark={bookmark} onSubmit={handleUpdate} onCancel={() => setEditingBookmark(null)} />
            ) : (
              <>
                <h3>{bookmark.title}</h3>
                <a href={bookmark.url} target="_blank" rel="noopener noreferrer">
                  {bookmark.url}
                </a>
                <p>{bookmark.description}</p>
                <div className="bookmark-tags">
                  {bookmark.tags.map((tag) => (
                    <span key={tag} className="bookmark-tag">
                      {tag}
                    </span>
                  ))}
                </div>
                <p>Folder: {bookmark.folder || "None"}</p>
                <div className="bookmark-actions">
                  <button onClick={() => handleEdit(bookmark)}>
                    <Edit2Icon size={18} />
                  </button>
                  <button onClick={() => handleDelete(bookmark.id)}>
                    <Trash2Icon size={18} />
                  </button>
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}

