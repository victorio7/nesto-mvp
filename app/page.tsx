import Image from "next/image";
import Link from "next/link";
import type { ReactNode } from "react";
import {
  ArrowRight,
  BellRing,
  Brain,
  Check,
  CheckCircle2,
  Clock3,
  Handshake,
  HeartHandshake,
  MessageCircle,
  PhoneCall,
  Search,
  ShieldCheck,
  Sparkles
} from "lucide-react";
import { NESTO_WHATSAPP_CONTACT_URL } from "@/lib/nesto-contact";

const steps = [
  {
    title: "Connectez vos outils",
    text: "WhatsApp, votre site agence et vos outils essentiels."
  },
  {
    title: "Clapy organise",
    text: "Chaque demande devient une fiche claire et complète."
  },
  {
    title: "Clapy retrouve",
    text: "Il rapproche vos prospects des bons biens."
  },
  {
    title: "Vous validez",
    text: "Les décisions importantes arrivent sur WhatsApp. Un mot suffit."
  }
];

const whatsappCommands = [
  "Qui dois-je relancer aujourd'hui ?",
  "Trouve les prospects compatibles avec ce bien.",
  "Nouveau contact : cherche F3 Punaauia, budget 220 000 F.",
  "Valide.",
  "Détails.",
  "Relance demain."
];

const handledByClapy = [
  "Demande les informations manquantes",
  "Complète et classe les fiches prospects",
  "Résume les conversations",
  "Détecte les nouveaux biens",
  "Retrouve les contacts compatibles",
  "Prépare et envoie les relances simples"
];

const needsValidation = [
  "Confirmer une visite",
  "Envoyer une adresse précise",
  "Refuser un dossier",
  "Lancer une relance groupée",
  "Créer un rendez-vous définitif",
  "Envoyer un message sensible"
];

const included = [
  "Installation accompagnée",
  "Connexion WhatsApp",
  "Connexion site agence et messageries",
  "Mémoire commerciale organisée",
  "Matching prospects et biens",
  "Relances simples automatisées",
  "Validation depuis WhatsApp",
  "Accompagnement par l'équipe Clapy"
];

export default async function LandingPage({
  searchParams
}: {
  searchParams: Promise<{ payment?: string }>;
}) {
  const params = await searchParams;

  return (
    <main className="overflow-hidden bg-[#f8f5ee] text-ink">
      {params.payment === "cancelled" ? (
        <div className="border-b border-[#e7dcc8] bg-[#fffaf0] px-4 py-3 text-center text-sm font-semibold text-wood">
          Paiement annulé. Vous pouvez reprendre votre inscription quand vous le souhaitez.
        </div>
      ) : null}

      <header className="absolute inset-x-0 top-0 z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-5 sm:px-6 lg:px-8">
          <Link className="focus-ring flex items-center gap-3 rounded-lg" href="/">
            <span className="grid size-10 place-items-center rounded-lg bg-pine text-lg font-black text-white shadow-lg shadow-pine/15">
              N
            </span>
            <span>
              <span className="block text-lg font-black leading-none">Clapy</span>
              <span className="mt-1 hidden text-xs font-bold text-gray-500 sm:block">Bras droit commercial immobilier</span>
            </span>
          </Link>
          <div className="flex items-center gap-2">
            <a
              className="focus-ring hidden min-h-10 items-center gap-2 rounded-lg bg-white/80 px-4 text-sm font-bold text-ink shadow-sm ring-1 ring-black/5 backdrop-blur transition hover:-translate-y-0.5 hover:bg-white hover:shadow-md sm:inline-flex"
              href={NESTO_WHATSAPP_CONTACT_URL}
              rel="noreferrer"
              target="_blank"
            >
              <MessageCircle size={16} /> Nous parler
            </a>
            <Link
              className="focus-ring inline-flex min-h-10 items-center gap-2 rounded-lg bg-pine px-4 text-sm font-bold text-white shadow-lg shadow-pine/15 transition hover:-translate-y-0.5 hover:bg-[#123f32] hover:shadow-xl"
              href="/signup"
            >
              Démarrer <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      </header>

      <section className="relative overflow-hidden border-b border-[#e7dcc8] bg-[#f8f5ee] pt-24 lg:min-h-[760px] lg:pt-28">
        <div className="absolute inset-y-0 right-0 w-full overflow-hidden lg:w-[58%]">
          <Image
            alt="Un assistant immobilier disponible depuis WhatsApp"
            className="scale-[1.02] object-cover object-[94%_center] blur-[3px]"
            fill
            priority
            sizes="(min-width: 1024px) 58vw, 100vw"
            src="/immopilot-hero.png"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#f8f5ee] via-[#f8f5ee]/85 to-[#f8f5ee]/5 lg:from-[#f8f5ee] lg:via-[#f8f5ee]/25 lg:to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-t from-[#f8f5ee] via-transparent to-[#f8f5ee]/30 lg:from-[#f8f5ee]/25" />
        </div>

        <div className="relative mx-auto grid max-w-7xl items-center px-4 pb-10 sm:px-6 lg:min-h-[630px] lg:grid-cols-[1.02fr_0.98fr] lg:px-8 lg:pb-16">
          <div className="reveal-up max-w-2xl py-7 lg:py-10">
            <div className="inline-flex items-center gap-2 rounded-full border border-pine/15 bg-white/80 px-3 py-2 text-xs font-black text-pine shadow-sm backdrop-blur">
              <Sparkles size={15} />
              Le second cerveau de l'agent immobilier
            </div>
            <h1 className="mt-6 text-4xl font-black leading-[1.04] text-ink sm:text-5xl lg:text-6xl">
              Votre bras droit commercial en immobilier.
            </h1>
            <p className="mt-6 max-w-xl text-lg font-semibold leading-8 text-gray-700">
              Clapy mémorise vos prospects, prépare le suivi et vous alerte au bon moment. Vous, vous gérez la relation.
            </p>
            <p className="mt-5 max-w-xl border-l-2 border-pine pl-4 text-base font-black leading-7 text-ink">
              Pas de logiciel compliqué. Vous pilotez tout depuis WhatsApp.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                className="focus-ring inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg bg-pine px-6 py-3 text-sm font-black text-white shadow-xl shadow-pine/20 transition duration-200 hover:-translate-y-1 hover:bg-[#123f32] hover:shadow-2xl"
                href="/signup"
              >
                Commencer gratuitement <ArrowRight size={18} />
              </Link>
              <a
                className="focus-ring inline-flex min-h-[52px] items-center justify-center gap-2 rounded-lg bg-white/90 px-6 py-3 text-sm font-black text-ink shadow-lg ring-1 ring-black/5 backdrop-blur transition duration-200 hover:-translate-y-1 hover:bg-white hover:shadow-xl"
                href={NESTO_WHATSAPP_CONTACT_URL}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="text-pine" size={18} /> Nous parler sur WhatsApp
              </a>
            </div>
            <div className="mt-8 flex flex-wrap gap-x-6 gap-y-3 text-sm font-bold text-gray-700">
              <TrustItem>Essai 1 mois gratuit</TrustItem>
              <TrustItem>Pas de carte bancaire</TrustItem>
              <TrustItem>Installation fournie</TrustItem>
            </div>
          </div>

          <div className="relative hidden min-h-[530px] lg:block">
            <div className="absolute bottom-8 right-0 w-[390px] rounded-lg border border-white/60 bg-white/95 p-4 shadow-[0_30px_80px_rgba(17,24,39,0.20)] backdrop-blur">
              <div className="flex items-center justify-between border-b border-line pb-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 place-items-center rounded-full bg-[#25d366] text-white">
                    <MessageCircle size={19} />
                  </span>
                  <div>
                    <p className="font-black">Clapy</p>
                    <p className="text-xs font-bold text-gray-500">Assistant actif sur WhatsApp</p>
                  </div>
                </div>
                <span className="size-2.5 rounded-full bg-[#25d366] shadow-[0_0_0_5px_rgba(37,211,102,0.12)]" />
              </div>
              <div className="space-y-3 py-4">
                <ChatBubble speaker="Vous" text="Qui dois-je relancer aujourd'hui ?" />
                <ChatBubble
                  speaker="Clapy"
                  text="Sarah correspond à 94 % avec le nouveau F3 Punaauia. La relance est prête."
                  variant="nesto"
                />
                <div className="flex gap-2 pl-7">
                  {["Valide", "Détails", "Demain"].map((action) => (
                    <span className="rounded-full bg-[#edf7f1] px-3 py-1.5 text-xs font-black text-pine" key={action}>
                      {action}
                    </span>
                  ))}
                </div>
              </div>
              <div className="rounded-lg bg-[#f8f5ee] px-4 py-3 text-sm font-bold leading-6 text-gray-700">
                Vous gérez la relation. Clapy assure le suivi.
              </div>
            </div>
          </div>
        </div>

        <div className="relative mx-auto -mb-px max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="hidden overflow-hidden rounded-t-lg border border-[#e7dcc8] bg-white/90 shadow-[0_-8px_35px_rgba(17,24,39,0.04)] backdrop-blur sm:grid sm:grid-cols-3">
            <HeroProof icon={<Brain size={19} />} title="Mémoire commerciale">
              Vos prospects et leurs besoins restent organisés.
            </HeroProof>
            <HeroProof icon={<BellRing size={19} />} title="Alertes utiles">
              Les bonnes opportunités remontent au bon moment.
            </HeroProof>
            <HeroProof icon={<MessageCircle size={19} />} title="WhatsApp au centre">
              Un mot suffit pour valider ou demander des détails.
            </HeroProof>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="landing-reveal mx-auto grid max-w-7xl gap-10 px-4 py-24 sm:px-6 lg:grid-cols-[0.88fr_1.12fr] lg:px-8">
          <div>
            <SectionIntro
              eyebrow="Ne laissez plus filer l'essentiel"
              title="Chaque demande mérite d'être suivie au bon moment."
            >
              Un prospect oublié, une relance tardive, un bien mal rapproché : les opportunités se perdent souvent dans les détails.
            </SectionIntro>
            <p className="mt-7 rounded-lg border border-wood/20 bg-[#fffaf0] p-5 text-lg font-black leading-8 text-wood shadow-sm">
              Chaque demande peut valoir de l'or lorsqu'elle est traitée au bon moment.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <EditorialCard icon={<MessageCircle size={21} />} number="01" title="Les demandes se dispersent">
              WhatsApp, téléphone, email et réseaux sociaux avancent rarement au même rythme.
            </EditorialCard>
            <EditorialCard icon={<Clock3 size={21} />} number="02" title="Le bon moment passe">
              Les prospects chauds se refroidissent quand le suivi dépend uniquement de la mémoire.
            </EditorialCard>
            <EditorialCard icon={<Search size={21} />} number="03" title="Les rapprochements se perdent">
              Un nouveau bien peut correspondre à un ancien contact sans que personne ne fasse le lien.
            </EditorialCard>
            <EditorialCard icon={<Handshake size={21} />} number="04" title="Le terrain reste prioritaire">
              Votre temps doit aller aux appels, aux visites, à la négociation et à la signature.
            </EditorialCard>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7dcc8] bg-[#f8f5ee]">
        <div className="landing-reveal mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.78fr_1.22fr]">
            <SectionIntro eyebrow="Simplement" title="Clapy prépare le suivi. Vous gardez la relation.">
              Il mémorise, classe, retrouve et vous alerte. Vous, vous agissez.
            </SectionIntro>
            <div className="grid gap-4 sm:grid-cols-3">
              <PremiumPoint icon={<Brain size={21} />} title="Clapy mémorise">
                Vos prospects, leurs critères et la prochaine action à faire.
              </PremiumPoint>
              <PremiumPoint icon={<BellRing size={21} />} title="Clapy vous alerte">
                Au bon moment, avant qu'une opportunité se refroidisse.
              </PremiumPoint>
              <PremiumPoint icon={<PhoneCall size={21} />} title="Vous agissez">
                Vous gérez la relation, les visites, les appels et la signature.
              </PremiumPoint>
            </div>
          </div>
          <div className="mt-12 rounded-lg bg-pine px-6 py-7 text-white shadow-xl shadow-pine/10 sm:px-8">
            <p className="text-center text-xl font-black leading-8 sm:text-2xl">
              Vous gérez la relation. Clapy mémorise, relance et vous alerte au bon moment.
            </p>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="landing-reveal mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-3xl text-center">
            <SectionIntro eyebrow="Un fonctionnement naturel" title="Vous créez la relation. Clapy assure le suivi." centered>
              Quatre étapes simples. Clapy s'intègre à vos outils et assure le suivi.
            </SectionIntro>
          </div>
          <div className="relative mt-12 grid gap-4 md:grid-cols-4">
            <div className="absolute left-[12.5%] right-[12.5%] top-7 hidden h-px bg-[#d8c9ae] md:block" />
            {steps.map((step, index) => (
              <div className="relative rounded-lg border border-line bg-[#fbfaf6] p-5 transition duration-200 hover:-translate-y-1 hover:border-wood/35 hover:bg-white hover:shadow-xl" key={step.title}>
                <span className="relative z-10 grid size-14 place-items-center rounded-full bg-pine text-base font-black text-white shadow-lg shadow-pine/15">
                  {index + 1}
                </span>
                <h3 className="mt-6 text-lg font-black">{step.title}</h3>
                <p className="mt-3 text-sm font-semibold leading-6 text-gray-600">{step.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden bg-[#102f27] text-white">
        <div className="absolute inset-0 opacity-[0.06] [background-image:radial-gradient(circle_at_center,white_1px,transparent_1px)] [background-size:26px_26px]" />
        <div className="landing-reveal relative mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
          <div className="mx-auto w-full max-w-md">
            <div className="rounded-lg border border-white/15 bg-[#f3efe6] p-3 text-ink shadow-[0_35px_90px_rgba(0,0,0,0.28)]">
              <div className="flex items-center gap-3 rounded-lg bg-[#075e54] px-4 py-3 text-white">
                <span className="grid size-10 place-items-center rounded-full bg-white/15">
                  <MessageCircle size={19} />
                </span>
                <div>
                  <p className="font-black">Clapy</p>
                  <p className="text-xs font-bold text-white/65">Disponible</p>
                </div>
              </div>
              <div className="space-y-4 px-2 py-5">
                <ChatBubble speaker="Vous" text="Trouve les prospects compatibles avec ce bien." />
                <ChatBubble
                  speaker="Clapy"
                  text="6 prospects correspondent. Sarah arrive en tête avec 94 %. Voir la relance ?"
                  variant="nesto"
                />
                <ChatBubble speaker="Vous" text="Détails." />
                <ChatBubble
                  speaker="Clapy"
                  text="Budget, secteur et type de bien correspondent. À vérifier : sa date d'entrée."
                  variant="nesto"
                />
              </div>
              <div className="flex items-center gap-3 rounded-full bg-white px-4 py-3 text-sm font-semibold text-gray-400 shadow-inner">
                Écrivez votre message...
                <span className="ml-auto grid size-8 place-items-center rounded-full bg-pine text-white">
                  <ArrowRight size={15} />
                </span>
              </div>
            </div>
          </div>

          <div>
            <p className="text-sm font-black uppercase text-[#e5bd75]">Votre poste de commande</p>
            <h2 className="mt-4 max-w-xl text-4xl font-black leading-tight sm:text-5xl">Tout se pilote depuis WhatsApp.</h2>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/72">
              Donnez une instruction, transmettez un résumé d'appel ou validez une action. Clapy vous répond simplement.
            </p>
            <p className="mt-5 max-w-xl font-black leading-7 text-white">
              Pas besoin de passer votre journée dans un dashboard. Clapy travaille là où vous travaillez déjà.
            </p>
            <div className="mt-8 grid gap-3 sm:grid-cols-2">
              {whatsappCommands.map((command) => (
                <div className="rounded-lg border border-white/10 bg-white/[0.07] px-4 py-3 text-sm font-bold leading-6 text-white/90 transition hover:-translate-y-0.5 hover:border-white/20 hover:bg-white/[0.11]" key={command}>
                  "{command}"
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="bg-[#f8f5ee]">
        <div className="landing-reveal mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.86fr_1.14fr] lg:px-8">
          <div>
            <SectionIntro eyebrow="Après un appel" title="Envoyez simplement l'essentiel à Clapy.">
              Dictez ou écrivez le budget, le secteur et l'urgence. Clapy s'occupe du reste.
            </SectionIntro>
            <div className="mt-8 space-y-3">
              {[
                ["1", "Vous terminez votre appel"],
                ["2", "Vous envoyez un résumé sur WhatsApp"],
                ["3", "Clapy crée et classe la fiche"],
                ["4", "Il surveille les biens et prépare le suivi"]
              ].map(([number, label]) => (
                <div className="flex items-center gap-4 rounded-lg border border-line bg-white px-4 py-3 shadow-sm transition hover:translate-x-1 hover:shadow-md" key={number}>
                  <span className="grid size-9 shrink-0 place-items-center rounded-full bg-[#edf7f1] text-sm font-black text-pine">{number}</span>
                  <p className="font-bold">{label}</p>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-line bg-white p-5 shadow-[0_25px_70px_rgba(17,24,39,0.10)] sm:p-7">
            <div className="flex items-center justify-between gap-4 border-b border-line pb-5">
              <div>
                <p className="text-xs font-black uppercase text-wood">Un résumé, puis Clapy prend le relais</p>
                <h3 className="mt-2 text-2xl font-black">Sarah ne sera pas oubliée.</h3>
              </div>
              <span className="grid size-12 shrink-0 place-items-center rounded-full bg-[#edf7f1] text-pine">
                <MessageCircle size={22} />
              </span>
            </div>
            <div className="space-y-5 py-6">
              <ChatBubble
                speaker="Agent"
                text="Nouveau contact Sarah : cherche F3 Punaauia, budget 220 000 F, CDI, pas d'animaux, entrée juillet."
              />
              <ChatBubble
                speaker="Clapy"
                text="Fiche Sarah créée. Prospect chaud. Je surveille les F3 à Punaauia jusqu'à 220 000 F."
                variant="nesto"
              />
            </div>
            <div className="grid gap-3 border-t border-line pt-5 sm:grid-cols-3">
              <MiniMetric label="Fiche" value="Créée" />
              <MiniMetric label="Priorité" value="Chaude" />
              <MiniMetric label="Suivi" value="Actif" />
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="landing-reveal mx-auto grid max-w-7xl gap-6 px-4 py-24 sm:px-6 lg:grid-cols-2 lg:px-8">
          <div className="rounded-lg border border-pine/15 bg-[#edf7f1] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-pine text-white"><Sparkles size={20} /></span>
              <h2 className="text-2xl font-black">Ce que Clapy gère seul</h2>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {handledByClapy.map((task) => (
                <TaskLine icon={<Check size={16} />} key={task}>{task}</TaskLine>
              ))}
            </div>
          </div>
          <div className="rounded-lg border border-wood/20 bg-[#fffaf0] p-6 sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-wood text-white"><ShieldCheck size={20} /></span>
              <h2 className="text-2xl font-black">Ce qui demande votre validation</h2>
            </div>
            <div className="mt-7 grid gap-3 sm:grid-cols-2">
              {needsValidation.map((task) => (
                <TaskLine icon={<Check size={16} />} key={task} tone="wood">{task}</TaskLine>
              ))}
            </div>
            <p className="mt-6 border-t border-wood/15 pt-5 text-sm font-black leading-7 text-wood">
              Les relances simples sont automatisées. Les décisions importantes restent sous votre contrôle.
            </p>
          </div>
        </div>
      </section>

      <section className="border-y border-[#e7dcc8] bg-[#f8f5ee]">
        <div className="landing-reveal mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="grid overflow-hidden rounded-lg border border-line bg-white shadow-[0_28px_80px_rgba(17,24,39,0.10)] lg:grid-cols-[0.78fr_1.22fr]">
            <div className="bg-pine p-7 text-white sm:p-10">
              <p className="text-sm font-black uppercase text-[#e5bd75]">Offre de lancement</p>
              <h2 className="mt-4 text-4xl font-black leading-tight">Un bras droit commercial, sans embaucher.</h2>
              <p className="mt-5 text-base leading-8 text-white/75">
                Une installation accompagnée, adaptée à votre activité.
              </p>
              <div className="mt-8 rounded-lg border border-white/15 bg-white/10 p-5">
                <p className="text-xs font-black uppercase text-white/60">100 premiers agents</p>
                <p className="mt-2 text-2xl font-black">1 mois gratuit</p>
                <p className="mt-2 text-sm font-semibold leading-6 text-white/75">
                  Votre mois gratuit commence lorsque Clapy est installé et prêt à être testé avec vous.
                </p>
              </div>
            </div>
            <div className="p-7 sm:p-10">
              <div className="flex flex-wrap items-start justify-between gap-5 border-b border-line pb-6">
                <div>
                  <p className="text-sm font-black text-pine">Clapy Assistant Immobilier</p>
                  <div className="mt-3 flex items-end gap-2">
                    <span className="text-6xl font-black leading-none">99 €</span>
                    <span className="pb-2 text-lg font-black text-gray-500">/mois</span>
                  </div>
                  <p className="mt-2 text-sm font-bold text-gray-600">Puis 99 €/mois, sans engagement.</p>
                </div>
                <span className="rounded-full bg-[#fff4d8] px-4 py-2 text-xs font-black text-wood">Installation incluse</span>
              </div>
              <div className="mt-7 grid gap-x-6 gap-y-3 sm:grid-cols-2">
                {included.map((item) => (
                  <div className="flex items-start gap-3 text-sm font-semibold leading-6" key={item}>
                    <span className="mt-1 grid size-5 shrink-0 place-items-center rounded-full bg-[#edf7f1] text-pine">
                      <Check size={13} />
                    </span>
                    {item}
                  </div>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link
                  className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-pine px-6 py-3 text-sm font-black text-white shadow-lg shadow-pine/15 transition hover:-translate-y-0.5 hover:bg-[#123f32] hover:shadow-xl"
                  href="/signup"
                >
                  Activer mon mois gratuit <ArrowRight size={17} />
                </Link>
                <a
                  className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-black text-ink ring-1 ring-line transition hover:-translate-y-0.5 hover:bg-[#fbfaf7] hover:shadow-lg"
                  href={NESTO_WHATSAPP_CONTACT_URL}
                  rel="noreferrer"
                  target="_blank"
                >
                  <MessageCircle className="text-pine" size={17} /> Parler à un conseiller
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="bg-white">
        <div className="landing-reveal mx-auto grid max-w-7xl items-center gap-12 px-4 py-24 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
          <div>
            <SectionIntro eyebrow="Installation accompagnée" title="Clapy s'installe avec vous, simplement.">
              Notre équipe relie vos outils et vérifie que tout fonctionne. Vous n'avez rien de technique à gérer.
            </SectionIntro>
            <div className="mt-7 space-y-3">
              {[
                "Nous recueillons vos informations essentielles",
                "Notre équipe prépare vos connexions",
                "Nous testons Clapy avec votre activité",
                "Vous êtes prévenu dès que votre assistant est prêt"
              ].map((item) => (
                <div className="flex items-center gap-3 text-sm font-bold text-gray-700" key={item}>
                  <CheckCircle2 className="shrink-0 text-pine" size={18} />
                  {item}
                </div>
              ))}
            </div>
            <p className="mt-7 rounded-lg border border-pine/15 bg-[#edf7f1] p-5 font-black leading-7 text-pine">
              Gardez votre énergie pour le relationnel, les visites, la négociation et la signature.
            </p>
          </div>
          <div className="rounded-lg border border-line bg-[#f8f5ee] p-6 shadow-[0_20px_60px_rgba(17,24,39,0.08)] sm:p-8">
            <div className="flex items-center gap-3">
              <span className="grid size-11 place-items-center rounded-lg bg-white text-pine shadow-sm ring-1 ring-line">
                <HeartHandshake size={21} />
              </span>
              <div>
                <p className="text-xl font-black">Parlons de votre activité</p>
                <p className="mt-1 text-sm font-semibold text-gray-600">Quelques informations suffisent pour commencer.</p>
              </div>
            </div>
            <div className="mt-7 grid gap-4 sm:grid-cols-2">
              <Field label="Votre nom" placeholder="Marie Dupont" />
              <Field label="Votre WhatsApp" placeholder="+689..." />
              <Field label="Votre email" placeholder="vous@agence.fr" />
              <Field label="Votre agence" placeholder="Nom de l'agence" />
            </div>
            <div className="mt-7 flex flex-col gap-3 sm:flex-row">
              <Link
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-pine px-6 py-3 text-sm font-black text-white shadow-lg shadow-pine/15 transition hover:-translate-y-0.5 hover:bg-[#123f32] hover:shadow-xl"
                href="/signup"
              >
                Démarrer avec Clapy <ArrowRight size={17} />
              </Link>
              <a
                className="focus-ring inline-flex min-h-12 items-center justify-center gap-2 rounded-lg bg-white px-6 py-3 text-sm font-black text-ink ring-1 ring-line transition hover:-translate-y-0.5 hover:shadow-lg"
                href={NESTO_WHATSAPP_CONTACT_URL}
                rel="noreferrer"
                target="_blank"
              >
                <MessageCircle className="text-pine" size={17} /> WhatsApp
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t border-line bg-white">
        <div className="mx-auto max-w-7xl px-4 py-8 text-center sm:px-6 lg:px-8">
          <div className="flex items-center justify-center gap-2">
            <span className="grid size-8 place-items-center rounded-lg bg-pine font-black text-white text-sm">N</span>
            <p className="font-black text-ink">Clapy</p>
          </div>
          <p className="mt-3 text-sm font-semibold text-gray-600">Vous gérez la relation. Clapy assure le suivi.</p>
        </div>
      </footer>
    </main>
  );
}

function TrustItem({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-center gap-2">
      <CheckCircle2 className="text-pine" size={17} />
      {children}
    </span>
  );
}

function HeroProof({ children, icon, title }: { children: ReactNode; icon: ReactNode; title: string }) {
  return (
    <div className="flex gap-3 border-b border-[#e7dcc8] p-5 transition duration-200 hover:bg-[#fbfaf6] last:border-0 sm:border-b-0 sm:border-r sm:last:border-r-0">
      <span className="grid size-10 shrink-0 place-items-center rounded-lg bg-[#edf7f1] text-pine">{icon}</span>
      <div>
        <p className="font-black">{title}</p>
        <p className="mt-1 text-sm font-semibold leading-6 text-gray-600">{children}</p>
      </div>
    </div>
  );
}

function SectionIntro({
  centered = false,
  children,
  eyebrow,
  title
}: {
  centered?: boolean;
  children: ReactNode;
  eyebrow: string;
  title: string;
}) {
  return (
    <div className={centered ? "text-center" : ""}>
      <p className="text-sm font-black uppercase text-wood">{eyebrow}</p>
      <h2 className="mt-4 text-3xl font-black leading-tight sm:text-4xl">{title}</h2>
      <p className={`mt-5 text-base font-medium leading-8 text-gray-600 ${centered ? "mx-auto max-w-2xl" : "max-w-2xl"}`}>
        {children}
      </p>
    </div>
  );
}

function EditorialCard({
  children,
  icon,
  number,
  title
}: {
  children: ReactNode;
  icon: ReactNode;
  number: string;
  title: string;
}) {
  return (
    <article className="group rounded-lg border border-line bg-[#fbfaf6] p-5 shadow-[0_8px_24px_rgba(17,24,39,0.035)] transition duration-200 hover:-translate-y-1 hover:border-wood/35 hover:bg-white hover:shadow-[0_18px_45px_rgba(17,24,39,0.09)]">
      <div className="flex items-center justify-between">
        <span className="grid size-10 place-items-center rounded-lg bg-white text-wood shadow-sm ring-1 ring-line transition group-hover:bg-wood group-hover:text-white">
          {icon}
        </span>
        <span className="text-xs font-black text-gray-400">{number}</span>
      </div>
      <h3 className="mt-5 text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">{children}</p>
    </article>
  );
}

function PremiumPoint({
  children,
  icon,
  title
}: {
  children: ReactNode;
  icon: ReactNode;
  title: string;
}) {
  return (
    <article className="group rounded-lg border border-line bg-white p-5 shadow-[0_8px_24px_rgba(17,24,39,0.04)] transition duration-200 hover:-translate-y-1 hover:border-pine/25 hover:shadow-[0_18px_45px_rgba(17,24,39,0.09)]">
      <div className="mb-5 grid size-11 place-items-center rounded-lg bg-[#edf7f1] text-pine transition group-hover:bg-pine group-hover:text-white">{icon}</div>
      <h3 className="text-lg font-black">{title}</h3>
      <p className="mt-2 text-sm font-semibold leading-6 text-gray-600">{children}</p>
    </article>
  );
}

function ChatBubble({
  speaker,
  text,
  variant = "agent"
}: {
  speaker: string;
  text: string;
  variant?: "agent" | "nesto";
}) {
  const isClapy = variant === "nesto";

  return (
    <div className={isClapy ? "ml-auto max-w-[92%]" : "mr-auto max-w-[92%]"}>
      <p className={`mb-1.5 text-xs font-black uppercase ${isClapy ? "text-pine" : "text-gray-500"}`}>{speaker}</p>
      <p className={`rounded-lg px-4 py-3 text-sm font-semibold leading-6 shadow-sm ${isClapy ? "bg-[#dff4e7] text-[#173d32]" : "bg-white text-ink ring-1 ring-black/5"}`}>
        "{text}"
      </p>
    </div>
  );
}

function MiniMetric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-line bg-[#fbfaf6] p-3">
      <p className="text-lg font-black text-pine">{value}</p>
      <p className="mt-1 text-xs font-bold text-gray-500">{label}</p>
    </div>
  );
}

function TaskLine({ children, icon, tone = "pine" }: { children: ReactNode; icon: ReactNode; tone?: "pine" | "wood" }) {
  return (
    <div className="flex items-start gap-3 rounded-lg bg-white/85 p-3 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:bg-white hover:shadow-md">
      <span className={`mt-0.5 grid size-6 shrink-0 place-items-center rounded-full ${tone === "wood" ? "bg-[#fff1dc] text-wood" : "bg-[#dff4e7] text-pine"}`}>
        {icon}
      </span>
      <span className="text-sm font-semibold leading-6">{children}</span>
    </div>
  );
}

function Field({ label, placeholder }: { label: string; placeholder: string }) {
  return (
    <label className="block text-sm font-black">
      {label}
      <input
        className="focus-ring mt-2 min-h-12 w-full rounded-lg border border-line bg-white px-4 text-sm font-semibold transition placeholder:text-gray-400 hover:border-wood/40 focus:border-pine"
        placeholder={placeholder}
      />
    </label>
  );
}
