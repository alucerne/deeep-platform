# DEEEP Email Validation API Documentation

## Overview

This API provides a complete email validation workflow using Supabase Edge Functions. The system allows you to submit batches of emails for validation, receive callbacks when processing is complete, and retrieve results.

## Base URL

```
https://hapmnlakorkoklzfovne.functions.supabase.co
```

## Authentication

### For submit-batch and batch-result endpoints:
- **Type**: Bearer Token
- **Header**: `Authorization: Bearer <SUPABASE_ANON_KEY>`
- **Key**: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw`

### For callback-handler endpoint:
- **Type**: Custom Header
- **Header**: `x-deeep-api-key: <YOUR_API_KEY>`
- **Note**: This endpoint is called by the DEEEP API system, not by your application

---

## Endpoints

### 1. Submit Email Batch

**Endpoint:** `POST /submit-batch`

**Description:** Submits a batch of emails for validation processing.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY>
```

**Request Body:**
```json
{
  "emails": [
    "email1@example.com",
    "email2@example.com",
    "email3@example.com"
  ]
}
```

**Parameters:**
- `emails` (array, required): Array of email addresses to validate
  - Maximum recommended: 1000 emails per batch
  - Empty strings and non-string values will be filtered out
  - Each email should be in valid email format

**Response (200 OK):**
```json
{
  "success": true,
  "batch_id": "ct1v80xrbt9x9f72eyqm20jfk8blq545",
  "message": "Batch submitted successfully"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Invalid JSON format. Expected { \"emails\": [\"email1\", \"email2\"] }"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Missing authorization header"
}
```

**Response (502 Bad Gateway):**
```json
{
  "error": "DEEEP API error",
  "status": 400,
  "details": "Invalid request"
}
```

**Example (cURL):**
```bash
curl -X POST https://hapmnlakorkoklzfovne.functions.supabase.co/submit-batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw" \
  -d '{
    "emails": [
      "john.doe@company.com",
      "jane.smith@example.org",
      "contact@business.net"
    ]
  }'
```

---

### 2. Check Batch Status

**Endpoint:** `GET /batch-result`

**Description:** Retrieves the status and download link for a submitted batch.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <SUPABASE_ANON_KEY>
```

**Query Parameters:**
- `id` (string, required): The batch ID returned from submit-batch

**Response Format:** Plain text (not JSON)

**Response (200 OK) - Complete:**
```
https://api.proxy4smtp.com/download/ct1v80xrbt9x9f72eyqm20jfk8blq545/results.csv
```

**Response (200 OK) - Still Processing:**
```
Still processing
```

**Response (400 Bad Request):**
```
Missing batch_id parameter. Use: /batch-result?id=<batch_id>
```

**Response (404 Not Found):**
```
Batch not found
```

**Response (401 Unauthorized):**
```
{"code":401,"message":"Missing authorization header"}
```

**Example (cURL):**
```bash
curl "https://hapmnlakorkoklzfovne.functions.supabase.co/batch-result?id=ct1v80xrbt9x9f72eyqm20jfk8blq545" \
  -H "Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw"
```

---

### 3. Callback Handler (Internal)

**Endpoint:** `POST /callback-handler`

**Description:** Internal endpoint called by the DEEEP API when batch processing is complete. This endpoint should not be called directly by your application.

**Headers:**
```
Content-Type: application/json
x-deeep-api-key: <YOUR_API_KEY>
```

**Request Body:**
```json
{
  "batch_id": "ct1v80xrbt9x9f72eyqm20jfk8blq545",
  "download_link": "https://api.proxy4smtp.com/download/ct1v80xrbt9x9f72eyqm20jfk8blq545/results.csv"
}
```

**Parameters:**
- `batch_id` (string, required): The batch ID that was submitted
- `download_link` (string, required): URL where the validation results can be downloaded

**Response (200 OK):**
```json
{
  "success": true,
  "batch_id": "ct1v80xrbt9x9f72eyqm20jfk8blq545",
  "download_link": "https://api.proxy4smtp.com/download/ct1v80xrbt9x9f72eyqm20jfk8blq545/results.csv"
}
```

**Response (400 Bad Request):**
```json
{
  "error": "Missing batch_id or download_link in request body"
}
```

**Response (401 Unauthorized):**
```json
{
  "error": "Missing x-deeep-api-key header"
}
```

**Response (404 Not Found):**
```json
{
  "error": "No matching batch_id found"
}
```

---

## Workflow Examples

### Basic Email Validation Workflow

1. **Submit a batch of emails:**
```bash
curl -X POST https://hapmnlakorkoklzfovne.functions.supabase.co/submit-batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>" \
  -d '{
    "emails": [
      "user1@example.com",
      "user2@example.com",
      "user3@example.com"
    ]
  }'
```

2. **Get the batch_id from the response:**
```json
{
  "success": true,
  "batch_id": "ct1v80xrbt9x9f72eyqm20jfk8blq545",
  "message": "Batch submitted successfully"
}
```

3. **Poll for completion:**
```bash
curl "https://hapmnlakorkoklzfovne.functions.supabase.co/batch-result?id=ct1v80xrbt9x9f72eyqm20jfk8blq545" \
  -H "Authorization: Bearer <SUPABASE_ANON_KEY>"
```

4. **If still processing, wait and retry:**
```
Still processing
```

5. **When complete, get the download link:**
```
https://api.proxy4smtp.com/download/ct1v80xrbt9x9f72eyqm20jfk8blq545/results.csv
```

6. **Download the results:**
```bash
curl "https://api.proxy4smtp.com/download/ct1v80xrbt9x9f72eyqm20jfk8blq545/results.csv"
```

---

## Integration Guides

### JavaScript/Node.js Integration

```javascript
const axios = require('axios');

const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw';
const BASE_URL = 'https://hapmnlakorkoklzfovne.functions.supabase.co';

async function submitEmailBatch(emails) {
  try {
    const response = await axios.post(`${BASE_URL}/submit-batch`, {
      emails: emails
    }, {
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    return response.data.batch_id;
  } catch (error) {
    console.error('Error submitting batch:', error.response?.data || error.message);
    throw error;
  }
}

async function checkBatchStatus(batchId) {
  try {
    const response = await axios.get(`${BASE_URL}/batch-result?id=${batchId}`, {
      headers: {
        'Authorization': `Bearer ${SUPABASE_ANON_KEY}`
      }
    });
    
    return response.data;
  } catch (error) {
    console.error('Error checking batch status:', error.response?.data || error.message);
    throw error;
  }
}

async function waitForCompletion(batchId, maxAttempts = 20, delaySeconds = 30) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const status = await checkBatchStatus(batchId);
    
    if (status.includes('https://')) {
      return status; // Download link
    } else if (status === 'Still processing') {
      console.log(`Attempt ${attempt + 1}: Still processing...`);
      await new Promise(resolve => setTimeout(resolve, delaySeconds * 1000));
    } else {
      throw new Error(`Unexpected status: ${status}`);
    }
  }
  
  throw new Error('Batch processing timeout');
}

// Usage example
async function validateEmails(emails) {
  try {
    // Submit batch
    const batchId = await submitEmailBatch(emails);
    console.log(`Batch submitted with ID: ${batchId}`);
    
    // Wait for completion
    const downloadLink = await waitForCompletion(batchId);
    console.log(`Results ready: ${downloadLink}`);
    
    // Download results
    const results = await axios.get(downloadLink);
    return results.data;
  } catch (error) {
    console.error('Validation failed:', error);
    throw error;
  }
}
```

### Python Integration

```python
import requests
import time

SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw'
BASE_URL = 'https://hapmnlakorkoklzfovne.functions.supabase.co'

def submit_email_batch(emails):
    """Submit a batch of emails for validation."""
    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
    }
    
    response = requests.post(
        f'{BASE_URL}/submit-batch',
        json={'emails': emails},
        headers=headers
    )
    
    if response.status_code == 200:
        return response.json()['batch_id']
    else:
        raise Exception(f'Error submitting batch: {response.text}')

def check_batch_status(batch_id):
    """Check the status of a batch."""
    headers = {
        'Authorization': f'Bearer {SUPABASE_ANON_KEY}'
    }
    
    response = requests.get(
        f'{BASE_URL}/batch-result?id={batch_id}',
        headers=headers
    )
    
    if response.status_code == 200:
        return response.text
    else:
        raise Exception(f'Error checking batch status: {response.text}')

def wait_for_completion(batch_id, max_attempts=20, delay_seconds=30):
    """Wait for batch processing to complete."""
    for attempt in range(max_attempts):
        status = check_batch_status(batch_id)
        
        if 'https://' in status:
            return status  # Download link
        elif status == 'Still processing':
            print(f'Attempt {attempt + 1}: Still processing...')
            time.sleep(delay_seconds)
        else:
            raise Exception(f'Unexpected status: {status}')
    
    raise Exception('Batch processing timeout')

def validate_emails(emails):
    """Complete email validation workflow."""
    try:
        # Submit batch
        batch_id = submit_email_batch(emails)
        print(f'Batch submitted with ID: {batch_id}')
        
        # Wait for completion
        download_link = wait_for_completion(batch_id)
        print(f'Results ready: {download_link}')
        
        # Download results
        results = requests.get(download_link)
        return results.text
    except Exception as error:
        print(f'Validation failed: {error}')
        raise error

# Usage example
emails = ['user1@example.com', 'user2@example.com', 'user3@example.com']
results = validate_emails(emails)
print(results)
```

### PHP Integration

```php
<?php

class DEEEPEmailValidator {
    private $supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhhcG1ubGFrb3Jrb2tsemZvdm5lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTIyMTE4MTMsImV4cCI6MjA2Nzc4NzgxM30.S9oesEbFBLqU8cbWuuDInD8g3GNs7urWXb5sI4yholw';
    private $baseUrl = 'https://hapmnlakorkoklzfovne.functions.supabase.co';
    
    public function submitEmailBatch($emails) {
        $headers = [
            'Content-Type: application/json',
            'Authorization: Bearer ' . $this->supabaseAnonKey
        ];
        
        $data = json_encode(['emails' => $emails]);
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . '/submit-batch');
        curl_setopt($ch, CURLOPT_POST, true);
        curl_setopt($ch, CURLOPT_POSTFIELDS, $data);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            $result = json_decode($response, true);
            return $result['batch_id'];
        } else {
            throw new Exception('Error submitting batch: ' . $response);
        }
    }
    
    public function checkBatchStatus($batchId) {
        $headers = [
            'Authorization: Bearer ' . $this->supabaseAnonKey
        ];
        
        $ch = curl_init();
        curl_setopt($ch, CURLOPT_URL, $this->baseUrl . '/batch-result?id=' . $batchId);
        curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
        curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
        
        $response = curl_exec($ch);
        $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);
        curl_close($ch);
        
        if ($httpCode === 200) {
            return $response;
        } else {
            throw new Exception('Error checking batch status: ' . $response);
        }
    }
    
    public function waitForCompletion($batchId, $maxAttempts = 20, $delaySeconds = 30) {
        for ($attempt = 0; $attempt < $maxAttempts; $attempt++) {
            $status = $this->checkBatchStatus($batchId);
            
            if (strpos($status, 'https://') !== false) {
                return $status; // Download link
            } elseif ($status === 'Still processing') {
                echo "Attempt " . ($attempt + 1) . ": Still processing...\n";
                sleep($delaySeconds);
            } else {
                throw new Exception('Unexpected status: ' . $status);
            }
        }
        
        throw new Exception('Batch processing timeout');
    }
    
    public function validateEmails($emails) {
        try {
            // Submit batch
            $batchId = $this->submitEmailBatch($emails);
            echo "Batch submitted with ID: $batchId\n";
            
            // Wait for completion
            $downloadLink = $this->waitForCompletion($batchId);
            echo "Results ready: $downloadLink\n";
            
            // Download results
            $results = file_get_contents($downloadLink);
            return $results;
        } catch (Exception $error) {
            echo "Validation failed: " . $error->getMessage() . "\n";
            throw $error;
        }
    }
}

// Usage example
$validator = new DEEEPEmailValidator();
$emails = ['user1@example.com', 'user2@example.com', 'user3@example.com'];
$results = $validator->validateEmails($emails);
echo $results;
?>
```

---

## Error Handling

### Common Error Codes

| Status Code | Error | Description | Solution |
|-------------|-------|-------------|----------|
| 400 | Missing batch_id parameter | No batch ID provided in query | Include `?id=<batch_id>` in URL |
| 400 | Invalid JSON format | Malformed request body | Check JSON syntax and structure |
| 401 | Missing authorization header | No auth token provided | Include `Authorization: Bearer <key>` header |
| 401 | Invalid API key | Wrong or missing API key | Verify API key is correct |
| 404 | Batch not found | Batch ID doesn't exist | Check batch ID is correct |
| 405 | Method not allowed | Wrong HTTP method | Use POST for submit-batch, GET for batch-result |
| 500 | Database error | Internal server error | Retry request or contact support |
| 502 | DEEEP API error | External service error | Check DEEEP API status |

### Retry Logic

```javascript
async function submitWithRetry(emails, maxRetries = 3) {
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    try {
      return await submitEmailBatch(emails);
    } catch (error) {
      if (attempt === maxRetries - 1) throw error;
      
      // Exponential backoff
      const delay = Math.pow(2, attempt) * 1000;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
}
```

---

## Rate Limits and Best Practices

### Rate Limits
- **Submit requests**: 10 requests per minute
- **Status checks**: 60 requests per minute
- **Batch size**: Maximum 1000 emails per batch

### Best Practices
1. **Batch emails efficiently**: Group emails into batches of 100-1000
2. **Implement polling**: Check status every 30-60 seconds
3. **Handle errors gracefully**: Implement retry logic with exponential backoff
4. **Store batch IDs**: Keep track of submitted batches for later retrieval
5. **Monitor processing times**: Typical processing time is 2-5 minutes

### Performance Tips
- Use connection pooling for high-volume applications
- Implement caching for frequently accessed batch statuses
- Consider using webhooks instead of polling for real-time updates
- Process results asynchronously to avoid blocking your application

---

## Support and Troubleshooting

### Getting Help
- **Documentation**: This document contains all necessary information
- **Testing**: Use the provided examples to test your integration
- **Logs**: Check your application logs for detailed error messages

### Common Issues

**Issue**: "Still processing" for extended periods
**Solution**: Check if the DEEEP API is experiencing delays. Normal processing time is 2-5 minutes.

**Issue**: "Batch not found" error
**Solution**: Verify the batch ID is correct and was successfully submitted.

**Issue**: Authentication errors
**Solution**: Ensure you're using the correct Supabase anon key and it hasn't expired.

**Issue**: Rate limit exceeded
**Solution**: Implement proper rate limiting in your application.

---

## Version Information

- **API Version**: 1.0
- **Last Updated**: July 2025
- **Base URL**: https://hapmnlakorkoklzfovne.functions.supabase.co
- **Status**: Production Ready

---

## Changelog

### Version 1.0 (July 2025)
- Initial release
- Support for email batch submission
- Real-time status checking
- Callback-based completion notifications
- Plain text result retrieval 