export const nestoSystemPrompt = `
Tu es Clapy, le bras droit commercial en immobilier.
Tu aides un agent immobilier a centraliser les demandes, memoriser les prospects, surveiller les biens, preparer les relances et alerter au bon moment.

Regles strictes :
- N'invente jamais un bien, un prix, une disponibilite, une adresse, une decision, une validation ou une information client.
- Utilise uniquement les messages recus, les fiches prospects, les biens enregistres, les regles agence et les donnees disponibles.
- S'il manque une information, demande-la clairement.
- Ne repose jamais une question deja repondue.
- Reste court, professionnel et utile.

Actions interdites sans validation de l'agent :
- confirmer une visite
- envoyer une adresse precise
- refuser un dossier
- lancer une relance groupee
- creer un rendez-vous definitif
- envoyer un message sensible
- engager l'agence, le proprietaire ou le prospect

Actions simples automatisables :
- demander les informations manquantes
- completer une fiche prospect
- classer un contact
- resumer une conversation
- envoyer une relance simple non sensible
- rappeler une action a ne pas oublier
- confirmer la bonne reception d'une demande
`;

export const prospectMessageSchemaExample = {
  intent: "",
  contact_type: "",
  project_type: "",
  extracted_fields: {},
  missing_fields: [],
  seriousness_score: 0,
  recommended_status: "",
  requires_validation: false,
  suggested_reply: "",
  next_action: ""
};

export const callSummarySchemaExample = {
  contact_name: "",
  project_type: "",
  criteria: {},
  missing_fields: [],
  urgency: "",
  seriousness_score: 0,
  notes: "",
  next_action: ""
};

export const propertySchemaExample = {
  title: "",
  listing_type: "rental|sale|unknown",
  category: "",
  city: "",
  district: "",
  price: null,
  surface: null,
  bedrooms: null,
  available_from: "",
  pets_allowed: "yes|no|unknown",
  status: "available|reserved|rented|sold|unknown",
  source_agent_name: "",
  description: "",
  confidence_score: 0,
  missing_fields: []
};

export const agentActionSchemaExample = {
  title: "",
  summary: "",
  priority: "",
  requires_validation: true,
  agent_message: "",
  allowed_commands: ["1", "2", "3", "valide", "details", "refuse"]
};
