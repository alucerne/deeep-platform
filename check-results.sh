#!/bin/bash

# DEEEP Platform - Check Batch Results
# Batch ID: p014ctdttthgjvt8znjcup5qz2lde8pl

BATCH_ID="p014ctdttthgjvt8znjcup5qz2lde8pl"
SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw"
ENDPOINT="https://hapmnlakorkoklzfovne.supabase.co/functions/v1/validateEmails"

echo "🔍 Checking batch status for: $BATCH_ID"
echo "=========================================="

# Function to check status
check_status() {
    curl -s -X POST \
        "$ENDPOINT?check_status=true&batch_id=$BATCH_ID" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY"
}

# Function to wait for completion
wait_for_completion() {
    curl -s -X POST \
        "$ENDPOINT?check_status=true&batch_id=$BATCH_ID&wait=true" \
        -H "Content-Type: application/json" \
        -H "Authorization: Bearer $SUPABASE_ANON_KEY"
}

# Check current status
echo "📊 Current status:"
RESPONSE=$(check_status)
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "⏳ Waiting for completion (this may take 2-5 minutes)..."
echo "Press Ctrl+C to stop waiting and check manually"

# Wait for completion
RESPONSE=$(wait_for_completion)
echo ""
echo "✅ Final results:"
echo "$RESPONSE" | jq '.' 2>/dev/null || echo "$RESPONSE"

echo ""
echo "📥 To download results file, use:"
echo "curl -X GET \"https://your-vercel-deployment-url.vercel.app/api/download-results/$BATCH_ID\" \\"
echo "  -H \"Authorization: Bearer YOUR_SUPABASE_SESSION_TOKEN\"" 