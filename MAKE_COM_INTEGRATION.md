# Make.com Integration Guide: DEEEP Email Validation

## Overview

This guide provides step-by-step instructions for integrating the DEEEP Email Validation API into Make.com (formerly Integromat) scenarios.

## Prerequisites

- Make.com account
- Supabase anon key: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw`

## Scenario 1: Basic Email Validation Workflow

### Step 1: Create New Scenario
1. Log into Make.com
2. Click "Create a new scenario"
3. Name it "DEEEP Email Validation"

### Step 2: Add Trigger
**Module:** Webhooks > Custom webhook

**Configuration:**
```
URL: [Auto-generated webhook URL]
Method: POST
Body: JSON
```

**Sample webhook data:**
```json
{
  "emails": ["user1@example.com", "user2@example.com"],
  "campaign_id": "campaign_123"
}
```

### Step 3: Submit Email Batch
**Module:** HTTP > Make an HTTP request

**Configuration:**
```
URL: https://hapmnlakorkoklzfovne.functions.supabase.co/submit-batch
Method: POST
Headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw
Body (JSON):
{
  "emails": {{1.emails}}
}
```

**Data Mapping:**
- `{{1.emails}}` - Maps to the emails array from the webhook

### Step 4: Wait for Processing
**Module:** Tools > Set up a timer

**Configuration:**
```
Delay: 30 seconds
```

### Step 5: Check Batch Status
**Module:** HTTP > Make an HTTP request

**Configuration:**
```
URL: https://hapmnlakorkoklzfovne.functions.supabase.co/batch-result?id={{2.batch_id}}
Method: GET
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw
```

**Data Mapping:**
- `{{2.batch_id}}` - Maps to the batch_id from step 2

### Step 6: Router for Response Handling
**Module:** Router

**Routes:**
1. **Complete** - Condition: `{{5.body}}` contains "https://"
2. **Still Processing** - Condition: `{{5.body}}` equals "Still processing"
3. **Error** - Default route

### Step 7: Download Results (Complete Route)
**Module:** HTTP > Make an HTTP request

**Configuration:**
```
URL: {{5.body}}
Method: GET
```

### Step 8: Process Results (Complete Route)
**Module:** Tools > Parse CSV

**Configuration:**
```
Data: {{7.body}}
Delimiter: ,
Has header row: Yes
```

### Step 9: Store Results (Complete Route)
**Module:** Google Sheets > Add a row

**Configuration:**
```
Spreadsheet: [Your Google Sheet]
Sheet: Results
Data mapping:
  - Email: {{8.email}}
  - Status: {{8.status}}
  - Score: {{8.score}}
  - Batch ID: {{2.batch_id}}
  - Timestamp: {{now}}
```

### Step 10: Loop Back (Still Processing Route)
**Module:** Router > Route to Step 4 (Wait for Processing)

## Scenario 2: Advanced Workflow with Retry Logic

### Step 1-3: Same as Basic Workflow

### Step 4: Iterator for Polling
**Module:** Iterator > Repeat

**Configuration:**
```
Maximum iterations: 20
Delay between iterations: 30 seconds
```

### Step 5: Check Status (Inside Iterator)
**Module:** HTTP > Make an HTTP request

**Configuration:**
```
URL: https://hapmnlakorkoklzfovne.functions.supabase.co/batch-result?id={{2.batch_id}}
Method: GET
Headers:
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw
```

### Step 6: Router (Inside Iterator)
**Routes:**
1. **Complete** - Condition: `{{5.body}}` contains "https://"
2. **Still Processing** - Condition: `{{5.body}}` equals "Still processing"
3. **Error** - Condition: `{{5.body}}` contains "not found"

### Step 7: Break Iterator (Complete Route)
**Module:** Tools > Break

### Step 8: Continue Iterator (Still Processing Route)
**Module:** Router > Continue to next iteration

### Step 9: Error Handling (Error Route)
**Module:** Email > Send an email

**Configuration:**
```
To: admin@yourcompany.com
Subject: Email Validation Error
Body: Batch {{2.batch_id}} failed: {{5.body}}
```

## Scenario 3: Bulk Processing from CSV

### Step 1: Google Drive Trigger
**Module:** Google Drive > Watch files

**Configuration:**
```
Folder: [Your upload folder]
File types: CSV
```

### Step 2: Parse CSV
**Module:** Tools > Parse CSV

**Configuration:**
```
Data: {{1.body}}
Delimiter: ,
Has header row: Yes
```

### Step 3: Iterator for Each Row
**Module:** Iterator

**Configuration:**
```
Data source: {{2.parsed}}
```

### Step 4: Submit Batch (Inside Iterator)
**Module:** HTTP > Make an HTTP request

**Configuration:**
```
URL: https://hapmnlakorkoklzfovne.functions.supabase.co/submit-batch
Method: POST
Headers:
  Content-Type: application/json
  Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw
Body (JSON):
{
  "emails": [{{3.email}}]
}
```

### Step 5: Store Batch ID (Inside Iterator)
**Module:** Google Sheets > Add a row

**Configuration:**
```
Spreadsheet: [Your tracking sheet]
Sheet: Batches
Data mapping:
  - Email: {{3.email}}
  - Batch ID: {{4.batch_id}}
  - Status: Submitted
  - Timestamp: {{now}}
```

## Data Mapping Reference

### Input Data Structure
```json
{
  "emails": ["user1@example.com", "user2@example.com"],
  "campaign_id": "campaign_123",
  "priority": "high"
}
```

### Submit Batch Mapping
```json
{
  "emails": "{{1.emails}}"
}
```

### Batch Result Mapping
```
URL: https://hapmnlakorkoklzfovne.functions.supabase.co/batch-result?id={{2.batch_id}}
```

### Response Handling
- **Success**: `{{5.body}}` contains download URL
- **Processing**: `{{5.body}}` equals "Still processing"
- **Error**: `{{5.body}}` contains error message

## Error Handling

### HTTP Error Responses
**Module:** Router

**Routes:**
1. **200 OK** → Continue workflow
2. **401 Unauthorized** → Log error, retry with new token
3. **404 Not Found** → Log error, notify admin
4. **500 Server Error** → Retry with exponential backoff

### Retry Logic
**Module:** Tools > Set up a timer

**Configuration:**
```
Initial delay: 5 seconds
Maximum retries: 3
Exponential backoff: 2x each retry
```

## Environment Variables

### In Make.com Settings:
```
SUPABASE_URL=https://hapmnlakorkoklzfovne.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw
```

### Usage in HTTP Headers:
```
Authorization: Bearer {{SUPABASE_ANON_KEY}}
```

## Best Practices

### Performance
1. **Batch Size**: Keep email batches under 1000 emails
2. **Polling Frequency**: Use 30-60 second intervals
3. **Concurrent Requests**: Limit to 5 concurrent batch submissions
4. **Timeout Settings**: Set HTTP timeouts to 60 seconds

### Error Handling
1. **Always validate responses** before proceeding
2. **Implement retry logic** with exponential backoff
3. **Log all responses** for debugging
4. **Handle all possible response states**

### Monitoring
1. **Add logging steps** to track processing times
2. **Send notifications** on completion or failure
3. **Monitor error rates** and processing times
4. **Set up alerts** for failed batches

## Troubleshooting

### Common Issues

**Issue**: "Missing authorization header"
**Solution**: Check that the Authorization header is properly set

**Issue**: "Invalid JSON format"
**Solution**: Verify the JSON structure matches the expected format

**Issue**: "Still processing" for too long
**Solution**: Check if the DEEEP API is experiencing delays

**Issue**: "Batch not found"
**Solution**: Verify the batch_id is correct and was successfully submitted

### Debugging Tips
1. **Use the execution log** to see step-by-step results
2. **Add data structure tools** to inspect data at each step
3. **Test individual modules** before connecting them
4. **Use sample data** to verify your mappings

## Testing Your Workflow

### Test Data
```json
{
  "emails": ["test1@example.com", "test2@example.com", "test3@example.com"]
}
```

### Expected Results
1. **Submit**: Returns batch_id
2. **Status Check**: Returns "Still processing" initially
3. **Final Result**: Returns download URL after processing

### Validation Steps
1. **Run the scenario** with test data
2. **Check each step** in the execution log
3. **Verify data mapping** is correct
4. **Test error conditions** by using invalid data

This comprehensive guide should help you successfully integrate the DEEEP Email Validation API into your Make.com workflows! 