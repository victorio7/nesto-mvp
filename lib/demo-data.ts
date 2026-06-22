import type {
  Agency,
  AgencySubscription,
  AiActionProposal,
  AutonomySettings,
  Contact,
  DetectedProperty,
  IntegrationConnection,
  Match,
  OnboardingStep,
  Property,
  PropertySource,
  User
} from "./types";

const now = "2026-06-11T09:00:00.000Z";

export const demoAgency: Agency = {
  id: "agency-demo",
  name: "Agence Mana Immobilier",
  website_url: "https://mana-immo.example",
  created_at: now
};

export const demoUsers: User[] = [
  {
    id: "user-1",
    agency_id: demoAgency.id,
    full_name: "Maeva Laurent",
    email: "maeva@mana-immo.example",
    role: "owner",
    created_at: now
  },
  {
    id: "user-2",
    agency_id: demoAgency.id,
    full_name: "Teriitahi Moana",
    email: "terii@mana-immo.example",
    role: "agent",
    created_at: now
  }
];

export const demoContacts: Contact[] = [
  {
    id: "contact-1",
    agency_id: demoAgency.id,
    first_name: "Sarah",
    last_name: "M.",
    phone: "+689 87 12 34 56",
    email: "sarah@example.com",
    contact_type: "tenant",
    project_type: "rental_search",
    min_budget: 140000,
    max_budget: 220000,
    desired_city: "Punaauia",
    desired_district: "Taapuna",
    desired_property_type: "t3",
    desired_bedrooms: 2,
    number_of_people: 3,
    professional_status: "CDI",
    income: 520000,
    pets: "no",
    move_in_date: "2026-07-01",
    financing_approved: "unknown",
    documents_ready: "partial",
    urgency: "high",
    seriousness_score: 91,
    status: "hot",
    missing_fields: ["documents_ready"],
    notes: "Disponible rapidement pour une visite.",
    created_at: now,
    updated_at: now
  },
  {
    id: "contact-2",
    agency_id: demoAgency.id,
    first_name: "Nicolas",
    last_name: "T.",
    phone: "+689 87 65 43 21",
    email: "nicolas@example.com",
    contact_type: "buyer",
    project_type: "purchase_search",
    min_budget: 38000000,
    max_budget: 52000000,
    desired_city: "Papeete",
    desired_district: "",
    desired_property_type: "t3",
    desired_bedrooms: 2,
    number_of_people: 2,
    professional_status: "Entrepreneur",
    income: null,
    pets: "unknown",
    move_in_date: "",
    financing_approved: "yes",
    documents_ready: "yes",
    urgency: "medium",
    seriousness_score: 84,
    status: "qualified",
    missing_fields: ["desired_district"],
    notes: "Financement valide, cherche residence principale.",
    created_at: now,
    updated_at: now
  },
  {
    id: "contact-3",
    agency_id: demoAgency.id,
    first_name: "Ariihau",
    last_name: "P.",
    phone: "+689 89 22 11 00",
    email: "",
    contact_type: "tenant",
    project_type: "rental_search",
    min_budget: null,
    max_budget: 160000,
    desired_city: "Faaa",
    desired_district: "",
    desired_property_type: "t2",
    desired_bedrooms: 1,
    number_of_people: null,
    professional_status: "",
    income: null,
    pets: "unknown",
    move_in_date: "",
    financing_approved: "unknown",
    documents_ready: "unknown",
    urgency: "medium",
    seriousness_score: 52,
    status: "incomplete",
    missing_fields: ["number_of_people", "professional_status", "income", "pets", "move_in_date", "documents_ready"],
    notes: "Message WhatsApp bref, a relancer proprement.",
    created_at: now,
    updated_at: now
  },
  {
    id: "contact-4",
    agency_id: demoAgency.id,
    first_name: "Lea",
    last_name: "B.",
    phone: "+689 87 90 12 30",
    email: "lea@example.com",
    contact_type: "seller",
    project_type: "sale_project",
    min_budget: null,
    max_budget: null,
    desired_city: "Pirae",
    desired_district: "",
    desired_property_type: "house",
    desired_bedrooms: 3,
    number_of_people: null,
    professional_status: "",
    income: null,
    pets: "unknown",
    move_in_date: "",
    financing_approved: "unknown",
    documents_ready: "partial",
    urgency: "high",
    seriousness_score: 76,
    status: "followup",
    missing_fields: ["surface", "prix souhaite", "disponibilite rendez-vous"],
    notes: "Projet de vente maison familiale.",
    created_at: now,
    updated_at: now
  },
  {
    id: "contact-5",
    agency_id: demoAgency.id,
    first_name: "Mahana",
    last_name: "R.",
    phone: "+689 87 44 55 66",
    email: "mahana@example.com",
    contact_type: "tenant",
    project_type: "rental_search",
    min_budget: 100000,
    max_budget: 145000,
    desired_city: "Papeete",
    desired_district: "Mission",
    desired_property_type: "studio",
    desired_bedrooms: 0,
    number_of_people: 1,
    professional_status: "CDD",
    income: 260000,
    pets: "yes",
    move_in_date: "2026-06-25",
    financing_approved: "unknown",
    documents_ready: "yes",
    urgency: "high",
    seriousness_score: 88,
    status: "hot",
    missing_fields: [],
    notes: "Chat accepte uniquement.",
    created_at: now,
    updated_at: now
  },
  {
    id: "contact-6",
    agency_id: demoAgency.id,
    first_name: "Jonathan",
    last_name: "K.",
    phone: "+689 89 41 25 36",
    email: "jonathan@example.com",
    contact_type: "buyer",
    project_type: "purchase_search",
    min_budget: 60000000,
    max_budget: 85000000,
    desired_city: "Moorea",
    desired_district: "",
    desired_property_type: "house",
    desired_bedrooms: 3,
    number_of_people: 4,
    professional_status: "Chef d'entreprise",
    income: null,
    pets: "unknown",
    move_in_date: "",
    financing_approved: "no",
    documents_ready: "partial",
    urgency: "low",
    seriousness_score: 61,
    status: "qualified",
    missing_fields: ["financing_approved"],
    notes: "A recontacter apres rendez-vous banque.",
    created_at: now,
    updated_at: now
  },
  {
    id: "contact-7",
    agency_id: demoAgency.id,
    first_name: "Heiata",
    last_name: "V.",
    phone: "+689 87 74 12 09",
    email: "",
    contact_type: "landlord",
    project_type: "rental_project",
    min_budget: null,
    max_budget: null,
    desired_city: "Arue",
    desired_district: "",
    desired_property_type: "t2",
    desired_bedrooms: 1,
    number_of_people: null,
    professional_status: "",
    income: null,
    pets: "unknown",
    move_in_date: "",
    financing_approved: "unknown",
    documents_ready: "unknown",
    urgency: "medium",
    seriousness_score: 66,
    status: "new",
    missing_fields: ["surface", "loyer souhaite", "disponibilite rendez-vous"],
    notes: "Souhaite confier un appartement en gestion.",
    created_at: now,
    updated_at: now
  },
  {
    id: "contact-8",
    agency_id: demoAgency.id,
    first_name: "Camille",
    last_name: "D.",
    phone: "+689 87 77 08 08",
    email: "camille@example.com",
    contact_type: "tenant",
    project_type: "rental_search",
    min_budget: 180000,
    max_budget: 260000,
    desired_city: "Punaauia",
    desired_district: "",
    desired_property_type: "house",
    desired_bedrooms: 3,
    number_of_people: 4,
    professional_status: "Fonctionnaire",
    income: 650000,
    pets: "yes",
    move_in_date: "2026-08-01",
    financing_approved: "unknown",
    documents_ready: "partial",
    urgency: "medium",
    seriousness_score: 79,
    status: "qualified",
    missing_fields: ["documents_ready"],
    notes: "Famille avec chien.",
    created_at: now,
    updated_at: now
  },
  {
    id: "contact-9",
    agency_id: demoAgency.id,
    first_name: "Raimana",
    last_name: "H.",
    phone: "+689 89 10 10 10",
    email: "raimana@example.com",
    contact_type: "buyer",
    project_type: "purchase_search",
    min_budget: 25000000,
    max_budget: 39000000,
    desired_city: "Faaa",
    desired_district: "",
    desired_property_type: "t2",
    desired_bedrooms: 1,
    number_of_people: 1,
    professional_status: "CDI",
    income: 410000,
    pets: "unknown",
    move_in_date: "",
    financing_approved: "yes",
    documents_ready: "yes",
    urgency: "high",
    seriousness_score: 90,
    status: "hot",
    missing_fields: [],
    notes: "Souhaite investir rapidement.",
    created_at: now,
    updated_at: now
  },
  {
    id: "contact-10",
    agency_id: demoAgency.id,
    first_name: "Elodie",
    last_name: "S.",
    phone: "+689 87 33 22 11",
    email: "elodie@example.com",
    contact_type: "tenant",
    project_type: "rental_search",
    min_budget: 120000,
    max_budget: 175000,
    desired_city: "Papeete",
    desired_district: "",
    desired_property_type: "t2",
    desired_bedrooms: 1,
    number_of_people: 2,
    professional_status: "",
    income: null,
    pets: "no",
    move_in_date: "2026-07-15",
    financing_approved: "unknown",
    documents_ready: "no",
    urgency: "medium",
    seriousness_score: 58,
    status: "incomplete",
    missing_fields: ["professional_status", "income", "documents_ready"],
    notes: "A requalifier avant proposition.",
    created_at: now,
    updated_at: now
  }
];

export const demoProperties: Property[] = [
  {
    id: "property-1",
    agency_id: demoAgency.id,
    title: "F3 lumineux a Taapuna",
    listing_type: "rental",
    category: "t3",
    city: "Punaauia",
    district: "Taapuna",
    price: 210000,
    surface: 72,
    bedrooms: 2,
    available_from: "2026-06-20",
    pets_allowed: "no",
    status: "available",
    description: "Appartement F3 proche marina, parking et terrasse.",
    source_url: "https://mana-immo.example/locations/f3-taapuna",
    source_type: "agency_website",
    created_at: now,
    updated_at: now
  },
  {
    id: "property-2",
    agency_id: demoAgency.id,
    title: "Studio meuble quartier Mission",
    listing_type: "rental",
    category: "studio",
    city: "Papeete",
    district: "Mission",
    price: 135000,
    surface: 31,
    bedrooms: 0,
    available_from: "2026-06-18",
    pets_allowed: "yes",
    status: "available",
    description: "Studio meuble avec internet inclus, accepte petit animal.",
    source_url: "",
    source_type: "manual",
    created_at: now,
    updated_at: now
  },
  {
    id: "property-3",
    agency_id: demoAgency.id,
    title: "T2 a vendre proche centre Faaa",
    listing_type: "sale",
    category: "t2",
    city: "Faaa",
    district: "Centre",
    price: 36500000,
    surface: 48,
    bedrooms: 1,
    available_from: "",
    pets_allowed: "unknown",
    status: "available",
    description: "T2 en residence securisee, bon rendement locatif.",
    source_url: "https://mana-immo.example/ventes/t2-faaa",
    source_type: "agency_website",
    created_at: now,
    updated_at: now
  },
  {
    id: "property-4",
    agency_id: demoAgency.id,
    title: "Maison familiale Punaauia",
    listing_type: "rental",
    category: "house",
    city: "Punaauia",
    district: "",
    price: 250000,
    surface: 110,
    bedrooms: 3,
    available_from: "2026-08-01",
    pets_allowed: "yes",
    status: "available",
    description: "Maison avec jardin, ideale famille.",
    source_url: "",
    source_type: "manual",
    created_at: now,
    updated_at: now
  },
  {
    id: "property-5",
    agency_id: demoAgency.id,
    title: "Terrain constructible a Moorea",
    listing_type: "sale",
    category: "land",
    city: "Moorea",
    district: "Maharepa",
    price: 68000000,
    surface: 920,
    bedrooms: null,
    available_from: "",
    pets_allowed: "unknown",
    status: "available",
    description: "Terrain plat proche commodites.",
    source_url: "",
    source_type: "manual",
    created_at: now,
    updated_at: now
  }
];

export const demoPropertySources: PropertySource[] = [
  {
    id: "source-1",
    agency_id: demoAgency.id,
    source_type: "website",
    name: "Site agence - locations",
    source_url: "https://mana-immo.example/locations",
    status: "connected",
    check_frequency_minutes: 180,
    last_checked_at: "2026-06-11T08:40:00.000Z",
    last_success_at: "2026-06-11T08:40:00.000Z",
    last_error: null,
    created_at: now
  },
  {
    id: "source-2",
    agency_id: demoAgency.id,
    source_type: "sitemap",
    name: "Sitemap annonces",
    source_url: "https://mana-immo.example/sitemap.xml",
    status: "pending",
    check_frequency_minutes: 360,
    last_checked_at: null,
    last_success_at: null,
    last_error: null,
    created_at: now
  }
];

export const demoDetectedProperties: DetectedProperty[] = [
  {
    id: "detected-1",
    agency_id: demoAgency.id,
    source_id: "source-1",
    external_id: "f3-taapuna",
    source_url: "https://mana-immo.example/locations/f3-taapuna",
    raw_title: "F3 Punaauia Taapuna - 210 000 F",
    raw_content: "F3 de 72 m2, 2 chambres, disponible le 20 juin.",
    raw_data: { htmlTitle: "F3 Punaauia" },
    extracted_data: { city: "Punaauia", price: 210000, bedrooms: 2 },
    status: "validated",
    created_at: now,
    updated_at: now
  },
  {
    id: "detected-2",
    agency_id: demoAgency.id,
    source_id: "source-1",
    external_id: "t2-arue",
    source_url: "https://mana-immo.example/locations/t2-arue",
    raw_title: "Nouveau T2 Arue",
    raw_content: "T2 meuble, loyer 165 000 F, dossier a verifier.",
    raw_data: {},
    extracted_data: { city: "Arue", price: 165000, category: "t2" },
    status: "detected",
    created_at: now,
    updated_at: now
  }
];

export const demoMatches: Match[] = [
  {
    id: "match-1",
    agency_id: demoAgency.id,
    contact_id: "contact-1",
    property_id: "property-1",
    score: 94,
    reasons: ["Budget compatible", "Ville et quartier alignes", "2 chambres demandees"],
    blocking_points: [],
    status: "proposed",
    created_at: now,
    updated_at: now
  },
  {
    id: "match-2",
    agency_id: demoAgency.id,
    contact_id: "contact-5",
    property_id: "property-2",
    score: 91,
    reasons: ["Budget compatible", "Animal accepte", "Quartier souhaite"],
    blocking_points: [],
    status: "validated",
    created_at: now,
    updated_at: now
  },
  {
    id: "match-3",
    agency_id: demoAgency.id,
    contact_id: "contact-9",
    property_id: "property-3",
    score: 89,
    reasons: ["Financement valide", "Budget compatible", "Ville souhaitee"],
    blocking_points: [],
    status: "proposed",
    created_at: now,
    updated_at: now
  },
  {
    id: "match-4",
    agency_id: demoAgency.id,
    contact_id: "contact-8",
    property_id: "property-4",
    score: 82,
    reasons: ["Maison familiale", "Animaux acceptes", "Disponibilite compatible"],
    blocking_points: ["Budget haut de fourchette"],
    status: "proposed",
    created_at: now,
    updated_at: now
  }
];

export const demoAiActions: AiActionProposal[] = [
  {
    id: "action-1",
    agency_id: demoAgency.id,
    contact_id: "contact-1",
    property_id: "property-1",
    match_id: "match-1",
    action_type: "send_followup",
    priority: "urgent",
    title: "Relancer Sarah pour le F3 Taapuna",
    summary: "Profil tres compatible, bien disponible rapidement.",
    proposed_message:
      "Bonjour Sarah, je reviens vers vous car un F3 lumineux a Taapuna vient d'entrer. Il correspond a votre budget et dispose de 2 chambres. Souhaitez-vous que je vous propose un creneau de visite ?",
    status: "pending",
    requires_validation: true,
    created_at: now,
    validated_at: null,
    executed_at: null
  },
  {
    id: "action-2",
    agency_id: demoAgency.id,
    contact_id: "contact-3",
    property_id: null,
    match_id: null,
    action_type: "complete_profile",
    priority: "medium",
    title: "Completer la fiche Ariihau",
    summary: "Plusieurs informations locataire manquent avant matching fiable.",
    proposed_message:
      "Bonjour Ariihau, pour mieux cibler votre recherche, pouvez-vous me confirmer le nombre de personnes, votre situation professionnelle, vos revenus, la presence d'animaux et la date d'entree souhaitee ?",
    status: "pending",
    requires_validation: false,
    created_at: now,
    validated_at: null,
    executed_at: null
  },
  {
    id: "action-3",
    agency_id: demoAgency.id,
    contact_id: null,
    property_id: "property-1",
    match_id: null,
    action_type: "notify_new_match",
    priority: "high",
    title: "Nouveau bien detecte avec prospects compatibles",
    summary: "14 prospects potentiels identifies depuis le site agence.",
    proposed_message:
      "Nouveau bien detecte : F3 Punaauia, 210 000 F. 14 prospects compatibles trouves. Action proposee : envoyer une relance aux 5 meilleurs profils.",
    status: "pending",
    requires_validation: true,
    created_at: now,
    validated_at: null,
    executed_at: null
  }
];

export const demoAutonomySettings: AutonomySettings = {
  agency_id: demoAgency.id,
  auto_complete_missing_info: true,
  auto_answer_faq: true,
  auto_request_documents: false,
  require_validation_for_visits: true,
  require_validation_for_address: true,
  require_validation_for_rejection: true,
  require_validation_for_group_followups: true
};

export const demoSubscription: AgencySubscription = {
  id: "subscription-demo",
  agency_id: demoAgency.id,
  plan_name: "Nesto Assistant Immobilier",
  monthly_price: 99,
  commitment_months: 6,
  status: "simulated",
  stripe_customer_id: null,
  stripe_subscription_id: null,
  current_period_start: "2026-06-11T00:00:00.000Z",
  current_period_end: "2026-07-11T00:00:00.000Z",
  created_at: now
};

export const demoIntegrationConnections: IntegrationConnection[] = [
  {
    id: "connection-whatsapp",
    agency_id: demoAgency.id,
    integration_type: "whatsapp",
    status: "pending",
    config: {
      business_number: "+689 87 00 00 01",
      agent_alert_number: "+689 87 12 34 56",
      assisted_setup: true
    },
    last_tested_at: null,
    last_success_at: null,
    last_error: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "connection-website",
    agency_id: demoAgency.id,
    integration_type: "agency_website",
    status: "connected",
    config: {
      website_url: "https://mana-immo.example",
      rental_url: "https://mana-immo.example/locations",
      sale_url: "https://mana-immo.example/ventes",
      sitemap_url: "https://mana-immo.example/sitemap.xml"
    },
    last_tested_at: "2026-06-11T08:40:00.000Z",
    last_success_at: "2026-06-11T08:40:00.000Z",
    last_error: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "connection-email",
    agency_id: demoAgency.id,
    integration_type: "gmail",
    status: "not_connected",
    config: {
      watched_email: "contact@mana-immo.example"
    },
    last_tested_at: null,
    last_success_at: null,
    last_error: null,
    created_at: now,
    updated_at: now
  },
  {
    id: "connection-calendar",
    agency_id: demoAgency.id,
    integration_type: "google_calendar",
    status: "not_connected",
    config: {},
    last_tested_at: null,
    last_success_at: null,
    last_error: null,
    created_at: now,
    updated_at: now
  }
];

export const demoOnboardingSteps: OnboardingStep[] = [
  {
    id: "onboarding-agency",
    agency_id: demoAgency.id,
    step_key: "agency",
    status: "completed",
    data: {
      agency_name: demoAgency.name,
      agent_name: demoUsers[0].full_name,
      phone: "+689 87 12 34 56",
      email: demoUsers[0].email,
      zone: "Tahiti"
    },
    updated_at: now
  },
  {
    id: "onboarding-whatsapp",
    agency_id: demoAgency.id,
    step_key: "whatsapp",
    status: "needs_help",
    data: {
      assisted_setup: true,
      business_number: "+689 87 00 00 01",
      agent_alert_number: "+689 87 12 34 56"
    },
    updated_at: now
  },
  {
    id: "onboarding-website",
    agency_id: demoAgency.id,
    step_key: "website",
    status: "completed",
    data: {
      website_url: demoAgency.website_url,
      rental_url: "https://mana-immo.example/locations",
      sale_url: "https://mana-immo.example/ventes"
    },
    updated_at: now
  },
  {
    id: "onboarding-email",
    agency_id: demoAgency.id,
    step_key: "email",
    status: "pending",
    data: {},
    updated_at: now
  },
  {
    id: "onboarding-calendar",
    agency_id: demoAgency.id,
    step_key: "calendar",
    status: "pending",
    data: {},
    updated_at: now
  },
  {
    id: "onboarding-rules",
    agency_id: demoAgency.id,
    step_key: "rules",
    status: "completed",
    data: demoAutonomySettings,
    updated_at: now
  },
  {
    id: "onboarding-confirmation",
    agency_id: demoAgency.id,
    step_key: "confirmation",
    status: "pending",
    data: {},
    updated_at: now
  }
];

export const demoAssistantProfile = {
  name: "Mana",
  agent_alert_number: "+689 87 12 34 56",
  autonomy_mode: "equilibre",
  validation_rules: [
    "Confirmer une visite",
    "Envoyer une adresse exacte",
    "Refuser un dossier",
    "Lancer une relance groupee",
    "Creer un rendez-vous definitif"
  ]
};

export function getContact(id: string) {
  return demoContacts.find((contact) => contact.id === id);
}

export function getProperty(id: string) {
  return demoProperties.find((property) => property.id === id);
}

export function getContactName(contactId: string) {
  const contact = getContact(contactId);
  return contact ? `${contact.first_name} ${contact.last_name}` : "Contact inconnu";
}

export function getPropertyTitle(propertyId: string) {
  return getProperty(propertyId)?.title ?? "Bien inconnu";
}
