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
      ad_requests: {
        Row: {
          ad_link: string | null
          ad_name: string
          admin_response: string | null
          created_at: string
          duration_hours: number
          id: string
          image_url: string
          phone_number: string
          price: number
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          ad_link?: string | null
          ad_name: string
          admin_response?: string | null
          created_at?: string
          duration_hours: number
          id?: string
          image_url: string
          phone_number: string
          price: number
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          ad_link?: string | null
          ad_name?: string
          admin_response?: string | null
          created_at?: string
          duration_hours?: number
          id?: string
          image_url?: string
          phone_number?: string
          price?: number
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      admin_users: {
        Row: {
          created_at: string | null
          id: string
          is_super_admin: boolean | null
          password_hash: string
          updated_at: string | null
          username: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          password_hash: string
          updated_at?: string | null
          username: string
        }
        Update: {
          created_at?: string | null
          id?: string
          is_super_admin?: boolean | null
          password_hash?: string
          updated_at?: string | null
          username?: string
        }
        Relationships: []
      }
      advertisement_views: {
        Row: {
          advertisement_id: string
          id: string
          page_location: string
          user_id: string | null
          viewed_at: string
        }
        Insert: {
          advertisement_id: string
          id?: string
          page_location: string
          user_id?: string | null
          viewed_at?: string
        }
        Update: {
          advertisement_id?: string
          id?: string
          page_location?: string
          user_id?: string | null
          viewed_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisement_views_advertisement_id_fkey"
            columns: ["advertisement_id"]
            isOneToOne: false
            referencedRelation: "advertisements"
            referencedColumns: ["id"]
          },
        ]
      }
      advertisements: {
        Row: {
          admin_id: string
          created_at: string
          description: string | null
          expires_at: string | null
          id: string
          image_url: string
          is_active: boolean
          link_url: string | null
          scheduled_at: string | null
          title: string
          updated_at: string
        }
        Insert: {
          admin_id: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url: string
          is_active?: boolean
          link_url?: string | null
          scheduled_at?: string | null
          title: string
          updated_at?: string
        }
        Update: {
          admin_id?: string
          created_at?: string
          description?: string | null
          expires_at?: string | null
          id?: string
          image_url?: string
          is_active?: boolean
          link_url?: string | null
          scheduled_at?: string | null
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "advertisements_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "admin_users"
            referencedColumns: ["id"]
          },
        ]
      }
      chat_rooms: {
        Row: {
          announcement: string | null
          avatar_url: string | null
          created_at: string | null
          description: string | null
          id: string
          is_private: boolean | null
          members_count: number | null
          name: string
          owner_id: string
          password: string | null
          updated_at: string | null
        }
        Insert: {
          announcement?: string | null
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          members_count?: number | null
          name: string
          owner_id: string
          password?: string | null
          updated_at?: string | null
        }
        Update: {
          announcement?: string | null
          avatar_url?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          is_private?: boolean | null
          members_count?: number | null
          name?: string
          owner_id?: string
          password?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "chat_rooms_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      follows: {
        Row: {
          created_at: string | null
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string | null
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string | null
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "follows_follower_id_fkey"
            columns: ["follower_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "follows_following_id_fkey"
            columns: ["following_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "hashtag_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_comment_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_comments: {
        Row: {
          content: string
          created_at: string
          hashtags: string[] | null
          id: string
          image_url: string | null
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          hashtags?: string[] | null
          id?: string
          image_url?: string | null
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "hashtag_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_comments_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "hashtag_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "hashtag_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "hashtag_likes_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_posts: {
        Row: {
          comments_count: number | null
          content: string
          created_at: string | null
          hashtags: string[]
          id: string
          image_url: string | null
          likes_count: number | null
          shares_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          comments_count?: number | null
          content: string
          created_at?: string | null
          hashtags?: string[]
          id?: string
          image_url?: string | null
          likes_count?: number | null
          shares_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          comments_count?: number | null
          content?: string
          created_at?: string | null
          hashtags?: string[]
          id?: string
          image_url?: string | null
          likes_count?: number | null
          shares_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "hashtag_posts_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      hashtag_trends: {
        Row: {
          created_at: string | null
          hashtag: string
          id: string
          is_trending: boolean | null
          posts_count: number | null
          trend_score: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          hashtag: string
          id?: string
          is_trending?: boolean | null
          posts_count?: number | null
          trend_score?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          hashtag?: string
          id?: string
          is_trending?: boolean | null
          posts_count?: number | null
          trend_score?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      notifications: {
        Row: {
          created_at: string | null
          data: Json | null
          id: string
          is_read: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          data?: Json | null
          id?: string
          is_read?: boolean | null
          message?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      post_shares: {
        Row: {
          created_at: string
          id: string
          post_id: string
          shared_to: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          post_id: string
          shared_to: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          post_id?: string
          shared_to?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_shares_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "hashtag_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      private_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_read: boolean | null
          receiver_id: string
          sender_id: string
          voice_duration: number | null
          voice_url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id: string
          sender_id: string
          voice_duration?: number | null
          voice_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_read?: boolean | null
          receiver_id?: string
          sender_id?: string
          voice_duration?: number | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "private_messages_receiver_id_fkey"
            columns: ["receiver_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "private_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          email: string
          favorite_team: string | null
          followers_count: number | null
          following_count: number | null
          id: string
          updated_at: string | null
          username: string
          verification_status: string | null
        }
        Insert: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email: string
          favorite_team?: string | null
          followers_count?: number | null
          following_count?: number | null
          id: string
          updated_at?: string | null
          username: string
          verification_status?: string | null
        }
        Update: {
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          email?: string
          favorite_team?: string | null
          followers_count?: number | null
          following_count?: number | null
          id?: string
          updated_at?: string | null
          username?: string
          verification_status?: string | null
        }
        Relationships: []
      }
      reports: {
        Row: {
          admin_response: string | null
          created_at: string | null
          description: string | null
          id: string
          reason: string
          report_type: string
          reported_comment_id: string | null
          reported_post_id: string | null
          reported_room_id: string | null
          reported_user_id: string | null
          reporter_id: string | null
          status: string | null
          updated_at: string | null
        }
        Insert: {
          admin_response?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason: string
          report_type: string
          reported_comment_id?: string | null
          reported_post_id?: string | null
          reported_room_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          admin_response?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          reason?: string
          report_type?: string
          reported_comment_id?: string | null
          reported_post_id?: string | null
          reported_room_id?: string | null
          reported_user_id?: string | null
          reporter_id?: string | null
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "reports_reported_comment_id_fkey"
            columns: ["reported_comment_id"]
            isOneToOne: false
            referencedRelation: "hashtag_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_post_id_fkey"
            columns: ["reported_post_id"]
            isOneToOne: false
            referencedRelation: "hashtag_posts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reports_reported_room_id_fkey"
            columns: ["reported_room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_invitations: {
        Row: {
          created_at: string | null
          id: string
          invitee_id: string
          inviter_id: string
          room_id: string
          status: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          invitee_id: string
          inviter_id: string
          room_id: string
          status?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          invitee_id?: string
          inviter_id?: string
          room_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_invitations_invitee_id_fkey"
            columns: ["invitee_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_invitations_inviter_id_fkey"
            columns: ["inviter_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_invitations_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      room_members: {
        Row: {
          id: string
          is_banned: boolean | null
          joined_at: string | null
          role: string | null
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_banned?: boolean | null
          joined_at?: string | null
          role?: string | null
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_banned?: boolean | null
          joined_at?: string | null
          role?: string | null
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_members_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      room_messages: {
        Row: {
          content: string
          created_at: string | null
          id: string
          is_pinned: boolean | null
          media_type: string | null
          media_url: string | null
          room_id: string
          updated_at: string | null
          user_id: string
          voice_duration: number | null
          voice_url: string | null
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          media_type?: string | null
          media_url?: string | null
          room_id: string
          updated_at?: string | null
          user_id: string
          voice_duration?: number | null
          voice_url?: string | null
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          is_pinned?: boolean | null
          media_type?: string | null
          media_url?: string | null
          room_id?: string
          updated_at?: string | null
          user_id?: string
          voice_duration?: number | null
          voice_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "room_messages_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "chat_rooms"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "room_messages_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_access_room_members: {
        Args: { room_id_param: string; user_id_param: string }
        Returns: boolean
      }
      demote_from_moderator: {
        Args: {
          room_id_param: string
          user_id_param: string
          demoter_id_param: string
        }
        Returns: boolean
      }
      get_ad_requests_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_requests: number
          pending_requests: number
          approved_requests: number
          rejected_requests: number
          total_revenue: number
        }[]
      }
      get_advertisement_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_ads: number
          active_ads: number
          total_views: number
          top_ad_title: string
          top_ad_views: number
        }[]
      }
      get_app_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_users: number
          total_posts: number
          total_comments: number
          total_rooms: number
          total_messages: number
          total_reports: number
          pending_reports: number
        }[]
      }
      get_hashtag_statistics: {
        Args: Record<PropertyKey, never>
        Returns: {
          total_hashtags: number
          trending_hashtags: number
          top_hashtag: string
          top_hashtag_count: number
        }[]
      }
      get_user_role: {
        Args: { user_uuid: string }
        Returns: string
      }
      is_room_owner: {
        Args: { room_id_param: string; user_id_param: string }
        Returns: boolean
      }
      promote_to_moderator: {
        Args: {
          room_id_param: string
          user_id_param: string
          promoter_id_param: string
        }
        Returns: boolean
      }
      update_admin_password: {
        Args: { admin_id: string; new_password: string }
        Returns: boolean
      }
      update_trending_threshold: {
        Args: { new_threshold: number }
        Returns: boolean
      }
      verify_admin_login: {
        Args: { username_input: string; password_input: string }
        Returns: {
          id: string
          username: string
          is_super_admin: boolean
        }[]
      }
    }
    Enums: {
      user_role: "admin" | "moderator" | "user"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      user_role: ["admin", "moderator", "user"],
    },
  },
} as const
