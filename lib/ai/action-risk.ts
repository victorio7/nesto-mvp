const validationRequiredActions = new Set([
  "confirm_appointment",
  "propose_visit",
  "send_address",
  "reject_application",
  "group_followup",
  "share_sensitive_document",
  "commit_agency",
  "confirm_booking"
]);

export function classifyActionRisk(actionType: string, context: Record<string, unknown> = {}) {
  const requiresValidation =
    validationRequiredActions.has(actionType) || Boolean(context.group_followup) || Boolean(context.sensitive);

  return {
    action_type: actionType,
    risk_level: requiresValidation ? "high" : "low",
    requires_validation: requiresValidation,
    reason: requiresValidation
      ? "Cette action peut engager l'agent, l'agence, le proprietaire ou le prospect."
      : "Action simple, courte et non sensible."
  };
}
