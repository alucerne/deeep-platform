export interface Database {
  public: {
    Tables: {
      user_profiles: {
        Row: {
          id: string
          user_id: string
          email: string
          api_key: string | null
          customer_link: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          api_key?: string | null
          customer_link?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          api_key?: string | null
          customer_link?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      deeep_api_keys: {
        Row: {
          id: string
          user_id: string
          email: string
          api_key: string
          customer_link: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          email: string
          api_key: string
          customer_link?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          email?: string
          api_key?: string
          customer_link?: string | null
          created_at?: string
        }
      }
      bulk_jobs: {
        Row: {
          id: string
          user_id: string
          batch_id: string
          submitted_at: string
          num_valid_items: number
          remaining_credits: number
          status: 'processing' | 'complete'
          download_link: string | null
          api_key: string | null
          created_at: string
        }
        Insert: {
          id?: string
          user_id: string
          batch_id: string
          submitted_at?: string
          num_valid_items: number
          remaining_credits: number
          status?: 'processing' | 'complete'
          download_link?: string | null
          api_key?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          batch_id?: string
          submitted_at?: string
          num_valid_items?: number
          remaining_credits?: number
          status?: 'processing' | 'complete'
          download_link?: string | null
          api_key?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
} 