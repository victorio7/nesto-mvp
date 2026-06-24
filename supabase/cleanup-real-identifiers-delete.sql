-- Nesto MVP - DELETE FINAL nettoyage identifiants reels
-- IMPORTANT : a lancer uniquement apres avoir verifie cleanup-real-identifiers-preview.sql.
--
-- Objectif :
-- - Supprimer les anciennes donnees liees a :
--   * lacrosevincent7@gmail.com
--   * danceabon9@gmail.com
--   * +689 87 710 196
-- - Permettre un nouveau signup propre avec ces identifiants.
--
-- Protection :
-- - Le compte marie@nextimmo.pf n'est PAS supprime.
-- - Si marie@nextimmo.pf porte le numero cible, son champ phone est vide pour liberer le numero.
--   Sans cette neutralisation, le signup restera bloque par la verification du numero WhatsApp.
--
-- Ce script ne modifie pas le schema, ne supprime aucune table et ne touche pas aux migrations.

begin;

create temporary table nesto_target_emails(email text primary key) on commit drop;
create temporary table nesto_target_phone(digits text primary key) on commit drop;
create temporary table nesto_protected_emails(email text primary key) on commit drop;

insert into nesto_target_emails(email) values
  ('lacrosevincent7@gmail.com'),
  ('danceabon9@gmail.com');

insert into nesto_target_phone(digits) values
  ('68987710196');

insert into nesto_protected_emails(email) values
  ('marie@nextimmo.pf');

create temporary table nesto_target_agency_users on commit drop as
select au.*
from public.agency_users au
where (
  lower(au.email) in (select email from nesto_target_emails)
  or regexp_replace(coalesce(au.phone, ''), '\D', '', 'g') in (select digits from nesto_target_phone)
)
and lower(au.email) not in (select email from nesto_protected_emails);

create temporary table nesto_target_profiles on commit drop as
select p.*
from public.profiles p
where (
  lower(p.email) in (select email from nesto_target_emails)
  or regexp_replace(coalesce(p.phone, ''), '\D', '', 'g') in (select digits from nesto_target_phone)
)
and lower(p.email) not in (select email from nesto_protected_emails);

create temporary table nesto_candidate_agencies on commit drop as
select agency_id as id from nesto_target_agency_users
union
select agency_id as id from nesto_target_profiles;

create temporary table nesto_deletable_agencies on commit drop as
select ca.id
from nesto_candidate_agencies ca
where not exists (
  select 1
  from public.agency_users au
  where au.agency_id = ca.id
    and au.id not in (select id from nesto_target_agency_users)
)
and not exists (
  select 1
  from public.profiles p
  where p.agency_id = ca.id
    and p.id not in (select id from nesto_target_profiles)
);

create temporary table nesto_target_contacts on commit drop as
select c.*
from public.contacts c
where c.agency_id in (select id from nesto_deletable_agencies)
   or c.owner_user_id in (select id from nesto_target_agency_users)
   or lower(coalesce(c.email, '')) in (select email from nesto_target_emails)
   or regexp_replace(coalesce(c.phone, ''), '\D', '', 'g') in (select digits from nesto_target_phone);

create temporary table nesto_target_properties on commit drop as
select p.*
from public.properties p
where p.agency_id in (select id from nesto_deletable_agencies)
   or p.created_by_user_id in (select id from nesto_target_agency_users)
   or p.source_agent_id in (select id from nesto_target_agency_users);

create temporary table nesto_target_conversations on commit drop as
select c.*
from public.conversations c
where c.agency_id in (select id from nesto_deletable_agencies)
   or c.user_id in (select id from nesto_target_agency_users)
   or c.contact_id in (select id from nesto_target_contacts);

create temporary table nesto_target_matches on commit drop as
select m.*
from public.matches m
where m.agency_id in (select id from nesto_deletable_agencies)
   or m.contact_id in (select id from nesto_target_contacts)
   or m.property_id in (select id from nesto_target_properties)
   or m.contact_owner_user_id in (select id from nesto_target_agency_users);

create temporary table nesto_target_ai_action_proposals on commit drop as
select a.*
from public.ai_action_proposals a
where a.agency_id in (select id from nesto_deletable_agencies)
   or a.user_id in (select id from nesto_target_agency_users)
   or a.contact_id in (select id from nesto_target_contacts)
   or a.property_id in (select id from nesto_target_properties)
   or a.match_id in (select id from nesto_target_matches);

create temporary table nesto_target_property_sources on commit drop as
select ps.*
from public.property_sources ps
where ps.agency_id in (select id from nesto_deletable_agencies);

-- 1) Liberer le numero WhatsApp cible sans supprimer les comptes proteges ou non cibles.
update public.agency_users
set phone = null
where regexp_replace(coalesce(phone, ''), '\D', '', 'g') in (select digits from nesto_target_phone)
  and lower(email) not in (select email from nesto_target_emails);

update public.profiles
set phone = null
where regexp_replace(coalesce(phone, ''), '\D', '', 'g') in (select digits from nesto_target_phone)
  and lower(email) not in (select email from nesto_target_emails);

-- 2) Supprimer les donnees dependantes utilisateur/contact/bien dans le bon ordre.
delete from public.messages
where agency_id in (select id from nesto_deletable_agencies)
   or conversation_id in (select id from nesto_target_conversations)
   or contact_id in (select id from nesto_target_contacts);

delete from public.agent_commands
where agency_id in (select id from nesto_deletable_agencies)
   or user_id in (select id from nesto_target_agency_users)
   or related_action_id in (select id from nesto_target_ai_action_proposals);

delete from public.followups
where agency_id in (select id from nesto_deletable_agencies)
   or contact_id in (select id from nesto_target_contacts)
   or property_id in (select id from nesto_target_properties)
   or match_id in (select id from nesto_target_matches);

delete from public.ai_action_proposals
where id in (select id from nesto_target_ai_action_proposals);

delete from public.matches
where id in (select id from nesto_target_matches);

delete from public.property_changes
where agency_id in (select id from nesto_deletable_agencies)
   or property_id in (select id from nesto_target_properties);

delete from public.property_source_checks
where agency_id in (select id from nesto_deletable_agencies)
   or source_id in (select id from nesto_target_property_sources);

delete from public.detected_properties
where agency_id in (select id from nesto_deletable_agencies)
   or source_id in (select id from nesto_target_property_sources);

delete from public.property_sources
where id in (select id from nesto_target_property_sources);

delete from public.conversations
where id in (select id from nesto_target_conversations);

delete from public.properties
where id in (select id from nesto_target_properties);

delete from public.contacts
where id in (select id from nesto_target_contacts);

delete from public.agent_notification_channels
where agency_id in (select id from nesto_deletable_agencies)
   or user_id in (select id from nesto_target_agency_users)
   or lower(coalesce(email, '')) in (select email from nesto_target_emails)
   or regexp_replace(coalesce(phone_number, ''), '\D', '', 'g') in (select digits from nesto_target_phone);

-- 3) Supprimer uniquement la configuration agence des agences devenues vides.
-- Les agences partagees, comme NEXTIMMO si marie@nextimmo.pf reste presente, sont conservees.
delete from public.integration_connections
where agency_id in (select id from nesto_deletable_agencies);

delete from public.onboarding_steps
where agency_id in (select id from nesto_deletable_agencies);

delete from public.agency_subscriptions
where agency_id in (select id from nesto_deletable_agencies);

delete from public.agency_autonomy_settings
where agency_id in (select id from nesto_deletable_agencies);

-- 4) Supprimer les identites publiques ciblees.
delete from public.profiles
where id in (select id from nesto_target_profiles);

delete from public.agency_users
where id in (select id from nesto_target_agency_users);

delete from public.agencies
where id in (select id from nesto_deletable_agencies);

-- 5) Supprimer uniquement les utilisateurs Supabase Auth des emails cibles.
delete from auth.users
where lower(email) in (select email from nesto_target_emails);

-- 6) Verification finale dans la transaction.
-- Ces deux resultats doivent etre a 0 pour permettre un nouveau signup.
select 'remaining_public_target_emails' as check_name, count(*) as remaining
from (
  select email, phone from public.agency_users
  union all
  select email, phone from public.profiles
) rows
where lower(email) in (select email from nesto_target_emails);

select 'remaining_public_target_phone' as check_name, count(*) as remaining
from (
  select email, phone from public.agency_users
  union all
  select email, phone from public.profiles
) rows
where regexp_replace(coalesce(phone, ''), '\D', '', 'g') in (select digits from nesto_target_phone);

select 'remaining_auth_target_emails' as check_name, count(*) as remaining
from auth.users
where lower(email) in (select email from nesto_target_emails);

commit;
