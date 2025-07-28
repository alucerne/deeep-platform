# InstantEmail API Documentation

## Overview

The InstantEmail API provides email processing capabilities with a credit-based system. This API runs alongside the existing DEEEP API, providing users with multiple email processing options.

## Base URL

```
https://hapmnlakorkoklzfovne.functions.supabase.co
```

## Authentication

Most endpoints require authentication using an API key in the Authorization header:

```
Authorization: Bearer <your_api_key>
```

## Endpoints

### 1. Generate API Key

**Endpoint:** `POST /generate-key`

**Description:** Generate a new API key for a user email address.

**Headers:**
```
Content-Type: application/json
```

**Body:**
```json
{
  "user_email": "user@example.com"
}
```

**Response:**
```json
{
  "api_key": "user_813f41af-e06c-4f58-b3be-793299db4e69",
  "credits": 0,
  "message": "API key generated successfully"
}
```

**Example:**
```bash
curl -X POST https://hapmnlakorkoklzfovne.functions.supabase.co/generate-key \
  -H "Content-Type: application/json" \
  -d '{"user_email": "user@example.com"}'
```

### 2. Update Credits (Admin Only)

**Endpoint:** `POST /update-credits`

**Description:** Add credits to a user's account (admin access required).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <ADMIN_SECRET>
```

**Body:**
```json
{
  "user_email": "user@example.com",
  "credits": 100
}
```

**Response:**
```json
{
  "user_email": "user@example.com",
  "previous_credits": 0,
  "credits_added": 100,
  "new_balance": 100,
  "message": "Credits updated successfully"
}
```

**Example:**
```bash
curl -X POST https://hapmnlakorkoklzfovne.functions.supabase.co/update-credits \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <ADMIN_SECRET>" \
  -d '{"user_email": "user@example.com", "credits": 100}'
```

### 3. Submit Batch

**Endpoint:** `POST /submit-batch`

**Description:** Submit a batch of emails for processing.

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_api_key>
```

**Body:**
```json
{
  "emails": ["email1@gmail.com", "email2@gmail.com", "email3@gmail.com"]
}
```

**Response:**
```json
{
  "request_id": "req_abc123def456",
  "batch_id": "0d4ae475-5112-4bb3-a682-3d3bf114ef51",
  "emails_submitted": 3,
  "credits_deducted": 3,
  "remaining_credits": 97,
  "status": "processing",
  "message": "Batch submitted successfully"
}
```

**Example:**
```bash
curl -X POST https://hapmnlakorkoklzfovne.functions.supabase.co/submit-batch \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user_813f41af-e06c-4f58-b3be-793299db4e69" \
  -d '{"emails": ["email1@gmail.com", "email2@gmail.com"]}'
```

### 4. Poll Status

**Endpoint:** `GET /poll-status?request_id=<request_id>`

**Description:** Check the status of a submitted batch.

**Headers:**
```
Content-Type: application/json
```

**Response:**
```json
{
  "request_id": "req_abc123def456",
  "status": "processing",
  "download_url": null,
  "submitted_emails": ["email1@gmail.com", "email2@gmail.com"],
  "emails_count": 2,
  "created_at": "2025-07-28T00:45:35.070254+00:00",
  "message": "Batch still processing"
}
```

**Example:**
```bash
curl -X GET "https://hapmnlakorkoklzfovne.functions.supabase.co/poll-status?request_id=req_abc123def456" \
  -H "Content-Type: application/json"
```

### 5. Get Results

**Endpoint:** `GET /get-results?request_id=<request_id>`

**Description:** Get detailed results for a batch (requires authentication).

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <your_api_key>
```

**Response:**
```json
{
  "request_id": "req_abc123def456",
  "status": "complete",
  "download_url": "https://example.com/download/results.csv",
  "submitted_emails": ["email1@gmail.com", "email2@gmail.com"],
  "emails_count": 2,
  "created_at": "2025-07-28T00:45:35.070254+00:00",
  "message": "Batch processing complete"
}
```

**Example:**
```bash
curl -X GET "https://hapmnlakorkoklzfovne.functions.supabase.co/get-results?request_id=req_abc123def456" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer user_813f41af-e06c-4f58-b3be-793299db4e69"
```

## Error Responses

### Common Error Codes

- **400 Bad Request:** Invalid input data
- **401 Unauthorized:** Missing or invalid API key
- **402 Payment Required:** Insufficient credits
- **403 Forbidden:** Admin access denied
- **404 Not Found:** User or batch not found
- **500 Internal Server Error:** Server error

### Error Response Format

```json
{
  "error": "Error description"
}
```

## Status Values

- **processing:** Batch is being processed
- **complete:** Batch processing is finished
- **failed:** Batch processing failed

## Credit System

- Each email in a batch costs 1 credit
- Credits are deducted when a batch is submitted
- Users cannot submit batches with insufficient credits
- Credits can only be added by administrators

## Make.com Integration

### HTTP Module Setup

1. **Generate API Key:**
   - Method: POST
   - URL: `https://hapmnlakorkoklzfovne.functions.supabase.co/generate-key`
   - Headers: `Content-Type: application/json`
   - Body: `{"user_email": "{{user_email}}"}`

2. **Submit Batch:**
   - Method: POST
   - URL: `https://hapmnlakorkoklzfovne.functions.supabase.co/submit-batch`
   - Headers: 
     - `Content-Type: application/json`
     - `Authorization: Bearer {{api_key}}`
   - Body: `{"emails": {{emails_array}}}`

3. **Check Status:**
   - Method: GET
   - URL: `https://hapmnlakorkoklzfovne.functions.supabase.co/poll-status?request_id={{request_id}}`
   - Headers: `Content-Type: application/json`

4. **Get Results:**
   - Method: GET
   - URL: `https://hapmnlakorkoklzfovne.functions.supabase.co/get-results?request_id={{request_id}}`
   - Headers:
     - `Content-Type: application/json`
     - `Authorization: Bearer {{api_key}}`

## Environment Variables

The following environment variables are required:

- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_SERVICE_ROLE_KEY`: Your Supabase service role key
- `SUPABASE_ADMIN_SECRET`: Admin secret for credit management

## Rate Limits

Currently, there are no rate limits implemented. However, please use the API responsibly.

## Support

For support or questions, please contact the development team. 