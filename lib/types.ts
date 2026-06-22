export type ContactType = "tenant" | "buyer" | "seller" | "landlord" | "unknown";
export type ProjectType = "rental_search" | "purchase_search" | "sale_project" | "rental_project" | "unknown";
export type TriState = "yes" | "no" | "unknown";
export type DocumentsState = "yes" | "no" | "partial" | "unknown";
export type Urgency = "low" | "medium" | "high";
export type ContactStatus = "new" | "incomplete" | "qualified" | "hot" | "followup" | "appointment" | "lost" | "archived";
export type ListingType = "rental" | "sale" | "unknown";
export type PropertyCategory = "studio" | "t2" | "t3" | "house" | "land" | "commercial" | "other";
export type PropertyStatus = "available" | "reserved" | "rented" | "sold" | "archived" | "unknown";
export type SourceType = "manual" | "agency_website" | "facebook" | "crm" | "email" | "website" | "sitemap" | "rss" | "xml_feed" | "api";
export type IntegrationType = "whatsapp" | "agency_website" | "gmail" | "outlook" | "google_calendar" | "facebook_page";
export type IntegrationStatus = "not_connected" | "pending" | "connected" | "error";
export type OnboardingStepStatus = "pending" | "completed" | "skipped" | "needs_help";
export type SubscriptionStatus = "trialing" | "active" | "past_due" | "canceled" | "incomplete" | "simulated";
export type MatchStatus = "proposed" | "validated" | "refused" | "followup_sent" | "archived";
export type AiActionStatus = "pending" | "validated" | "modified" | "refused" | "executed" | "expired";
export type ConversationChannelType =
  | "whatsapp_prospect"
  | "whatsapp_agent"
  | "email"
  | "messenger"
  | "instagram"
  | "facebook";
export type MessageDirection = "inbound" | "outbound";
export type MessageSenderType = "prospect" | "agent" | "nesto";
export type MatchContext = "own_property" | "agency_property" | "colleague_property";
export type VisibilityScope = "agency" | "personal" | "private";
export type AiActionType =
  | "complete_profile"
  | "propose_visit"
  | "send_followup"
  | "notify_new_match"
  | "request_documents"
  | "relaunch_old_prospect"
  | "confirm_appointment"
  | "notify_property_change"
  | "collaboration_opportunity";

export type Agency = {
  id: string;
  name: string;
  website_url: string;
  created_at: string;
};

export type User = {
  id: string;
  agency_id: string;
  full_name: string;
  email: string;
  phone?: string;
  role: "owner" | "admin" | "agent" | "assistant";
  created_at: string;
};

export type Contact = {
  id: string;
  agency_id: string;
  owner_user_id?: string | null;
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  source_channel?: ConversationChannelType | string;
  contact_type: ContactType;
  project_type: ProjectType;
  min_budget: number | null;
  max_budget: number | null;
  desired_city: string;
  desired_district: string;
  desired_property_type: PropertyCategory | "";
  desired_bedrooms: number | null;
  number_of_people: number | null;
  professional_status: string;
  income: number | null;
  pets: TriState;
  move_in_date: string;
  financing_approved: TriState;
  documents_ready: DocumentsState;
  urgency: Urgency;
  seriousness_score: number;
  status: ContactStatus;
  missing_fields: string[];
  notes: string;
  created_at: string;
  updated_at: string;
};

export type Property = {
  id: string;
  agency_id: string;
  created_by_user_id?: string | null;
  source_agent_name?: string | null;
  source_agent_id?: string | null;
  visibility_scope?: VisibilityScope;
  title: string;
  listing_type: ListingType;
  category: PropertyCategory;
  city: string;
  district: string;
  price: number;
  surface: number | null;
  bedrooms: number | null;
  available_from: string;
  pets_allowed: TriState;
  status: PropertyStatus;
  description: string;
  source_url: string;
  source_type: SourceType;
  created_at: string;
  updated_at: string;
};

export type PropertySource = {
  id: string;
  agency_id: string;
  source_type: SourceType;
  name: string;
  source_url: string;
  status: "connected" | "pending" | "failed" | "paused";
  check_frequency_minutes: number;
  last_checked_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
};

export type DetectedProperty = {
  id: string;
  agency_id: string;
  source_id: string;
  external_id: string;
  source_url: string;
  raw_title: string;
  raw_content: string;
  raw_data: Record<string, unknown>;
  extracted_data: Record<string, unknown>;
  status: "detected" | "draft" | "validated" | "ignored" | "archived";
  created_at: string;
  updated_at: string;
};

export type Match = {
  id: string;
  agency_id: string;
  contact_id: string;
  property_id: string;
  contact_owner_user_id?: string | null;
  property_source_agent_name?: string | null;
  score: number;
  reasons: string[];
  blocking_points: string[];
  collaboration_opportunity?: boolean;
  match_context?: MatchContext;
  status: MatchStatus;
  created_at: string;
  updated_at: string;
};

export type AiActionProposal = {
  id: string;
  agency_id: string;
  contact_id: string | null;
  property_id: string | null;
  match_id: string | null;
  user_id?: string | null;
  action_type: AiActionType;
  priority: "low" | "medium" | "high" | "urgent";
  title: string;
  summary: string;
  proposed_message: string;
  status: AiActionStatus;
  requires_validation: boolean;
  created_at: string;
  validated_at: string | null;
  executed_at: string | null;
};

export type AgentNotificationChannel = {
  id: string;
  agency_id: string;
  user_id: string;
  channel_type: "whatsapp" | "email";
  phone_number: string | null;
  email: string | null;
  is_primary: boolean;
  status: "connected" | "pending" | "failed";
  created_at: string;
};

export type Conversation = {
  id: string;
  agency_id: string;
  contact_id: string | null;
  user_id: string | null;
  channel_type: ConversationChannelType;
  external_thread_id: string;
  created_at: string;
  updated_at: string;
};

export type Message = {
  id: string;
  agency_id: string;
  conversation_id: string;
  contact_id: string | null;
  direction: MessageDirection;
  sender_type: MessageSenderType;
  raw_content: string;
  structured_data: Record<string, unknown>;
  created_at: string;
};

export type AutonomySettings = {
  agency_id: string;
  auto_complete_missing_info: boolean;
  auto_answer_faq: boolean;
  auto_request_documents: boolean;
  require_validation_for_visits: boolean;
  require_validation_for_address: boolean;
  require_validation_for_rejection: boolean;
  require_validation_for_group_followups: boolean;
};

export type AgencySubscription = {
  id: string;
  agency_id: string;
  plan_name: string;
  monthly_price: number;
  commitment_months: number;
  status: SubscriptionStatus;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  current_period_start: string | null;
  current_period_end: string | null;
  created_at: string;
};

export type OnboardingStep = {
  id: string;
  agency_id: string;
  step_key: string;
  status: OnboardingStepStatus;
  data: Record<string, unknown>;
  updated_at: string;
};

export type IntegrationConnection = {
  id: string;
  agency_id: string;
  integration_type: IntegrationType | "whatsapp_prospect" | "whatsapp_agent" | "messenger" | "instagram";
  status: IntegrationStatus;
  config: Record<string, unknown>;
  last_tested_at: string | null;
  last_success_at: string | null;
  last_error: string | null;
  created_at: string;
  updated_at: string;
};
