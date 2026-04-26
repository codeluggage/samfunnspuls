"use client";

import {
  Button,
  Card,
  CardBlock,
  CrossCorner,
  Heading,
  Link,
  Paragraph,
  Tag,
} from "rk-designsystem";
import { getViewCards } from "@/lib/app-navigation";
import { SiteHeader } from "./components/site-header";
import styles from "./page.module.css";

export default function HomePage() {
  const viewCards = getViewCards();
  const [featured, ...secondary] = viewCards;

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
              Planlegg aktiviteter der behovet er størst
            </Heading>
            <Paragraph data-size="lg">
              Samfunnspuls kombinerer åpne samfunnsdata med Røde Kors-aktiviteter, slik at du kan finne kommuner med størst humanitært behov og se hva som allerede tilbys der.
            </Paragraph>
            <div className={styles.heroActions}>
              <Button asChild variant="primary">
                <a href="/aktivitetsradar">Åpne aktivitetsradar</a>
              </Button>
              <Link href="/utforsk-data">Utforsk datagrunnlaget</Link>
            </div>
          </div>
        </section>

        <section className={styles.viewGrid} aria-label="Analyser og datasett">
          <div className={styles.sectionHeader}>
            <Heading level={2} data-size="lg">
              Analyser og datasett
            </Heading>
            <Paragraph>
              Start med aktivitetsradaren for lokal planlegging, eller utforsk rådata etter kategori.
            </Paragraph>
          </div>

          {featured ? (
            <Card data-color="neutral">
              <CardBlock>
                <div className={styles.featuredInner}>
                  <div className={styles.featuredMeta}>
                    <Tag data-color="success">{featured.status}</Tag>
                    <Heading level={3} data-size="lg">
                      {featured.title}
                    </Heading>
                    <Paragraph data-size="lg">{featured.description}</Paragraph>
                    <div className={styles.tagList} aria-label={`Emner for ${featured.title}`}>
                      {featured.tags.map((tag) => (
                        <Tag key={tag} data-color="neutral">
                          {tag}
                        </Tag>
                      ))}
                    </div>
                  </div>
                  <div className={styles.featuredAction}>
                    <Button asChild variant="primary">
                      <a href={featured.href}>Åpne aktivitetsradar</a>
                    </Button>
                  </div>
                </div>
              </CardBlock>
            </Card>
          ) : null}

          {secondary.length > 0 ? (
            <div className={styles.cards}>
              {secondary.map((card) => (
                <Card key={card.href} data-color="neutral">
                  <CardBlock>
                    <article className={styles.viewCard}>
                      <div className={styles.viewCardHeader}>
                        <Tag data-color={card.status === "Utforsk data" ? "info" : "neutral"}>{card.status}</Tag>
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
          ) : null}
        </section>
      </main>
    </>
  );
}
