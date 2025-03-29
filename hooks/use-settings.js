"use client"

import { useState, useEffect, useCallback } from "react"
import { getUserSettingsAction, updateUserSettingsAction } from "@/app/actions/settings-actions"
import { useAuth } from "./use-auth"

export function useSettings() {
  const { user } = useAuth()
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchSettings = useCallback(async () => {
    if (!user) return

    try {
      setLoading(true)
      setError(null)

      const result = await getUserSettingsAction(user.uid)

      if (result.success) {
        setSettings(result.data)
      } else {
        setError(result.error)
      }
    } catch (err) {
      console.error("Error fetching settings:", err)
      setError("Failed to load settings")
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    fetchSettings()
  }, [fetchSettings])

  const updateSettings = useCallback(
    async (settingsData) => {
      if (!user) return { success: false, error: "Not authenticated" }

      try {
        setLoading(true)

        const result = await updateUserSettingsAction(user.uid, settingsData)

        if (result.success) {
          // Update local state
          setSettings((prev) => ({ ...prev, ...settingsData }))
        }

        return result
      } catch (err) {
        console.error("Error updating settings:", err)
        return { success: false, error: err.message }
      } finally {
        setLoading(false)
      }
    },
    [user],
  )

  // Helper function to easily update a specific setting
  const updateSetting = useCallback(
    async (key, value) => {
      const settingUpdate = {}
      settingUpdate[key] = value
      return await updateSettings(settingUpdate)
    },
    [updateSettings],
  )

  return {
    settings,
    loading,
    error,
    updateSettings,
    updateSetting,
    refetch: fetchSettings,
  }
}

