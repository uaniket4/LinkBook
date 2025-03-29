"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Progress } from "@/components/ui/progress"
import {
  parseHtmlBookmarks,
  parseJsonBookmarks,
  exportBookmarksToHtml,
  exportBookmarksToJson,
} from "@/lib/import-export"
import { useBookmarks } from "@/hooks/use-bookmarks"
import { Download, Upload, FileText, AlertCircle, CheckCircle } from "lucide-react"

export function ImportExportBookmarks() {
  const { bookmarks, importBookmarks, exportBookmarks } = useBookmarks()
  const [activeTab, setActiveTab] = useState("import")
  const [importStatus, setImportStatus] = useState({ status: "idle", message: "", progress: 0 })
  const [exportStatus, setExportStatus] = useState({ status: "idle", message: "" })

  // Handle file import
  const handleFileImport = async (event) => {
    const file = event.target.files[0]
    if (!file) return

    setImportStatus({ status: "loading", message: "Reading file...", progress: 10 })

    try {
      // Read file content
      const fileContent = await readFileContent(file)
      setImportStatus({ status: "loading", message: "Parsing bookmarks...", progress: 30 })

      // Parse bookmarks based on file type
      let parsedBookmarks = []
      if (file.name.endsWith(".html") || file.name.endsWith(".htm")) {
        parsedBookmarks = parseHtmlBookmarks(fileContent)
      } else if (file.name.endsWith(".json")) {
        parsedBookmarks = parseJsonBookmarks(fileContent)
      } else {
        throw new Error("Unsupported file format. Please upload an HTML or JSON file.")
      }

      setImportStatus({
        status: "loading",
        message: `Found ${parsedBookmarks.length} bookmarks. Importing...`,
        progress: 50,
      })

      // Import bookmarks
      const result = await importBookmarks(parsedBookmarks)

      if (result.success) {
        setImportStatus({
          status: "success",
          message: `Successfully imported ${result.data.count} bookmarks.`,
          progress: 100,
        })
      } else {
        throw new Error(result.error || "Failed to import bookmarks")
      }
    } catch (error) {
      console.error("Import error:", error)
      setImportStatus({
        status: "error",
        message: error.message || "An error occurred during import",
        progress: 0,
      })
    }

    // Reset file input
    event.target.value = ""
  }

  // Handle export
  const handleExport = async (format) => {
    setExportStatus({ status: "loading", message: "Preparing bookmarks for export..." })

    try {
      // Get bookmarks
      const result = await exportBookmarks()

      if (!result.success) {
        throw new Error(result.error || "Failed to export bookmarks")
      }

      const bookmarksData = result.data

      if (bookmarksData.length === 0) {
        throw new Error("No bookmarks to export")
      }

      // Generate export content
      let content = ""
      let fileName = ""
      let mimeType = ""

      if (format === "html") {
        content = exportBookmarksToHtml(bookmarksData)
        fileName = `linkbook-export-${new Date().toISOString().slice(0, 10)}.html`
        mimeType = "text/html"
      } else {
        content = exportBookmarksToJson(bookmarksData)
        fileName = `linkbook-export-${new Date().toISOString().slice(0, 10)}.json`
        mimeType = "application/json"
      }

      // Create download link
      const blob = new Blob([content], { type: mimeType })
      const url = URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = fileName
      document.body.appendChild(a)
      a.click()

      // Clean up
      setTimeout(() => {
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      }, 100)

      setExportStatus({
        status: "success",
        message: `Successfully exported ${bookmarksData.length} bookmarks to ${format.toUpperCase()}.`,
      })
    } catch (error) {
      console.error("Export error:", error)
      setExportStatus({
        status: "error",
        message: error.message || "An error occurred during export",
      })
    }
  }

  // Helper to read file content
  const readFileContent = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()

      reader.onload = (event) => {
        resolve(event.target.result)
      }

      reader.onerror = (error) => {
        reject(error)
      }

      reader.readAsText(file)
    })
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Import & Export Bookmarks</CardTitle>
        <CardDescription>Import bookmarks from other browsers or export your LinkBook bookmarks</CardDescription>
      </CardHeader>

      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="import">
              <Upload className="h-4 w-4 mr-2" />
              Import
            </TabsTrigger>
            <TabsTrigger value="export">
              <Download className="h-4 w-4 mr-2" />
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import">
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Import from Browser</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Import bookmarks from HTML or JSON files exported from browsers or other bookmark managers.
                </p>

                <div className="flex items-center gap-4">
                  <Button
                    variant="outline"
                    onClick={() => document.getElementById("import-file").click()}
                    disabled={importStatus.status === "loading"}
                  >
                    <FileText className="h-4 w-4 mr-2" />
                    Select File
                  </Button>
                  <input
                    id="import-file"
                    type="file"
                    accept=".html,.htm,.json"
                    className="hidden"
                    onChange={handleFileImport}
                  />
                  <span className="text-sm text-muted-foreground">Supported formats: HTML, JSON</span>
                </div>
              </div>

              {importStatus.status !== "idle" && (
                <div className="space-y-2">
                  {importStatus.status === "loading" && (
                    <>
                      <Progress value={importStatus.progress} className="h-2" />
                      <p className="text-sm">{importStatus.message}</p>
                    </>
                  )}

                  {importStatus.status === "success" && (
                    <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription>{importStatus.message}</AlertDescription>
                    </Alert>
                  )}

                  {importStatus.status === "error" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{importStatus.message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="export">
            <div className="space-y-4">
              <div className="bg-muted/50 p-4 rounded-lg">
                <h3 className="font-medium mb-2">Export Options</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Export your bookmarks to use in other browsers or bookmark managers.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  <Button
                    variant="outline"
                    onClick={() => handleExport("html")}
                    disabled={exportStatus.status === "loading" || bookmarks.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as HTML
                  </Button>

                  <Button
                    variant="outline"
                    onClick={() => handleExport("json")}
                    disabled={exportStatus.status === "loading" || bookmarks.length === 0}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Export as JSON
                  </Button>
                </div>
              </div>

              {exportStatus.status !== "idle" && (
                <div>
                  {exportStatus.status === "loading" && <p className="text-sm">{exportStatus.message}</p>}

                  {exportStatus.status === "success" && (
                    <Alert variant="default" className="bg-green-50 text-green-800 border-green-200">
                      <CheckCircle className="h-4 w-4" />
                      <AlertTitle>Success</AlertTitle>
                      <AlertDescription>{exportStatus.message}</AlertDescription>
                    </Alert>
                  )}

                  {exportStatus.status === "error" && (
                    <Alert variant="destructive">
                      <AlertCircle className="h-4 w-4" />
                      <AlertTitle>Error</AlertTitle>
                      <AlertDescription>{exportStatus.message}</AlertDescription>
                    </Alert>
                  )}
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </CardContent>

      <CardFooter className="flex justify-between border-t pt-4">
        <p className="text-sm text-muted-foreground">{bookmarks.length} bookmarks available</p>
      </CardFooter>
    </Card>
  )
}

    