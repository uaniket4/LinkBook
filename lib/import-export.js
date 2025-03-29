// Utility functions for importing and exporting bookmarks

/**
 * Parse HTML bookmarks file (typically exported from browsers)
 * @param {string} html - HTML content of bookmarks file
 * @returns {Array} Array of bookmark objects
 */
export function parseHtmlBookmarks(html) {
    try {
      const parser = new DOMParser()
      const doc = parser.parseFromString(html, "text/html")
      const bookmarks = []
  
      // Process all A tags (links)
      const links = doc.querySelectorAll("a")
  
      links.forEach((link) => {
        const url = link.getAttribute("href")
        if (!url || !url.trim() || url.startsWith("javascript:")) return
  
        const title = link.textContent.trim()
        const addDate = link.getAttribute("add_date")
        const icon = link.getAttribute("icon")
        const tags = link.getAttribute("tags")
  
        // Find parent folder (if any)
        let folder = null
        let parent = link.parentElement
        while (parent && !folder) {
          if (
            parent.tagName === "DL" &&
            parent.previousElementSibling &&
            parent.previousElementSibling.tagName === "H3"
          ) {
            folder = parent.previousElementSibling.textContent.trim()
          }
          parent = parent.parentElement
        }
  
        bookmarks.push({
          url,
          title: title || url,
          description: "",
          createdAt: addDate ? new Date(Number.parseInt(addDate) * 1000) : new Date(),
          tags: tags ? tags.split(",").map((tag) => tag.trim()) : [],
          folder,
          favicon: icon || null,
        })
      })
  
      return bookmarks
    } catch (error) {
      console.error("Error parsing HTML bookmarks:", error)
      throw new Error("Failed to parse HTML bookmarks file")
    }
  }
  
  /**
   * Parse JSON bookmarks file (typically exported from other bookmark managers)
   * @param {string} json - JSON content of bookmarks file
   * @returns {Array} Array of bookmark objects
   */
  export function parseJsonBookmarks(json) {
    try {
      const data = JSON.parse(json)
  
      // Handle different JSON formats
      if (Array.isArray(data)) {
        // Direct array of bookmarks
        return data.map(normalizeBookmark)
      } else if (data.bookmarks && Array.isArray(data.bookmarks)) {
        // Object with bookmarks array
        return data.bookmarks.map(normalizeBookmark)
      } else if (data.items && Array.isArray(data.items)) {
        // Object with items array
        return data.items.map(normalizeBookmark)
      } else {
        throw new Error("Unsupported JSON format")
      }
    } catch (error) {
      console.error("Error parsing JSON bookmarks:", error)
      throw new Error("Failed to parse JSON bookmarks file")
    }
  }
  
  /**
   * Normalize bookmark object to ensure consistent format
   * @param {Object} bookmark - Bookmark object from various sources
   * @returns {Object} Normalized bookmark object
   */
  function normalizeBookmark(bookmark) {
    // Handle different property names
    const url = bookmark.url || bookmark.uri || bookmark.link || ""
    const title = bookmark.title || bookmark.name || url
    const description = bookmark.description || bookmark.desc || bookmark.note || ""
    const createdAt = bookmark.createdAt || bookmark.created || bookmark.date || new Date()
    const tags = bookmark.tags || bookmark.categories || bookmark.labels || []
    const folder = bookmark.folder || bookmark.collection || bookmark.category || null
    const favicon = bookmark.favicon || bookmark.icon || null
  
    return {
      url,
      title,
      description,
      createdAt: typeof createdAt === "string" ? new Date(createdAt) : createdAt,
      tags: Array.isArray(tags) ? tags : typeof tags === "string" ? tags.split(",").map((t) => t.trim()) : [],
      folder,
      favicon,
    }
  }
  
  /**
   * Export bookmarks to HTML format (compatible with most browsers)
   * @param {Array} bookmarks - Array of bookmark objects
   * @returns {string} HTML content for bookmarks file
   */
  export function exportBookmarksToHtml(bookmarks) {
    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      throw new Error("No bookmarks to export")
    }
  
    // Group bookmarks by folder
    const folderMap = new Map()
  
    bookmarks.forEach((bookmark) => {
      const folder = bookmark.folder || "Uncategorized"
      if (!folderMap.has(folder)) {
        folderMap.set(folder, [])
      }
      folderMap.get(folder).push(bookmark)
    })
  
    // Generate HTML
    let html = `<!DOCTYPE NETSCAPE-Bookmark-file-1>
  <!-- This is an automatically generated file.
       It will be read and overwritten.
       DO NOT EDIT! -->
  <META HTTP-EQUIV="Content-Type" CONTENT="text/html; charset=UTF-8">
  <TITLE>Bookmarks</TITLE>
  <H1>Bookmarks</H1>
  <DL><p>
      <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}" LAST_MODIFIED="${Math.floor(Date.now() / 1000)}">LinkBook Export</H3>
      <DL><p>`
  
    // Add bookmarks by folder
    folderMap.forEach((folderBookmarks, folderName) => {
      html += `
          <DT><H3 ADD_DATE="${Math.floor(Date.now() / 1000)}" LAST_MODIFIED="${Math.floor(Date.now() / 1000)}">${escapeHtml(folderName)}</H3>
          <DL><p>`
  
      folderBookmarks.forEach((bookmark) => {
        const addDate =
          bookmark.createdAt instanceof Date
            ? Math.floor(bookmark.createdAt.getTime() / 1000)
            : Math.floor(Date.now() / 1000)
  
        const tags = Array.isArray(bookmark.tags) ? bookmark.tags.join(",") : ""
  
        html += `
              <DT><A HREF="${escapeHtml(bookmark.url)}" ADD_DATE="${addDate}" ${bookmark.favicon ? `ICON="${escapeHtml(bookmark.favicon)}"` : ""} ${tags ? `TAGS="${escapeHtml(tags)}"` : ""}>${escapeHtml(bookmark.title)}</A>
              ${bookmark.description ? `<DD>${escapeHtml(bookmark.description)}` : ""}`
      })
  
      html += `
          </DL><p>`
    })
  
    html += `
      </DL><p>
  </DL><p>`
  
    return html
  }
  
  /**
   * Export bookmarks to JSON format
   * @param {Array} bookmarks - Array of bookmark objects
   * @returns {string} JSON content for bookmarks file
   */
  export function exportBookmarksToJson(bookmarks) {
    if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
      throw new Error("No bookmarks to export")
    }
  
    // Format bookmarks for export
    const exportData = bookmarks.map((bookmark) => ({
      url: bookmark.url,
      title: bookmark.title,
      description: bookmark.description || "",
      createdAt: bookmark.createdAt instanceof Date ? bookmark.createdAt.toISOString() : new Date().toISOString(),
      tags: Array.isArray(bookmark.tags) ? bookmark.tags : [],
      folder: bookmark.folder || null,
      favicon: bookmark.favicon || null,
      metadata: bookmark.metadata || null,
    }))
  
    return JSON.stringify(
      {
        version: "1.0",
        generator: "LinkBook",
        exportDate: new Date().toISOString(),
        count: exportData.length,
        bookmarks: exportData,
      },
      null,
      2,
    )
  }
  
  /**
   * Helper function to escape HTML special characters
   * @param {string} text - Text to escape
   * @returns {string} Escaped text
   */
  function escapeHtml(text) {
    if (!text) return ""
  
    return text
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;")
  }
  
  