export type IndicatorId =
  | "low-income-children"
  | "population-total"
  | "population-growth"
  | "net-migration";

export type IndicatorDirection = "higher-is-pressure" | "lower-is-pressure" | "context-only";

export type IndicatorDefinition = {
  id: IndicatorId;
  label: string;
  shortLabel: string;
  unit: "percent" | "count" | "per-mille";
  source: string;
  sourceTable: string;
  sourceUrl: string;
  description: string;
  direction: IndicatorDirection;
};

export const INDICATORS: Record<IndicatorId, IndicatorDefinition> = {
  "low-income-children": {
    id: "low-income-children",
    label: "Barn under 18 år i husholdninger med lavinntekt (EU-60)",
    shortLabel: "Barn i lavinntekt",
    unit: "percent",
    source: "Statistisk sentralbyrå (SSB)",
    sourceTable: "08764",
    sourceUrl: "https://data.ssb.no/api/v0/no/table/08764",
    description:
      "Andelen barn under 18 år som bor i husholdninger med vedvarende lav inntekt etter EU-skala 60 prosent.",
    direction: "higher-is-pressure",
  },
  "population-total": {
    id: "population-total",
    label: "Befolkning per 1. januar",
    shortLabel: "Innbyggere",
    unit: "count",
    source: "Statistisk sentralbyrå (SSB)",
    sourceTable: "06913",
    sourceUrl: "https://data.ssb.no/api/v0/no/table/06913",
    description: "Antall personer registrert som bosatt i kommunen.",
    direction: "context-only",
  },
  "population-growth": {
    id: "population-growth",
    label: "Folketilvekst siste år",
    shortLabel: "Folketilvekst",
    unit: "per-mille",
    source: "Statistisk sentralbyrå (SSB)",
    sourceTable: "06913",
    sourceUrl: "https://data.ssb.no/api/v0/no/table/06913",
    description:
      "Endring i folkemengden i løpet av året, regnet per 1 000 innbyggere. Negative tall betyr at folketallet synker.",
    direction: "context-only",
  },
  "net-migration": {
    id: "net-migration",
    label: "Nettoinnflytting siste år",
    shortLabel: "Nettoinnflytting",
    unit: "per-mille",
    source: "Statistisk sentralbyrå (SSB)",
    sourceTable: "06913",
    sourceUrl: "https://data.ssb.no/api/v0/no/table/06913",
    description:
      "Innflyttinger minus utflyttinger i løpet av året, per 1 000 innbyggere. Et grovt mål på hvor raskt befolkningen i kommunen skiftes ut.",
    direction: "context-only",
  },
};

export const INDICATOR_ORDER: IndicatorId[] = [
  "low-income-children",
  "population-growth",
  "net-migration",
  "population-total",
];

export function getIndicator(id: IndicatorId): IndicatorDefinition {
  return INDICATORS[id];
}

export function listIndicators(): IndicatorDefinition[] {
  return INDICATOR_ORDER.map((id) => INDICATORS[id]);
}
