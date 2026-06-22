create extension if not exists "pgcrypto";

create table if not exists agencies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  website_url text,
  created_at timestamptz not null default now()
);

create table if not exists agency_users (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  auth_user_id uuid,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'agent' check (role in ('owner', 'admin', 'agent', 'assistant')),
  created_at timestamptz not null default now()
);

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  auth_user_id uuid unique,
  full_name text not null,
  email text not null,
  phone text,
  role text not null default 'agent' check (role in ('owner', 'admin', 'agent', 'assistant')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists contacts (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  owner_user_id uuid references agency_users(id) on delete set null,
  first_name text,
  last_name text,
  phone text,
  email text,
  source_channel text,
  contact_type text not null default 'unknown' check (contact_type in ('tenant', 'buyer', 'seller', 'landlord', 'unknown')),
  project_type text not null default 'unknown' check (project_type in ('rental_search', 'purchase_search', 'sale_project', 'rental_project', 'unknown')),
  min_budget numeric,
  max_budget numeric,
  desired_city text,
  desired_district text,
  desired_property_type text,
  desired_bedrooms int,
  number_of_people int,
  professional_status text,
  income numeric,
  pets text not null default 'unknown' check (pets in ('yes', 'no', 'unknown')),
  move_in_date date,
  financing_approved text not null default 'unknown' check (financing_approved in ('yes', 'no', 'unknown')),
  documents_ready text not null default 'unknown' check (documents_ready in ('yes', 'no', 'partial', 'unknown')),
  urgency text not null default 'medium' check (urgency in ('low', 'medium', 'high')),
  seriousness_score int not null default 0 check (seriousness_score between 0 and 100),
  status text not null default 'new' check (status in ('new', 'incomplete', 'qualified', 'hot', 'followup', 'appointment', 'lost', 'archived')),
  missing_fields jsonb not null default '[]'::jsonb,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists properties (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  created_by_user_id uuid references agency_users(id) on delete set null,
  source_agent_name text,
  source_agent_id uuid references agency_users(id) on delete set null,
  visibility_scope text not null default 'agency' check (visibility_scope in ('agency', 'personal', 'private')),
  title text not null,
  listing_type text not null check (listing_type in ('rental', 'sale', 'unknown')),
  category text not null check (category in ('studio', 't2', 't3', 'house', 'land', 'commercial', 'other')),
  city text,
  district text,
  price numeric,
  surface numeric,
  bedrooms int,
  available_from date,
  pets_allowed text not null default 'unknown' check (pets_allowed in ('yes', 'no', 'unknown')),
  status text not null default 'unknown' check (status in ('available', 'reserved', 'rented', 'sold', 'archived', 'unknown')),
  description text,
  source_url text,
  source_type text not null default 'manual' check (source_type in ('manual', 'agency_website', 'facebook', 'crm', 'email', 'xml_feed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  user_id uuid references agency_users(id) on delete set null,
  channel_type text not null check (channel_type in ('whatsapp_prospect', 'whatsapp_agent', 'email', 'messenger', 'instagram', 'facebook')),
  external_thread_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  conversation_id uuid not null references conversations(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  direction text not null check (direction in ('inbound', 'outbound')),
  sender_type text not null check (sender_type in ('prospect', 'agent', 'nesto')),
  raw_content text not null,
  structured_data jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create table if not exists property_sources (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  source_type text not null check (source_type in ('website', 'sitemap', 'rss', 'xml_feed', 'api', 'manual')),
  name text not null,
  source_url text not null,
  status text not null default 'pending',
  check_frequency_minutes int not null default 360,
  last_checked_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now()
);

create table if not exists detected_properties (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  source_id uuid references property_sources(id) on delete set null,
  external_id text,
  source_url text,
  raw_title text,
  raw_content text,
  raw_data jsonb not null default '{}'::jsonb,
  extracted_data jsonb not null default '{}'::jsonb,
  status text not null default 'detected' check (status in ('detected', 'draft', 'validated', 'ignored', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists property_source_checks (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  source_id uuid references property_sources(id) on delete cascade,
  status text not null check (status in ('success', 'failed')),
  checked_at timestamptz not null default now(),
  detected_count int not null default 0,
  error_message text
);

create table if not exists property_changes (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  change_type text not null check (change_type in ('new_property', 'price_change', 'status_change', 'availability_change', 'content_change', 'removed_from_site')),
  old_value jsonb,
  new_value jsonb,
  created_at timestamptz not null default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  contact_id uuid not null references contacts(id) on delete cascade,
  property_id uuid not null references properties(id) on delete cascade,
  contact_owner_user_id uuid references agency_users(id) on delete set null,
  property_source_agent_name text,
  score int not null check (score between 0 and 100),
  reasons jsonb not null default '[]'::jsonb,
  blocking_points jsonb not null default '[]'::jsonb,
  collaboration_opportunity boolean not null default false,
  match_context text not null default 'agency_property' check (match_context in ('own_property', 'agency_property', 'colleague_property')),
  status text not null default 'proposed' check (status in ('proposed', 'validated', 'refused', 'followup_sent', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(contact_id, property_id)
);

create table if not exists ai_action_proposals (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  contact_id uuid references contacts(id) on delete set null,
  property_id uuid references properties(id) on delete set null,
  match_id uuid references matches(id) on delete set null,
  user_id uuid references agency_users(id) on delete set null,
  action_type text not null check (action_type in ('complete_profile', 'propose_visit', 'send_followup', 'notify_new_match', 'request_documents', 'relaunch_old_prospect', 'confirm_appointment', 'notify_property_change', 'collaboration_opportunity')),
  priority text not null default 'medium' check (priority in ('low', 'medium', 'high', 'urgent')),
  title text not null,
  summary text,
  proposed_message text,
  status text not null default 'pending' check (status in ('pending', 'validated', 'modified', 'refused', 'executed', 'expired')),
  requires_validation boolean not null default true,
  created_at timestamptz not null default now(),
  validated_at timestamptz,
  executed_at timestamptz
);

create table if not exists followups (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  contact_id uuid references contacts(id) on delete cascade,
  property_id uuid references properties(id) on delete cascade,
  match_id uuid references matches(id) on delete set null,
  message text not null,
  status text not null default 'draft' check (status in ('draft', 'proposed', 'validated', 'sent', 'refused', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists agent_notification_channels (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  user_id uuid references agency_users(id) on delete cascade,
  channel_type text not null check (channel_type in ('whatsapp', 'email')),
  phone_number text,
  email text,
  is_primary boolean not null default false,
  status text not null default 'pending',
  created_at timestamptz not null default now()
);

create table if not exists agent_commands (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  user_id uuid references agency_users(id) on delete set null,
  source_channel text not null check (source_channel in ('whatsapp', 'email', 'dashboard')),
  raw_command text not null,
  interpreted_command jsonb not null default '{}'::jsonb,
  related_action_id uuid references ai_action_proposals(id) on delete set null,
  status text not null default 'received' check (status in ('received', 'understood', 'executed', 'failed')),
  created_at timestamptz not null default now()
);

create table if not exists agency_autonomy_settings (
  agency_id uuid primary key references agencies(id) on delete cascade,
  auto_complete_missing_info boolean not null default true,
  auto_answer_faq boolean not null default true,
  auto_request_documents boolean not null default false,
  require_validation_for_visits boolean not null default true,
  require_validation_for_address boolean not null default true,
  require_validation_for_rejection boolean not null default true,
  require_validation_for_group_followups boolean not null default true
);

create table if not exists agency_subscriptions (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null unique references agencies(id) on delete cascade,
  plan_name text not null,
  monthly_price numeric not null,
  commitment_months int not null default 6,
  status text not null default 'incomplete' check (status in ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'simulated')),
  stripe_customer_id text,
  stripe_subscription_id text,
  stripe_price_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists onboarding_steps (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  step_key text not null,
  status text not null default 'pending' check (status in ('pending', 'completed', 'skipped', 'needs_help')),
  data jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now(),
  unique(agency_id, step_key)
);

create table if not exists integration_connections (
  id uuid primary key default gen_random_uuid(),
  agency_id uuid not null references agencies(id) on delete cascade,
  integration_type text not null check (integration_type in ('whatsapp', 'whatsapp_prospect', 'whatsapp_agent', 'agency_website', 'gmail', 'outlook', 'google_calendar', 'facebook_page', 'messenger', 'instagram')),
  status text not null default 'not_connected' check (status in ('not_connected', 'pending', 'connected', 'error')),
  config jsonb not null default '{}'::jsonb,
  last_tested_at timestamptz,
  last_success_at timestamptz,
  last_error text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(agency_id, integration_type)
);

alter table agency_users add column if not exists phone text;
alter table profiles add column if not exists phone text;
alter table contacts add column if not exists owner_user_id uuid references agency_users(id) on delete set null;
alter table contacts add column if not exists source_channel text;
alter table properties add column if not exists created_by_user_id uuid references agency_users(id) on delete set null;
alter table properties add column if not exists source_agent_name text;
alter table properties add column if not exists source_agent_id uuid references agency_users(id) on delete set null;
alter table properties add column if not exists visibility_scope text not null default 'agency';
alter table matches add column if not exists contact_owner_user_id uuid references agency_users(id) on delete set null;
alter table matches add column if not exists property_source_agent_name text;
alter table matches add column if not exists collaboration_opportunity boolean not null default false;
alter table matches add column if not exists match_context text not null default 'agency_property';
alter table ai_action_proposals add column if not exists user_id uuid references agency_users(id) on delete set null;

create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

drop trigger if exists contacts_set_updated_at on contacts;
create trigger contacts_set_updated_at before update on contacts for each row execute function set_updated_at();
drop trigger if exists profiles_set_updated_at on profiles;
create trigger profiles_set_updated_at before update on profiles for each row execute function set_updated_at();
drop trigger if exists properties_set_updated_at on properties;
create trigger properties_set_updated_at before update on properties for each row execute function set_updated_at();
drop trigger if exists conversations_set_updated_at on conversations;
create trigger conversations_set_updated_at before update on conversations for each row execute function set_updated_at();
drop trigger if exists matches_set_updated_at on matches;
create trigger matches_set_updated_at before update on matches for each row execute function set_updated_at();
drop trigger if exists followups_set_updated_at on followups;
create trigger followups_set_updated_at before update on followups for each row execute function set_updated_at();
drop trigger if exists agency_subscriptions_set_updated_at on agency_subscriptions;
create trigger agency_subscriptions_set_updated_at before update on agency_subscriptions for each row execute function set_updated_at();
drop trigger if exists onboarding_steps_set_updated_at on onboarding_steps;
create trigger onboarding_steps_set_updated_at before update on onboarding_steps for each row execute function set_updated_at();
drop trigger if exists integration_connections_set_updated_at on integration_connections;
create trigger integration_connections_set_updated_at before update on integration_connections for each row execute function set_updated_at();

alter table agencies enable row level security;
alter table agency_users enable row level security;
alter table profiles enable row level security;
alter table contacts enable row level security;
alter table properties enable row level security;
alter table conversations enable row level security;
alter table messages enable row level security;
alter table property_sources enable row level security;
alter table detected_properties enable row level security;
alter table property_source_checks enable row level security;
alter table property_changes enable row level security;
alter table matches enable row level security;
alter table followups enable row level security;
alter table ai_action_proposals enable row level security;
alter table agent_notification_channels enable row level security;
alter table agent_commands enable row level security;
alter table agency_autonomy_settings enable row level security;
alter table agency_subscriptions enable row level security;
alter table onboarding_steps enable row level security;
alter table integration_connections enable row level security;

create or replace function current_user_agency_ids()
returns setof uuid
language sql
stable
security definer
as $$
  select agency_id from profiles where auth_user_id = auth.uid()
  union
  select agency_id from agency_users where auth_user_id = auth.uid()
$$;

create policy "agency users can read their agencies" on agencies
for select using (id in (select current_user_agency_ids()));

create policy "agency users can read agency members" on agency_users
for select using (agency_id in (select current_user_agency_ids()));

create policy "agency users can read profiles" on profiles
for select using (agency_id in (select current_user_agency_ids()));
create policy "agency owners can write profiles" on profiles
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped read contacts" on contacts
for select using (agency_id in (select current_user_agency_ids()));
create policy "agency scoped write contacts" on contacts
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped read properties" on properties
for select using (agency_id in (select current_user_agency_ids()));
create policy "agency scoped write properties" on properties
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped conversations" on conversations
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped messages" on messages
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped property sources" on property_sources
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped detected properties" on detected_properties
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped property source checks" on property_source_checks
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped property changes" on property_changes
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped matches" on matches
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped followups" on followups
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped ai action proposals" on ai_action_proposals
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped agent channels" on agent_notification_channels
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped agent commands" on agent_commands
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped autonomy settings" on agency_autonomy_settings
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped subscriptions" on agency_subscriptions
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped onboarding steps" on onboarding_steps
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create policy "agency scoped integration connections" on integration_connections
for all using (agency_id in (select current_user_agency_ids()))
with check (agency_id in (select current_user_agency_ids()));

create index if not exists contacts_agency_status_idx on contacts(agency_id, status);
create index if not exists contacts_owner_status_idx on contacts(agency_id, owner_user_id, status);
create index if not exists profiles_agency_auth_user_idx on profiles(agency_id, auth_user_id);
create index if not exists properties_agency_status_idx on properties(agency_id, status);
create index if not exists properties_agency_source_agent_idx on properties(agency_id, source_agent_id, status);
create index if not exists matches_agency_score_idx on matches(agency_id, score desc);
create index if not exists matches_collaboration_idx on matches(agency_id, contact_owner_user_id, collaboration_opportunity, score desc);
create index if not exists conversations_agency_channel_idx on conversations(agency_id, channel_type, updated_at desc);
create index if not exists messages_agency_conversation_idx on messages(agency_id, conversation_id, created_at);
create index if not exists followups_agency_status_idx on followups(agency_id, status);
create index if not exists ai_action_proposals_agency_status_idx on ai_action_proposals(agency_id, status, priority);
create index if not exists agency_subscriptions_agency_status_idx on agency_subscriptions(agency_id, status);
create index if not exists onboarding_steps_agency_status_idx on onboarding_steps(agency_id, status);
create index if not exists integration_connections_agency_status_idx on integration_connections(agency_id, status);
