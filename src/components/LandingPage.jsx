"use client"

import { Link } from "react-router-dom"
import { BookmarkIcon, SearchIcon, FolderIcon, CloudIcon, ShareIcon, TagIcon, SunIcon, MoonIcon } from "lucide-react"

const LandingPage = ({ darkMode, toggleDarkMode }) => (
  <div className="landing-page">
    <header className="landing-header">
      <nav className="landing-nav">
        <div>
          <Link to="/" className="logo-link">
            <BookmarkIcon className="logo-icon" size={24} />
            <span>LinkBook</span>
          </Link>
        </div>
        <div className="nav-links">
          <button
            className="theme-toggle-landing"
            onClick={toggleDarkMode}
            title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? <SunIcon size={20} /> : <MoonIcon size={20} />}
          </button>
          <Link to="/login" className="nav-link">
            Login
          </Link>
          <Link to="/signup" className="btn">
            Sign Up
          </Link>
        </div>
      </nav>
    </header>

    <section className="hero-section">
      <div className="hero-container">
        <div className="hero-content">
          <h1 className="hero-title">Organize Your Online World</h1>
          <p className="hero-text">
            Save, organize, and access your favorite websites from anywhere. LinkBook makes bookmark management simple
            and efficient.
          </p>
          <div className="hero-buttons">
            <Link to="/signup" className="btn btn-primary btn-large">
              Get Started Free
            </Link>
            <Link to="/login" className="btn btn-secondary btn-large">
              Log In
            </Link>
          </div>
        </div>
        <div className="hero-image">
          <img src="/placeholder.svg?height=500&width=600" alt="LinkBook Dashboard Preview" className="hero-img" />
          <div className="hero-image-dots"></div>
        </div>
      </div>
    </section>

    <section className="features-section">
      <div className="container">
        <h2 className="section-heading">Why Choose LinkBook?</h2>
        <div className="features-grid">
          <FeatureCard
            icon={<BookmarkIcon size={28} />}
            title="Easy Bookmarking"
            description="Save websites with a single click and access them from any device."
          />
          <FeatureCard
            icon={<FolderIcon size={28} />}
            title="Smart Organization"
            description="Organize bookmarks with folders and tags for quick retrieval."
          />
          <FeatureCard
            icon={<SearchIcon size={28} />}
            title="Powerful Search"
            description="Find any bookmark instantly with our advanced search capabilities."
          />
          <FeatureCard
            icon={<CloudIcon size={28} />}
            title="Cloud Sync"
            description="Your bookmarks are automatically synced across all your devices."
          />
          <FeatureCard
            icon={<ShareIcon size={28} />}
            title="Easy Sharing"
            description="Share collections of bookmarks with friends and colleagues."
          />
          <FeatureCard
            icon={<TagIcon size={28} />}
            title="Custom Tags"
            description="Create your own tagging system to categorize bookmarks your way."
          />
        </div>
      </div>
    </section>

    <section className="stats-section">
      <div className="container">
        <div className="stats-grid">
          <div className="stat-card">
            <div className="stat-number">10,000+</div>
            <div className="stat-label">Active Users</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">5M+</div>
            <div className="stat-label">Bookmarks Saved</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">99.9%</div>
            <div className="stat-label">Uptime</div>
          </div>
          <div className="stat-card">
            <div className="stat-number">4.8/5</div>
            <div className="stat-label">User Rating</div>
          </div>
        </div>
      </div>
    </section>

    <section className="cta-section">
      <div className="container">
        <div className="cta-content">
          <h2>Ready to Organize Your Bookmarks?</h2>
          <p>Join thousands of users who trust LinkBook for their bookmark management.</p>
          <Link to="/signup" className="btn btn-primary btn-large">
            Sign Up Now
          </Link>
        </div>
      </div>
    </section>

    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div className="footer-brand">
            <Link to="/" className="footer-logo">
              <BookmarkIcon size={24} />
              <span>LinkBook</span>
            </Link>
            <p className="footer-tagline">The smart way to manage your bookmarks</p>
            <div className="social-links">
              <a href="#" className="social-link" aria-label="Twitter">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.6 5.6 4.1 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"></path>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Facebook">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"></path>
                </svg>
              </a>
              <a href="#" className="social-link" aria-label="Instagram">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  width="24"
                  height="24"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line>
                </svg>
              </a>
            </div>
          </div>
          <FooterColumn
            title="Product"
            links={[
              { href: "#", text: "Features" },
              { href: "#", text: "Pricing" },
              { href: "#", text: "FAQ" },
              { href: "#", text: "Roadmap" },
            ]}
          />
          <FooterColumn
            title="Company"
            links={[
              { href: "#", text: "About Us" },
              { href: "#", text: "Blog" },
              { href: "#", text: "Careers" },
              { href: "#", text: "Contact" },
            ]}
          />
          <FooterColumn
            title="Legal"
            links={[
              { href: "#", text: "Terms of Service" },
              { href: "#", text: "Privacy Policy" },
              { href: "#", text: "Cookie Policy" },
              { href: "#", text: "GDPR" },
            ]}
          />
        </div>
        <div className="footer-bottom">
          <p>&copy; {new Date().getFullYear()} LinkBook. All rights reserved.</p>
        </div>
      </div>
    </footer>
  </div>
)

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

export default LandingPage

