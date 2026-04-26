import { SAMFUNNSPULS_CATALOG } from "./samfunnspuls/catalog";
import { normalizeSearchText, searchCatalog } from "./samfunnspuls/search";

export type AppNavItem = {
  label: string;
  href: string;
};

export type GlobalSearchSuggestion = {
  title: string;
  href: string;
  description: string;
  type: "view" | "dataset";
};

export const APP_NAV_ITEMS: AppNavItem[] = [
  { label: "Samfunnspuls", href: "/" },
  { label: "Om tallene", href: "/om-tallene" },
];

const VIEW_HINTS: Array<{ title: string; href: string; description: string; tags: string[] }> = [
  {
    title: "Velg kommune",
    href: "/",
    description: "Lokal humanitær profil – barnefattigdom, befolkning, tilflytting og Røde Kors-aktivitet.",
    tags: ["kommune", "lokal", "planlegging", "lavinntekt", "befolkning"],
  },
  {
    title: "Om tallene",
    href: "/om-tallene",
    description: "Oversikt over alle datasett, kilder og kobling til SSB, NAV, Udir og IMDi.",
    tags: ["datasett", "kilder", "metadata"],
  },
];

export function getGlobalSearchSuggestions(query: string, limit = 6): GlobalSearchSuggestion[] {
  const normalizedQuery = normalizeSearchText(query);

  if (!normalizedQuery) {
    return VIEW_HINTS.map(viewHintToSuggestion);
  }

  const viewSuggestions = VIEW_HINTS.filter((view) =>
    normalizeSearchText([view.title, view.description, ...view.tags].join(" ")).includes(normalizedQuery),
  ).map(viewHintToSuggestion);
  const datasetSuggestions = searchCatalog(SAMFUNNSPULS_CATALOG, { query })
    .slice(0, limit)
    .map((result) => ({
      title: result.entry.title,
      href: `/om-tallene?q=${encodeURIComponent(query)}&datasett=${encodeURIComponent(result.entry.slug)}`,
      description: `${result.entry.category} · ${result.entry.source}`,
      type: "dataset" as const,
    }));

  return [...viewSuggestions, ...datasetSuggestions].slice(0, limit);
}

function viewHintToSuggestion(view: (typeof VIEW_HINTS)[number]): GlobalSearchSuggestion {
  return {
    title: view.title,
    href: view.href,
    description: view.description,
    type: "view",
  };
}
