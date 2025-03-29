"use client"

import { useState, useEffect } from "react"
import { BrowserRouter as Router, Route, Routes, Link, Navigate, useLocation } from "react-router-dom"
import { BookmarkProvider, BookmarkForm, BookmarkList, useBookmarks } from "./components/Bookmarks"
import LoginSignup from "./LoginSignup"
import FoldersPage from "./pages/FoldersPage"
import TagsPage from "./pages/TagsPage"
import TrendingPage from "./pages/TrendingPage"
import SettingsPage from "./pages/SettingsPage"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "./firebase"
import {
  TagIcon,
  LogOutIcon,
  HomeIcon,
  FolderIcon,
  PlusIcon,
  SettingsIcon,
  TrendingUpIcon,
  MoonIcon,
  SunIcon,
} from "lucide-react"
import "./styles/custom.css"
import LandingPage from "./components/LandingPage"

const App = () => {
  const [user, loading] = useAuthState(auth)
  const [darkMode, setDarkMode] = useState(() => {
    // Check if user preference exists in localStorage
    const savedMode = localStorage.getItem("darkMode")
    // Return true if saved preference is 'true', or if no preference and system prefers dark
    return savedMode !== null
      ? savedMode === "true"
      : window.matchMedia && window.matchMedia("(prefers-color-scheme: dark)").matches
  })

  useEffect(() => {
    // Apply dark mode to body and save preference
    if (darkMode) {
      document.body.classList.add("dark-mode")
      document.documentElement.classList.add("dark-mode")
    } else {
      document.body.classList.remove("dark-mode")
      document.documentElement.classList.remove("dark-mode")
    }

    // Save preference to localStorage
    localStorage.setItem("darkMode", darkMode.toString())
  }, [darkMode])

  const toggleDarkMode = () => {
    setDarkMode(!darkMode)
  }

  if (loading) {
    return (
      <div
        className="loading-state"
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <div className="loading-spinner"></div>
        <p>Loading LinkBook...</p>
      </div>
    )
  }

  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
        <Route path="/login" element={<LoginSignup darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
        <Route path="/signup" element={<LoginSignup darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
        <Route
          path="/dashboard/*"
          element={
            user ? (
              <BookmarkProvider>
                <DashboardRoutes darkMode={darkMode} toggleDarkMode={toggleDarkMode} />
              </BookmarkProvider>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  )
}

const DashboardRoutes = ({ darkMode, toggleDarkMode }) => {
  return (
    <Routes>
      <Route path="/" element={<Dashboard darkMode={darkMode} toggleDarkMode={toggleDarkMode} />} />
      <Route
        path="/folders"
        element={
          <DashboardLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <FoldersPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/tags"
        element={
          <DashboardLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <TagsPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/trending"
        element={
          <DashboardLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <TrendingPage />
          </DashboardLayout>
        }
      />
      <Route
        path="/settings"
        element={
          <DashboardLayout darkMode={darkMode} toggleDarkMode={toggleDarkMode}>
            <SettingsPage />
          </DashboardLayout>
        }
      />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  )
}

const DashboardLayout = ({ children, darkMode, toggleDarkMode }) => {
  const location = useLocation()
  const [user] = useAuthState(auth)

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>LinkBook</h2>
          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL || "/placeholder.svg"} alt={user.displayName || "User"} />
            ) : (
              <div className="avatar-placeholder">{(user?.displayName || user?.email || "U")[0].toUpperCase()}</div>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.displayName || "User"}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>

        <nav>
          <ul className="sidebar-nav">
            <li>
              <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
                <HomeIcon size={18} /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/dashboard/folders" className={location.pathname === "/dashboard/folders" ? "active" : ""}>
                <FolderIcon size={18} /> Folders
              </Link>
            </li>
            <li>
              <Link to="/dashboard/tags" className={location.pathname === "/dashboard/tags" ? "active" : ""}>
                <TagIcon size={18} /> Tags
              </Link>
            </li>
            <li>
              <Link to="/dashboard/trending" className={location.pathname === "/dashboard/trending" ? "active" : ""}>
                <TrendingUpIcon size={18} /> Trending
              </Link>
            </li>
            <li>
              <Link to="/dashboard/settings" className={location.pathname === "/dashboard/settings" ? "active" : ""}>
                <SettingsIcon size={18} /> Settings
              </Link>
            </li>
            <li>
              <button onClick={() => auth.signOut()}>
                <LogOutIcon size={18} /> Log Out
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">{children}</main>
    </div>
  )
}

const Dashboard = ({ darkMode, toggleDarkMode }) => {
  const location = useLocation()
  const [isAddingBookmark, setIsAddingBookmark] = useState(false)
  const { addBookmark } = useBookmarks()
  const [user] = useAuthState(auth)

  const handleAddBookmark = async (bookmark) => {
    const result = await addBookmark(bookmark)
    if (result.success) {
      setIsAddingBookmark(false)
    }
    return result
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <div className="sidebar-header">
          <h2>LinkBook</h2>
          <button
            className="theme-toggle"
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <SunIcon size={18} /> : <MoonIcon size={18} />}
          </button>
        </div>

        <div className="user-info">
          <div className="user-avatar">
            {user?.photoURL ? (
              <img src={user.photoURL || "/placeholder.svg"} alt={user.displayName || "User"} />
            ) : (
              <div className="avatar-placeholder">{(user?.displayName || user?.email || "U")[0].toUpperCase()}</div>
            )}
          </div>
          <div className="user-details">
            <div className="user-name">{user?.displayName || "User"}</div>
            <div className="user-email">{user?.email}</div>
          </div>
        </div>

        <nav>
          <ul className="sidebar-nav">
            <li>
              <Link to="/dashboard" className={location.pathname === "/dashboard" ? "active" : ""}>
                <HomeIcon size={18} /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/dashboard/folders" className={location.pathname === "/dashboard/folders" ? "active" : ""}>
                <FolderIcon size={18} /> Folders
              </Link>
            </li>
            <li>
              <Link to="/dashboard/tags" className={location.pathname === "/dashboard/tags" ? "active" : ""}>
                <TagIcon size={18} /> Tags
              </Link>
            </li>
            <li>
              <Link to="/dashboard/trending" className={location.pathname === "/dashboard/trending" ? "active" : ""}>
                <TrendingUpIcon size={18} /> Trending
              </Link>
            </li>
            <li>
              <Link to="/dashboard/settings" className={location.pathname === "/dashboard/settings" ? "active" : ""}>
                <SettingsIcon size={18} /> Settings
              </Link>
            </li>
            <li>
              <button onClick={() => auth.signOut()}>
                <LogOutIcon size={18} /> Log Out
              </button>
            </li>
          </ul>
        </nav>
      </aside>
      <main className="main-content">
        <div className="dashboard-header">
          <h1>Your Bookmarks</h1>
          <button className="add-bookmark-btn" onClick={() => setIsAddingBookmark(true)}>
            <PlusIcon size={16} /> Add Bookmark
          </button>
        </div>

        {isAddingBookmark && <BookmarkForm onSubmit={handleAddBookmark} onCancel={() => setIsAddingBookmark(false)} />}

        <BookmarkList />
      </main>
    </div>
  )
}

const FeatureCard = ({ icon, title, description }) => (
  <div className="feature-card">
    <div className="feature-icon">{icon}</div>
    <h3 className="feature-title">{title}</h3>
    <p className="feature-description">{description}</p>
  </div>
)

const FooterColumn = ({ title, links }) => (
  <div className="footer-column">
    <h3 className="footer-title">{title}</h3>
    <ul className="footer-links">
      {links.map((link, index) => (
        <li key={index}>
          <a href={link.href}>{link.text}</a>
        </li>
      ))}
    </ul>
  </div>
)

export default App

