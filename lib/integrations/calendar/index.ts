export async function connectGoogleCalendar() {
  return {
    simulated: true,
    status: "pending",
    message: "Connexion Google Calendar preparee pour OAuth."
  };
}

export async function createTentativeCalendarEvent() {
  return {
    simulated: true,
    requires_validation: true
  };
}
