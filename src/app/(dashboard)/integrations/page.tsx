import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { ExternalLink, Download, Play } from "lucide-react"
import { VideoDialog } from "@/components/integrations/VideoDialog"

export default function IntegrationsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Integrations</h1>
        <p className="text-muted-foreground">
          Connect DEEEP with your favorite tools and automate your email validation workflows.
        </p>
      </div>

      <div className="grid gap-6">
        {/* API Documentation Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              DEEEP API Docs
            </CardTitle>
            <CardDescription>
              Access full endpoint reference, including auth, validation, and credit updates.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a href="/docs" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-2 h-4 w-4" />
                View API Documentation
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Make App Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Download className="h-5 w-5" />
              Automate with Make.com
            </CardTitle>
            <CardDescription>
              Download our custom Make App to sync your email validations instantly.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild>
              <a 
                href="https://github.com/deeep-verify/make-app/releases/latest/download/deeep-make-app.zip" 
                target="_blank" 
                rel="noopener noreferrer"
              >
                <Download className="mr-2 h-4 w-4" />
                Download Make App
              </a>
            </Button>
          </CardContent>
        </Card>

        {/* Interactive Video Section */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Getting Started with the Make App
            </CardTitle>
            <CardDescription>
              Learn how to connect your workflows using our official integration.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <VideoDialog />
          </CardContent>
        </Card>
      </div>
    </div>
  )
} 