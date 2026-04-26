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
  status: "Klar" | "Datagrunnlag klart" | "Neste steg";
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
      "Sammenligner barn i lavinntekt fra SSB med lokale Røde Kors-aktiviteter for barn, ungdom og integrering.",
    status: "Klar",
    tags: ["lavinntekt", "Røde Kors", "kommuner", "aktivitet"],
  },
  {
    title: "Barn og unge",
    href: "/utforsk-data?category=Barn+og+unge",
    description:
      "Finn datasett om lavinntekt, skole, fritidstilbud, boforhold og andre oppvekstindikatorer.",
    status: "Datagrunnlag klart",
    tags: ["barn", "unge", "skole", "fritid", "lavinntekt"],
  },
  {
    title: "Demografi og flytting",
    href: "/utforsk-data?category=Demografi+og+boforhold",
    description:
      "Se datagrunnlag for befolkningsendring, alder, kjønn, familier og flytting mellom områder.",
    status: "Datagrunnlag klart",
    tags: ["befolkningsendring", "folketilvekst", "tilflytting", "familier"],
  },
  {
    title: "Økonomisk sårbarhet",
    href: "/utforsk-data?category=Økonomi",
    description:
      "Utforsk lavinntekt, arbeidsledighet, sosialhjelp og stønadsdata som kan støtte lokal planlegging.",
    status: "Neste steg",
    tags: ["økonomi", "NAV", "arbeidsledige", "sosialhjelp", "lavinntekt"],
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
