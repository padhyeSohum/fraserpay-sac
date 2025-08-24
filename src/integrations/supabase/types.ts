export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      booths: {
        Row: {
          created_at: string | null
          description: string
          id: string
          members: string[] | null
          name: string
          pin: string
          sales: number
        }
        Insert: {
          created_at?: string | null
          description: string
          id?: string
          members?: string[] | null
          name: string
          pin: string
          sales?: number
        }
        Update: {
          created_at?: string | null
          description?: string
          id?: string
          members?: string[] | null
          name?: string
          pin?: string
          sales?: number
        }
        Relationships: []
      }
      products: {
        Row: {
          booth_id: string
          created_at: string | null
          id: string
          image: string | null
          name: string
          price: number
        }
        Insert: {
          booth_id: string
          created_at?: string | null
          id?: string
          image?: string | null
          name: string
          price: number
        }
        Update: {
          booth_id?: string
          created_at?: string | null
          id?: string
          image?: string | null
          name?: string
          price?: number
        }
        Relationships: [
          {
            foreignKeyName: "products_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "booths"
            referencedColumns: ["id"]
          },
        ]
      }
      transaction_products: {
        Row: {
          created_at: string | null
          id: string
          price: number
          product_id: string
          product_name: string
          quantity: number
          transaction_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          price: number
          product_id: string
          product_name: string
          quantity?: number
          transaction_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          price?: number
          product_id?: string
          product_name?: string
          quantity?: number
          transaction_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "transaction_products_transaction_id_fkey"
            columns: ["transaction_id"]
            isOneToOne: false
            referencedRelation: "transactions"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          booth_id: string | null
          booth_name: string | null
          created_at: string | null
          id: string
          sac_member: string | null
          student_id: string
          student_name: string
          type: string
        }
        Insert: {
          amount: number
          booth_id?: string | null
          booth_name?: string | null
          created_at?: string | null
          id?: string
          sac_member?: string | null
          student_id: string
          student_name: string
          type: string
        }
        Update: {
          amount?: number
          booth_id?: string | null
          booth_name?: string | null
          created_at?: string | null
          id?: string
          sac_member?: string | null
          student_id?: string
          student_name?: string
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "transactions_booth_id_fkey"
            columns: ["booth_id"]
            isOneToOne: false
            referencedRelation: "booths"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transactions_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          booth_access: string[] | null
          created_at: string | null
          email: string
          id: string
          name: string
          qr_code: string
          role: string
          student_number: string
          tickets: number
          points: number
        }
        Insert: {
          booth_access?: string[] | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          qr_code: string
          role?: string
          student_number: string
          tickets?: number
          points?: number
        }
        Update: {
          booth_access?: string[] | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          qr_code?: string
          role?: string
          student_number?: string
          tickets?: number
          points?: number
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      update_user_balance: {
        Args: {
          user_id: string
          new_balance: number
        }
        Returns: boolean
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
