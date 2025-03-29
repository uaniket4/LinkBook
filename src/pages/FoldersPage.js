"use client"

import { useState } from "react"
import { useBookmarks } from "../components/Bookmarks"
import { FolderIcon, FolderPlusIcon, Edit2Icon, Trash2Icon, BookmarkIcon, FolderOpenIcon } from "lucide-react"

const FoldersPage = () => {
  const { bookmarks, folders, updateBookmark, deleteBookmark } = useBookmarks()
  const [activeFolder, setActiveFolder] = useState(null)
  const [newFolderName, setNewFolderName] = useState("")
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [editingFolder, setEditingFolder] = useState(null)
  const [editedFolderName, setEditedFolderName] = useState("")

  // Group bookmarks by folder
  const bookmarksByFolder = folders.reduce((acc, folder) => {
    acc[folder] = bookmarks.filter((bookmark) => bookmark.folder === folder)
    return acc
  }, {})

  // Add "Uncategorized" for bookmarks without a folder
  const uncategorizedBookmarks = bookmarks.filter((bookmark) => !bookmark.folder || bookmark.folder === "")
  if (uncategorizedBookmarks.length > 0) {
    bookmarksByFolder["Uncategorized"] = uncategorizedBookmarks
  }

  const handleCreateFolder = () => {
    setIsCreatingFolder(true)
  }

  const handleSaveNewFolder = () => {
    if (newFolderName.trim()) {
      // Create a dummy bookmark to establish the folder
      // In a real app, you might want to create a separate collection for folders
     // const dummyBookmark = {
       // title: `${newFolderName} (Empty)`,
       // url: "",
       // description: "This is a placeholder for an empty folder",
       // tags: [],
       // folder: newFolderName.trim(),
    //  }

      // Add the dummy bookmark to create the folder
      // You can remove this later when the folder has real bookmarks
      // addBookmark(dummyBookmark)

      setNewFolderName("")
      setIsCreatingFolder(false)
      setActiveFolder(newFolderName.trim())
    }
  }

  const handleEditFolder = (folder) => {
    setEditingFolder(folder)
    setEditedFolderName(folder)
  }

  const handleSaveEditedFolder = () => {
    if (editedFolderName.trim() && editedFolderName !== editingFolder) {
      // Update all bookmarks in this folder
      bookmarksByFolder[editingFolder].forEach((bookmark) => {
        updateBookmark(bookmark.id, { ...bookmark, folder: editedFolderName.trim() })
      })

      setEditingFolder(null)
      setActiveFolder(editedFolderName.trim())
    } else {
      setEditingFolder(null)
    }
  }

  const handleDeleteFolder = (folder) => {
    if (window.confirm(`Are you sure you want to delete the folder "${folder}" and all its bookmarks?`)) {
      // Delete all bookmarks in this folder
      bookmarksByFolder[folder].forEach((bookmark) => {
        deleteBookmark(bookmark.id)
      })

      setActiveFolder(null)
    }
  }

  const handleMoveBookmark = (bookmarkId, newFolder) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId)
    if (bookmark) {
      updateBookmark(bookmarkId, { ...bookmark, folder: newFolder })
    }
  }

  return (
    <div className="folders-page">
      <div className="dashboard-header">
        <h1>Folders</h1>
        <button className="add-bookmark-btn" onClick={handleCreateFolder}>
          <FolderPlusIcon size={16} /> Create Folder
        </button>
      </div>

      <div className="folders-container">
        <div className="folders-sidebar">
          <h3 className="folders-sidebar-title">Your Folders</h3>

          {isCreatingFolder ? (
            <div className="new-folder-form">
              <input
                type="text"
                value={newFolderName}
                onChange={(e) => setNewFolderName(e.target.value)}
                placeholder="Folder name"
                className="form-input"
                autoFocus
              />
              <div className="form-actions" style={{ marginTop: "0.5rem" }}>
                <button className="btn btn-cancel" onClick={() => setIsCreatingFolder(false)}>
                  Cancel
                </button>
                <button className="btn btn-save" onClick={handleSaveNewFolder}>
                  Save
                </button>
              </div>
            </div>
          ) : null}

          <ul className="folders-list">
            {Object.keys(bookmarksByFolder).map((folder) => (
              <li
                key={folder}
                className={`folder-item ${activeFolder === folder ? "active" : ""}`}
                onClick={() => setActiveFolder(folder)}
              >
                {editingFolder === folder ? (
                  <div className="edit-folder-form">
                    <input
                      id={`edit-folder-${folder}`}
                      type="text"
                      value={editedFolderName}
                      onChange={(e) => setEditedFolderName(e.target.value)}
                      className="form-input"
                      autoFocus
                    />
                    <div className="form-actions" style={{ marginTop: "0.5rem" }}>
                      <button className="btn btn-cancel" onClick={() => setEditingFolder(null)}>
                        Cancel
                      </button>
                      <button className="btn btn-save" onClick={handleSaveEditedFolder}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="folder-item-content">
                      {activeFolder === folder ? <FolderOpenIcon size={18} /> : <FolderIcon size={18} />}
                      <span className="folder-name">{folder}</span>
                      <span className="folder-count">{bookmarksByFolder[folder].length}</span>
                    </div>

                    {folder !== "Uncategorized" && (
                      <div className="folder-actions">
                        <button
                          className="action-btn"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleEditFolder(folder)
                          }}
                          title="Edit folder"
                        >
                          <Edit2Icon size={14} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={(e) => {
                            e.stopPropagation()
                            handleDeleteFolder(folder)
                          }}
                          title="Delete folder"
                        >
                          <Trash2Icon size={14} />
                        </button>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </div>

        <div className="folders-content">
          {activeFolder ? (
            <>
              <h2 className="folder-title">
                <FolderOpenIcon size={20} />
                {activeFolder}
                <span className="bookmark-count">{bookmarksByFolder[activeFolder].length} bookmarks</span>
              </h2>

              {bookmarksByFolder[activeFolder].length === 0 ? (
                <div className="empty-state">
                  <BookmarkIcon size={48} className="empty-state-icon" />
                  <h3 className="empty-state-title">No bookmarks in this folder</h3>
                  <p className="empty-state-text">Add bookmarks to this folder to see them here.</p>
                </div>
              ) : (
                <div className="bookmark-table-container">
                  <table className="bookmark-table">
                    <thead>
                      <tr>
                        <th style={{ width: "40%" }}>Title</th>
                        <th style={{ width: "40%" }}>URL</th>
                        <th style={{ width: "20%" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookmarksByFolder[activeFolder].map((bookmark) => (
                        <tr key={bookmark.id} className="fade-in">
                          <td>
                            <div className="bookmark-title">{bookmark.title}</div>
                          </td>
                          <td>
                            <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="bookmark-url">
                              {bookmark.url}
                            </a>
                          </td>
                          <td>
                            <div className="bookmark-actions">
                              <select
                                className="filter-select"
                                value=""
                                onChange={(e) => {
                                  if (e.target.value) {
                                    handleMoveBookmark(bookmark.id, e.target.value)
                                    e.target.value = ""
                                  }
                                }}
                                style={{ minWidth: "120px" }}
                              >
                                <option value="">Move to...</option>
                                {folders
                                  .filter((f) => f !== activeFolder)
                                  .map((folder) => (
                                    <option key={folder} value={folder}>
                                      {folder}
                                    </option>
                                  ))}
                                {activeFolder !== "Uncategorized" && <option value="">Uncategorized</option>}
                              </select>
                              <button
                                onClick={() => deleteBookmark(bookmark.id)}
                                className="action-btn delete"
                                title="Delete"
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
            </>
          ) : (
            <div className="empty-state">
              <FolderIcon size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">Select a folder</h3>
              <p className="empty-state-text">Choose a folder from the sidebar to view its bookmarks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default FoldersPage

