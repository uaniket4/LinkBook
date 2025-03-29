"use client"

import { useState } from "react"
import { useBookmarks } from "../components/Bookmarks"
import { TagIcon, PlusIcon, Edit2Icon, Trash2Icon, BookmarkIcon, HashIcon } from "lucide-react"

const TagsPage = () => {
  const { bookmarks, tags, updateBookmark, deleteBookmark } = useBookmarks()
  const [activeTag, setActiveTag] = useState(null)
  const [newTagName, setNewTagName] = useState("")
  const [isCreatingTag, setIsCreatingTag] = useState(false)
  const [editingTag, setEditingTag] = useState(null)
  const [editedTagName, setEditedTagName] = useState("")

  // Group bookmarks by tag
  const bookmarksByTag = tags.reduce((acc, tag) => {
    acc[tag] = bookmarks.filter((bookmark) => bookmark.tags.includes(tag))
    return acc
  }, {})

  // Add "Untagged" for bookmarks without tags
  const untaggedBookmarks = bookmarks.filter((bookmark) => !bookmark.tags || bookmark.tags.length === 0)
  if (untaggedBookmarks.length > 0) {
    bookmarksByTag["Untagged"] = untaggedBookmarks
  }

  const handleCreateTag = () => {
    setIsCreatingTag(true)
  }

  const handleSaveNewTag = () => {
    if (newTagName.trim()) {
      // In a real app, you might want to create a separate collection for tags
      setNewTagName("")
      setIsCreatingTag(false)
      setActiveTag(newTagName.trim())
    }
  }

  const handleEditTag = (tag) => {
    setEditingTag(tag)
    setEditedTagName(tag)
  }

  const handleSaveEditedTag = () => {
    if (editedTagName.trim() && editedTagName !== editingTag) {
      // Update all bookmarks with this tag
      bookmarksByTag[editingTag].forEach((bookmark) => {
        const updatedTags = bookmark.tags.map((t) => (t === editingTag ? editedTagName.trim() : t))
        updateBookmark(bookmark.id, { ...bookmark, tags: updatedTags })
      })

      setEditingTag(null)
      setActiveTag(editedTagName.trim())
    } else {
      setEditingTag(null)
    }
  }

  const handleDeleteTag = (tag) => {
    if (window.confirm(`Are you sure you want to remove the tag "${tag}" from all bookmarks?`)) {
      // Remove this tag from all bookmarks
      bookmarksByTag[tag].forEach((bookmark) => {
        const updatedTags = bookmark.tags.filter((t) => t !== tag)
        updateBookmark(bookmark.id, { ...bookmark, tags: updatedTags })
      })

      setActiveTag(null)
    }
  }

  const handleRemoveTagFromBookmark = (bookmarkId, tagToRemove) => {
    const bookmark = bookmarks.find((b) => b.id === bookmarkId)
    if (bookmark) {
      const updatedTags = bookmark.tags.filter((t) => t !== tagToRemove)
      updateBookmark(bookmarkId, { ...bookmark, tags: updatedTags })
    }
  }

  // Calculate tag usage statistics
  const tagStats = tags
    .map((tag) => ({
      name: tag,
      count: bookmarksByTag[tag]?.length || 0,
      percentage: Math.round(((bookmarksByTag[tag]?.length || 0) / bookmarks.length) * 100),
    }))
    .sort((a, b) => b.count - a.count)

  return (
    <div className="tags-page">
      <div className="dashboard-header">
        <h1>Tags</h1>
        <button className="add-bookmark-btn" onClick={handleCreateTag}>
          <PlusIcon size={16} /> Create Tag
        </button>
      </div>

      <div className="tags-container">
        <div className="tags-sidebar">
          <h3 className="tags-sidebar-title">Your Tags</h3>

          {isCreatingTag ? (
            <div className="new-tag-form">
              <input
                type="text"
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                placeholder="Tag name"
                className="form-input"
                autoFocus
              />
              <div className="form-actions" style={{ marginTop: "0.5rem" }}>
                <button className="btn btn-cancel" onClick={() => setIsCreatingTag(false)}>
                  Cancel
                </button>
                <button className="btn btn-save" onClick={handleSaveNewTag}>
                  Save
                </button>
              </div>
            </div>
          ) : null}

          <div className="tags-cloud">
            {tagStats.map((tag) => (
              <div
                key={tag.name}
                className={`tag-item ${activeTag === tag.name ? "active" : ""}`}
                style={{
                  fontSize: `${Math.max(0.8, Math.min(1.5, 0.8 + (tag.percentage / 100) * 0.7))}rem`,
                  opacity: Math.max(0.6, Math.min(1, 0.6 + (tag.percentage / 100) * 0.4)),
                }}
                onClick={() => setActiveTag(tag.name)}
              >
                <span className="tag-name">#{tag.name}</span>
                <span className="tag-count">{tag.count}</span>
              </div>
            ))}
            {Object.keys(bookmarksByTag).includes("Untagged") && (
              <div
                className={`tag-item ${activeTag === "Untagged" ? "active" : ""}`}
                onClick={() => setActiveTag("Untagged")}
              >
                <span className="tag-name">Untagged</span>
                <span className="tag-count">{bookmarksByTag["Untagged"].length}</span>
              </div>
            )}
          </div>
        </div>

        <div className="tags-content">
          {activeTag ? (
            <>
              <div className="tag-header">
                {editingTag === activeTag ? (
                  <div className="edit-tag-form">
                    <input
                      type="text"
                      value={editedTagName}
                      onChange={(e) => setEditedTagName(e.target.value)}
                      className="form-input"
                      autoFocus
                    />
                    <div className="form-actions" style={{ marginTop: "0.5rem" }}>
                      <button className="btn btn-cancel" onClick={() => setEditingTag(null)}>
                        Cancel
                      </button>
                      <button className="btn btn-save" onClick={handleSaveEditedTag}>
                        Save
                      </button>
                    </div>
                  </div>
                ) : (
                  <h2 className="tag-title">
                    <HashIcon size={20} />
                    {activeTag}
                    <span className="bookmark-count">{bookmarksByTag[activeTag].length} bookmarks</span>

                    {activeTag !== "Untagged" && (
                      <div className="tag-actions">
                        <button className="action-btn" onClick={() => handleEditTag(activeTag)} title="Edit tag">
                          <Edit2Icon size={16} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDeleteTag(activeTag)}
                          title="Delete tag"
                        >
                          <Trash2Icon size={16} />
                        </button>
                      </div>
                    )}
                  </h2>
                )}
              </div>

              {bookmarksByTag[activeTag].length === 0 ? (
                <div className="empty-state">
                  <BookmarkIcon size={48} className="empty-state-icon" />
                  <h3 className="empty-state-title">No bookmarks with this tag</h3>
                  <p className="empty-state-text">Add this tag to bookmarks to see them here.</p>
                </div>
              ) : (
                <div className="bookmark-table-container">
                  <table className="bookmark-table">
                    <thead>
                      <tr>
                        <th style={{ width: "30%" }}>Title</th>
                        <th style={{ width: "30%" }}>URL</th>
                        <th style={{ width: "25%" }}>Other Tags</th>
                        <th style={{ width: "15%" }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bookmarksByTag[activeTag].map((bookmark) => (
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
                            <div className="bookmark-tags">
                              {bookmark.tags
                                .filter((tag) => tag !== activeTag)
                                .map((tag) => (
                                  <span key={tag} className="bookmark-tag" onClick={() => setActiveTag(tag)}>
                                    {tag}
                                  </span>
                                ))}
                              {bookmark.tags.length === 1 && bookmark.tags[0] === activeTag && (
                                <span style={{ color: "var(--text-secondary)", fontSize: "0.9rem" }}>
                                  No other tags
                                </span>
                              )}
                            </div>
                          </td>
                          <td>
                            <div className="bookmark-actions">
                              {activeTag !== "Untagged" && (
                                <button
                                  onClick={() => handleRemoveTagFromBookmark(bookmark.id, activeTag)}
                                  className="action-btn"
                                  title="Remove tag"
                                >
                                  <TagIcon size={16} style={{ marginRight: "4px" }} />
                                  Remove
                                </button>
                              )}
                              <button
                                onClick={() => deleteBookmark(bookmark.id)}
                                className="action-btn delete"
                                title="Delete bookmark"
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
              <TagIcon size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">Select a tag</h3>
              <p className="empty-state-text">Choose a tag from the sidebar to view related bookmarks.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default TagsPage

