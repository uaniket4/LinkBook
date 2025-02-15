import { useState, useEffect } from "react"
import { useNavigate } from "react-router-dom"
import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signInWithPopup,
  GoogleAuthProvider,
  FacebookAuthProvider,
  GithubAuthProvider,
} from "firebase/auth"
import { useAuthState } from "react-firebase-hooks/auth"
import { auth } from "./firebase"

const LoginSignup = () => {
  const [isLogin, setIsLogin] = useState(true)
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [user, loading] = useAuthState(auth)
  const navigate = useNavigate()

  useEffect(() => {
    if (loading) return
    if (user) navigate("/dashboard")
  }, [user, loading, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError("")

    if (!email || !password || (!isLogin && !name)) {
      setError("Please fill in all fields.")
      return
    }

    if (!isValidEmail(email)) {
      setError("Please enter a valid email address.")
      return
    }

    if (password.length < 6) {
      setError("Password must be at least 6 characters long.")
      return
    }

    try {
      if (isLogin) {
        await signInWithEmailAndPassword(auth, email, password)
      } else {
        await createUserWithEmailAndPassword(auth, email, password)
        // Here you would typically update the user profile with the name
        // For simplicity, we're skipping this step
      }
    } catch (error) {
      setError(error.message)
    }
  }

  const handleSocialLogin = async (provider) => {
    try {
      await signInWithPopup(auth, provider)
    } catch (error) {
      setError(error.message)
    }
  }

  const isValidEmail = (email) => {
    return /\S+@\S+\.\S+/.test(email)
  }

  return (
    <div style={styles.container}>
      <div style={styles.formContainer}>
        <h2 style={styles.title}>{isLogin ? "Login" : "Sign Up"}</h2>
        <form onSubmit={handleSubmit} style={styles.form}>
          {!isLogin && (
            <input
              type="text"
              placeholder="Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              style={styles.input}
            />
          )}
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            style={styles.input}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            style={styles.input}
          />
          {error && <p style={styles.error}>{error}</p>}
          <button type="submit" style={styles.button}>
            {isLogin ? "Login" : "Sign Up"}
          </button>
        </form>
        <div style={styles.socialButtons}>
          <button
            onClick={() => handleSocialLogin(new GoogleAuthProvider())}
            style={{ ...styles.button, ...styles.googleButton }}
          >
            Login with Google
          </button>
          <button
            onClick={() => handleSocialLogin(new FacebookAuthProvider())}
            style={{ ...styles.button, ...styles.facebookButton }}
          >
            Login with Facebook
          </button>
          <button
            onClick={() => handleSocialLogin(new GithubAuthProvider())}
            style={{ ...styles.button, ...styles.githubButton }}
          >
            Login with GitHub
          </button>
        </div>
        <p style={styles.toggleText}>
          {isLogin ? "Don't have an account? " : "Already have an account? "}
          <span style={styles.toggleLink} onClick={() => setIsLogin(!isLogin)}>
            {isLogin ? "Sign Up" : "Login"}
          </span>
        </p>
      </div>
    </div>
  )
}

const styles = {
  container: {
    display: "flex",
    justifyContent: "center",
    alignItems: "center",
    minHeight: "100vh",
    backgroundColor: "#f3f4f6",
  },
  formContainer: {
    backgroundColor: "#ffffff",
    padding: "2rem",
    borderRadius: "0.5rem",
    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.1)",
    width: "100%",
    maxWidth: "400px",
  },
  title: {
    fontSize: "1.5rem",
    fontWeight: "bold",
    marginBottom: "1.5rem",
    textAlign: "center",
    color: "#1f2937",
  },
  form: {
    display: "flex",
    flexDirection: "column",
  },
  input: {
    marginBottom: "1rem",
    padding: "0.5rem",
    borderRadius: "0.25rem",
    border: "1px solid #d1d5db",
    fontSize: "1rem",
  },
  button: {
    backgroundColor: "#3b82f6",
    color: "#ffffff",
    padding: "0.75rem",
    borderRadius: "0.25rem",
    fontSize: "1rem",
    border: "none",
    cursor: "pointer",
    transition: "background-color 0.3s ease",
    marginBottom: "0.5rem",
  },
  error: {
    color: "#ef4444",
    marginBottom: "1rem",
  },
  toggleText: {
    marginTop: "1rem",
    textAlign: "center",
    color: "#6b7280",
  },
  toggleLink: {
    color: "#3b82f6",
    cursor: "pointer",
    fontWeight: "bold",
  },
  socialButtons: {
    display: "flex",
    flexDirection: "column",
    marginTop: "1rem",
  },
  googleButton: {
    backgroundColor: "#4285F4",
  },
  facebookButton: {
    backgroundColor: "#3b5998",
  },
  githubButton: {
    backgroundColor: "#333",
  },
}

export default LoginSignup

