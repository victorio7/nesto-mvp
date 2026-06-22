insert into agencies (id, name, website_url)
values ('00000000-0000-0000-0000-000000000001', 'Agence Mana Immobilier', 'https://mana-immo.example')
on conflict do nothing;

insert into agency_users (id, agency_id, full_name, email, role)
values
  ('00000000-0000-0000-0000-000000000101', '00000000-0000-0000-0000-000000000001', 'Maeva Laurent', 'maeva@mana-immo.example', 'owner'),
  ('00000000-0000-0000-0000-000000000102', '00000000-0000-0000-0000-000000000001', 'Teriitahi Moana', 'terii@mana-immo.example', 'agent')
on conflict do nothing;

insert into profiles (id, agency_id, full_name, email, role)
values
  ('00000000-0000-0000-0000-000000000201', '00000000-0000-0000-0000-000000000001', 'Maeva Laurent', 'maeva@mana-immo.example', 'owner'),
  ('00000000-0000-0000-0000-000000000202', '00000000-0000-0000-0000-000000000001', 'Teriitahi Moana', 'terii@mana-immo.example', 'agent')
on conflict do nothing;

insert into agency_autonomy_settings (agency_id)
values ('00000000-0000-0000-0000-000000000001')
on conflict do nothing;

insert into contacts (
  id, agency_id, owner_user_id, first_name, last_name, phone, email, source_channel, contact_type, project_type,
  min_budget, max_budget, desired_city, desired_district, desired_property_type,
  desired_bedrooms, number_of_people, professional_status, income, pets, move_in_date,
  financing_approved, documents_ready, urgency, seriousness_score, status, missing_fields, notes
) values
  ('00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Sarah', 'M.', '+689 87 12 34 56', 'sarah@example.com', 'whatsapp_prospect', 'tenant', 'rental_search', 140000, 220000, 'Punaauia', 'Taapuna', 't3', 2, 3, 'CDI', 520000, 'no', '2026-07-01', 'unknown', 'partial', 'high', 91, 'hot', '["documents_ready"]', 'Disponible rapidement pour une visite.'),
  ('00000000-0000-0000-0000-000000001002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Nicolas', 'T.', '+689 87 65 43 21', 'nicolas@example.com', 'whatsapp_prospect', 'buyer', 'purchase_search', 38000000, 52000000, 'Papeete', '', 't3', 2, 2, 'Entrepreneur', null, 'unknown', null, 'yes', 'yes', 'medium', 84, 'qualified', '["desired_district"]', 'Financement valide, cherche residence principale.'),
  ('00000000-0000-0000-0000-000000001003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Ariihau', 'P.', '+689 89 22 11 00', '', 'whatsapp_prospect', 'tenant', 'rental_search', null, 160000, 'Faaa', '', 't2', 1, null, '', null, 'unknown', null, 'unknown', 'unknown', 'medium', 52, 'incomplete', '["number_of_people","professional_status","income","pets","move_in_date","documents_ready"]', 'Message WhatsApp bref.'),
  ('00000000-0000-0000-0000-000000001004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Lea', 'B.', '+689 87 90 12 30', 'lea@example.com', 'whatsapp_prospect', 'seller', 'sale_project', null, null, 'Pirae', '', 'house', 3, null, '', null, 'unknown', null, 'unknown', 'partial', 'high', 76, 'followup', '["surface","prix souhaite","disponibilite rendez-vous"]', 'Projet de vente maison familiale.'),
  ('00000000-0000-0000-0000-000000001005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', 'Mahana', 'R.', '+689 87 44 55 66', 'mahana@example.com', 'whatsapp_prospect', 'tenant', 'rental_search', 100000, 145000, 'Papeete', 'Mission', 'studio', 0, 1, 'CDD', 260000, 'yes', '2026-06-25', 'unknown', 'yes', 'high', 88, 'hot', '[]', 'Chat accepte uniquement.')
on conflict do nothing;

insert into properties (
  id, agency_id, created_by_user_id, source_agent_name, source_agent_id, visibility_scope, title, listing_type, category, city, district, price, surface, bedrooms,
  available_from, pets_allowed, status, description, source_url, source_type
) values
  ('00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'Marc', '00000000-0000-0000-0000-000000000102', 'agency', 'F3 lumineux a Taapuna', 'rental', 't3', 'Punaauia', 'Taapuna', 210000, 72, 2, '2026-06-20', 'no', 'available', 'Appartement F3 proche marina, parking et terrasse.', 'https://mana-immo.example/locations/f3-taapuna', 'agency_website'),
  ('00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', null, null, 'agency', 'Studio meuble quartier Mission', 'rental', 'studio', 'Papeete', 'Mission', 135000, 31, 0, '2026-06-18', 'yes', 'available', 'Studio meuble avec internet inclus.', '', 'manual'),
  ('00000000-0000-0000-0000-000000002003', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'Teriitahi', '00000000-0000-0000-0000-000000000102', 'agency', 'T2 a vendre proche centre Faaa', 'sale', 't2', 'Faaa', 'Centre', 36500000, 48, 1, null, 'unknown', 'available', 'T2 en residence securisee.', 'https://mana-immo.example/ventes/t2-faaa', 'agency_website'),
  ('00000000-0000-0000-0000-000000002004', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000101', null, null, 'agency', 'Maison familiale Punaauia', 'rental', 'house', 'Punaauia', '', 250000, 110, 3, '2026-08-01', 'yes', 'available', 'Maison avec jardin.', '', 'manual'),
  ('00000000-0000-0000-0000-000000002005', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000102', 'Teriitahi', '00000000-0000-0000-0000-000000000102', 'agency', 'Terrain constructible a Moorea', 'sale', 'land', 'Moorea', 'Maharepa', 68000000, 920, null, null, 'unknown', 'available', 'Terrain plat proche commodites.', '', 'manual')
on conflict do nothing;

insert into property_sources (id, agency_id, source_type, name, source_url, status, check_frequency_minutes, last_checked_at, last_success_at)
values
  ('00000000-0000-0000-0000-000000003001', '00000000-0000-0000-0000-000000000001', 'website', 'Site agence - locations', 'https://mana-immo.example/locations', 'connected', 180, now(), now()),
  ('00000000-0000-0000-0000-000000003002', '00000000-0000-0000-0000-000000000001', 'sitemap', 'Sitemap annonces', 'https://mana-immo.example/sitemap.xml', 'pending', 360, null, null)
on conflict do nothing;

insert into matches (id, agency_id, contact_id, property_id, contact_owner_user_id, property_source_agent_name, score, reasons, blocking_points, collaboration_opportunity, match_context, status)
values
  ('00000000-0000-0000-0000-000000004001', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000000101', 'Marc', 94, '["Budget compatible","Ville et quartier alignes","2 chambres demandees","Bien ajoute par un autre agent de l agence"]', '[]', true, 'colleague_property', 'proposed'),
  ('00000000-0000-0000-0000-000000004002', '00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000001005', '00000000-0000-0000-0000-000000002002', '00000000-0000-0000-0000-000000000101', null, 91, '["Budget compatible","Animal accepte","Quartier souhaite"]', '[]', false, 'own_property', 'validated')
on conflict do nothing;

insert into ai_action_proposals (
  agency_id, contact_id, property_id, match_id, action_type, priority, title, summary, proposed_message, requires_validation
) values
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000001001', '00000000-0000-0000-0000-000000002001', '00000000-0000-0000-0000-000000004001', 'send_followup', 'urgent', 'Relancer Sarah pour le F3 Taapuna', 'Profil tres compatible, bien disponible rapidement.', 'Bonjour Sarah, un F3 lumineux a Taapuna correspond a votre recherche. Souhaitez-vous plus d informations ?', true),
  ('00000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000001003', null, null, 'complete_profile', 'medium', 'Completer la fiche Ariihau', 'Informations locataire manquantes.', 'Bonjour Ariihau, pouvez-vous confirmer le nombre de personnes, votre situation, vos revenus, animaux et date d entree souhaitee ?', false);

insert into agency_subscriptions (
  id, agency_id, plan_name, monthly_price, commitment_months, status, stripe_price_id, current_period_start, current_period_end
) values (
  '00000000-0000-0000-0000-000000005001',
  '00000000-0000-0000-0000-000000000001',
  'Nesto Assistant Immobilier',
  99,
  6,
  'simulated',
  null,
  now(),
  now() + interval '1 month'
)
on conflict do nothing;

insert into integration_connections (
  id, agency_id, integration_type, status, config, last_tested_at, last_success_at
) values
  ('00000000-0000-0000-0000-000000006001', '00000000-0000-0000-0000-000000000001', 'whatsapp_prospect', 'pending', '{"business_number":"+689 87 00 00 01","purpose":"prospects","assisted_setup":true}', null, null),
  ('00000000-0000-0000-0000-000000006005', '00000000-0000-0000-0000-000000000001', 'whatsapp_agent', 'pending', '{"agent_alert_number":"+689 87 12 34 56","purpose":"agent_alerts","assisted_setup":true}', null, null),
  ('00000000-0000-0000-0000-000000006002', '00000000-0000-0000-0000-000000000001', 'agency_website', 'connected', '{"website_url":"https://mana-immo.example","rental_url":"https://mana-immo.example/locations","sale_url":"https://mana-immo.example/ventes","sitemap_url":"https://mana-immo.example/sitemap.xml"}', now(), now()),
  ('00000000-0000-0000-0000-000000006003', '00000000-0000-0000-0000-000000000001', 'gmail', 'not_connected', '{"watched_email":"contact@mana-immo.example"}', null, null),
  ('00000000-0000-0000-0000-000000006004', '00000000-0000-0000-0000-000000000001', 'google_calendar', 'not_connected', '{}', null, null)
on conflict do nothing;

insert into onboarding_steps (agency_id, step_key, status, data)
values
  ('00000000-0000-0000-0000-000000000001', 'agency', 'completed', '{"agency_name":"Agence Mana Immobilier","agent_name":"Maeva Laurent","phone":"+689 87 12 34 56","email":"maeva@mana-immo.example","zone":"Tahiti"}'),
  ('00000000-0000-0000-0000-000000000001', 'whatsapp', 'needs_help', '{"assisted_setup":true,"business_number":"+689 87 00 00 01","agent_alert_number":"+689 87 12 34 56"}'),
  ('00000000-0000-0000-0000-000000000001', 'website', 'completed', '{"website_url":"https://mana-immo.example","rental_url":"https://mana-immo.example/locations","sale_url":"https://mana-immo.example/ventes"}'),
  ('00000000-0000-0000-0000-000000000001', 'email', 'pending', '{}'),
  ('00000000-0000-0000-0000-000000000001', 'calendar', 'pending', '{}'),
  ('00000000-0000-0000-0000-000000000001', 'rules', 'completed', '{"auto_complete_missing_info":true,"auto_answer_faq":true,"auto_request_documents":false,"require_validation_for_visits":true,"require_validation_for_address":true,"require_validation_for_rejection":true,"require_validation_for_group_followups":true}'),
  ('00000000-0000-0000-0000-000000000001', 'confirmation', 'pending', '{}')
on conflict do nothing;
