"use client";

import { Button, Card, CardBlock, Heading, Paragraph } from "rk-designsystem";
import styles from "./page.module.css";

export default function Home() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <Heading level={1} data-size="xl">
          Røde Kors Designsystemet
        </Heading>
        <Paragraph data-size="lg">
          Start new Red Cross web apps with the design system, checked-in AI context,
          and local verification defaults already in place.
        </Paragraph>
      </section>

      <Card data-color="neutral">
        <CardBlock>
          <Heading level={2} data-size="md">
            Template ready
          </Heading>
          <Paragraph>
            This Next.js project is pre-configured with the Røde Kors Design
            System, design tokens, and React Compiler.
          </Paragraph>
          <div className={styles.actions}>
            <Button variant="primary" data-size="md">
              Get started
            </Button>
          </div>
        </CardBlock>
      </Card>

      <Card data-color="neutral">
        <CardBlock>
          <Heading level={2} data-size="md">
            Built for guided collaboration
          </Heading>
          <div className={styles.stack}>
            <Paragraph>
              Shared skills and rules live in the repo, while tool-specific outputs
              are generated with sync guards that stop on divergence.
            </Paragraph>
            <Paragraph>
              Refresh upstream guidance with `npm run guide:refresh` and verify changes
              with `npm run check:ai`.
            </Paragraph>
          </div>
        </CardBlock>
      </Card>
    </main>
  );
}
