"use client";

import {
  Alert,
  Button,
  Card,
  CardBlock,
  CrossCorner,
  Field,
  Heading,
  Link,
  Paragraph,
  SkeletonLoader,
  Suggestion,
  Tag,
} from "rk-designsystem";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { SiteHeader } from "./components/site-header";
import type { AreaProfile, IndicatorSnapshot } from "@/lib/planning";
import styles from "./page.module.css";

type ApiResponse = {
  areas: AreaProfile[];
  metadata: {
    generatedAt: string;
    sources: Array<{
      id: string;
      label: string;
      url: string;
      sourceUpdatedAt: string | null;
      importedAt: string;
    }>;
  };
};

type AreaSuggestion = { label: string; value: string };

type SuggestionSelectedChange = NonNullable<ComponentProps<typeof Suggestion>["onSelectedChange"]>;

const ACTIVITY_GROUPS: Array<{ label: string; activities: string[] }> = [
  {
    label: "Barn og ungdom",
    activities: [
      "Barnas Røde Kors",
      "Ferie for alle",
      "Leksehjelp",
      "Digital leksehjelp",
      "Treffpunkt - Røde Kors Ungdom",
      "Øvrige aktiviteter - Røde Kors Ungdom",
      "Møteplass Fellesverkene",
    ],
  },
  {
    label: "Integrering og språk",
    activities: ["Flyktningguide", "Norsktrening", "Språkgruppe", "Mentorfamilie"],
  },
  {
    label: "Møteplasser og fellesskap",
    activities: ["Møteplasser", "Vennefamilie"],
  },
];

export default function HomePage() {
  const [areas, setAreas] = useState<AreaProfile[]>([]);
  const [metadata, setMetadata] = useState<ApiResponse["metadata"] | null>(null);
  const [selectedRegionCode, setSelectedRegionCode] = useState("");
  const [status, setStatus] = useState<"loading" | "ready" | "empty" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    let isActive = true;

    async function loadAreas() {
      try {
        const response = await fetch("/api/planning/areas");
        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload.detail ?? payload.error ?? "Ukjent API-feil");
        }

        if (!isActive) return;

        const data = payload as ApiResponse;
        setAreas(data.areas);
        setMetadata(data.metadata);
        setSelectedRegionCode(findDefaultArea(data.areas)?.regionCode ?? "");
        setStatus(data.areas.length ? "ready" : "empty");
      } catch (caught) {
        if (!isActive) return;
        setError(caught instanceof Error ? caught.message : "Ukjent feil");
        setStatus("error");
      }
    }

    loadAreas();

    return () => {
      isActive = false;
    };
  }, []);

  const selectedArea = useMemo(
    () => areas.find((area) => area.regionCode === selectedRegionCode) ?? areas[0],
    [areas, selectedRegionCode],
  );

  const areaOptions = useMemo<AreaSuggestion[]>(
    () =>
      [...areas]
        .sort((left, right) => formatAreaName(left).localeCompare(formatAreaName(right), "nb-NO"))
        .map((area) => ({ label: formatAreaName(area), value: area.regionCode })),
    [areas],
  );

  const selectedAreaOption = areaOptions.find((option) => option.value === selectedRegionCode);
  const topPressureAreas = useMemo(
    () => areas.filter((area) => area.pressureScore !== null).slice(0, 10),
    [areas],
  );

  function handleAreaSuggestionChange(selected: unknown) {
    if (!selected || Array.isArray(selected) || typeof selected !== "object") return;
    const option = selected as Partial<AreaSuggestion>;
    if (typeof option.value === "string") setSelectedRegionCode(option.value);
  }

  return (
    <>
      <SiteHeader />

      <main className={styles.main}>
        <section className={styles.hero} aria-label="Velg sted">
          <div className={styles.heroDecor} aria-hidden />
          <CrossCorner
            data-color="primary-color-red"
            data-size="md"
            position="top-left"
            aria-hidden
          />
          <div className={styles.heroInner}>
            <Tag data-color="primary-color-red">Lokal humanitær planlegging</Tag>
            <Heading level={1} data-size="xl">
              Hva trenger lokalsamfunnet ditt?
            </Heading>
            <Paragraph data-size="lg">
              Velg en kommune og se hvordan barn, befolkning og tilflytting beveger seg — og hva Røde Kors allerede tilbyr der i dag.
            </Paragraph>

            <div className={styles.picker}>
              <Field>
                <label htmlFor="kommune-search" className={styles.pickerLabel}>
                  Velg kommune
                </label>
                <Suggestion
                  filter
                  name="kommune"
                  selected={selectedAreaOption}
                  onSelectedChange={handleAreaSuggestionChange as SuggestionSelectedChange}
                >
                  <Suggestion.Input
                    id="kommune-search"
                    placeholder="Søk etter kommune – Oslo, Tønsberg, Tromsø …"
                  />
                  <Suggestion.Clear />
                  <Suggestion.List>
                    <Suggestion.Empty>Ingen kommuner funnet</Suggestion.Empty>
                    {areaOptions.map((option) => (
                      <Suggestion.Option key={option.value} label={option.label} value={option.value}>
                        {option.label}
                      </Suggestion.Option>
                    ))}
                  </Suggestion.List>
                </Suggestion>
              </Field>
              <Paragraph data-size="sm">
                {areas.length > 0
                  ? `${areas.length} kommuner i datasettet — sortert etter humanitær pressindikator (andel barn i lavinntekt).`
                  : "Datasettet er tomt. Kjør npm run data:sync for å hente friske tall fra SSB."}
              </Paragraph>
            </div>
          </div>
        </section>

        {status === "loading" ? <LoadingState /> : null}
        {status === "error" ? <ErrorState message={error} /> : null}
        {status === "empty" ? <EmptyState /> : null}
        {status === "ready" && selectedArea ? (
          <ProfileView
            area={selectedArea}
            allAreas={areas}
            topPressureAreas={topPressureAreas}
            onSelectArea={setSelectedRegionCode}
          />
        ) : null}

        {metadata ? <SourceFootnote metadata={metadata} /> : null}
      </main>
    </>
  );
}

function ProfileView({
  area,
  allAreas,
  topPressureAreas,
  onSelectArea,
}: {
  area: AreaProfile;
  allAreas: AreaProfile[];
  topPressureAreas: AreaProfile[];
  onSelectArea: (regionCode: string) => void;
}) {
  return (
    <article className={styles.profile} aria-label={`Humanitær profil for ${area.municipality}`}>
      <header className={styles.profileHeader}>
        <div className={styles.profileHeaderText}>
          <div className={styles.tagRow}>
            <Tag data-color={pressureColor(area.pressureBand)}>{pressureLabel(area.pressureBand)}</Tag>
            {area.county ? <Tag data-color="neutral">{area.county}</Tag> : null}
            {area.population !== null ? (
              <Tag data-color="neutral">{formatNumber(area.population)} innbyggere</Tag>
            ) : null}
          </div>
          <Heading level={2} data-size="xl">
            {area.municipality}
          </Heading>
          <Paragraph data-size="lg">{area.narrative}</Paragraph>
        </div>
      </header>

      <section className={styles.indicatorStrip} aria-label="Indikatorer">
        {area.indicators.map((snapshot) => (
          <IndicatorRow key={snapshot.indicator.id} snapshot={snapshot} />
        ))}
      </section>

      <div className={styles.twoColumn}>
        <Card data-color="neutral">
          <CardBlock>
            <div className={styles.cardStack}>
              <Heading level={3} data-size="md">
                Røde Kors i {area.municipality}
              </Heading>
              <Paragraph data-size="sm">
                {area.activeBranchesCount === 0
                  ? "Ingen aktive lokalforeninger registrert."
                  : `${area.activeBranchesCount} aktive lokalforeninger, hvorav ${area.matchingBranchesCount} tilbyr aktiviteter i de prioriterte kategoriene.`}
              </Paragraph>
              <ActivityCoverageList area={area} />
              {area.branches.length ? (
                <ul className={styles.branchList}>
                  {area.branches.slice(0, 6).map((branch) => (
                    <li key={branch.branchId}>
                      <span className={styles.branchName}>{branch.branchName}</span>
                      <span className={styles.branchMeta}>
                        {branch.relevantActivities.length
                          ? branch.relevantActivities.join(", ")
                          : "Ingen aktiviteter i prioriterte kategorier"}
                      </span>
                      {branch.web ? (
                        <Link href={branch.web} data-size="sm">
                          Nettside
                        </Link>
                      ) : branch.email ? (
                        <Link href={`mailto:${branch.email}`} data-size="sm">
                          E-post
                        </Link>
                      ) : null}
                    </li>
                  ))}
                </ul>
              ) : null}
            </div>
          </CardBlock>
        </Card>

        <Card data-color="neutral">
          <CardBlock>
            <div className={styles.cardStack}>
              <Heading level={3} data-size="md">
                Kommuner med høyest barnefattigdom i datasettet
              </Heading>
              <Paragraph data-size="sm">
                Andel barn i husholdninger med lavinntekt (EU-60) — klikk for å bytte profil.
              </Paragraph>
              <PressureRanking
                areas={topPressureAreas}
                selectedRegionCode={area.regionCode}
                onSelect={onSelectArea}
              />
              <Paragraph data-size="sm">
                {area.regionCode &&
                topPressureAreas.some((entry) => entry.regionCode === area.regionCode)
                  ? `${area.municipality} er i topp 10 i datasettet.`
                  : `${area.municipality} er ikke i topp 10 — bla i listen for å finne nabokommuner.`}
              </Paragraph>
              <RankInDataset area={area} totalAreas={allAreas.length} />
            </div>
          </CardBlock>
        </Card>
      </div>
    </article>
  );
}

function IndicatorRow({ snapshot }: { snapshot: IndicatorSnapshot }) {
  const { indicator, value, nationalAverage, comparison } = snapshot;
  const trend = trendFor(snapshot);

  return (
    <div className={styles.indicatorRow}>
      <div className={styles.indicatorMain}>
        <p className={styles.indicatorValue}>{formatValue(value, indicator.unit)}</p>
        <Paragraph data-size="sm">
          <span className={styles.indicatorLabel}>{indicator.shortLabel}</span>
          <span className={styles.indicatorPeriod}>{snapshot.period ? `· ${snapshot.period}` : null}</span>
        </Paragraph>
      </div>
      <div className={styles.indicatorMeta}>
        {trend ? (
          <Tag data-color={trend.color}>{trend.label}</Tag>
        ) : null}
        {nationalAverage !== null ? (
          <Paragraph data-size="sm">
            Landsgjennomsnitt: {formatValue(nationalAverage, indicator.unit)}
          </Paragraph>
        ) : null}
        {snapshot.rank !== null && snapshot.totalRanked > 0 && comparison !== "no-comparison" ? (
          <Paragraph data-size="sm">
            Rangering: nr. {snapshot.rank} av {snapshot.totalRanked}
          </Paragraph>
        ) : null}
      </div>
      <p className={styles.indicatorDescription}>{indicator.description}</p>
    </div>
  );
}

function ActivityCoverageList({ area }: { area: AreaProfile }) {
  if (area.matchingBranchesCount === 0) {
    return (
      <Alert data-color="warning">
        <Heading level={4} data-size="xs">
          Hvit flekk i de prioriterte kategoriene
        </Heading>
        <Paragraph>
          Ingen lokal Røde Kors-aktivitet i {area.municipality} matcher kategoriene barn/ungdom, integrering eller møteplasser. Nabokommuner kan være naturlige samarbeidspunkt.
        </Paragraph>
      </Alert>
    );
  }

  const coverageByGroup = ACTIVITY_GROUPS.map((group) => {
    const matches = area.topRelevantActivities.filter((activity) =>
      group.activities.includes(activity.activityName),
    );
    return { ...group, matches };
  });

  return (
    <dl className={styles.activityList}>
      {coverageByGroup.map((group) => (
        <div key={group.label}>
          <dt>{group.label}</dt>
          <dd>
            {group.matches.length === 0 ? (
              <span className={styles.activityMissing}>Ingen tilbud her</span>
            ) : (
              group.matches
                .map((match) => `${match.activityName} (${match.branchesCount})`)
                .join(", ")
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function PressureRanking({
  areas,
  selectedRegionCode,
  onSelect,
}: {
  areas: AreaProfile[];
  selectedRegionCode: string;
  onSelect: (regionCode: string) => void;
}) {
  return (
    <ol className={styles.rankList}>
      {areas.map((area, index) => {
        const isSelected = area.regionCode === selectedRegionCode;
        return (
          <li key={area.regionCode} className={isSelected ? styles.rankRowSelected : styles.rankRow}>
            <Button
              variant={isSelected ? "primary" : "tertiary"}
              data-size="sm"
              onClick={() => onSelect(area.regionCode)}
              aria-pressed={isSelected}
            >
              <span className={styles.rankIndex} aria-hidden>
                {String(index + 1).padStart(2, " ")}.
              </span>
              {area.municipality}
              <span className={styles.rankValue} aria-hidden>
                {formatValue(area.pressureScore, "percent")}
              </span>
            </Button>
          </li>
        );
      })}
    </ol>
  );
}

function RankInDataset({ area, totalAreas }: { area: AreaProfile; totalAreas: number }) {
  const lowIncome = area.indicators.find((s) => s.indicator.id === "low-income-children");
  if (!lowIncome || lowIncome.rank === null || lowIncome.totalRanked === 0) return null;

  return (
    <Paragraph data-size="sm">
      {area.municipality} er nr. {lowIncome.rank} av {lowIncome.totalRanked} kommuner sortert på barnefattigdom (totalt {totalAreas} kommuner i datasettet).
    </Paragraph>
  );
}

function SourceFootnote({ metadata }: { metadata: ApiResponse["metadata"] }) {
  return (
    <footer className={styles.sourceFootnote} aria-label="Datagrunnlag">
      <Heading level={2} data-size="xs">
        Datagrunnlag
      </Heading>
      <ul className={styles.sourceList}>
        {metadata.sources.map((source) => (
          <li key={source.id}>
            <Link href={source.url}>{source.label}</Link>
            <span className={styles.sourceMeta}>
              Kildedato {formatDate(source.sourceUpdatedAt)} · synkronisert {formatDate(source.importedAt)}
            </span>
          </li>
        ))}
      </ul>
      <Paragraph data-size="sm">
        Mer om tallene: <Link href="/om-tallene">Om tallene og datasettene</Link>
      </Paragraph>
    </footer>
  );
}

function LoadingState() {
  return (
    <section className={styles.loadingGrid} aria-label="Laster planleggingsdata">
      {Array.from({ length: 4 }).map((_, index) => (
        <Card key={index} data-color="neutral">
          <CardBlock>
            <SkeletonLoader aria-label="Laster" />
          </CardBlock>
        </Card>
      ))}
    </section>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <Alert data-color="danger">
      <Heading level={2} data-size="sm">
        Data kunne ikke hentes
      </Heading>
      <Paragraph>{message}</Paragraph>
    </Alert>
  );
}

function EmptyState() {
  return (
    <Alert data-color="warning">
      <Heading level={2} data-size="sm">
        Ingen data tilgjengelig
      </Heading>
      <Paragraph>
        Start lokal Supabase og kjør <code>npm run data:sync</code> for å hente tall fra SSB og Røde Kors-organisasjonsdata.
      </Paragraph>
    </Alert>
  );
}

function pressureLabel(band: AreaProfile["pressureBand"]) {
  if (band === "high") return "Høy humanitær press";
  if (band === "moderate") return "Moderat press";
  if (band === "lower") return "Lavere utslag";
  return "Ufullstendig datagrunnlag";
}

function pressureColor(band: AreaProfile["pressureBand"]):
  | "primary-color-red"
  | "warning"
  | "info"
  | "neutral" {
  if (band === "high") return "primary-color-red";
  if (band === "moderate") return "warning";
  if (band === "lower") return "info";
  return "neutral";
}

function trendFor(snapshot: IndicatorSnapshot): { label: string; color: "primary-color-red" | "warning" | "info" | "neutral" | "success" } | null {
  if (snapshot.value === null || snapshot.nationalAverage === null) return null;
  const direction = snapshot.indicator.direction;
  const comparison = snapshot.comparison;

  if (direction === "higher-is-pressure") {
    if (comparison === "above-average") return { label: "Over snittet", color: "primary-color-red" };
    if (comparison === "below-average") return { label: "Under snittet", color: "success" };
    return { label: "På linje med snittet", color: "neutral" };
  }

  if (direction === "lower-is-pressure") {
    if (comparison === "below-average") return { label: "Under snittet", color: "primary-color-red" };
    if (comparison === "above-average") return { label: "Over snittet", color: "success" };
    return { label: "På linje med snittet", color: "neutral" };
  }

  if (comparison === "above-average") return { label: "Over snittet", color: "info" };
  if (comparison === "below-average") return { label: "Under snittet", color: "info" };
  return { label: "På linje med snittet", color: "neutral" };
}

function formatValue(value: number | null, unit: "percent" | "count" | "per-mille"): string {
  if (value === null) return "Ikke oppgitt";
  if (unit === "percent") {
    return `${value.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} %`;
  }
  if (unit === "per-mille") {
    const sign = value > 0 ? "+" : "";
    return `${sign}${value.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} ‰`;
  }
  return value.toLocaleString("nb-NO", { maximumFractionDigits: 0 });
}

function formatNumber(value: number): string {
  return value.toLocaleString("nb-NO");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "ikke oppgitt";
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium" }).format(new Date(value));
}

function formatAreaName(area: AreaProfile) {
  return `${area.municipality}${area.county ? `, ${area.county}` : ""}`;
}

function findDefaultArea(areas: AreaProfile[]) {
  return areas.find((area) => area.municipality === "Oslo") ?? areas[0];
}
