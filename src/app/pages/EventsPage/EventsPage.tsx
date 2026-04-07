import type { Metadata } from 'next';
import { Heading, Paragraph } from 'rk-designsystem';
import styles from './EventsPage.module.css';

export const metadata: Metadata = {
  title: 'Events',
  description: 'Upcoming and currently active volunteer events',
};

export default function EventsPage() {
  return (
    <div id="main">
      <div className={styles.intro}>
        <Heading level={1} data-size="xl">
          Red Cross Events
        </Heading>
        <Paragraph data-size="lg">
          Summarize the purpose of the page in one clear sentence.
        </Paragraph>
      </div>

      <section className={styles.section} aria-labelledby="events-title">
        <Heading id="heading-title" level={2} data-size="md">
          First section heading
        </Heading>
        <Paragraph>
          Use rk-designsystem components for UI and keep CSS Modules focused on layout and spacing.
        </Paragraph>
      </section>

      <section className={styles.section} aria-labelledby="section-2-title">
        <Heading id="section-2-title" level={2} data-size="md">
          Second section heading
        </Heading>
        <Paragraph>Add the next building block here</Paragraph>
      </section>
    </div>
  );
}
