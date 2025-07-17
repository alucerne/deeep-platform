# DEEEP Email Validation API - Quick Reference

## Essential Information

**Base URL:** `https://hapmnlakorkoklzfovne.functions.supabase.co`  
**Auth Key:** `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw`

## Quick Start

### 1. Submit Emails
```bash
curl -X POST https://hapmnlakorkoklzfovne.functions.supabase.co/submit-batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw" \
  -d '{"emails": ["test@example.com"]}'
```

### 2. Check Status
```bash
curl "https://hapmnlakorkoklzfovne.functions.supabase.co/batch-result?id=YOUR_BATCH_ID" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw"
```

## Response Formats

### Submit Response
```json
{
  "success": true,
  "batch_id": "ct1v80xrbt9x9f72eyqm20jfk8blq545",
  "message": "Batch submitted successfully"
}
```

### Status Response (Plain Text)
- **Complete:** `https://api.proxy4smtp.com/download/batch-id/results.csv`
- **Processing:** `Still processing`
- **Not Found:** `Batch not found`

## Common Patterns

### JavaScript Polling
```javascript
async function waitForResults(batchId) {
  for (let i = 0; i < 20; i++) {
    const status = await fetch(`/batch-result?id=${batchId}`);
    const result = await status.text();
    
    if (result.includes('https://')) return result;
    if (result === 'Still processing') {
      await new Promise(r => setTimeout(r, 30000)); // Wait 30s
    }
  }
  throw new Error('Timeout');
}
```

### Python Polling
```python
import time
import requests

def wait_for_results(batch_id):
    for i in range(20):
        response = requests.get(f'/batch-result?id={batch_id}')
        result = response.text
        
        if 'https://' in result:
            return result
        elif result == 'Still processing':
            time.sleep(30)  # Wait 30s
    raise Exception('Timeout')
```

## Error Codes

| Code | Meaning | Action |
|------|---------|--------|
| 400 | Bad Request | Check JSON format |
| 401 | Unauthorized | Verify auth token |
| 404 | Not Found | Check batch ID |
| 502 | Service Error | Retry later |

## Limits
- **Batch Size:** Max 1000 emails
- **Rate Limit:** 10 submits/minute, 60 checks/minute
- **Processing Time:** 2-5 minutes typical 