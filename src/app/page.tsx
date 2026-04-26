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
            <Tag data-color="primary-color-red">Forstå hva folk i kommunen trenger, og hva vi kan gjøre</Tag>
            <Heading level={1} data-size="xl">
              Hva trenger lokalsamfunnet?
            </Heading>
            <Paragraph data-size="lg">
              Velg sted for å se oversikt over Røde Kors-tilbud, samt utvikling i barn, befolkning og flytting.
            </Paragraph>

            <div className={styles.picker}>
              <Field>
                <label htmlFor="kommune-search" className={styles.pickerLabel}>
                  Velg kommune
                </label>
                <Suggestion
                  filter
                  multiple={false}
                  selected={selectedAreaOption ?? null}
                  onSelectedChange={handleAreaSuggestionChange as SuggestionSelectedChange}
                >
                  <Suggestion.Input
                    id="kommune-search"
                    placeholder="Søk etter sted"
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
                  ? `${areas.length} kommuner sortert etter andel barn i familier med lav inntekt.`
                  : "Vi har ingen tall å vise akkurat nå."}
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
            areas={areas}
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
  areas,
  topPressureAreas,
  onSelectArea,
}: {
  area: AreaProfile;
  areas: AreaProfile[];
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

      <section className={styles.visualizationGrid} aria-label="Visualisering av nøkkeltall">
        <Card data-color="neutral">
          <CardBlock>
            <div className={styles.cardStack}>
              <Heading level={3} data-size="md">
                Sammenligning med Norge
              </Heading>
              <Paragraph data-size="sm">
                Vi viser valgt kommune mot landssnittet for indikatorene vi har tall på.
              </Paragraph>
              <IndicatorComparisonChart area={area} />
            </div>
          </CardBlock>
        </Card>

        <Card data-color="neutral">
          <CardBlock>
            <div className={styles.cardStack}>
              <Heading level={3} data-size="md">
                Kommuner med høyest andel barn i lavinntekt
              </Heading>
              <Paragraph data-size="sm">
                Klikk på en kommune i grafen for å oppdatere profilen.
              </Paragraph>
              <PressureGraph
                areas={areas}
                selectedRegionCode={area.regionCode}
                onSelect={onSelectArea}
              />
              <Paragraph data-size="sm">
                Lengden på stolpene viser nivået i prosent.
              </Paragraph>
            </div>
          </CardBlock>
        </Card>
      </section>

      <div className={styles.twoColumn}>
        <Card data-color="neutral">
          <CardBlock>
            <div className={styles.cardStack}>
              <Heading level={3} data-size="md">
                Røde Kors-tilbud i {area.municipality}
              </Heading>
              <Paragraph data-size="sm">
                {area.activeBranchesCount === 0
                  ? "Ingen aktive lokalforeninger registrert."
                  : `${area.activeBranchesCount} aktive lokalforeninger. ${area.matchingBranchesCount} har tilbud innen fokusområdene.`}
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
                          : "Ingen tilbud funnet for fokusområdene"}
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
                Kommuner med høyest andel barn i familier med lav inntekt
              </Heading>
              <Paragraph data-size="sm">
                Klikk på en kommune i listen for å se mer.
              </Paragraph>
              <PressureRanking
                areas={topPressureAreas}
                selectedRegionCode={area.regionCode}
                onSelect={onSelectArea}
              />
              <Paragraph data-size="sm">
                {area.regionCode &&
                topPressureAreas.some((entry) => entry.regionCode === area.regionCode)
                  ? `${area.municipality} er i de 10 høyest målte.`
                  : `${area.municipality} er ikke blant de 10 høyest målte. Se listen for nabokommuner.`}
              </Paragraph>
              <RankInDataset area={area} />
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
            Snitt for Norge: {formatValue(nationalAverage, indicator.unit)}
          </Paragraph>
        ) : null}
        {snapshot.rank !== null && snapshot.totalRanked > 0 && comparison !== "no-comparison" ? (
          <Paragraph data-size="sm">
            Plassering: {snapshot.rank} av {snapshot.totalRanked}
          </Paragraph>
        ) : null}
      </div>
      <p className={styles.indicatorDescription}>{indicator.description}</p>
    </div>
  );
}

function IndicatorComparisonChart({ area }: { area: AreaProfile }) {
  const comparableIndicators = area.indicators.filter(
    (snapshot) => snapshot.value !== null && snapshot.nationalAverage !== null,
  );

  if (!comparableIndicators.length) {
    return <Paragraph data-size="sm">Vi mangler nok data til å vise sammenligning akkurat nå.</Paragraph>;
  }

  return (
    <div className={styles.comparisonChart} role="list" aria-label={`Indikatorsammenligning for ${area.municipality}`}>
      {comparableIndicators.map((snapshot) => {
        const value = snapshot.value as number;
        const nationalAverage = snapshot.nationalAverage as number;
        const maxMagnitude = Math.max(Math.abs(value), Math.abs(nationalAverage), 1);

        return (
          <article key={snapshot.indicator.id} className={styles.comparisonRow} role="listitem">
            <Heading level={4} data-size="xs">
              {snapshot.indicator.shortLabel}
            </Heading>
            <div className={styles.comparisonBars}>
              <ComparisonBar
                label={area.municipality}
                value={value}
                unit={snapshot.indicator.unit}
                maxMagnitude={maxMagnitude}
                variant="area"
              />
              <ComparisonBar
                label="Norge"
                value={nationalAverage}
                unit={snapshot.indicator.unit}
                maxMagnitude={maxMagnitude}
                variant="national"
              />
            </div>
          </article>
        );
      })}
    </div>
  );
}

function ComparisonBar({
  label,
  value,
  unit,
  maxMagnitude,
  variant,
}: {
  label: string;
  value: number;
  unit: "percent" | "count" | "per-mille";
  maxMagnitude: number;
  variant: "area" | "national";
}) {
  const valueClassName = value < 0 ? styles.comparisonValueNegative : styles.comparisonValue;

  return (
    <div className={styles.comparisonBarRow}>
      <span className={styles.comparisonLabel}>{label}</span>
      <progress
        className={variant === "area" ? styles.comparisonTrackArea : styles.comparisonTrackNational}
        max={maxMagnitude}
        value={Math.abs(value)}
        aria-hidden
      />
      <span className={valueClassName}>{formatValue(value, unit)}</span>
    </div>
  );
}

function ActivityCoverageList({ area }: { area: AreaProfile }) {
  if (area.matchingBranchesCount === 0) {
    return (
      <Alert data-color="warning">
        <Heading level={4} data-size="xs">
          Ingen registrerte tilbud for fokusområdene
        </Heading>
        <Paragraph>
          I {area.municipality} finner vi ingen registrerte Røde Kors-tilbud innen barn og unge, integrering eller møteplasser. Det kan være aktuelt å samarbeide med nabokommuner.
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
              <span className={styles.activityMissing}>Ingen tilbud i denne kategorien</span>
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

function PressureGraph({
  areas,
  selectedRegionCode,
  onSelect,
}: {
  areas: AreaProfile[];
  selectedRegionCode: string;
  onSelect: (regionCode: string) => void;
}) {
  const graphAreas = [...areas]
    .filter((entry) => entry.pressureScore !== null)
    .sort((left, right) => (right.pressureScore ?? 0) - (left.pressureScore ?? 0))
    .slice(0, 15);

  if (!graphAreas.length) {
    return <Paragraph data-size="sm">Vi mangler nok data til å vise graf akkurat nå.</Paragraph>;
  }

  const maxScore = Math.max(...graphAreas.map((entry) => entry.pressureScore ?? 0), 1);

  return (
    <ol className={styles.pressureGraphList}>
      {graphAreas.map((entry, index) => {
        const isSelected = entry.regionCode === selectedRegionCode;

        return (
          <li key={entry.regionCode} className={isSelected ? styles.pressureGraphRowSelected : styles.pressureGraphRow}>
            <Button
              variant="tertiary"
              onClick={() => onSelect(entry.regionCode)}
              aria-pressed={isSelected}
            >
              <span className={styles.pressureGraphButtonContent}>
                <span className={styles.pressureGraphLabel}>
                  {index + 1}. {entry.municipality}
                </span>
                <progress
                  className={isSelected ? styles.pressureGraphTrackSelected : styles.pressureGraphTrack}
                  max={maxScore}
                  value={entry.pressureScore ?? 0}
                  aria-hidden
                />
                <span className={styles.pressureGraphValue}>
                  {formatValue(entry.pressureScore, "percent")}
                </span>
              </span>
            </Button>
          </li>
        );
      })}
    </ol>
  );
}

function RankInDataset({ area }: { area: AreaProfile }) {
  const lowIncome = area.indicators.find((s) => s.indicator.id === "low-income-children");
  if (!lowIncome || lowIncome.rank === null || lowIncome.totalRanked === 0) return null;

  return (
    <Paragraph data-size="sm">
      {area.municipality} er nummer {lowIncome.rank} på listen.
    </Paragraph>
  );
}

function SourceFootnote({ metadata }: { metadata: ApiResponse["metadata"] }) {
  return (
    <footer className={styles.sourceFootnote} aria-label="Kilder">
      <Heading level={2} data-size="xs">
        Kilder
      </Heading>
      <ul className={styles.sourceList}>
        {metadata.sources.map((source) => (
          <li key={source.id}>
            <Link href={source.url}>{source.label}</Link>
            <span className={styles.sourceMeta}>
              Oppdatert hos kilden: {formatDate(source.sourceUpdatedAt)}. Hentet inn: {formatDate(source.importedAt)}.
            </span>
          </li>
        ))}
      </ul>
      <Paragraph data-size="sm">
        <Link href="/om-tallene">Les mer om tallene og datakildene</Link>
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
        Ingen tall lastet inn
      </Heading>
      <Paragraph>{message}</Paragraph>
    </Alert>
  );
}

function EmptyState() {
  return (
    <Alert data-color="warning">
      <Heading level={2} data-size="sm">
        Ingen tall tilgjengelig
      </Heading>
      <Paragraph>
        Vi mangler datagrunnlag for denne visningen.
      </Paragraph>
    </Alert>
  );
}

function pressureLabel(band: AreaProfile["pressureBand"]) {
  if (band === "high") return "Stort behov";
  if (band === "moderate") return "Middels behov";
  if (band === "lower") return "Mindre behov";
  return "For lite data";
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
