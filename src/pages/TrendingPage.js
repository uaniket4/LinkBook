"use client"

import { useState, useEffect } from "react"
import { useBookmarks } from "../components/Bookmarks"
import {
  TrendingUpIcon,
  ExternalLinkIcon,
  BookmarkIcon,
  StarIcon,
  EyeIcon,
  ClockIcon,
  CalendarIcon,
} from "lucide-react"

const TrendingPage = () => {
  const { bookmarks } = useBookmarks()
  const [trendingBookmarks, setTrendingBookmarks] = useState([])
  const [popularTags, setPopularTags] = useState([])
  const [viewMode, setViewMode] = useState("trending") // trending, popular, recent

  useEffect(() => {
    // Calculate trending bookmarks (in a real app, this would be based on actual metrics)
    // For demo purposes, we'll just add a random "popularity" score
    const withPopularity = bookmarks.map((bookmark) => ({
      ...bookmark,
      popularity: Math.floor(Math.random() * 100),
      views: Math.floor(Math.random() * 1000),
      lastViewed: new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000)),
    }))

    // Sort by popularity
    const trending = [...withPopularity].sort((a, b) => b.popularity - a.popularity).slice(0, 10)
    setTrendingBookmarks(trending)

    // Calculate popular tags
    const tagCounts = {}
    bookmarks.forEach((bookmark) => {
      bookmark.tags.forEach((tag) => {
        tagCounts[tag] = (tagCounts[tag] || 0) + 1
      })
    })

    const sortedTags = Object.entries(tagCounts)
      .map(([tag, count]) => ({ tag, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 15)

    setPopularTags(sortedTags)
  }, [bookmarks])

  const getFilteredBookmarks = () => {
    switch (viewMode) {
      case "popular":
        return [...trendingBookmarks].sort((a, b) => b.views - a.views)
      case "recent":
        return [...trendingBookmarks].sort((a, b) => b.lastViewed - a.lastViewed)
      default:
        return trendingBookmarks
    }
  }

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    })
  }

  return (
    <div className="trending-page">
      <div className="dashboard-header">
        <h1>Trending</h1>
        <div className="view-mode-selector">
          <button
            className={`view-mode-btn ${viewMode === "trending" ? "active" : ""}`}
            onClick={() => setViewMode("trending")}
          >
            <TrendingUpIcon size={16} /> Trending
          </button>
          <button
            className={`view-mode-btn ${viewMode === "popular" ? "active" : ""}`}
            onClick={() => setViewMode("popular")}
          >
            <StarIcon size={16} /> Most Viewed
          </button>
          <button
            className={`view-mode-btn ${viewMode === "recent" ? "active" : ""}`}
            onClick={() => setViewMode("recent")}
          >
            <ClockIcon size={16} /> Recently Viewed
          </button>
        </div>
      </div>

      <div className="trending-container">
        <div className="trending-main">
          <h2 className="section-title">
            {viewMode === "trending" && "Trending Bookmarks"}
            {viewMode === "popular" && "Most Viewed Bookmarks"}
            {viewMode === "recent" && "Recently Viewed Bookmarks"}
          </h2>

          {getFilteredBookmarks().length === 0 ? (
            <div className="empty-state">
              <BookmarkIcon size={48} className="empty-state-icon" />
              <h3 className="empty-state-title">No bookmarks to display</h3>
              <p className="empty-state-text">Add more bookmarks to see trends.</p>
            </div>
          ) : (
            <div className="trending-cards">
              {getFilteredBookmarks().map((bookmark, index) => (
                <div key={bookmark.id} className="trending-card">
                  <div className="trending-rank">{index + 1}</div>
                  <div className="trending-content">
                    <h3 className="trending-title">{bookmark.title}</h3>
                    <a href={bookmark.url} target="_blank" rel="noopener noreferrer" className="trending-url">
                      {bookmark.url} <ExternalLinkIcon size={14} />
                    </a>
                    <p className="trending-description">{bookmark.description}</p>

                    <div className="trending-tags">
                      {bookmark.tags.map((tag) => (
                        <span key={tag} className="bookmark-tag">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <div className="trending-stats">
                      <div className="stat">
                        <EyeIcon size={14} />
                        <span>{bookmark.views} views</span>
                      </div>
                      <div className="stat">
                        <CalendarIcon size={14} />
                        <span>Last viewed: {formatDate(bookmark.lastViewed)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="trending-sidebar">
          <h3 className="sidebar-title">Popular Tags</h3>

          <div className="popular-tags">
            {popularTags.map(({ tag, count }) => (
              <div key={tag} className="popular-tag">
                <span className="tag-name">#{tag}</span>
                <span className="tag-count">{count}</span>
              </div>
            ))}
          </div>

          <div className="trending-info">
            <h4>About Trending</h4>
            <p>
              Trending bookmarks are calculated based on popularity, views, and recency. Add more bookmarks and interact
              with them to see more accurate trends.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default TrendingPage

