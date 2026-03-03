"use client";

import { Heading, Button, Card, CardBlock } from "rk-designsystem";

export default function Home() {
  return (
    <main
      style={{
        maxWidth: "800px",
        margin: "0 auto",
        padding: "var(--ds-size-8)",
        display: "flex",
        flexDirection: "column",
        gap: "var(--ds-size-6)",
      }}
    >
      <Heading level={1} data-size="xl">
        Røde Kors Designsystemet
      </Heading>

      <Card data-color="neutral">
        <CardBlock>
          <Heading level={2} data-size="md">
            Template ready
          </Heading>
          <p>
            This Next.js project is pre-configured with the Røde Kors Design
            System, design tokens, and React Compiler.
          </p>
          <Button variant="primary" data-size="md">
            Get started
          </Button>
        </CardBlock>
      </Card>
    </main>
  );
}
