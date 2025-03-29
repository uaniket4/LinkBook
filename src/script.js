// Fix the import statement
document.addEventListener("DOMContentLoaded", () => {
  // Only try to create icons if lucide is available
  if (typeof window.lucide !== "undefined") {
    window.lucide.createIcons()
  }
})

