import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// Database types
export interface DatabaseSession {
  id: string
  title: string
  messages: any[] // JSON field
  user_id?: string
  created_at: string
  updated_at: string
}

export interface Database {
  public: {
    Tables: {
      chat_sessions: {
        Row: DatabaseSession
        Insert: Omit<DatabaseSession, 'created_at' | 'updated_at'>
        Update: Partial<Omit<DatabaseSession, 'id' | 'created_at'>>
      }
    }
  }
}

