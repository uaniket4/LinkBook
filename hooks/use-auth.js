"use client"

import { useState, useEffect, useContext, createContext } from "react"
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  updateProfile,
  signOut,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
} from "firebase/auth"
import { auth } from "@/lib/firebase"

const AuthContext = createContext()

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        setUser(user)
        setLoading(false)
      },
      (error) => {
        console.error("Auth state changed error:", error)
        setError(error.message)
        setLoading(false)
      },
    )

    return () => unsubscribe()
  }, [])

  const signIn = async (email, password) => {
    try {
      setError(null)
      await signInWithEmailAndPassword(auth, email, password)
      return { success: true }
    } catch (error) {
      console.error("Sign in error:", error)
      setError(error.message)
      return { success: false, error: error.message }
    }
  }

  const signUp = async (email, password, name) => {
    try {
      setError(null)
      const result = await createUserWithEmailAndPassword(auth, email, password)

      // If name is provided, update the user profile
      if (name && result.user) {
        await updateProfile(result.user, {
          displayName: name,
        })
      }

      return { success: true }
    } catch (error) {
      console.error("Sign up error:", error)
      setError(error.message)
      return { success: false, error: error.message }
    }
  }

  const signInWithGoogle = async () => {
    try {
      setError(null)
      const provider = new GoogleAuthProvider()
      await signInWithPopup(auth, provider)
      return { success: true }
    } catch (error) {
      console.error("Google sign in error:", error)
      setError(error.message)
      return { success: false, error: error.message }
    }
  }

  const signInWithFacebook = async () => {
    try {
      setError(null)
      const provider = new FacebookAuthProvider()
      await signInWithPopup(auth, provider)
      return { success: true }
    } catch (error) {
      console.error("Facebook sign in error:", error)
      setError(error.message)
      return { success: false, error: error.message }
    }
  }

  const signInWithGithub = async () => {
    try {
      setError(null)
      const provider = new GithubAuthProvider()
      await signInWithPopup(auth, provider)
      return { success: true }
    } catch (error) {
      console.error("Github sign in error:", error)
      setError(error.message)
      return { success: false, error: error.message }
    }
  }

  const logout = async () => {
    try {
      await signOut(auth)
    } catch (error) {
      console.error("Sign out error:", error)
      setError(error.message)
    }
  }

  const value = {
    user,
    loading,
    error,
    signIn,
    signUp,
    signInWithGoogle,
    signInWithFacebook,
    signInWithGithub,
    logout,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

