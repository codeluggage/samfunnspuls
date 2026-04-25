"use client";

import {
  Alert,
  Button,
  Card,
  CardBlock,
  Field,
  Heading,
  Link,
  Paragraph,
  SkeletonLoader,
  Suggestion,
  Table,
  Tag,
} from "rk-designsystem";
import { type ComponentProps, useEffect, useMemo, useState } from "react";
import { SiteHeader } from "./components/site-header";
import styles from "./page.module.css";

type PlanningSignalLevel =
  | "high-covered"
  | "high-limited"
  | "moderate-covered"
  | "moderate-limited"
  | "lower";

type AreaPlan = {
  regionCode: string;
  municipality: string;
  county: string | null;
  year: string;
  childrenCount: number | null;
  lowIncomePercent: number | null;
  activeBranchesCount: number;
  matchingBranchesCount: number;
  topRelevantActivities: Array<{ activityName: string; branchesCount: number }>;
  branches: Array<{
    branchId: string;
    branchName: string;
    county: string | null;
    municipality: string | null;
    relevantActivities: string[];
    allActivitiesCount: number;
    email?: string | null;
    phone?: string | null;
    web?: string | null;
  }>;
  planningSignal: {
    level: PlanningSignalLevel;
    title: string;
    summary: string;
  };
  source: {
    ssbTable: "08764";
    ssbUpdatedAt: string | null;
    importedAt: string;
  };
};

type ApiResponse = {
  areas: AreaPlan[];
  metadata: {
    generatedAt: string;
    sources: Array<{
      id: string;
      label: string;
      url: string;
      source_updated_at: string | null;
      imported_at: string;
    }>;
  };
};

type AreaSuggestion = {
  label: string;
  value: string;
};

type SuggestionSelectedChange = NonNullable<ComponentProps<typeof Suggestion>["onSelectedChange"]>;

export default function Home() {
  const [areas, setAreas] = useState<AreaPlan[]>([]);
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
  const areaOptions = useMemo(
    () =>
      [...areas]
        .sort((left, right) => formatAreaName(left).localeCompare(formatAreaName(right), "nb-NO"))
        .map((area) => ({ label: formatAreaName(area), value: area.regionCode })),
    [areas],
  );
  const selectedAreaOption = areaOptions.find((option) => option.value === selectedRegionCode);
  const topAreas = areas.slice(0, 6);

  function handleAreaSuggestionChange(selected: unknown) {
    if (!selected || Array.isArray(selected) || typeof selected !== "object") {
      return;
    }

    const option = selected as Partial<AreaSuggestion>;
    if (typeof option.value === "string") {
      setSelectedRegionCode(option.value);
    }
  }

  return (
    <>
      <SiteHeader />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <Heading level={1} data-size="xl">
              Aktivitetsradar for lokale humanitære behov
            </Heading>
            <Paragraph data-size="lg">
              Sammenlign barn og unge i lavinntekt med eksisterende Røde Kors-aktiviteter i kommunen.
            </Paragraph>
          </div>
          {metadata ? <SourcePanel metadata={metadata} /> : null}
        </section>

        {status === "loading" ? <LoadingState /> : null}
        {status === "error" ? <ErrorState message={error} /> : null}
        {status === "empty" ? <EmptyState /> : null}
        {status === "ready" && selectedArea ? (
          <section className={styles.dashboard} aria-label="Lokal planleggingsoversikt">
            <Card data-color="neutral">
              <CardBlock>
                <div className={styles.filterBar}>
                  <div>
                    <Heading level={2} data-size="md">
                      Velg kommune
                    </Heading>
                    <Paragraph>
                      {areas.length} kommuner med både SSB-indikator og minst én lokal Røde Kors-forening.
                    </Paragraph>
                  </div>
                  <Field>
                    <label htmlFor="municipality-search">Søk kommune</label>
                    <Suggestion
                      filter
                      name="municipality"
                      selected={selectedAreaOption}
                      onSelectedChange={handleAreaSuggestionChange as SuggestionSelectedChange}
                    >
                      <Suggestion.Input id="municipality-search" />
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
                </div>
              </CardBlock>
            </Card>

            <section className={styles.summaryGrid} aria-label={`Nøkkeltall for ${selectedArea.municipality}`}>
              <MetricCard
                label="Barn i lavinntekt"
                value={formatPercent(selectedArea.lowIncomePercent)}
                detail={`SSB ${selectedArea.year}, EU-skala 60 prosent`}
              />
              <MetricCard
                label="Barn under 18 år"
                value={formatNumber(selectedArea.childrenCount)}
                detail="Privathusholdninger i valgt kommune"
              />
              <MetricCard
                label="Aktive lokalforeninger"
                value={String(selectedArea.activeBranchesCount)}
                detail="Fra Røde Kors organisasjonsdata"
              />
              <MetricCard
                label="Relevante aktivitetstreff"
                value={String(selectedArea.matchingBranchesCount)}
                detail="Barn, ungdom, møteplasser og integrering"
              />
            </section>

            <div className={styles.twoColumn}>
              <Card data-color="neutral">
                <CardBlock>
                  <div className={styles.cardStack}>
                    <Tag data-color={signalColor(selectedArea.planningSignal.level)}>
                      {selectedArea.planningSignal.title}
                    </Tag>
                    <Heading level={2} data-size="lg">
                      {selectedArea.municipality}
                      {selectedArea.county ? `, ${selectedArea.county}` : ""}
                    </Heading>
                    <Paragraph>{selectedArea.planningSignal.summary}</Paragraph>
                    <div className={styles.tagList} aria-label="Relevante aktiviteter">
                      {selectedArea.topRelevantActivities.length ? (
                        selectedArea.topRelevantActivities.map((activity) => (
                          <Tag key={activity.activityName} data-color="neutral">
                            {activity.activityName}: {activity.branchesCount}
                          </Tag>
                        ))
                      ) : (
                        <Paragraph>Ingen relevante aktivitetstreff i de valgte kategoriene.</Paragraph>
                      )}
                    </div>
                  </div>
                </CardBlock>
              </Card>

              <Card data-color="neutral">
                <CardBlock>
                  <div className={styles.cardStack}>
                    <Heading level={2} data-size="md">
                      Kommuner med høyest utslag
                    </Heading>
                    <div className={styles.rankList}>
                      {topAreas.map((area) => (
                        <Button
                          key={area.regionCode}
                          variant={area.regionCode === selectedArea.regionCode ? "primary" : "secondary"}
                          data-size="sm"
                          onClick={() => setSelectedRegionCode(area.regionCode)}
                        >
                          {area.municipality} {formatPercent(area.lowIncomePercent)}
                        </Button>
                      ))}
                    </div>
                  </div>
                </CardBlock>
              </Card>
            </div>

            <Card data-color="neutral">
              <CardBlock>
                <div className={styles.cardStack}>
                  <Heading level={2} data-size="md">
                    Lokale foreninger og aktivitetstreff
                  </Heading>
                  <div className={styles.tableWrap}>
                    <Table data-size="sm" zebra hover>
                      <thead>
                        <tr>
                          <th>Forening</th>
                          <th>Relevante aktiviteter</th>
                          <th>Kontakt</th>
                        </tr>
                      </thead>
                      <tbody>
                        {selectedArea.branches.map((branch) => (
                          <tr key={branch.branchId}>
                            <td>{branch.branchName}</td>
                            <td>
                              {branch.relevantActivities.length
                                ? branch.relevantActivities.join(", ")
                                : "Ingen treff i valgte kategorier"}
                            </td>
                            <td>
                              {branch.web ? (
                                <Link href={branch.web}>Nettside</Link>
                              ) : branch.email ? (
                                <Link href={`mailto:${branch.email}`}>E-post</Link>
                              ) : (
                                "Ikke oppgitt"
                              )}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </div>
              </CardBlock>
            </Card>
          </section>
        ) : null}
      </main>
    </>
  );
}

function MetricCard({ label, value, detail }: { label: string; value: string; detail: string }) {
  return (
    <Card data-color="neutral">
      <CardBlock>
        <div className={styles.metric}>
          <span>{label}</span>
          <strong>{value}</strong>
          <Paragraph data-size="sm">{detail}</Paragraph>
        </div>
      </CardBlock>
    </Card>
  );
}

function SourcePanel({ metadata }: { metadata: ApiResponse["metadata"] }) {
  const ssbSource = metadata.sources.find((source) => source.id === "ssb-08764");
  const orgSource = metadata.sources.find((source) => source.id === "red-cross-organizations");

  return (
    <Card data-color="neutral">
      <CardBlock>
        <div className={styles.sourcePanel}>
          <Heading level={2} data-size="sm">
            Datagrunnlag
          </Heading>
          <Paragraph data-size="sm">SSB tabell 08764 oppdatert {formatDate(ssbSource?.source_updated_at)}.</Paragraph>
          <Paragraph data-size="sm">
            Organisasjonsdata fra Røde Kors API-uttak {formatDate(orgSource?.source_updated_at)}.
          </Paragraph>
          <Paragraph data-size="sm">Sist synkronisert {formatDate(ssbSource?.imported_at)}.</Paragraph>
        </div>
      </CardBlock>
    </Card>
  );
}

function LoadingState() {
  return (
    <section className={styles.summaryGrid} aria-label="Laster planleggingsdata">
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
        Ingen planleggingsdata
      </Heading>
      <Paragraph>Kjør lokal Supabase og importer data før dashboardet åpnes.</Paragraph>
    </Alert>
  );
}

function formatPercent(value: number | null) {
  return value === null ? "Ikke oppgitt" : `${value.toLocaleString("nb-NO", { maximumFractionDigits: 1 })} %`;
}

function formatNumber(value: number | null) {
  return value === null ? "Ikke oppgitt" : value.toLocaleString("nb-NO");
}

function formatDate(value: string | null | undefined) {
  if (!value) return "ikke oppgitt";
  return new Intl.DateTimeFormat("nb-NO", { dateStyle: "medium" }).format(new Date(value));
}

function formatAreaName(area: AreaPlan) {
  return `${area.municipality}${area.county ? `, ${area.county}` : ""}`;
}

function findDefaultArea(areas: AreaPlan[]) {
  return areas.find((area) => area.municipality === "Oslo") ?? areas[0];
}

function signalColor(level: PlanningSignalLevel) {
  if (level === "high-covered") return "success";
  if (level === "high-limited") return "warning";
  if (level === "moderate-covered") return "info";
  if (level === "moderate-limited") return "warning";
  return "neutral";
}
