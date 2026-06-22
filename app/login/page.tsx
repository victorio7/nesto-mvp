import { Panel } from "@/components/Panel";
import { LoginForm } from "./LoginForm";

export default async function LoginPage({
  searchParams
}: {
  searchParams: Promise<{ next?: string }>;
}) {
  await searchParams;
  const nextPath = "/client-home";

  return (
    <main className="grid min-h-screen place-items-center bg-paper px-4 py-10">
      <Panel className="w-full max-w-md" title="Connexion">
        <LoginForm nextPath={nextPath} />
      </Panel>
    </main>
  );
}
