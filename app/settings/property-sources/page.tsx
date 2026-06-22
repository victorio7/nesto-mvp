import { Globe2, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/Button";
import { DataTable } from "@/components/DataTable";
import { PageHeader } from "@/components/PageHeader";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/StatusBadge";
import { getPropertySourcesData } from "@/lib/property-sources-data";

export const dynamic = "force-dynamic";

export default async function PropertySourcesPage() {
  const { error, sources } = await getPropertySourcesData();

  return (
    <AppShell>
      <PageHeader
        title="Sources de biens"
        description="Le site agence est la source prioritaire. L'assistant surveille les nouveaux biens pour trouver les prospects compatibles."
        actions={<Button><Plus size={16} /> Ajouter une source</Button>}
      />

      <div className="grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
        <Panel title="Nouvelle source">
          <form className="space-y-4">
            {[
              ["Nom", "Site agence - locations"],
              ["URL site agence", "https://agence.fr"],
              ["URL page locations", "https://agence.fr/locations"],
              ["URL page ventes", "https://agence.fr/ventes"],
              ["URL sitemap", "https://agence.fr/sitemap.xml"],
              ["URL flux XML ou API", ""]
            ].map(([label, placeholder]) => (
              <label className="block text-sm font-bold" key={label}>
                {label}
                <input className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring" placeholder={placeholder} />
              </label>
            ))}
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block text-sm font-bold">
                Type
                <select className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring">
                  <option>website</option>
                  <option>sitemap</option>
                  <option>rss</option>
                  <option>xml_feed</option>
                  <option>api</option>
                  <option>manual</option>
                </select>
              </label>
              <label className="block text-sm font-bold">
                Frequence
                <select className="mt-2 w-full rounded-md border border-line px-3 py-2 focus-ring">
                  <option>180 minutes</option>
                  <option>360 minutes</option>
                  <option>1440 minutes</option>
                </select>
              </label>
            </div>
            <Button type="button"><Globe2 size={16} /> Tester et enregistrer</Button>
          </form>
        </Panel>

        <Panel title="Sources configurees">
          {error ? (
            <p className="mb-4 rounded-md border border-[#fde68a] bg-[#fffbeb] p-3 text-sm font-semibold text-[#92400e]">
              Sources momentanement indisponibles. Nesto gardera les informations deja connues.
            </p>
          ) : null}
          {sources.length ? (
            <DataTable
              columns={["Nom", "Type", "Statut", "Frequence", "Dernier succes"]}
              rows={sources.map((source) => [
                source.name,
                source.source_type,
                <StatusBadge label={source.status} tone={source.status} />,
                `${source.check_frequency_minutes} min`,
                source.last_success_at ? new Date(source.last_success_at).toLocaleString("fr-FR") : "-"
              ])}
            />
          ) : (
            <div className="rounded-md border border-line bg-[#fbfaf5] p-4 text-sm font-semibold leading-6 text-gray-600">
              Aucune source configuree pour le moment. Ajoutez le site de l'agence depuis l'installation pour que Nesto commence la surveillance.
            </div>
          )}
          <div className="mt-5 rounded-md border border-wood/30 bg-[#fffaf0] p-4">
            <p className="font-black">Resultat du test</p>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Source valide : annonces detectees sur la page locations. L'assistant pourra surveiller cette source en priorite.
            </p>
          </div>
        </Panel>
      </div>
    </AppShell>
  );
}
