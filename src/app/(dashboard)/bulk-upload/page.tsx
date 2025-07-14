import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import CsvUploader from "@/components/bulk-upload/csv-uploader"
import UploadHistory from "@/components/bulk-upload/upload-history"

export default function BulkUploadPage() {
  return (
    <div className="space-y-6 p-6">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-2xl font-bold">Bulk Upload</h1>
        <p className="text-muted-foreground">
          Upload CSV files with email addresses for batch validation processing.
        </p>
      </div>

      <div className="max-w-4xl mx-auto space-y-6">
        {/* CSV Upload Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload CSV File</CardTitle>
            <CardDescription>
              Select a CSV file containing email addresses. The file should have a single column with email addresses.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <CsvUploader />
          </CardContent>
        </Card>

        {/* Upload History Section */}
        <Card>
          <CardHeader>
            <CardTitle>Upload History</CardTitle>
            <CardDescription>
              View your previous bulk uploads and download results.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <UploadHistory />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 