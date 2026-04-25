"use client";

import { Header, Link } from "rk-designsystem";
import { usePathname } from "next/navigation";
import { type MouseEvent, useEffect, useRef } from "react";
import styles from "./site-header.module.css";

const navItems = [
  { label: "Aktivitetsradar", href: "/" },
  { label: "Utforsk data", href: "/utforsk-data" },
];

export function SiteHeader() {
  const pathname = usePathname();
  const shellRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const shell = shellRef.current;
    if (!shell) {
      return;
    }

    const hideEmptyMenuButtons = () => {
      const menuButtons = shell.querySelectorAll<HTMLButtonElement>(
        'button[aria-label="Åpne meny"], button[aria-label="Lukk meny"]',
      );

      menuButtons.forEach((button) => {
        button.hidden = true;
      });
    };

    hideEmptyMenuButtons();

    const observer = new MutationObserver(hideEmptyMenuButtons);
    observer.observe(shell, { childList: true, subtree: true });

    return () => observer.disconnect();
  }, []);

  function handleCurrentPageClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (pathname === href) {
      event.preventDefault();
    }
  }

  return (
    <div className={styles.shell} ref={shellRef}>
      <div className={styles.brandHeader}>
        <Header
          data-color="primary"
          activePage={navItems.find((item) => item.href === pathname)?.label}
          showHeaderExtension
          showNavItems={false}
          showMenuButton={false}
          showSearch={false}
          showLogin={false}
          showUser={false}
          showThemeToggle={false}
        />
      </div>
      <nav className={styles.nav} aria-label="Hovednavigasjon">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            aria-current={pathname === item.href ? "page" : undefined}
            onClick={(event: MouseEvent<HTMLAnchorElement>) => handleCurrentPageClick(event, item.href)}
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
