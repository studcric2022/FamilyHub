export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      family_members: {
        Row: {
          id: string
          user_id: string
          name: string
          relation: string
          date_of_birth: string
          gender: string
          blood_group: string | null
          health_status: string
          balance: number
          upi_qr_code: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id: string
          name: string
          relation: string
          date_of_birth: string
          gender: string
          blood_group?: string | null
          health_status: string
          balance?: number
          upi_qr_code?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          name?: string
          relation?: string
          date_of_birth?: string
          gender?: string
          blood_group?: string | null
          health_status?: string
          balance?: number
          upi_qr_code?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      diet_plans: {
        Row: {
          id: string
          member_id: string
          calories: number
          protein: number
          carbs: number
          fat: number
          meals: Json
          recommendations: string[]
          restrictions: string[]
          start_date: string
          end_date: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          member_id: string
          calories: number
          protein: number
          carbs: number
          fat: number
          meals: Json
          recommendations: string[]
          restrictions: string[]
          start_date: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          member_id?: string
          calories?: number
          protein?: number
          carbs?: number
          fat?: number
          meals?: Json
          recommendations?: string[]
          restrictions?: string[]
          start_date?: string
          end_date?: string | null
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
} 