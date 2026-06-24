-- Nesto MVP - nettoyage données de test
-- IMPORTANT :
-- 1. Ce script est préparé pour Supabase SQL Editor.
-- 2. Ne pas exécuter sans validation explicite.
-- 3. Il ne modifie pas le schéma, ne supprime aucune table, ne supprime aucune migration.
-- 4. Il cible uniquement les agences/comptes de test inventoriés le 2026-06-23.
-- 5. Les SELECT de prévisualisation au début permettent de vérifier le périmètre avant suppression.

begin;

create temporary table nesto_reset_target_agencies(id uuid primary key) on commit drop;
create temporary table nesto_reset_target_emails(email text primary key) on commit drop;

insert into nesto_reset_target_agencies(id) values
  ('7b362fc5-460e-440d-a504-c1e48221f687'),
  ('02f308f3-83b8-4bf9-a73c-73b7002697f2'),
  ('00000000-0000-0000-0000-000000000001'),
  ('1b7102a0-3508-4b3a-a593-ba77d4ddb113'),
  ('9789e1ff-1c93-4411-8ece-231ca7db5392'),
  ('817543a5-be6b-4443-9094-673d7f1027e0'),
  ('2066b6c1-e49e-493e-91d2-36da349a7e5f'),
  ('5b2e1a1c-1cb2-405d-a868-49c78d778546'),
  ('f8f62766-14b1-49c3-be87-686657941c65'),
  ('9783651b-8007-486f-a753-bd3701c05281'),
  ('454cdde7-5831-4143-b424-4b0332ea9e74'),
  ('97bbbfb7-add5-4ade-8f59-e1d006bd3bc3'),
  ('a42be18a-e053-4126-b4b5-f6ce8d451938'),
  ('c1925375-ccbe-4613-8c72-f182a75e7c5f'),
  ('f6a842ee-baaf-46f9-902f-0ccedf73bb2d'),
  ('1bed45c0-6378-425d-b3bb-79f6a4d9ce73'),
  ('eacd0841-6608-467e-8bda-bc6ef55006d6'),
  ('3ff2780e-8e8d-4610-aa88-bb460d1ab348'),
  ('8e4971c5-828a-4be4-830a-4ff3665626b2'),
  ('2bb7f866-df73-40f8-8c9c-b61b10da8785'),
  ('25ee46d8-980b-49a0-8b9c-fea404a73864'),
  ('eb0e23c0-ffad-4ae3-a6d0-5c78ea6e9491'),
  ('196f9d71-866f-4548-9521-60b9e85611ca'),
  ('4b53edcc-f18f-46a3-9b55-74bdbd7ba886'),
  ('0cc38ca3-2fc0-4d62-b45d-bc39dfe2f126'),
  ('57b24821-10ca-44ca-be57-253aa8e9c4aa');

insert into nesto_reset_target_emails(email) values
  ('danceabon9@gmail.com'),
  ('marie@nextimmo.pf'),
  ('alice.agent.20260613@nesto.test'),
  ('bruno.agent.20260613@nesto.test'),
  ('agent.test.1781425506858@nesto.test'),
  ('agent.install.final.20260614@nesto.test'),
  ('parcours-client-20260614-1005@nesto.test'),
  ('claire-tunnel-20260614@nesto.test'),
  ('nina-urgence-20260614@nesto.test'),
  ('paul-audit-mvp-20260614@nesto.test'),
  ('skip-install-20260614@nesto.test'),
  ('login-incomplete-20260614@nesto.test'),
  ('login-waiting-20260614@nesto.test'),
  ('audit-1781644320143@nesto.test'),
  ('mission-1781718239629@nesto.test'),
  ('thomas.agent@nesto-test.fr'),
  ('test-final-1781895548045@nesto.test'),
  ('email-transactionnel-1782226775@nesto.test'),
  ('signup-fix-1782234853081@nesto.test'),
  ('signup-final-1782235421@nesto.test'),
  ('signup-cookie-1782235459@nesto.test');

-- Prévisualisation du périmètre.
select 'agencies' as table_name, count(*) as rows_to_delete
from public.agencies
where id in (select id from nesto_reset_target_agencies)
union all
select 'agency_users', count(*)
from public.agency_users
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'profiles', count(*)
from public.profiles
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'contacts', count(*)
from public.contacts
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'properties', count(*)
from public.properties
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'conversations', count(*)
from public.conversations
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'messages', count(*)
from public.messages
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'property_sources', count(*)
from public.property_sources
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'detected_properties', count(*)
from public.detected_properties
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'property_source_checks', count(*)
from public.property_source_checks
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'property_changes', count(*)
from public.property_changes
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'matches', count(*)
from public.matches
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'ai_action_proposals', count(*)
from public.ai_action_proposals
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'followups', count(*)
from public.followups
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'agent_notification_channels', count(*)
from public.agent_notification_channels
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'agent_commands', count(*)
from public.agent_commands
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'agency_autonomy_settings', count(*)
from public.agency_autonomy_settings
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'agency_subscriptions', count(*)
from public.agency_subscriptions
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'onboarding_steps', count(*)
from public.onboarding_steps
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'integration_connections', count(*)
from public.integration_connections
where agency_id in (select id from nesto_reset_target_agencies)
union all
select 'auth.users', count(*)
from auth.users
where lower(email) in (select lower(email) from nesto_reset_target_emails);

select id, name, website_url, created_at
from public.agencies
where id in (select id from nesto_reset_target_agencies)
order by created_at;

select id, agency_id, full_name, email, phone, role, created_at
from public.agency_users
where agency_id in (select id from nesto_reset_target_agencies)
order by created_at;

select id, agency_id, full_name, email, phone, role, created_at
from public.profiles
where agency_id in (select id from nesto_reset_target_agencies)
order by created_at;

select id, email, phone, created_at, last_sign_in_at
from auth.users
where lower(email) in (select lower(email) from nesto_reset_target_emails)
order by created_at;

-- SUPPRESSION PROPOSÉE.
-- Ne pas exécuter sans validation.
-- L'ordre supprime d'abord les dépendances, puis les agents/profils, puis les agences, puis auth.users.

delete from public.messages where agency_id in (select id from nesto_reset_target_agencies);
delete from public.agent_commands where agency_id in (select id from nesto_reset_target_agencies);
delete from public.followups where agency_id in (select id from nesto_reset_target_agencies);
delete from public.ai_action_proposals where agency_id in (select id from nesto_reset_target_agencies);
delete from public.matches where agency_id in (select id from nesto_reset_target_agencies);
delete from public.property_changes where agency_id in (select id from nesto_reset_target_agencies);
delete from public.property_source_checks where agency_id in (select id from nesto_reset_target_agencies);
delete from public.detected_properties where agency_id in (select id from nesto_reset_target_agencies);
delete from public.property_sources where agency_id in (select id from nesto_reset_target_agencies);
delete from public.conversations where agency_id in (select id from nesto_reset_target_agencies);
delete from public.properties where agency_id in (select id from nesto_reset_target_agencies);
delete from public.contacts where agency_id in (select id from nesto_reset_target_agencies);
delete from public.agent_notification_channels where agency_id in (select id from nesto_reset_target_agencies);
delete from public.integration_connections where agency_id in (select id from nesto_reset_target_agencies);
delete from public.onboarding_steps where agency_id in (select id from nesto_reset_target_agencies);
delete from public.agency_subscriptions where agency_id in (select id from nesto_reset_target_agencies);
delete from public.agency_autonomy_settings where agency_id in (select id from nesto_reset_target_agencies);
delete from public.profiles where agency_id in (select id from nesto_reset_target_agencies);
delete from public.agency_users where agency_id in (select id from nesto_reset_target_agencies);
delete from public.agencies where id in (select id from nesto_reset_target_agencies);
delete from auth.users where lower(email) in (select lower(email) from nesto_reset_target_emails);

-- Vérification post-suppression dans la transaction.
select 'remaining_public_agents_for_danceabon' as check_name, count(*) as remaining
from (
  select email, phone from public.agency_users
  union all
  select email, phone from public.profiles
) rows
where lower(email) = 'danceabon9@gmail.com'
   or regexp_replace(coalesce(phone, ''), '\D', '', 'g') = '68987710196';

select 'remaining_auth_users_for_danceabon' as check_name, count(*) as remaining
from auth.users
where lower(email) = 'danceabon9@gmail.com';

-- Sécurité : laisser rollback par défaut tant que tu n'as pas validé.
-- Remplacer rollback par commit uniquement après validation explicite.
rollback;
