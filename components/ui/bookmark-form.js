"use client"

import { useState } from "react"
import { useForm } from "react-hook-form"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { extractMetadata } from "@/lib/metadata"
import { Loader2, AlertCircle } from "lucide-react"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useBookmarks } from "@/hooks/use-bookmarks"

const formSchema = z.object({
  url: z.string().url({ message: "Please enter a valid URL" }),
  title: z.string().min(1, { message: "Title is required" }),
  description: z.string().optional(),
  tags: z.string().optional(),
  folder: z.string().optional(),
})

export function BookmarkForm({ bookmark, onSubmit, onCancel }) {
  const { folders } = useBookmarks()
  const [loading, setLoading] = useState(false)
  const [fetchingMetadata, setFetchingMetadata] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(false)

  const form = useForm({
    resolver: zodResolver(formSchema),
    defaultValues: {
      url: bookmark?.url || "",
      title: bookmark?.title || "",
      description: bookmark?.description || "",
      tags: bookmark?.tags?.join(", ") || "",
      folder: bookmark?.folder || "",
    },
  })

  // Function to extract metadata from URL
  const fetchMetadata = async (url) => {
    if (!url || !url.trim() || !url.includes(".")) return

    // Make sure URL has protocol
    let formattedUrl = url
    if (!/^https?:\/\//i.test(formattedUrl)) {
      formattedUrl = `https://${formattedUrl}`
    }

    try {
      setFetchingMetadata(true)
      const metadata = await extractMetadata(formattedUrl)

      // Only set fields that are empty
      if (!form.getValues("title") && metadata.title) {
        form.setValue("title", metadata.title)
      }

      if (!form.getValues("description") && metadata.description) {
        form.setValue("description", metadata.description)
      }
    } catch (err) {
      console.error("Error fetching metadata:", err)
    } finally {
      setFetchingMetadata(false)
    }
  }

  // Fetch metadata when URL changes and fields are empty
  const onUrlBlur = () => {
    const url = form.getValues("url")
    if (!url) return

    const title = form.getValues("title")
    const description = form.getValues("description")

    if (!title || !description) {
      fetchMetadata(url)
    }
  }

  const handleSubmit = async (data) => {
    setError(null)
    setLoading(true)
    setSuccess(false)

    try {
      // Format URL if needed
      if (!/^https?:\/\//i.test(data.url)) {
        data.url = `https://${data.url}`
      }

      // Convert tags string to array
      const tags = data.tags
        ? data.tags
            .split(",")
            .map((tag) => tag.trim())
            .filter(Boolean)
        : []

      const result = await onSubmit({
        ...data,
        tags,
      })

      if (!result.success) {
        throw new Error(result.error || "Failed to save bookmark")
      }

      setSuccess(true)

      // Auto-close form after success
      setTimeout(() => {
        if (!bookmark) {
          onCancel()
        }
      }, 1500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <Form {...form}>
      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {success && (
        <Alert className="mb-4 bg-green-50 text-green-800 border-green-200">
          <AlertTitle>Success</AlertTitle>
          <AlertDescription>Bookmark {bookmark ? "updated" : "added"} successfully!</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="url"
          render={({ field }) => (
            <FormItem>
              <FormLabel>URL</FormLabel>
              <div className="relative">
                <FormControl>
                  <Input
                    placeholder="https://example.com"
                    {...field}
                    onBlur={onUrlBlur}
                    disabled={loading || fetchingMetadata}
                  />
                </FormControl>
                {fetchingMetadata && (
                  <div className="absolute right-2 top-1/2 -translate-y-1/2">
                    <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
                  </div>
                )}
              </div>
              <FormDescription>The URL of the website you want to bookmark</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="My Bookmark" {...field} disabled={loading || fetchingMetadata} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea
                  placeholder="A brief description of the bookmark"
                  {...field}
                  disabled={loading || fetchingMetadata}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags</FormLabel>
              <FormControl>
                <Input placeholder="tag1, tag2, tag3" {...field} disabled={loading} />
              </FormControl>
              <FormDescription>Separate tags with commas</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="folder"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Folder</FormLabel>
              <FormControl>
                <Input placeholder="Folder name" list="folder-options" {...field} disabled={loading} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {folders.length > 0 && (
          <datalist id="folder-options">
            {folders.map((folder) => (
              <option key={folder} value={folder} />
            ))}
          </datalist>
        )}

        <div className="flex justify-end gap-2">
          <Button type="button" variant="outline" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" disabled={loading || fetchingMetadata}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>{bookmark ? "Update" : "Save"}</>
            )}
          </Button>
        </div>
      </form>
    </Form>
  )
}

