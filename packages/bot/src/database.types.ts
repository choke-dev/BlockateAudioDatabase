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
      Audio: {
        Row: {
          category: string
          created_at: string
          id: string
          name: string
          updated_at: string
          whitelisterName: string
          whitelisterUserId: number
        }
        Insert: {
          category: string
          created_at?: string
          id: string
          name: string
          updated_at?: string
          whitelisterName: string
          whitelisterUserId: number
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          whitelisterName?: string
          whitelisterUserId?: number
        }
        Relationships: []
      }
      Requests: {
        Row: {
          createdAt: string
          fileName: string
          filePath: string
          fullFilePath: string
          id: string
          userId: string
        }
        Insert: {
          createdAt?: string
          fileName: string
          filePath: string
          fullFilePath: string
          id: string
          userId: string
        }
        Update: {
          createdAt?: string
          fileName?: string
          filePath?: string
          fullFilePath?: string
          id?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Requests_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      RequestUpdates: {
        Row: {
          createdAt: string
          id: string
          reason: string | null
          status: string
        }
        Insert: {
          createdAt?: string
          id: string
          reason?: string | null
          status: string
        }
        Update: {
          createdAt?: string
          id?: string
          reason?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "RequestUpdates_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "Requests"
            referencedColumns: ["id"]
          },
        ]
      }
      Session: {
        Row: {
          createdAt: string
          expires: string
          hash: string
          id: string
          userId: string
        }
        Insert: {
          createdAt?: string
          expires?: string
          hash: string
          id: string
          userId: string
        }
        Update: {
          createdAt?: string
          expires?: string
          hash?: string
          id?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Session_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      State: {
        Row: {
          codeVerifier: string
          createdAt: string
          expiresAt: string
          id: string
          state: string
        }
        Insert: {
          codeVerifier: string
          createdAt?: string
          expiresAt?: string
          id: string
          state: string
        }
        Update: {
          codeVerifier?: string
          createdAt?: string
          expiresAt?: string
          id?: string
          state?: string
        }
        Relationships: []
      }
      Token: {
        Row: {
          accessToken: string
          accessTokenExpiresAt: string
          createdAt: string
          id: string
          refreshToken: string
          tokenScopes: string[] | null
          tokenType: string
          userId: string
        }
        Insert: {
          accessToken: string
          accessTokenExpiresAt: string
          createdAt: string
          id: string
          refreshToken: string
          tokenScopes?: string[] | null
          tokenType: string
          userId: string
        }
        Update: {
          accessToken?: string
          accessTokenExpiresAt?: string
          createdAt?: string
          id?: string
          refreshToken?: string
          tokenScopes?: string[] | null
          tokenType?: string
          userId?: string
        }
        Relationships: [
          {
            foreignKeyName: "Token_userId_fkey"
            columns: ["userId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      UploadedAudio: {
        Row: {
          category: string
          grantedUsePermissions: boolean
          groupId: number | null
          id: string
          inModerationQueue: boolean
          isModerated: boolean
          isProcessed: boolean
          name: string
          requesterUserId: string
          uploadedAt: string
          uploaderUserId: string
        }
        Insert: {
          category: string
          grantedUsePermissions?: boolean
          groupId?: number | null
          id: string
          inModerationQueue?: boolean
          isModerated?: boolean
          isProcessed?: boolean
          name: string
          requesterUserId?: string
          uploadedAt?: string
          uploaderUserId: string
        }
        Update: {
          category?: string
          grantedUsePermissions?: boolean
          groupId?: number | null
          id?: string
          inModerationQueue?: boolean
          isModerated?: boolean
          isProcessed?: boolean
          name?: string
          requesterUserId?: string
          uploadedAt?: string
          uploaderUserId?: string
        }
        Relationships: [
          {
            foreignKeyName: "UploadedAudio_requesterUserId_fkey"
            columns: ["requesterUserId"]
            isOneToOne: false
            referencedRelation: "User"
            referencedColumns: ["id"]
          },
        ]
      }
      User: {
        Row: {
          accent_color: number | null
          avatar: string | null
          banner: string | null
          bot: string | null
          flags: number | null
          global_name: string | null
          id: string
          locale: string | null
          mfa_enabled: boolean | null
          premium_type: number | null
          public_flags: number | null
          system: string | null
          username: string
        }
        Insert: {
          accent_color?: number | null
          avatar?: string | null
          banner?: string | null
          bot?: string | null
          flags?: number | null
          global_name?: string | null
          id: string
          locale?: string | null
          mfa_enabled?: boolean | null
          premium_type?: number | null
          public_flags?: number | null
          system?: string | null
          username: string
        }
        Update: {
          accent_color?: number | null
          avatar?: string | null
          banner?: string | null
          bot?: string | null
          flags?: number | null
          global_name?: string | null
          id?: string
          locale?: string | null
          mfa_enabled?: boolean | null
          premium_type?: number | null
          public_flags?: number | null
          system?: string | null
          username?: string
        }
        Relationships: []
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
