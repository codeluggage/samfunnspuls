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
      "Andel barn under 18 år som bor i familier med lav inntekt over lengre tid.",
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
      "Endring i folketallet, per 1 000 innbyggere. Minus betyr at folketallet gikk ned.",
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
      "Om flere flyttet inn enn ut, per 1 000 innbyggere. Minus betyr at flere flyttet ut.",
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
