"use client"

import React, { useState } from "react"
import { useSettings } from "@/hooks/use-settings"
import { useAuth } from "@/hooks/use-auth"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { User, Key, Bell, Brush, Cloud, LogOut, Check, Moon, Sun, Laptop } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const { user, signOut } = useAuth()
  const { settings, loading, updateSettings } = useSettings()
  const [activeTab, setActiveTab] = useState("profile")
  const [displayName, setDisplayName] = useState(user?.displayName || "")
  const [email, setEmail] = useState(user?.email || "")
  const [currentPassword, setCurrentPassword] = useState("")
  const [newPassword, setNewPassword] = useState("")
  const [confirmPassword, setConfirmPassword] = useState("")
  const [message, setMessage] = useState({ text: "", type: "" })
  const [updatingProfile, setUpdatingProfile] = useState(false)

  const handleUpdateProfile = async (e) => {
    e.preventDefault()
    setMessage({ text: "", type: "" })
    setUpdatingProfile(true)

    try {
      // TODO: Implement profile update with Firebase
      setMessage({ text: "Profile updated successfully!", type: "success" })
    } catch (error) {
      setMessage({ text: error.message, type: "error" })
    } finally {
      setUpdatingProfile(false)
    }
  }

  const handleThemeChange = async (theme) => {
    if (!settings) return

    try {
      await updateSettings({ theme })
    } catch (error) {
      setMessage({ text: error.message, type: "error" })
    }
  }

  const handleNotificationChange = async (field, value) => {
    if (!settings) return

    try {
      await updateSettings({
        notifications: {
          ...settings.notifications,
          [field]: value,
        },
      })
    } catch (error) {
      setMessage({ text: error.message, type: "error" })
    }
  }

  const handleSyncChange = async (field, value) => {
    if (!settings) return

    try {
      await updateSettings({
        sync: {
          ...settings.sync,
          [field]: value,
        },
      })
    } catch (error) {
      setMessage({ text: error.message, type: "error" })
    }
  }

  return (
    <div className="container mx-auto py-6 px-4">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Settings</h1>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-6">
          <TabsTrigger value="profile">
            <User className="h-4 w-4 mr-2" />
            Profile
          </TabsTrigger>
          <TabsTrigger value="security">
            <Key className="h-4 w-4 mr-2" />
            Security
          </TabsTrigger>
          <TabsTrigger value="appearance">
            <Brush className="h-4 w-4 mr-2" />
            Appearance
          </TabsTrigger>
          <TabsTrigger value="notifications">
            <Bell className="h-4 w-4 mr-2" />
            Notifications
          </TabsTrigger>
          <TabsTrigger value="sync">
            <Cloud className="h-4 w-4 mr-2" />
            Sync
          </TabsTrigger>
        </TabsList>

        {message.text && (
          <Alert variant={message.type === "error" ? "destructive" : "default"} className="mb-6">
            <AlertTitle>{message.type === "success" ? "Success" : "Error"}</AlertTitle>
            <AlertDescription>{message.text}</AlertDescription>
          </Alert>
        )}

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Profile Settings</CardTitle>
              <CardDescription>Manage your profile information</CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleUpdateProfile} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="displayName">Display Name</Label>
                  <Input
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    disabled={updatingProfile}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" type="email" value={email} disabled />
                  <p className="text-sm text-muted-foreground">To change your email, go to the Security tab</p>
                </div>

                <Button type="submit" disabled={updatingProfile}>
                  {updatingProfile ? "Saving..." : "Save Changes"}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance</CardTitle>
              <CardDescription>Customize how LinkBook looks</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex gap-4">
                {["light", "dark", "system"].map((theme) => (
                  <div
                    key={theme}
                    className={`cursor-pointer border rounded-lg p-4 flex flex-col items-center ${
                      settings?.theme === theme ? "border-primary bg-primary/5" : "border-input"
                    }`}
                    onClick={() => handleThemeChange(theme)}
                  >
                    {settings?.theme === theme && (
                      <div className="absolute top-2 right-2 text-primary">
                        <Check className="h-4 w-4" />
                      </div>
                    )}
                    <div className="p-2 rounded-full bg-primary/10 mb-2">
                      {theme === "light" ? <Sun className="h-6 w-6" /> : theme === "dark" ? <Moon className="h-6 w-6" /> : <Laptop className="h-6 w-6" />}
                    </div>
                    <span className="text-sm font-medium">{theme.charAt(0).toUpperCase() + theme.slice(1)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle>Notification Settings</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <Label>Enable Notifications</Label>
                <Switch
                  checked={settings?.notifications?.enabled || false}
                  onCheckedChange={(checked) => handleNotificationChange("enabled", checked)}
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
