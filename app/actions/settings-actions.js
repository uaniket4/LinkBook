"use server"

import { getUserSettings, updateUserSettings } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function getUserSettingsAction(userId) {
  try {
    const settings = await getUserSettings(userId)
    return { success: true, data: settings }
  } catch (error) {
    console.error("Error fetching user settings:", error)
    return { success: false, error: "Failed to fetch user settings" }
  }
}

export async function updateUserSettingsAction(userId, settingsData) {
  try {
    await updateUserSettings(userId, settingsData)

    revalidatePath("/dashboard/settings")
    return { success: true }
  } catch (error) {
    console.error("Error updating user settings:", error)
    return { success: false, error: "Failed to update user settings" }
  }
}

