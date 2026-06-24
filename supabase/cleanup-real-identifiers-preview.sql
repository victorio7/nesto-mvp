-- Nesto MVP - PREVIEW nettoyage identifiants reels
-- Objectif : voir exactement ce qui serait touche avant tout nettoyage.
-- Important : ce fichier ne contient que des SELECT. Il ne supprime rien et ne modifie rien.
--
-- Identifiants cibles :
-- - lacrosevincent7@gmail.com
-- - danceabon9@gmail.com
-- - +689 87 710 196
--
-- Protection explicite :
-- - marie@nextimmo.pf ne sera PAS supprimee.
-- - Si ce compte porte le numero +689 87 710 196, le script final propose de vider uniquement son champ phone
--   pour liberer le numero, sans supprimer le compte Marie.

-- 1) Resume des lignes qui seraient supprimees ou touchees.
with
target_emails(email) as (
  values
    ('lacrosevincent7@gmail.com'),
    ('danceabon9@gmail.com')
),
target_phone(digits) as (
  values ('68987710196')
),
protected_emails(email) as (
  values ('marie@nextimmo.pf')
),
target_agency_users as (
  select au.*
  from public.agency_users au
  where (
    lower(au.email) in (select email from target_emails)
    or regexp_replace(coalesce(au.phone, ''), '\D', '', 'g') in (select digits from target_phone)
  )
  and lower(au.email) not in (select email from protected_emails)
),
target_profiles as (
  select p.*
  from public.profiles p
  where (
    lower(p.email) in (select email from target_emails)
    or regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') in (select digits from target_phone)
  )
  and lower(p.email) not in (select email from protected_emails)
),
candidate_agencies as (
  select agency_id as id from target_agency_users
  union
  select agency_id as id from target_profiles
),
deletable_agencies as (
  select ca.id
  from candidate_agencies ca
  where not exists (
    select 1
    from public.agency_users au
    where au.agency_id = ca.id
      and au.id not in (select id from target_agency_users)
  )
  and not exists (
    select 1
    from public.profiles p
    where p.agency_id = ca.id
      and p.id not in (select id from target_profiles)
  )
),
phone_holders_to_keep_but_clear as (
  select 'agency_users' as source_table, au.id, au.agency_id, au.full_name, au.email, au.phone
  from public.agency_users au
  where regexp_replace(coalesce(au.phone, ''), '\D', '', 'g') in (select digits from target_phone)
    and lower(au.email) not in (select email from target_emails)
  union all
  select 'profiles' as source_table, p.id, p.agency_id, p.full_name, p.email, p.phone
  from public.profiles p
  where regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') in (select digits from target_phone)
    and lower(p.email) not in (select email from target_emails)
),
target_contacts as (
  select c.*
  from public.contacts c
  where c.agency_id in (select id from deletable_agencies)
     or c.owner_user_id in (select id from target_agency_users)
     or lower(coalesce(c.email, '')) in (select email from target_emails)
     or regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') in (select digits from target_phone)
),
target_properties as (
  select p.*
  from public.properties p
  where p.agency_id in (select id from deletable_agencies)
     or p.created_by_user_id in (select id from target_agency_users)
     or p.source_agent_id in (select id from target_agency_users)
),
target_conversations as (
  select c.*
  from public.conversations c
  where c.agency_id in (select id from deletable_agencies)
     or c.user_id in (select id from target_agency_users)
     or c.contact_id in (select id from target_contacts)
),
target_messages as (
  select m.*
  from public.messages m
  where m.agency_id in (select id from deletable_agencies)
     or m.conversation_id in (select id from target_conversations)
     or m.contact_id in (select id from target_contacts)
),
target_matches as (
  select m.*
  from public.matches m
  where m.agency_id in (select id from deletable_agencies)
     or m.contact_id in (select id from target_contacts)
     or m.property_id in (select id from target_properties)
     or m.contact_owner_user_id in (select id from target_agency_users)
),
target_ai_action_proposals as (
  select a.*
  from public.ai_action_proposals a
  where a.agency_id in (select id from deletable_agencies)
     or a.user_id in (select id from target_agency_users)
     or a.contact_id in (select id from target_contacts)
     or a.property_id in (select id from target_properties)
     or a.match_id in (select id from target_matches)
),
target_followups as (
  select f.*
  from public.followups f
  where f.agency_id in (select id from deletable_agencies)
     or f.contact_id in (select id from target_contacts)
     or f.property_id in (select id from target_properties)
     or f.match_id in (select id from target_matches)
),
target_property_sources as (
  select ps.*
  from public.property_sources ps
  where ps.agency_id in (select id from deletable_agencies)
),
target_detected_properties as (
  select dp.*
  from public.detected_properties dp
  where dp.agency_id in (select id from deletable_agencies)
     or dp.source_id in (select id from target_property_sources)
),
target_property_source_checks as (
  select psc.*
  from public.property_source_checks psc
  where psc.agency_id in (select id from deletable_agencies)
     or psc.source_id in (select id from target_property_sources)
),
target_property_changes as (
  select pc.*
  from public.property_changes pc
  where pc.agency_id in (select id from deletable_agencies)
     or pc.property_id in (select id from target_properties)
),
target_agent_notification_channels as (
  select anc.*
  from public.agent_notification_channels anc
  where anc.agency_id in (select id from deletable_agencies)
     or anc.user_id in (select id from target_agency_users)
     or lower(coalesce(anc.email, '')) in (select email from target_emails)
     or regexp_replace(coalesce(anc.phone_number, ''), '\D', '', 'g') in (select digits from target_phone)
),
target_agent_commands as (
  select ac.*
  from public.agent_commands ac
  where ac.agency_id in (select id from deletable_agencies)
     or ac.user_id in (select id from target_agency_users)
     or ac.related_action_id in (select id from target_ai_action_proposals)
),
target_onboarding_steps as (
  select os.*
  from public.onboarding_steps os
  where os.agency_id in (select id from deletable_agencies)
),
target_integration_connections as (
  select ic.*
  from public.integration_connections ic
  where ic.agency_id in (select id from deletable_agencies)
),
target_agency_subscriptions as (
  select s.*
  from public.agency_subscriptions s
  where s.agency_id in (select id from deletable_agencies)
),
target_agency_autonomy_settings as (
  select aas.*
  from public.agency_autonomy_settings aas
  where aas.agency_id in (select id from deletable_agencies)
),
target_auth_users as (
  select u.*
  from auth.users u
  where lower(u.email) in (select email from target_emails)
)
select 'agency_users_to_delete' as scope, count(*) as rows from target_agency_users
union all select 'profiles_to_delete', count(*) from target_profiles
union all select 'phone_holders_to_keep_but_clear', count(*) from phone_holders_to_keep_but_clear
union all select 'deletable_agencies', count(*) from deletable_agencies
union all select 'contacts_to_delete', count(*) from target_contacts
union all select 'properties_to_delete', count(*) from target_properties
union all select 'conversations_to_delete', count(*) from target_conversations
union all select 'messages_to_delete', count(*) from target_messages
union all select 'property_sources_to_delete', count(*) from target_property_sources
union all select 'detected_properties_to_delete', count(*) from target_detected_properties
union all select 'property_source_checks_to_delete', count(*) from target_property_source_checks
union all select 'property_changes_to_delete', count(*) from target_property_changes
union all select 'matches_to_delete', count(*) from target_matches
union all select 'ai_action_proposals_to_delete', count(*) from target_ai_action_proposals
union all select 'followups_to_delete', count(*) from target_followups
union all select 'agent_notification_channels_to_delete', count(*) from target_agent_notification_channels
union all select 'agent_commands_to_delete', count(*) from target_agent_commands
union all select 'onboarding_steps_to_delete', count(*) from target_onboarding_steps
union all select 'integration_connections_to_delete', count(*) from target_integration_connections
union all select 'agency_subscriptions_to_delete', count(*) from target_agency_subscriptions
union all select 'agency_autonomy_settings_to_delete', count(*) from target_agency_autonomy_settings
union all select 'auth_users_to_delete', count(*) from target_auth_users
order by scope;

-- 2) Detail lisible des comptes principaux touches.
with
target_emails(email) as (
  values ('lacrosevincent7@gmail.com'), ('danceabon9@gmail.com')
),
target_phone(digits) as (
  values ('68987710196')
),
protected_emails(email) as (
  values ('marie@nextimmo.pf')
),
target_agency_users as (
  select au.*
  from public.agency_users au
  where (
    lower(au.email) in (select email from target_emails)
    or regexp_replace(coalesce(au.phone, ''), '\D', '', 'g') in (select digits from target_phone)
  )
  and lower(au.email) not in (select email from protected_emails)
),
target_profiles as (
  select p.*
  from public.profiles p
  where (
    lower(p.email) in (select email from target_emails)
    or regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') in (select digits from target_phone)
  )
  and lower(p.email) not in (select email from protected_emails)
),
phone_holders_to_keep_but_clear as (
  select 'agency_users' as source_table, au.id, au.agency_id, au.full_name, au.email, au.phone
  from public.agency_users au
  where regexp_replace(coalesce(au.phone, ''), '\D', '', 'g') in (select digits from target_phone)
    and lower(au.email) not in (select email from target_emails)
  union all
  select 'profiles' as source_table, p.id, p.agency_id, p.full_name, p.email, p.phone
  from public.profiles p
  where regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') in (select digits from target_phone)
    and lower(p.email) not in (select email from target_emails)
)
select 'agency_user_deleted' as action, lower(t.email) as email_sort, to_jsonb(t) as row_data
from target_agency_users t
union all
select 'profile_deleted' as action, lower(t.email) as email_sort, to_jsonb(t) as row_data
from target_profiles t
union all
select 'phone_cleared_but_row_kept' as action, lower(t.email) as email_sort, to_jsonb(t) as row_data
from phone_holders_to_keep_but_clear t
order by action, email_sort;

-- 3) Detail agences : celles qui seraient supprimees uniquement si elles ne contiennent plus
-- aucun autre agent/profil non cible apres nettoyage.
with
target_emails(email) as (
  values ('lacrosevincent7@gmail.com'), ('danceabon9@gmail.com')
),
target_phone(digits) as (
  values ('68987710196')
),
protected_emails(email) as (
  values ('marie@nextimmo.pf')
),
target_agency_users as (
  select au.*
  from public.agency_users au
  where (
    lower(au.email) in (select email from target_emails)
    or regexp_replace(coalesce(au.phone, ''), '\D', '', 'g') in (select digits from target_phone)
  )
  and lower(au.email) not in (select email from protected_emails)
),
target_profiles as (
  select p.*
  from public.profiles p
  where (
    lower(p.email) in (select email from target_emails)
    or regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') in (select digits from target_phone)
  )
  and lower(p.email) not in (select email from protected_emails)
),
candidate_agencies as (
  select agency_id as id from target_agency_users
  union
  select agency_id as id from target_profiles
),
deletable_agencies as (
  select ca.id
  from candidate_agencies ca
  where not exists (
    select 1 from public.agency_users au
    where au.agency_id = ca.id and au.id not in (select id from target_agency_users)
  )
  and not exists (
    select 1 from public.profiles p
    where p.agency_id = ca.id and p.id not in (select id from target_profiles)
  )
)
select
  case when da.id is null then 'agency_kept_shared' else 'agency_deleted' end as action,
  a.id,
  a.name,
  a.website_url,
  a.created_at
from public.agencies a
join candidate_agencies ca on ca.id = a.id
left join deletable_agencies da on da.id = a.id
order by action, a.created_at;
