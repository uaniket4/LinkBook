import { useState } from "react"
import { BrowserRouter as Router, Route, Routes, Link, Navigate } from "react-router-dom"
import { BookmarkProvider, BookmarkForm, BookmarkList, useBookmarks } from "./components/Bookmarks"
import LoginSignup from "./LoginSignup"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "./firebase"
import {
  BookmarkIcon,
  SearchIcon,
  TagIcon,
  CloudIcon,
  ShareIcon,
  UserIcon,
  LogOutIcon,
  HomeIcon,
  FolderIcon,
} from "lucide-react"
import "./styles/custom.css"

const App = () => {
  const [user] = useAuthState(auth)

  return (
    <Router>
      <div style={styles.container}>
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<LoginSignup />} />
          <Route path="/signup" element={<LoginSignup />} />
          <Route
            path="/dashboard/*"
            element={
              user ? (
                <BookmarkProvider>
                  <Dashboard />
                </BookmarkProvider>
              ) : (
                <Navigate to="/login" replace />
              )
            }
          />
        </Routes>
      </div>
    </Router>
  )
}

const LandingPage = () => (
  <main>
    <header style={styles.header}>
      <nav style={styles.nav}>
        <div style={styles.logo}>
          <Link to="/" style={styles.logoLink}>
            LinkBook
          </Link>
        </div>
        <div style={styles.navLinks}>
          <Link to="/login" style={styles.navLink}>
            Login
          </Link>
          <Link to="/signup" style={{ ...styles.button, ...styles.navLink }}>
            Sign Up
          </Link>
        </div>
      </nav>
    </header>
    <section style={styles.hero}>
      <h1 style={styles.heroTitle}>Manage Your Bookmarks with Ease</h1>
      <p style={styles.heroText}>
        LinkBook helps you organize, access, and share your favorite links across all devices.
      </p>
      <Link to="/signup" style={{ ...styles.button, ...styles.buttonLarge }}>
        Get Started for Free
      </Link>
    </section>

    <section style={styles.features}>
      <h2 style={styles.featuresTitle}>Features</h2>
      <div style={styles.featureGrid}>
        <FeatureCard
          icon={<BookmarkIcon />}
          title="Bookmark Management"
          description="Save, edit, delete, and categorize your links with ease."
        />
        <FeatureCard
          icon={<SearchIcon />}
          title="Search & Filtering"
          description="Quickly find your saved bookmarks using powerful search and filtering options."
        />
        <FeatureCard
          icon={<TagIcon />}
          title="Tags & Folders"
          description="Organize your bookmarks efficiently with customizable tags and folders."
        />
        <FeatureCard
          icon={<CloudIcon />}
          title="Cross-Device Sync"
          description="Access your bookmarks seamlessly across all your devices with cloud storage."
        />
        <FeatureCard
          icon={<ShareIcon />}
          title="Sharing & Collaboration"
          description="Share your bookmarks and collaborate with friends and colleagues."
        />
        <FeatureCard
          icon={<UserIcon />}
          title="User Authentication"
          description="Secure signup, login, and password recovery to keep your data safe."
        />
      </div>
    </section>

    <section style={styles.cta}>
      <h2 style={styles.ctaTitle}>Ready to Organize Your Online World?</h2>
      <p style={styles.ctaText}>Join thousands of users who trust LinkBook for their bookmark management.</p>
      <Link to="/signup" style={{ ...styles.button, ...styles.buttonLarge }}>
        Sign Up Now
      </Link>
    </section>

    <footer style={styles.footer}>
      <div style={styles.footerGrid}>
        <FooterColumn
          title="Product"
          links={[
            { href: "/features", text: "Features" },
            { href: "/pricing", text: "Pricing" },
            { href: "/faq", text: "FAQ" },
          ]}
        />
        <FooterColumn
          title="Company"
          links={[
            { href: "/about", text: "About Us" },
            { href: "/blog", text: "Blog" },
            { href: "/careers", text: "Careers" },
          ]}
        />
        <FooterColumn
          title="Support"
          links={[
            { href: "/help", text: "Help Center" },
            { href: "/contact", text: "Contact Us" },
            { href: "/status", text: "System Status" },
          ]}
        />
        <FooterColumn
          title="Legal"
          links={[
            { href: "/terms", text: "Terms of Service" },
            { href: "/privacy", text: "Privacy Policy" },
            { href: "/cookies", text: "Cookie Policy" },
          ]}
        />
      </div>
      <div style={styles.footerBottom}>
        <p>&copy; 2023 LinkBook. All rights reserved.</p>
      </div>
    </footer>
  </main>
)

const Dashboard = () => {
  const [isAddingBookmark, setIsAddingBookmark] = useState(false)
  const { addBookmark } = useBookmarks()

  const handleAddBookmark = (bookmark) => {
    addBookmark(bookmark)
    setIsAddingBookmark(false)
  }

  return (
    <div className="dashboard-container">
      <aside className="sidebar">
        <h2>LinkBook</h2>
        <nav>
          <ul className="sidebar-nav">
            <li>
              <Link to="/dashboard">
                <HomeIcon size={18} /> Dashboard
              </Link>
            </li>
            <li>
              <Link to="/dashboard/folders">
                <FolderIcon size={18} /> Folders
              </Link>
            </li>
            <li>
              <Link to="/dashboard/tags">
                <TagIcon size={18} /> Tags
              </Link>
            </li>
            <li>
              <Link to="/dashboard/settings">
                <UserIcon size={18} /> Settings
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
            Add Bookmark
          </button>
        </div>
        {isAddingBookmark && <BookmarkForm onSubmit={handleAddBookmark} onCancel={() => setIsAddingBookmark(false)} />}
        <BookmarkList />
      </main>
    </div>
  )
}

const FeatureCard = ({ icon, title, description }) => (
  <div style={styles.featureCard}>
    <div style={styles.featureIcon}>{icon}</div>
    <h3 style={styles.featureTitle}>{title}</h3>
    <p style={styles.featureDescription}>{description}</p>
  </div>
)

const FooterColumn = ({ title, links }) => (
  <div style={styles.footerColumn}>
    <h3 style={styles.footerColumnTitle}>{title}</h3>
    <ul style={styles.footerColumnList}>
      {links.map((link, index) => (
        <li key={index} style={styles.footerColumnListItem}>
          <a href={link.href} style={styles.footerColumnLink}>
            {link.text}
          </a>
        </li>
      ))}
    </ul>
  </div>
)

const styles = {
  container: {
    fontFamily: "Poppins, sans-serif",
    lineHeight: 1.6,
    color: "#1f2937",
    backgroundColor: "#ffffff",
  },
  header: {
    backgroundColor: "#ffffff",
    boxShadow: "0 1px 3px rgba(0, 0, 0, 0.1)",
  },
  nav: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 0",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  logo: {
    fontSize: "1.5rem",
    fontWeight: "bold",
  },
  logoLink: {
    color: "#3b82f6",
    textDecoration: "none",
  },
  navLinks: {
    display: "flex",
    alignItems: "center",
  },
  navLink: {
    marginLeft: "1rem",
    textDecoration: "none",
    color: "#1f2937",
  },
  button: {
    display: "inline-block",
    backgroundColor: "#3b82f6",
    color: "white",
    padding: "0.5rem 1rem",
    borderRadius: "0.25rem",
    textDecoration: "none",
    transition: "background-color 0.3s ease",
  },
  buttonLarge: {
    padding: "0.75rem 1.5rem",
    fontSize: "1.1rem",
  },
  hero: {
    background: "linear-gradient(to right, #3b82f6, #2563eb)",
    color: "white",
    textAlign: "center",
    padding: "4rem 0",
  },
  heroTitle: {
    fontSize: "2.5rem",
    marginBottom: "1rem",
  },
  heroText: {
    fontSize: "1.25rem",
    marginBottom: "2rem",
  },
  features: {
    padding: "4rem 0",
    backgroundColor: "#f9fafb",
  },
  featuresTitle: {
    textAlign: "center",
    fontSize: "2rem",
    marginBottom: "2rem",
  },
  featureGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(250px, 1fr))",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  featureCard: {
    backgroundColor: "#ffffff",
    padding: "1.5rem",
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
  },
  featureIcon: {
    color: "#3b82f6",
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  featureTitle: {
    fontSize: "1.25rem",
    marginBottom: "0.5rem",
  },
  featureDescription: {
    color: "#6b7280",
  },
  cta: {
    backgroundColor: "#f3f4f6",
    textAlign: "center",
    padding: "4rem 0",
  },
  ctaTitle: {
    fontSize: "2rem",
    marginBottom: "1rem",
  },
  ctaText: {
    fontSize: "1.25rem",
    marginBottom: "2rem",
  },
  footer: {
    backgroundColor: "#1f2937",
    color: "white",
    padding: "4rem 0 2rem",
  },
  footerGrid: {
    display: "grid",
    gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
    gap: "2rem",
    maxWidth: "1200px",
    margin: "0 auto",
  },
  footerColumn: {
    marginBottom: "1rem",
  },
  footerColumnTitle: {
    fontSize: "1.25rem",
    marginBottom: "1rem",
  },
  footerColumnList: {
    listStyle: "none",
    padding: 0,
  },
  footerColumnListItem: {
    marginBottom: "0.5rem",
  },
  footerColumnLink: {
    color: "#d1d5db",
    textDecoration: "none",
  },
  footerBottom: {
    textAlign: "center",
    marginTop: "2rem",
    paddingTop: "2rem",
    borderTop: "1px solid #4b5563",
  },
}

export default App

