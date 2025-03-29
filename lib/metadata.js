import * as cheerio from "cheerio"

// Cache for metadata to avoid repeated fetches
const metadataCache = new Map()

export async function extractMetadata(url, options = {}) {
  try {
    // Normalize URL for caching
    const normalizedUrl = normalizeUrl(url)

    // Check cache first (valid for 24 hours)
    if (metadataCache.has(normalizedUrl)) {
      const { metadata, timestamp } = metadataCache.get(normalizedUrl)
      // Cache is valid for 24 hours unless force refresh is requested
      if (!options.forceRefresh && Date.now() - timestamp < 24 * 60 * 60 * 1000) {
        return metadata
      }
    }

    // Set timeout for fetch to avoid hanging
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

    // Fetch the HTML content with timeout
    const response = await fetch(url, {
      headers: {
        "User-Agent": "Mozilla/5.0 (compatible; LinkBook/1.0; +https://linkbook.app)",
        Accept: "text/html,application/xhtml+xml,application/xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      signal: controller.signal,
    })

    clearTimeout(timeoutId)

    if (!response.ok) {
      throw new Error(`Failed to fetch URL: ${response.status}`)
    }

    const contentType = response.headers.get("content-type") || ""
    if (!contentType.includes("text/html") && !contentType.includes("application/xhtml+xml")) {
      throw new Error("URL does not point to HTML content")
    }

    const html = await response.text()
    const $ = cheerio.load(html)

    // Extract basic metadata
    const title = $("title").text().trim() || ""
    const description =
      $('meta[name="description"]').attr("content") || $('meta[property="og:description"]').attr("content") || ""
    const favicon = extractFavicon($, url)

    // Open Graph metadata
    const ogTitle = $('meta[property="og:title"]').attr("content") || ""
    const ogDescription = $('meta[property="og:description"]').attr("content") || ""
    const ogImage = $('meta[property="og:image"]').attr("content") || ""
    const ogSiteName = $('meta[property="og:site_name"]').attr("content") || ""

    // Twitter card metadata
    const twitterTitle = $('meta[name="twitter:title"]').attr("content") || ""
    const twitterDescription = $('meta[name="twitter:description"]').attr("content") || ""
    const twitterImage =
      $('meta[name="twitter:image"]').attr("content") || $('meta[name="twitter:image:src"]').attr("content") || ""

    // JSON-LD metadata
    let jsonLdData = {}
    $('script[type="application/ld+json"]').each((i, element) => {
      try {
        const json = JSON.parse($(element).html())
        if (json["@type"] === "WebPage" || json["@type"] === "Article" || json["@type"] === "Product") {
          jsonLdData = json
        }
      } catch (e) {
        // Ignore JSON parse errors
      }
    })

    // Combine all metadata sources with priority
    const metadata = {
      title: ogTitle || twitterTitle || jsonLdData.headline || title || "",
      description: ogDescription || twitterDescription || jsonLdData.description || description || "",
      favicon,
      ogTitle,
      ogDescription,
      ogImage: makeAbsoluteUrl(ogImage, url),
      ogSiteName,
      twitterTitle,
      twitterDescription,
      twitterImage: makeAbsoluteUrl(twitterImage, url),
      jsonLd: jsonLdData,
      domain: extractDomain(url),
      lastUpdated: new Date().toISOString(),
    }

    // Update cache
    metadataCache.set(normalizedUrl, { metadata, timestamp: Date.now() })

    return metadata
  } catch (error) {
    console.error("Error extracting metadata:", error)

    // Return basic metadata based on URL if fetch fails
    const domain = extractDomain(url)
    const basicMetadata = {
      title: domain || url,
      description: "",
      favicon: `https://www.google.com/s2/favicons?domain=${domain}`,
      ogTitle: "",
      ogDescription: "",
      ogImage: "",
      domain,
      error: error.message,
    }

    return basicMetadata
  }
}

function extractFavicon($, baseUrl) {
  // Try to get favicon from link tags in order of preference
  const faviconSelectors = [
    'link[rel="icon"][sizes="32x32"]',
    'link[rel="icon"][sizes="48x48"]',
    'link[rel="icon"][sizes="96x96"]',
    'link[rel="shortcut icon"]',
    'link[rel="icon"]',
    'link[rel="apple-touch-icon"]',
  ]

  for (const selector of faviconSelectors) {
    const faviconLink = $(selector).attr("href")
    if (faviconLink) {
      return makeAbsoluteUrl(faviconLink, baseUrl)
    }
  }

  // Default favicon location
  try {
    const domain = extractDomain(baseUrl)
    return `https://www.google.com/s2/favicons?domain=${domain}`
  } catch (e) {
    return ""
  }
}

function makeAbsoluteUrl(relativeUrl, baseUrl) {
  if (!relativeUrl) return ""

  try {
    // Already absolute URL
    if (relativeUrl.match(/^https?:\/\//i)) {
      return relativeUrl
    }

    const base = new URL(baseUrl)

    // Handle protocol-relative URLs
    if (relativeUrl.startsWith("//")) {
      return `${base.protocol}${relativeUrl}`
    }

    // Handle root-relative URLs
    if (relativeUrl.startsWith("/")) {
      return `${base.protocol}//${base.host}${relativeUrl}`
    }

    // Handle relative URLs
    return new URL(relativeUrl, baseUrl).href
  } catch (e) {
    return relativeUrl
  }
}

function extractDomain(url) {
  try {
    const { hostname } = new URL(url)
    return hostname
  } catch (e) {
    return ""
  }
}

function normalizeUrl(url) {
  try {
    // Ensure URL has protocol
    if (!/^https?:\/\//i.test(url)) {
      url = `https://${url}`
    }

    const urlObj = new URL(url)

    // Remove trailing slash
    let normalized = `${urlObj.protocol}//${urlObj.hostname}${urlObj.pathname.replace(/\/$/, "")}`

    // Keep important query parameters
    if (urlObj.search) {
      normalized += urlObj.search
    }

    return normalized.toLowerCase()
  } catch (e) {
    return url
  }
}

// Clear metadata cache
export function clearMetadataCache() {
  metadataCache.clear()
}

// Preload metadata for a list of URLs
export async function preloadMetadata(urls) {
  if (!Array.isArray(urls) || urls.length === 0) return

  // Process in batches to avoid too many concurrent requests
  const batchSize = 5
  const batches = []

  for (let i = 0; i < urls.length; i += batchSize) {
    batches.push(urls.slice(i, i + batchSize))
  }

  for (const batch of batches) {
    await Promise.allSettled(batch.map((url) => extractMetadata(url)))

    // Small delay between batches
    await new Promise((resolve) => setTimeout(resolve, 500))
  }
}

