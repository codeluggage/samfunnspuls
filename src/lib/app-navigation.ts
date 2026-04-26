import { SAMFUNNSPULS_CATALOG } from "./samfunnspuls/catalog";
import { normalizeSearchText, searchCatalog } from "./samfunnspuls/search";

export type AppNavItem = {
  label: string;
  href: string;
};

export type ViewCard = {
  title: string;
  href: string;
  description: string;
  status: "Klar" | "Utforsk data" | "Kommer";
  tags: string[];
};

export type GlobalSearchSuggestion = {
  title: string;
  href: string;
  description: string;
  type: "view" | "dataset";
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { label: "Samfunnspuls", href: "/" },
  { label: "Aktivitetsradar", href: "/aktivitetsradar" },
  { label: "Utforsk data", href: "/utforsk-data" },
];

const VIEW_CARDS: ViewCard[] = [
  {
    title: "Aktivitetsradar",
    href: "/aktivitetsradar",
    description:
      "Se hvilke kommuner som har høyest andel barn i lavinntekt og minst Røde Kors-dekning — og finn ut hvilke aktiviteter som allerede finnes der.",
    status: "Klar",
    tags: ["lavinntekt", "Røde Kors", "kommuner", "aktivitet"],
  },
  {
    title: "Barn og unge",
    href: "/utforsk-data?category=Barn+og+unge",
    description:
      "Datasett om lavinntekt, skole, fritidstilbud og boforhold. Nyttig for å kartlegge oppvekstvilkår i din kommune.",
    status: "Utforsk data",
    tags: ["barn", "unge", "skole", "fritid", "lavinntekt"],
  },
  {
    title: "Demografi og flytting",
    href: "/utforsk-data?category=Demografi+og+boforhold",
    description:
      "Befolkningsendring, alder, familiesammensetning og tilflytting. Hjelper deg forstå hvem som bor i området.",
    status: "Utforsk data",
    tags: ["befolkningsendring", "alder", "tilflytting", "familier"],
  },
  {
    title: "Økonomisk sårbarhet",
    href: "/utforsk-data?category=Økonomi",
    description:
      "Lavinntekt, arbeidsledighet og sosialhjelp på kommunenivå. Viser hvor det økonomiske presset er størst.",
    status: "Kommer",
    tags: ["økonomi", "NAV", "arbeidsledige", "sosialhjelp"],
  },
];

export function getViewCards(): ViewCard[] {
  return VIEW_CARDS;
}

export function getGlobalSearchSuggestions(query: string, limit = 6): GlobalSearchSuggestion[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return VIEW_CARDS.slice(0, 3).map(viewToSuggestion);
  }

  const viewSuggestions = VIEW_CARDS.filter((view) =>
    normalizeSearchText([view.title, view.description, ...view.tags].join(" ")).includes(normalizedQuery),
  ).map(viewToSuggestion);
  const datasetSuggestions = searchCatalog(SAMFUNNSPULS_CATALOG, { query })
    .slice(0, limit)
    .map((result) => ({
      title: result.entry.title,
      href: `/utforsk-data?q=${encodeURIComponent(query)}&datasett=${encodeURIComponent(result.entry.slug)}`,
      description: `${result.entry.category} · ${result.entry.source}`,
      type: "dataset" as const,
    }));

  return [...viewSuggestions, ...datasetSuggestions].slice(0, limit);
}

function viewToSuggestion(view: ViewCard): GlobalSearchSuggestion {
  return {
    title: view.title,
    href: view.href,
    description: view.description,
    type: "view",
  };
}
