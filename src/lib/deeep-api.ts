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
  try {
    const response = await fetch('/api/create-deeep-user', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new DeeepApiError(
        `DEEEP API error: ${response.status} - ${errorData.error || 'Unknown error'}`,
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