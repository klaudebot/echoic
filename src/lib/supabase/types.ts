/**
 * Supabase Database Types — auto-maintained to match the SQL schema.
 * Run `npx supabase gen types typescript` to regenerate from live DB.
 */

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string;
          email: string;
          full_name: string | null;
          avatar_url: string | null;
          timezone: string;
          onboarded: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          onboarded?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          full_name?: string | null;
          avatar_url?: string | null;
          timezone?: string;
          onboarded?: boolean;
          updated_at?: string;
        };
      };

      organizations: {
        Row: {
          id: string;
          name: string;
          slug: string | null;
          owner_id: string | null;
          stripe_customer_id: string | null;
          stripe_subscription_id: string | null;
          stripe_price_id: string | null;
          plan: "free" | "starter" | "pro" | "team" | "enterprise";
          plan_status: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
          plan_period_start: string | null;
          plan_period_end: string | null;
          transcription_hours_used: number;
          transcription_hours_limit: number;
          storage_bytes_used: number;
          storage_bytes_limit: number;
          members_limit: number;
          meetings_per_month_limit: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          slug?: string | null;
          owner_id?: string | null;
          stripe_customer_id?: string | null;
          stripe_subscription_id?: string | null;
          stripe_price_id?: string | null;
          plan?: "free" | "starter" | "pro" | "team" | "enterprise";
          plan_status?: "active" | "trialing" | "past_due" | "canceled" | "unpaid";
          plan_period_start?: string | null;
          plan_period_end?: string | null;
          transcription_hours_used?: number;
          transcription_hours_limit?: number;
          storage_bytes_used?: number;
          storage_bytes_limit?: number;
          members_limit?: number;
          meetings_per_month_limit?: number;
        };
        Update: Partial<Database["public"]["Tables"]["organizations"]["Insert"]>;
      };

      organization_members: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string;
          role: "owner" | "admin" | "member" | "viewer";
          joined_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id: string;
          role?: "owner" | "admin" | "member" | "viewer";
          joined_at?: string;
        };
        Update: {
          role?: "owner" | "admin" | "member" | "viewer";
        };
      };

      team_invites: {
        Row: {
          id: string;
          organization_id: string;
          invited_by: string | null;
          email: string;
          role: "admin" | "member" | "viewer";
          status: "pending" | "accepted" | "declined" | "expired";
          token: string;
          invited_at: string;
          responded_at: string | null;
          expires_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          invited_by?: string | null;
          email: string;
          role?: "admin" | "member" | "viewer";
          status?: "pending" | "accepted" | "declined" | "expired";
          token?: string;
          invited_at?: string;
          responded_at?: string | null;
          expires_at?: string;
        };
        Update: {
          status?: "pending" | "accepted" | "declined" | "expired";
          responded_at?: string | null;
          role?: "admin" | "member" | "viewer";
        };
      };

      tags: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          color: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          name: string;
          color?: string | null;
        };
        Update: {
          name?: string;
          color?: string | null;
        };
      };

      meetings: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string | null;
          title: string;
          original_title: string | null;
          status: "uploading" | "processing" | "completed" | "failed" | "silent";
          processing_step: "preparing" | "transcribing" | "summarizing" | null;
          processing_progress: string | null;
          error_message: string | null;
          s3_key: string | null;
          file_name: string | null;
          file_size: number | null;
          content_type: string | null;
          source: "upload" | "record" | "zoom" | "google_meet" | "teams" | "api";
          duration: number | null;
          language: string;
          speaker_count: number | null;
          is_silent: boolean;
          silence_percent: number | null;
          peak_db: number | null;
          audio_recommendation: string | null;
          summary: string | null;
          notes: string;
          share_token: string;
          is_public: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by?: string | null;
          title: string;
          original_title?: string | null;
          status?: "uploading" | "processing" | "completed" | "failed" | "silent";
          processing_step?: "preparing" | "transcribing" | "summarizing" | null;
          processing_progress?: string | null;
          error_message?: string | null;
          s3_key?: string | null;
          file_name?: string | null;
          file_size?: number | null;
          content_type?: string | null;
          source?: "upload" | "record" | "zoom" | "google_meet" | "teams" | "api";
          duration?: number | null;
          language?: string;
          speaker_count?: number | null;
          is_silent?: boolean;
          silence_percent?: number | null;
          peak_db?: number | null;
          audio_recommendation?: string | null;
          summary?: string | null;
          notes?: string;
        };
        Update: Partial<Database["public"]["Tables"]["meetings"]["Insert"]>;
      };

      meeting_tags: {
        Row: {
          meeting_id: string;
          tag_id: string;
        };
        Insert: {
          meeting_id: string;
          tag_id: string;
        };
        Update: never;
      };

      meeting_participants: {
        Row: {
          id: string;
          meeting_id: string;
          user_id: string | null;
          name: string | null;
          email: string | null;
          role: "host" | "participant" | "observer";
          speaker_label: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          user_id?: string | null;
          name?: string | null;
          email?: string | null;
          role?: "host" | "participant" | "observer";
          speaker_label?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["meeting_participants"]["Insert"]>;
      };

      transcript_segments: {
        Row: {
          id: string;
          meeting_id: string;
          version_id: string | null;
          segment_index: number;
          start_time: number;
          end_time: number;
          text: string;
          speaker: string | null;
          speaker_id: string | null;
          confidence: number | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          version_id?: string | null;
          segment_index: number;
          start_time: number;
          end_time: number;
          text: string;
          speaker?: string | null;
          speaker_id?: string | null;
          confidence?: number | null;
        };
        Update: Partial<Database["public"]["Tables"]["transcript_segments"]["Insert"]>;
      };

      meeting_key_points: {
        Row: {
          id: string;
          meeting_id: string;
          text: string;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          text: string;
          sort_order?: number;
        };
        Update: {
          text?: string;
          sort_order?: number;
        };
      };

      meeting_action_items: {
        Row: {
          id: string;
          meeting_id: string;
          organization_id: string;
          text: string;
          assignee_name: string | null;
          assigned_to: string | null;
          priority: "high" | "medium" | "low";
          completed: boolean;
          completed_at: string | null;
          completed_by: string | null;
          due_date: string | null;
          sort_order: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          organization_id: string;
          text: string;
          assignee_name?: string | null;
          assigned_to?: string | null;
          priority?: "high" | "medium" | "low";
          completed?: boolean;
          completed_at?: string | null;
          completed_by?: string | null;
          due_date?: string | null;
          sort_order?: number;
        };
        Update: Partial<Database["public"]["Tables"]["meeting_action_items"]["Insert"]>;
      };

      meeting_decisions: {
        Row: {
          id: string;
          meeting_id: string;
          organization_id: string;
          text: string;
          made_by_name: string | null;
          decided_by: string | null;
          sort_order: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          organization_id: string;
          text: string;
          made_by_name?: string | null;
          decided_by?: string | null;
          sort_order?: number;
        };
        Update: {
          text?: string;
          made_by_name?: string | null;
          decided_by?: string | null;
          sort_order?: number;
        };
      };

      transcript_versions: {
        Row: {
          id: string;
          meeting_id: string;
          label: string;
          summary: string | null;
          peak_db: number | null;
          is_silent: boolean | null;
          silence_percent: number | null;
          audio_recommendation: string | null;
          segment_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          label: string;
          summary?: string | null;
          peak_db?: number | null;
          is_silent?: boolean | null;
          silence_percent?: number | null;
          audio_recommendation?: string | null;
          segment_count?: number;
        };
        Update: Partial<Database["public"]["Tables"]["transcript_versions"]["Insert"]>;
      };

      clips: {
        Row: {
          id: string;
          meeting_id: string;
          organization_id: string;
          created_by: string | null;
          title: string;
          description: string | null;
          start_time: number;
          end_time: number;
          transcript_text: string | null;
          share_token: string;
          is_public: boolean;
          view_count: number;
          created_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          organization_id: string;
          created_by?: string | null;
          title: string;
          description?: string | null;
          start_time: number;
          end_time: number;
          transcript_text?: string | null;
          is_public?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["clips"]["Insert"]>;
      };

      notifications: {
        Row: {
          id: string;
          user_id: string;
          type: string;
          title: string;
          message: string | null;
          meeting_id: string | null;
          action_url: string | null;
          read: boolean;
          archived: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          type: string;
          title: string;
          message?: string | null;
          meeting_id?: string | null;
          action_url?: string | null;
          read?: boolean;
          archived?: boolean;
        };
        Update: {
          read?: boolean;
          archived?: boolean;
        };
      };

      meeting_comments: {
        Row: {
          id: string;
          meeting_id: string;
          user_id: string;
          parent_id: string | null;
          text: string;
          timestamp_ref: number | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          meeting_id: string;
          user_id: string;
          parent_id?: string | null;
          text: string;
          timestamp_ref?: number | null;
        };
        Update: {
          text?: string;
          timestamp_ref?: number | null;
        };
      };

      user_settings: {
        Row: {
          user_id: string;
          email_transcript_ready: boolean;
          email_processing_failed: boolean;
          email_team_invites: boolean;
          email_action_item_assigned: boolean;
          email_weekly_digest: boolean;
          email_meeting_shared: boolean;
          default_language: string;
          auto_detect_speakers: boolean;
          default_speaker_count: number | null;
          theme: "light" | "dark" | "system";
          compact_transcript: boolean;
          auto_play_audio: boolean;
          shortcuts_enabled: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          user_id: string;
          email_transcript_ready?: boolean;
          email_processing_failed?: boolean;
          email_team_invites?: boolean;
          email_action_item_assigned?: boolean;
          email_weekly_digest?: boolean;
          email_meeting_shared?: boolean;
          default_language?: string;
          auto_detect_speakers?: boolean;
          default_speaker_count?: number | null;
          theme?: "light" | "dark" | "system";
          compact_transcript?: boolean;
          auto_play_audio?: boolean;
          shortcuts_enabled?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["user_settings"]["Insert"]>;
      };

      integrations: {
        Row: {
          id: string;
          organization_id: string;
          provider: string;
          access_token: string | null;
          refresh_token: string | null;
          token_expires_at: string | null;
          config: Json;
          enabled: boolean;
          connected_by: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          provider: string;
          access_token?: string | null;
          refresh_token?: string | null;
          token_expires_at?: string | null;
          config?: Json;
          enabled?: boolean;
          connected_by?: string | null;
        };
        Update: Partial<Database["public"]["Tables"]["integrations"]["Insert"]>;
      };

      usage_events: {
        Row: {
          id: string;
          organization_id: string;
          user_id: string | null;
          event_type: string;
          meeting_id: string | null;
          duration_seconds: number | null;
          file_size_bytes: number | null;
          tokens_used: number | null;
          metadata: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          user_id?: string | null;
          event_type: string;
          meeting_id?: string | null;
          duration_seconds?: number | null;
          file_size_bytes?: number | null;
          tokens_used?: number | null;
          metadata?: Json;
        };
        Update: never;
      };

      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string | null;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes: string[];
          last_used_at: string | null;
          expires_at: string | null;
          revoked: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by?: string | null;
          name: string;
          key_hash: string;
          key_prefix: string;
          scopes?: string[];
          expires_at?: string | null;
        };
        Update: {
          name?: string;
          scopes?: string[];
          last_used_at?: string | null;
          expires_at?: string | null;
          revoked?: boolean;
        };
      };

      audit_log: {
        Row: {
          id: string;
          organization_id: string | null;
          user_id: string | null;
          action: string;
          resource_type: string | null;
          resource_id: string | null;
          metadata: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id?: string | null;
          user_id?: string | null;
          action: string;
          resource_type?: string | null;
          resource_id?: string | null;
          metadata?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
        };
        Update: never;
      };

      meeting_templates: {
        Row: {
          id: string;
          organization_id: string;
          created_by: string | null;
          name: string;
          description: string | null;
          language: string;
          speaker_count: number | null;
          tags: string[];
          prompt_additions: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          created_by?: string | null;
          name: string;
          description?: string | null;
          language?: string;
          speaker_count?: number | null;
          tags?: string[];
          prompt_additions?: string | null;
          is_default?: boolean;
        };
        Update: Partial<Database["public"]["Tables"]["meeting_templates"]["Insert"]>;
      };

      saved_searches: {
        Row: {
          id: string;
          user_id: string;
          name: string;
          filters: Json;
          pinned: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          name: string;
          filters: Json;
          pinned?: boolean;
        };
        Update: {
          name?: string;
          filters?: Json;
          pinned?: boolean;
        };
      };
    };

    Functions: {
      user_org_ids: {
        Args: Record<string, never>;
        Returns: string[];
      };
    };
  };
}

// ─── Convenience type aliases ───

export type Profile = Database["public"]["Tables"]["profiles"]["Row"];
export type Organization = Database["public"]["Tables"]["organizations"]["Row"];
export type OrganizationMember = Database["public"]["Tables"]["organization_members"]["Row"];
export type TeamInvite = Database["public"]["Tables"]["team_invites"]["Row"];
export type Tag = Database["public"]["Tables"]["tags"]["Row"];
export type Meeting = Database["public"]["Tables"]["meetings"]["Row"];
export type MeetingParticipant = Database["public"]["Tables"]["meeting_participants"]["Row"];
export type TranscriptSegment = Database["public"]["Tables"]["transcript_segments"]["Row"];
export type MeetingKeyPoint = Database["public"]["Tables"]["meeting_key_points"]["Row"];
export type MeetingActionItem = Database["public"]["Tables"]["meeting_action_items"]["Row"];
export type MeetingDecision = Database["public"]["Tables"]["meeting_decisions"]["Row"];
export type TranscriptVersion = Database["public"]["Tables"]["transcript_versions"]["Row"];
export type Clip = Database["public"]["Tables"]["clips"]["Row"];
export type Notification = Database["public"]["Tables"]["notifications"]["Row"];
export type MeetingComment = Database["public"]["Tables"]["meeting_comments"]["Row"];
export type UserSettings = Database["public"]["Tables"]["user_settings"]["Row"];
export type Integration = Database["public"]["Tables"]["integrations"]["Row"];
export type UsageEvent = Database["public"]["Tables"]["usage_events"]["Row"];
export type ApiKey = Database["public"]["Tables"]["api_keys"]["Row"];
export type AuditLogEntry = Database["public"]["Tables"]["audit_log"]["Row"];
export type MeetingTemplate = Database["public"]["Tables"]["meeting_templates"]["Row"];
export type SavedSearch = Database["public"]["Tables"]["saved_searches"]["Row"];
