"use client";

import { Header, Link, Search } from "rk-designsystem";
import { usePathname, useRouter } from "next/navigation";
import {
  type ChangeEvent,
  type FormEvent,
  type MouseEvent,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { APP_NAV_ITEMS, getGlobalSearchSuggestions } from "@/lib/app-navigation";
import styles from "./site-header.module.css";

export function SiteHeader() {
  const pathname = usePathname();
  const router = useRouter();
  const shellRef = useRef<HTMLDivElement>(null);
  const [query, setQuery] = useState("");
  const suggestions = useMemo(() => getGlobalSearchSuggestions(query, 4), [query]);
  const activePage = APP_NAV_ITEMS.find((item) =>
    item.href === "/" ? pathname === "/" : pathname?.startsWith(item.href),
  )?.label;

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

  function handleSearchSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = query.trim();

    if (trimmed) {
      router.push(`/utforsk-data?q=${encodeURIComponent(trimmed)}`);
    } else {
      router.push("/utforsk-data");
    }
  }

  return (
    <div className={styles.shell} ref={shellRef}>
      <div className={styles.brandHeader}>
        <Header
          data-color="primary"
          activePage={activePage}
          showHeaderExtension
          showNavItems={false}
          showMenuButton={false}
          showSearch={false}
          showLogin={false}
          showUser={false}
          showThemeToggle={false}
        />
      </div>
      <div className={styles.utilityBar}>
        <nav className={styles.nav} aria-label="Hovednavigasjon">
          {APP_NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={activePage === item.label ? "page" : undefined}
              onClick={(event: MouseEvent<HTMLAnchorElement>) => handleCurrentPageClick(event, item.href)}
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form className={styles.siteSearch} role="search" onSubmit={handleSearchSubmit}>
          <Search data-size="sm">
            <Search.Input
              id="site-search"
              name="site-search"
              aria-label="Søk i Samfunnspuls"
              placeholder="Søk i Samfunnspuls"
              value={query}
              onChange={(event: ChangeEvent<HTMLInputElement>) => setQuery(event.currentTarget.value)}
            />
            <Search.Button>Søk</Search.Button>
          </Search>
          {query.trim() ? (
            <div className={styles.suggestions} aria-label="Søkeforslag">
              {suggestions.map((suggestion) => (
                <Link key={`${suggestion.type}-${suggestion.href}`} href={suggestion.href}>
                  <span>{suggestion.title}</span>
                  <small>{suggestion.description}</small>
                </Link>
              ))}
            </div>
          ) : null}
        </form>
      </div>
    </div>
  );
}
