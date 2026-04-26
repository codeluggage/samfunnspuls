"use client";

import {
  Button,
  Card,
  CardBlock,
  Details,
  Field,
  Heading,
  Paragraph,
  Select,
  Tag,
  Textfield,
} from "rk-designsystem";
import { CheckmarkCircleFillIcon, ClockDashedIcon, DatabaseFillIcon } from "@navikt/aksel-icons";
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
import { SiteHeader } from "../components/site-header";
import styles from "./page.module.css";

const filterOptions = getCatalogFilterOptions(SAMFUNNSPULS_CATALOG);

export default function OmTallenePage() {
  const initialState = getInitialCatalogState();
  const [query, setQuery] = useState(initialState.query);
  const [category, setCategory] = useState<CatalogCategory | "all">(initialState.category);
  const [source, setSource] = useState("all");
  const [valueType, setValueType] = useState<ValueType | "all">("all");
  const [status, setStatus] = useState<CatalogStatus | "all">("all");
  const [selectedSlug, setSelectedSlug] = useState(initialState.selectedSlug);

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
      <SiteHeader />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroDecor} aria-hidden />
          <div className={styles.heroInner}>
            <div className={styles.heroText}>
              <Tag data-color="primary-color-red">Om tallene</Tag>
              <Heading level={1} data-size="xl">
                Kildene vi bruker i Samfunnspuls
              </Heading>
              <Paragraph data-size="lg">
                Her finner du tallene bak kommuneprofilene. Søk på tema, tabellnummer eller kilde, for eksempel SSB, NAV, Udir eller IMDi.
              </Paragraph>
            </div>
            <div className={styles.heroStats} aria-label="Katalogstatus">
              <p className={styles.heroStatsValue}>{SAMFUNNSPULS_CATALOG.length}</p>
              <Paragraph data-size="sm">statistikker registrert</Paragraph>
            </div>
          </div>
        </section>

        <Card data-color="neutral">
          <CardBlock>
            <section className={styles.searchPanel} aria-label="Søk og filtrer datakatalogen">
              <Textfield
                id="catalog-search"
                name="catalog-search"
                label="Søk i dataoversikten"
                description="Eksempler: lav inntekt, 08764, NAV arbeidsledige eller sykehjem 12292."
                value={query}
                onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.target.value)}
              />

              <div className={styles.filters}>
                <Field>
                  <label htmlFor="catalog-category">Kategori</label>
                  <Select
                    id="catalog-category"
                    name="catalog-category"
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
                </Field>

                <Field>
                  <label htmlFor="catalog-source">Kilde</label>
                  <Select
                    id="catalog-source"
                    name="catalog-source"
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
                </Field>

                <Field>
                  <label htmlFor="catalog-value-type">Verditype</label>
                  <Select
                    id="catalog-value-type"
                    name="catalog-value-type"
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
                </Field>

                <Field>
                  <label htmlFor="catalog-status">Status for datakilden</label>
                  <Select
                    id="catalog-status"
                    name="catalog-status"
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
                </Field>
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
            {selectedResult ? <DetailPanel entry={selectedResult.entry} onRelatedSelect={setSelectedSlug} /> : null}
          </section>
        ) : (
          <Card data-color="neutral">
            <CardBlock>
              <div className={styles.emptyState}>
                <Heading level={2} data-size="md">
                  Ingen treff
                </Heading>
                <Paragraph>Prøv et bredere søk eller fjern filtre. Du kan også starte med et av disse:</Paragraph>
                <div className={styles.emptyExamples}>
                  {["lavinntekt", "NAV arbeidsledige", "sykehjem", "tilflytting", "08764"].map((term) => (
                    <Button
                      key={term}
                      variant="secondary"
                      data-size="sm"
                      onClick={() => {
                        setQuery(term);
                        setCategory("all");
                        setSource("all");
                        setValueType("all");
                        setStatus("all");
                      }}
                    >
                      {term}
                    </Button>
                  ))}
                  <Button
                    variant="tertiary"
                    data-size="sm"
                    onClick={() => {
                      setQuery("");
                      setCategory("all");
                      setSource("all");
                      setValueType("all");
                      setStatus("all");
                    }}
                  >
                    Nullstill alt
                  </Button>
                </div>
              </div>
            </CardBlock>
          </Card>
        )}
      </main>
    </>
  );
}

function getInitialCatalogState(): {
  query: string;
  category: CatalogCategory | "all";
  selectedSlug: string;
} {
  if (typeof window === "undefined") {
    return { query: "", category: "all", selectedSlug: "lavinntekt" };
  }

  const params = new URLSearchParams(window.location.search);
  const categoryParam = params.get("category");
  const datasetParam = params.get("datasett");

  return {
    query: params.get("q") ?? "",
    category:
      categoryParam && filterOptions.categories.includes(categoryParam as CatalogCategory)
        ? (categoryParam as CatalogCategory)
        : "all",
    selectedSlug:
      datasetParam && SAMFUNNSPULS_CATALOG.some((entry) => entry.slug === datasetParam)
        ? datasetParam
        : "lavinntekt",
  };
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
    <div className={isSelected ? styles.resultItemSelected : styles.resultItem}>
      <Card data-color="neutral">
        <CardBlock>
          <article className={styles.resultCard}>
            <div className={styles.resultTitle}>
              <div className={styles.tagRow}>
                <StatusTag status={entry.status} />
                {isSelected ? <Tag data-color="primary-color-red">Valgt</Tag> : null}
              </div>
              <Heading level={3} data-size="sm">
                {entry.title}
              </Heading>
            </div>
            <Paragraph data-size="sm">{entry.summary ?? "Ikke registrert ennå"}</Paragraph>
            <div className={styles.tagList} aria-label={`Metadata for ${entry.title}`}>
              <Tag data-color="neutral">{entry.category}</Tag>
              <Tag data-color="neutral">{entry.source}</Tag>
              {entry.ssbTables?.map((table) => (
                <Tag key={table.id} data-color="info">
                  SSB {table.id}
                </Tag>
              ))}
            </div>
            {!isSelected && (
              <Button variant="secondary" data-size="sm" onClick={onSelect}>
                Se detaljer
              </Button>
            )}
          </article>
        </CardBlock>
      </Card>
    </div>
  );
}

function DetailPanel({ entry, onRelatedSelect }: { entry: SamfunnspulsCatalogEntry; onRelatedSelect: (slug: string) => void }) {
  return (
    <aside className={styles.detailPanel} aria-label={`Detaljer for ${entry.title}`}>
      <Card data-color="neutral">
        <CardBlock>
          <div className={styles.detailStack}>
            <div className={styles.resultTitle}>
              <StatusTag status={entry.status} />
              <Heading level={2} data-size="lg">
                {entry.title}
              </Heading>
            </div>
            <Paragraph>{entry.summary ?? "Ikke registrert ennå"}</Paragraph>

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
                <dt>Slik hentes tallene</dt>
                <dd>{sourceDetails(entry)}</dd>
              </div>
            </dl>

            <section className={styles.sectionStack} aria-label="Emneknagger">
              <Heading level={3} data-size="sm">
                Emner
              </Heading>
              <div className={styles.tagList}>
                {entry.tags.map((tag) => (
                  <Tag key={tag} data-color="neutral">
                    {tag}
                  </Tag>
                ))}
              </div>
            </section>

            <RelatedStatistics entry={entry} onRelatedSelect={onRelatedSelect} />
            <AboutNumbers entry={entry} />
          </div>
        </CardBlock>
      </Card>
    </aside>
  );
}

function RelatedStatistics({
  entry,
  onRelatedSelect,
}: {
  entry: SamfunnspulsCatalogEntry;
  onRelatedSelect: (slug: string) => void;
}) {
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
            {related.slug ? (
              <Button data-size="sm" variant="secondary" onClick={() => onRelatedSelect(related.slug!)}>
                {related.title}
              </Button>
            ) : (
              <span>{related.title}</span>
            )}
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
          <Paragraph>Ikke registrert ennå.</Paragraph>
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
      <dd>{value ?? "Ikke registrert ennå"}</dd>
    </div>
  );
}

function StatusTag({ status }: { status: CatalogStatus }) {
  if (status === "integrated") {
    return (
      <Tag data-color="success">
        <CheckmarkCircleFillIcon aria-hidden fontSize="0.875rem" />
        <span className={styles.srOnly}>Klar i løsningen</span>
      </Tag>
    );
  }
  if (status === "api-known") {
    return (
      <Tag data-color="info">
        <DatabaseFillIcon aria-hidden fontSize="0.875rem" />
        <span className={styles.srOnly}>Datakilde funnet</span>
      </Tag>
    );
  }
  return (
    <Tag data-color="neutral">
      <ClockDashedIcon aria-hidden fontSize="0.875rem" />
      <span className={styles.srOnly}>Ikke tilgjengelig ennå</span>
    </Tag>
  );
}

function sourceDetails(entry: SamfunnspulsCatalogEntry) {
  const parts = [
    ...(entry.ssbTables?.map((table) => `SSB ${table.id}`) ?? []),
    ...(entry.otherApiHints ?? []),
  ].filter(Boolean);

  return parts.length ? parts.join(", ") : "Ikke registrert ennå";
}

function statusLabel(statusValue: CatalogStatus) {
  if (statusValue === "integrated") return "Klar i løsningen";
  if (statusValue === "api-known") return "Datakilde funnet";
  return "Ingen data tilgjengelig ennå";
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
