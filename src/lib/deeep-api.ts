interface DeeepNewUserRequest {
  email: string
  initial_credits: number
}

interface DeeepNewUserResponse {
  api_key: string
  customer_link: string
  // Add other fields that might be returned by the API
}

export class DeeepApiError extends Error {
  constructor(message: string, public status?: number) {
    super(message)
    this.name = 'DeeepApiError'
  }
}

export async function createDeeepUser(email: string): Promise<DeeepNewUserResponse> {
  const DEEEP_API_URL = 'https://al-api.proxy4smtp.com/audlabserviceusers/newuser'
  const DEEEP_AUTH_TOKEN = 'audlabY4qjL)129'

  const requestBody: DeeepNewUserRequest = {
    email,
    initial_credits: 1000
  }

  try {
    const response = await fetch(DEEEP_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEEP_AUTH_TOKEN}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody)
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new DeeepApiError(
        `DEEEP API error: ${response.status} - ${errorText}`,
        response.status
      )
    }

    const data = await response.json()
    return data as DeeepNewUserResponse
  } catch (error) {
    if (error instanceof DeeepApiError) {
      throw error
    }
    throw new DeeepApiError(`Failed to create DEEEP user: ${error instanceof Error ? error.message : 'Unknown error'}`)
  }
} 