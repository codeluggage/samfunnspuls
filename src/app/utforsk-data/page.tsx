"use client";

import {
  Badge,
  Button,
  Card,
  CardBlock,
  Details,
  Header,
  Heading,
  Link,
  Paragraph,
  Select,
  Tag,
  Textfield,
} from "rk-designsystem";
import { type ChangeEvent, useMemo, useState } from "react";
import {
  SAMFUNNSPULS_CATALOG,
  type CatalogCategory,
  type CatalogStatus,
  type SamfunnspulsCatalogEntry,
  type ValueType,
} from "@/lib/samfunnspuls/catalog";
import {
  getCatalogFilterOptions,
  searchCatalog,
  type CatalogSearchResult,
} from "@/lib/samfunnspuls/search";
import styles from "./page.module.css";

const filterOptions = getCatalogFilterOptions(SAMFUNNSPULS_CATALOG);

export default function UtforskDataPage() {
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<CatalogCategory | "all">("all");
  const [source, setSource] = useState("all");
  const [valueType, setValueType] = useState<ValueType | "all">("all");
  const [status, setStatus] = useState<CatalogStatus | "all">("all");
  const [selectedSlug, setSelectedSlug] = useState("lavinntekt");

  const results = useMemo(
    () =>
      searchCatalog(SAMFUNNSPULS_CATALOG, {
        query,
        filters: { category, source, valueType, status },
      }),
    [category, query, source, status, valueType],
  );
  const selectedResult = results.find((result) => result.entry.slug === selectedSlug) ?? results[0] ?? null;

  return (
    <>
      <Header
        data-color="primary"
        activePage="Utforsk data"
        navItems={[
          { label: "Aktivitetsradar", href: "/" },
          { label: "Utforsk data", href: "/utforsk-data" },
        ]}
        showHeaderExtension
        showNavItems
        showMenuButton={false}
        showSearch={false}
        showLogin={false}
        showUser={false}
        showThemeToggle={false}
      />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroText}>
            <Badge data-color="info">Datakatalog</Badge>
            <Heading level={1} data-size="xl">
              Utforsk samfunnsdata på tvers av kilder
            </Heading>
            <Paragraph data-size="lg">
              Søk etter tema, tabellnummer, kilde eller forklarende tekst for å finne relevante datasett.
            </Paragraph>
          </div>
          <div className={styles.heroStats} aria-label="Katalogstatus">
            <strong>{SAMFUNNSPULS_CATALOG.length}</strong>
            <span>statistikker kartlagt</span>
          </div>
        </section>

        <Card data-color="neutral">
          <CardBlock>
            <section className={styles.searchPanel} aria-label="Søk og filtrer datakatalogen">
              <Textfield
                id="catalog-search"
                name="catalog-search"
                label="Søk i datakatalogen"
                description="Prøv for eksempel lavinntekt, 08764, NAV arbeidsledige eller sykehjem 12292."
                value={query}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              />

              <div className={styles.filters}>
                <Select
                  id="catalog-category"
                  name="catalog-category"
                  aria-label="Filtrer på kategori"
                  value={category}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => setCategory(event.target.value as CatalogCategory | "all")}
                >
                  <option value="all">Alle kategorier</option>
                  {filterOptions.categories.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>

                <Select
                  id="catalog-source"
                  name="catalog-source"
                  aria-label="Filtrer på kilde"
                  value={source}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => setSource(event.target.value)}
                >
                  <option value="all">Alle kilder</option>
                  {filterOptions.sources.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </Select>

                <Select
                  id="catalog-value-type"
                  name="catalog-value-type"
                  aria-label="Filtrer på verdi"
                  value={valueType}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => setValueType(event.target.value as ValueType | "all")}
                >
                  <option value="all">Alle verdityper</option>
                  {filterOptions.valueTypes.map((option) => (
                    <option key={option} value={option}>
                      {valueTypeLabel(option)}
                    </option>
                  ))}
                </Select>

                <Select
                  id="catalog-status"
                  name="catalog-status"
                  aria-label="Filtrer på datastatus"
                  value={status}
                  onChange={(event: ChangeEvent<HTMLSelectElement>) => setStatus(event.target.value as CatalogStatus | "all")}
                >
                  <option value="all">Alle statuser</option>
                  {filterOptions.statuses.map((option) => (
                    <option key={option} value={option}>
                      {statusLabel(option)}
                    </option>
                  ))}
                </Select>
              </div>
            </section>
          </CardBlock>
        </Card>

        <section className={styles.resultsHeader} aria-live="polite">
          <Heading level={2} data-size="md">
            {results.length} treff
          </Heading>
          <Button
            variant="secondary"
            data-size="sm"
            onClick={() => {
              setQuery("");
              setCategory("all");
              setSource("all");
              setValueType("all");
              setStatus("all");
            }}
          >
            Nullstill filtre
          </Button>
        </section>

        {results.length ? (
          <section className={styles.resultsLayout} aria-label="Søkeresultater og detaljer">
            <div className={styles.resultList}>
              {results.map((result) => (
                <ResultCard
                  key={result.entry.slug}
                  result={result}
                  isSelected={result.entry.slug === selectedResult?.entry.slug}
                  onSelect={() => setSelectedSlug(result.entry.slug)}
                />
              ))}
            </div>
            {selectedResult ? <DetailPanel entry={selectedResult.entry} /> : null}
          </section>
        ) : (
          <Card data-color="neutral">
            <CardBlock>
              <div className={styles.emptyState}>
                <Heading level={2} data-size="md">
                  Ingen treff
                </Heading>
                <Paragraph>Prøv et bredere søk, fjern et filter, eller søk etter kilde som SSB, NAV, Udir eller IMDi.</Paragraph>
              </div>
            </CardBlock>
          </Card>
        )}
      </main>
    </>
  );
}

function ResultCard({
  result,
  isSelected,
  onSelect,
}: {
  result: CatalogSearchResult;
  isSelected: boolean;
  onSelect: () => void;
}) {
  const entry = result.entry;

  return (
    <Card data-color={isSelected ? "info" : "neutral"}>
      <CardBlock>
        <article className={styles.resultCard}>
          <div className={styles.resultTitle}>
            <Tag data-color={statusColor(entry.status)}>{statusLabel(entry.status)}</Tag>
            <Heading level={3} data-size="sm">
              {entry.title}
            </Heading>
          </div>
          <Paragraph data-size="sm">{entry.summary ?? "Ikke kartlagt ennå"}</Paragraph>
          <div className={styles.tagList} aria-label={`Metadata for ${entry.title}`}>
            <Badge data-color="neutral">{entry.category}</Badge>
            <Badge data-color="neutral">{entry.source}</Badge>
            {entry.ssbTables?.map((table) => (
              <Badge key={table.id} data-color="info">
                SSB {table.id}
              </Badge>
            ))}
          </div>
          <Button variant={isSelected ? "primary" : "secondary"} data-size="sm" onClick={onSelect}>
            Vis detaljer
          </Button>
        </article>
      </CardBlock>
    </Card>
  );
}

function DetailPanel({ entry }: { entry: SamfunnspulsCatalogEntry }) {
  return (
    <aside className={styles.detailPanel} aria-label={`Detaljer for ${entry.title}`}>
      <Card data-color="neutral">
        <CardBlock>
          <div className={styles.detailStack}>
            <div className={styles.resultTitle}>
              <Tag data-color={statusColor(entry.status)}>{statusLabel(entry.status)}</Tag>
              <Heading level={2} data-size="lg">
                {entry.title}
              </Heading>
            </div>
            <Paragraph>{entry.summary ?? "Ikke kartlagt ennå"}</Paragraph>

            <dl className={styles.metaList}>
              <div>
                <dt>Kategori</dt>
                <dd>{entry.category}</dd>
              </div>
              <div>
                <dt>Kilde</dt>
                <dd>{entry.source}</dd>
              </div>
              <div>
                <dt>Geografi</dt>
                <dd>{entry.geographies.map(geographyLabel).join(", ")}</dd>
              </div>
              <div>
                <dt>Tid</dt>
                <dd>{entry.timeDimensions.map(timeDimensionLabel).join(", ")}</dd>
              </div>
              <div>
                <dt>Verdier</dt>
                <dd>{entry.valueTypes.map(valueTypeLabel).join(", ")}</dd>
              </div>
              <div>
                <dt>Datakobling</dt>
                <dd>{sourceDetails(entry)}</dd>
              </div>
            </dl>

            <section className={styles.sectionStack} aria-label="Emneknagger">
              <Heading level={3} data-size="sm">
                Emner
              </Heading>
              <div className={styles.tagList}>
                {entry.tags.map((tag) => (
                  <Badge key={tag} data-color="neutral">
                    {tag}
                  </Badge>
                ))}
              </div>
            </section>

            <RelatedStatistics entry={entry} />
            <AboutNumbers entry={entry} />
          </div>
        </CardBlock>
      </Card>
    </aside>
  );
}

function RelatedStatistics({ entry }: { entry: SamfunnspulsCatalogEntry }) {
  if (!entry.relatedStatistics?.length) {
    return null;
  }

  return (
    <section className={styles.sectionStack}>
      <Heading level={3} data-size="sm">
        Relatert statistikk
      </Heading>
      <ul className={styles.linkList}>
        {entry.relatedStatistics.map((related) => (
          <li key={related.title}>
            {related.path ? <Link href={related.path}>{related.title}</Link> : <span>{related.title}</span>}
          </li>
        ))}
      </ul>
    </section>
  );
}

function AboutNumbers({ entry }: { entry: SamfunnspulsCatalogEntry }) {
  const about = entry.aboutNumbers;

  if (!about) {
    return (
      <Details data-color="neutral">
        <Details.Summary>Om tallene</Details.Summary>
        <Details.Content>
          <Paragraph>Ikke kartlagt ennå.</Paragraph>
        </Details.Content>
      </Details>
    );
  }

  return (
    <Details data-color="neutral" defaultOpen>
      <Details.Summary>Om tallene</Details.Summary>
      <Details.Content>
        <dl className={styles.metaList}>
          <OptionalMeta label="Statistikkens navn" value={about.statisticName} />
          <OptionalMeta label="Kilde" value={about.sourceDescription} />
          <OptionalMeta label="Type" value={about.dataType} />
          <OptionalMeta label="Telletidspunkt" value={about.countDate} />
          <OptionalMeta label="Innhenting" value={about.collectionMethod} />
        </dl>
        {about.definitions?.length ? (
          <div className={styles.definitionList}>
            {about.definitions.map((definition) => (
              <Paragraph key={definition} data-size="sm">
                {definition}
              </Paragraph>
            ))}
          </div>
        ) : null}
        {about.references?.length ? (
          <div className={styles.sectionStack}>
            <Heading level={4} data-size="xs">
              Referanser
            </Heading>
            <ul className={styles.linkList}>
              {about.references.map((reference) => (
                <li key={reference}>{reference}</li>
              ))}
            </ul>
          </div>
        ) : null}
      </Details.Content>
    </Details>
  );
}

function OptionalMeta({ label, value }: { label: string; value: string | undefined }) {
  return (
    <div>
      <dt>{label}</dt>
      <dd>{value ?? "Ikke kartlagt ennå"}</dd>
    </div>
  );
}

function sourceDetails(entry: SamfunnspulsCatalogEntry) {
  const parts = [
    ...(entry.ssbTables?.map((table) => `SSB ${table.id}`) ?? []),
    entry.powerBiReportId ? "Power BI rapport-ID kjent" : null,
    ...(entry.otherApiHints ?? []),
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Ikke kartlagt ennå";
}

function statusLabel(statusValue: CatalogStatus) {
  if (statusValue === "integrated") return "Integrert";
  if (statusValue === "api-known") return "API kjent";
  return "Metadata";
}

function statusColor(statusValue: CatalogStatus) {
  if (statusValue === "integrated") return "success";
  if (statusValue === "api-known") return "info";
  return "neutral";
}

function valueTypeLabel(value: ValueType) {
  const labels: Record<ValueType, string> = {
    count: "Antall",
    percent: "Prosent",
    rate: "Rate",
    kroner: "Kroner",
    duration: "Varighet",
    unknown: "Ukjent",
  };
  return labels[value];
}

function geographyLabel(value: SamfunnspulsCatalogEntry["geographies"][number]) {
  const labels: Record<SamfunnspulsCatalogEntry["geographies"][number], string> = {
    municipality: "kommune",
    county: "fylke",
    norway: "Norge",
    school: "skole",
    branch: "lokalforening",
    unknown: "ukjent",
  };
  return labels[value];
}

function timeDimensionLabel(value: SamfunnspulsCatalogEntry["timeDimensions"][number]) {
  const labels: Record<SamfunnspulsCatalogEntry["timeDimensions"][number], string> = {
    year: "år",
    month: "måned",
    "school-year": "skoleår",
    "count-date": "telletidspunkt",
    unknown: "ukjent",
  };
  return labels[value];
}
