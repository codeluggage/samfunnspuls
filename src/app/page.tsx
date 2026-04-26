"use client";

import {
  Card,
  CardBlock,
  CrossCorner,
  Heading,
  Link,
  Paragraph,
  Table,
  Tag,
} from "rk-designsystem";
import { getViewCards } from "@/lib/app-navigation";
import { SAMFUNNSPULS_CATALOG, type CatalogStatus } from "@/lib/samfunnspuls/catalog";
import { SiteHeader } from "./components/site-header";
import styles from "./page.module.css";

const statusLabels: Record<CatalogStatus, string> = {
  integrated: "Integrert",
  "api-known": "API kjent",
  "metadata-only": "Metadata",
};

export default function HomePage() {
  const viewCards = getViewCards();
  const categoryRows = summarizeBy(SAMFUNNSPULS_CATALOG, (entry) => entry.category);
  const statusRows = summarizeBy(SAMFUNNSPULS_CATALOG, (entry) => statusLabels[entry.status]);
  const sourceRows = summarizeBy(SAMFUNNSPULS_CATALOG, (entry) => entry.source).slice(0, 6);
  const maxCategoryCount = Math.max(...categoryRows.map((row) => row.count));

  return (
    <>
      <SiteHeader />

      <main className={styles.main}>
        <section className={styles.hero}>
          <div className={styles.heroDecor} aria-hidden />
          <CrossCorner
            data-color="primary-color-red"
            data-size="md"
            position="top-left"
            aria-hidden
          />
          <div className={styles.heroText}>
            <Tag data-color="primary-color-red">Samfunnspuls</Tag>
            <Heading level={1} data-size="xl">
              Data for lokal humanitær planlegging
            </Heading>
            <Paragraph data-size="lg">
              Søk i åpne samfunnsdata, se datagrunnlaget bak Samfunnspuls og åpne analyser som kombinerer behov med Røde Kors-aktivitet.
            </Paragraph>
          </div>
        </section>

        <section className={styles.viewGrid} aria-label="Direkte visninger">
          <div className={styles.sectionHeader}>
            <Heading level={2} data-size="lg">
              Direkte visninger
            </Heading>
            <Paragraph>Start med en analyse, eller gå til rådatakatalogen når du trenger å finne et konkret datasett.</Paragraph>
          </div>
          <div className={styles.cards}>
            {viewCards.map((card) => (
              <Card key={card.href} data-color="neutral">
                <CardBlock>
                  <article className={styles.viewCard}>
                    <div className={styles.viewCardHeader}>
                      <Tag data-color={card.status === "Klar" ? "success" : "neutral"}>{card.status}</Tag>
                      <Heading level={3} data-size="md">
                        <Link href={card.href}>{card.title}</Link>
                      </Heading>
                    </div>
                    <Paragraph>{card.description}</Paragraph>
                    <div className={styles.tagList} aria-label={`Emner for ${card.title}`}>
                      {card.tags.map((tag) => (
                        <Tag key={tag} data-color="neutral">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </article>
                </CardBlock>
              </Card>
            ))}
          </div>
        </section>

        <section className={styles.dataBand} aria-label="Datagrunnlag i katalogen">
          <div className={styles.sectionHeader}>
            <Heading level={2} data-size="lg">
              Datagrunnlag i katalogen
            </Heading>
            <Paragraph>
              Katalogen inneholder {SAMFUNNSPULS_CATALOG.length} kartlagte statistikker fra Samfunnspuls. Noen er integrert, flere har kjente API-kilder, og resten er klare for videre innhenting.
            </Paragraph>
          </div>

          <div className={styles.tableGrid}>
            <Card data-color="neutral">
              <CardBlock>
                <div className={styles.tableStack}>
                  <Heading level={3} data-size="md">
                    Kategorier
                  </Heading>
                  <Table data-size="sm" zebra>
                    <thead>
                      <tr>
                        <th>Kategori</th>
                        <th>Antall</th>
                        <th>Andel</th>
                      </tr>
                    </thead>
                    <tbody>
                      {categoryRows.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>
                          <td>{row.count}</td>
                          <td>
                            <span className={styles.barTrack} aria-label={`${row.count} datasett`}>
                              <span className={`${styles.barFill} ${barFillClass(row.count, maxCategoryCount)}`} />
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBlock>
            </Card>

            <Card data-color="neutral">
              <CardBlock>
                <div className={styles.tableStack}>
                  <Heading level={3} data-size="md">
                    Datastatus og kilder
                  </Heading>
                  <Table data-size="sm" zebra>
                    <thead>
                      <tr>
                        <th>Type</th>
                        <th>Antall</th>
                      </tr>
                    </thead>
                    <tbody>
                      {statusRows.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>
                          <td>{row.count}</td>
                        </tr>
                      ))}
                      {sourceRows.map((row) => (
                        <tr key={row.label}>
                          <td>{row.label}</td>
                          <td>{row.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </CardBlock>
            </Card>
          </div>
        </section>
      </main>
    </>
  );
}

function barFillClass(count: number, maxCount: number) {
  const ratio = count / maxCount;

  if (ratio >= 1) return styles.barFillFull;
  if (ratio >= 0.45) return styles.barFillMedium;
  if (ratio >= 0.2) return styles.barFillSmall;
  return styles.barFillTiny;
}

function summarizeBy<T>(items: T[], getLabel: (item: T) => string) {
  const counts = new Map<string, number>();

  for (const item of items) {
    const label = getLabel(item);
    counts.set(label, (counts.get(label) ?? 0) + 1);
  }

  return [...counts]
    .map(([label, count]) => ({ label, count }))
    .sort((left, right) => right.count - left.count || left.label.localeCompare(right.label, "nb-NO"));
}
