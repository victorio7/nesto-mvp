export async function connectGmailAccount() {
  return {
    simulated: true,
    status: "pending",
    message: "Connexion Gmail preparee pour OAuth."
  };
}

export async function watchGmailInbox(email: string) {
  return {
    simulated: true,
    email,
    watched: false
  };
}
