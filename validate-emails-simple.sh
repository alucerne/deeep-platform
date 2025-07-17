#!/bin/bash

# DEEEP Platform - Simple Email Validation Workflow
# Usage: ./validate-emails-simple.sh emails.csv

SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6kpXVCJ9eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3rb2tsemZvdm5lIiwicm9ZSI6ImFub24LCJpYXQiOjE3TIyMTE4TMsImV4CI6MjA2zc4NzgxM30S9esEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4w"
ENDPOINT="https://hapmnlakorkoklzfovne.supabase.co/functions/v1/validateEmails"

echo 🧪 DEEEP Platform - Email Validation"
echo "====================================# Check if file is provided
if  $# -eq 0]; then
    echo "❌ Usage: $0 <emails.csv>"
    echo "   Example: $0 emails.csv"
    exit 1
fi

EMAIL_FILE="$1

# Check if file exists
if [ ! -f "$EMAIL_FILE]; then
    echo ❌ File not found: $EMAIL_FILE"
    exit 1
fi

echo "📁 Processing file: $EMAIL_FILE"

# Read emails from file and create JSON array
echo 📋 Reading emails from file..."
EMAILS=()
while IFS= read -r line; do
    # Skip empty lines and comments
    if [[ ! -z "$line" && !$line" =~ ^# ]]; then
        EMAILS+=("\$line\"")
    fi
done < "$EMAIL_FILE

EMAIL_COUNT=${#EMAILS[@]}
echo ✅Found $EMAIL_COUNT emails to validate"

if  $EMAIL_COUNT -eq 0]; then
    echo ❌ Novalid emails found in file
    exit 1
fi

# Create JSON payload
EMAILS_JSON=$(IFS=,; echo [${EMAILS[*]}]")
PAYLOAD="{\emails\": $EMAILS_JSON}"

echo "🚀 Submitting batch for validation...
echo ⏳ This may take2minutes for $EMAIL_COUNT emails...# Submit batch
RESPONSE=$(curl -s -X POST \
   $ENDPOINT" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY" \
    -d "$PAYLOAD")

# Extract batch ID
BATCH_ID=$(echo $RESPONSE" | grep -o "batch_id:"^"]*'| cut -d'" -f4)

if [ -z "$BATCH_ID]; then
    echo "❌ Failed to submit batch:"
    echo "$RESPONSE"
    exit 1
fi

echo ✅ Batch submitted successfully!"
echo "📊 Batch ID: $BATCH_ID"
echo "📧 Emails to process: $EMAIL_COUNT"

# Wait for completion
echo cho "⏳ Waiting for validation to complete..."
echo    (This may take 2-5minutes)"

FINAL_RESPONSE=$(curl -s -X POST \
  $ENDPOINT?check_status=true&batch_id=$BATCH_ID&wait=true" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $SUPABASE_ANON_KEY)

echo ""
echo "✅ Validation completed!
echo 📊 Results:"
echo$FINAL_RESPONSE" | jq .>/dev/null || echo "$FINAL_RESPONSE"

# Save results to file
RESULTS_FILE="validation_results_${BATCH_ID}.json"
echo$FINAL_RESPONSE> "$RESULTS_FILE
echo 
echo💾 Results saved to: $RESULTS_FILE"

echo� Email validation workflow completed!" 