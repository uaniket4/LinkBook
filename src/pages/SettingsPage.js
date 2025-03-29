"use client"

import { useState } from "react"
import { useAuthState } from "react-firebase-hooks/auth"
import {
  updateProfile,
  updateEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
} from "firebase/auth"
import { auth } from "../firebase"
import { UserIcon, KeyIcon, BellIcon, PaletteIcon, CloudIcon, LogOutIcon, SaveIcon, CheckIcon } from "lucide-react"

const SettingsPage = () => {
  const [user] = useAuthState(auth)
  const [activeTab, setActiveTab] = useState("profile")
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [darkMode, setDarkMode] = useState(true)
  const [emailNotifications, setEmailNotifications] = useState(true)
  const [autoSync, setAutoSync] = useState(true)
  const [twoFactorAuth, setTwoFactorAuth] = useState(false)
  const [message, setMessage] = useState({ text: "", type: "" })
  const [loading, setLoading] = useState(false)

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: "", type: "" })

    try {
      await updateProfile(user, { displayName })
      setMessage({ text: "Profile updated successfully!", type: "success" })
    } catch (error) {
      setMessage({ text: error.message, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdateEmail = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: "", type: "" })

    try {
      if (!currentPassword) {
        throw new Error("Current password is required to update email")
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updateEmail(user, email)

      setMessage({ text: "Email updated successfully!", type: "success" })
      setCurrentPassword("")
    } catch (error) {
      setMessage({ text: error.message, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleUpdatePassword = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage({ text: "", type: "" })

    try {
      if (!currentPassword) {
        throw new Error("Current password is required")
      }

      if (newPassword !== confirmPassword) {
        throw new Error("New passwords do not match")
      }

      if (newPassword.length < 6) {
        throw new Error("Password should be at least 6 characters")
      }

      const credential = EmailAuthProvider.credential(user.email, currentPassword)
      await reauthenticateWithCredential(user, credential)
      await updatePassword(user, newPassword)

      setMessage({ text: "Password updated successfully!", type: "success" })
      setCurrentPassword("")
      setNewPassword("")
      setConfirmPassword("")
    } catch (error) {
      setMessage({ text: error.message, type: "error" })
    } finally {
      setLoading(false)
    }
  }

  const handleSavePreferences = () => {
    // In a real app, you would save these preferences to a database
    setMessage({ text: "Preferences saved successfully!", type: "success" })

    // Simulate saving
    setTimeout(() => {
      setMessage({ text: "", type: "" })
    }, 3000)
  }

  return (
    <div className="settings-page">
      <div className="dashboard-header">
        <h1>Settings</h1>
      </div>

      <div className="settings-container">
        <div className="settings-sidebar">
          <button
            className={`settings-tab ${activeTab === "profile" ? "active" : ""}`}
            onClick={() => setActiveTab("profile")}
          >
            <UserIcon size={18} /> Profile
          </button>
          <button
            className={`settings-tab ${activeTab === "security" ? "active" : ""}`}
            onClick={() => setActiveTab("security")}
          >
            <KeyIcon size={18} /> Security
          </button>
          <button
            className={`settings-tab ${activeTab === "preferences" ? "active" : ""}`}
            onClick={() => setActiveTab("preferences")}
          >
            <PaletteIcon size={18} /> Preferences
          </button>
          <button
            className={`settings-tab ${activeTab === "notifications" ? "active" : ""}`}
            onClick={() => setActiveTab("notifications")}
          >
            <BellIcon size={18} /> Notifications
          </button>
          <button
            className={`settings-tab ${activeTab === "sync" ? "active" : ""}`}
            onClick={() => setActiveTab("sync")}
          >
            <CloudIcon size={18} /> Sync
          </button>
          <button className="settings-tab logout" onClick={() => auth.signOut()}>
            <LogOutIcon size={18} /> Logout
          </button>
        </div>

        <div className="settings-content">
          {message.text && (
            <div className={`message ${message.type}`}>
              {message.type === "success" && <CheckIcon size={16} />}
              {message.text}
            </div>
          )}

          {activeTab === "profile" && (
            <div className="settings-section">
              <h2 className="section-title">Profile Settings</h2>
              <form onSubmit={handleUpdateProfile}>
                <div className="form-group">
                  <label htmlFor="displayName" className="form-label">
                    Display Name
                  </label>
                  <input
                    id="displayName"
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="form-input"
                  />
                </div>

                <div className="form-group">
                  <label htmlFor="profileEmail" className="form-label">
                    Email
                  </label>
                  <input id="profileEmail" type="email" value={email} disabled className="form-input" />
                  <p className="form-help">To change your email, go to the Security tab.</p>
                </div>

                <button type="submit" className="btn btn-save" disabled={loading}>
                  {loading ? "Saving..." : "Save Profile"}
                </button>
              </form>
            </div>
          )}

          {activeTab === "security" && (
            <div className="settings-section">
              <h2 className="section-title">Security Settings</h2>

              <div className="security-forms">
                <form onSubmit={handleUpdateEmail} className="security-form">
                  <h3>Update Email</h3>

                  <div className="form-group">
                    <label htmlFor="securityEmail" className="form-label">
                      New Email
                    </label>
                    <input
                      id="securityEmail"
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="emailCurrentPassword" className="form-label">
                      Current Password
                    </label>
                    <input
                      id="emailCurrentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <button type="submit" className="btn btn-save" disabled={loading}>
                    {loading ? "Updating..." : "Update Email"}
                  </button>
                </form>

                <form onSubmit={handleUpdatePassword} className="security-form">
                  <h3>Change Password</h3>

                  <div className="form-group">
                    <label htmlFor="passwordCurrentPassword" className="form-label">
                      Current Password
                    </label>
                    <input
                      id="passwordCurrentPassword"
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="newPassword" className="form-label">
                      New Password
                    </label>
                    <input
                      id="newPassword"
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="confirmPassword" className="form-label">
                      Confirm New Password
                    </label>
                    <input
                      id="confirmPassword"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="form-input"
                    />
                  </div>

                  <button type="submit" className="btn btn-save" disabled={loading}>
                    {loading ? "Updating..." : "Update Password"}
                  </button>
                </form>
              </div>

              <div className="two-factor-auth">
                <h3>Two-Factor Authentication</h3>
                <div className="toggle-container">
                  <label className="toggle">
                    <input type="checkbox" checked={twoFactorAuth} onChange={() => setTwoFactorAuth(!twoFactorAuth)} />
                    <span className="toggle-slider"></span>
                  </label>
                  <span>{twoFactorAuth ? "Enabled" : "Disabled"}</span>
                </div>
                <p className="form-help">Two-factor authentication adds an extra layer of security to your account.</p>
              </div>
            </div>
          )}

          {activeTab === "preferences" && (
            <div className="settings-section">
              <h2 className="section-title">Preferences</h2>

              <div className="preference-item">
                <div className="preference-info">
                  <h3>Dark Mode</h3>
                  <p>Enable dark mode for a better viewing experience in low light.</p>
                </div>
                <div className="toggle-container">
                  <label className="toggle">
                    <input type="checkbox" checked={darkMode} onChange={() => setDarkMode(!darkMode)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <button className="btn btn-save preferences-save" onClick={handleSavePreferences}>
                <SaveIcon size={16} /> Save Preferences
              </button>
            </div>
          )}

          {activeTab === "notifications" && (
            <div className="settings-section">
              <h2 className="section-title">Notification Settings</h2>

              <div className="preference-item">
                <div className="preference-info">
                  <h3>Email Notifications</h3>
                  <p>Receive email notifications about important updates and activities.</p>
                </div>
                <div className="toggle-container">
                  <label className="toggle">
                    <input
                      type="checkbox"
                      checked={emailNotifications}
                      onChange={() => setEmailNotifications(!emailNotifications)}
                    />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <button className="btn btn-save preferences-save" onClick={handleSavePreferences}>
                <SaveIcon size={16} /> Save Notification Settings
              </button>
            </div>
          )}

          {activeTab === "sync" && (
            <div className="settings-section">
              <h2 className="section-title">Sync Settings</h2>

              <div className="preference-item">
                <div className="preference-info">
                  <h3>Auto Sync</h3>
                  <p>Automatically sync your bookmarks across all your devices.</p>
                </div>
                <div className="toggle-container">
                  <label className="toggle">
                    <input type="checkbox" checked={autoSync} onChange={() => setAutoSync(!autoSync)} />
                    <span className="toggle-slider"></span>
                  </label>
                </div>
              </div>

              <button className="btn btn-save preferences-save" onClick={handleSavePreferences}>
                <SaveIcon size={16} /> Save Sync Settings
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default SettingsPage

