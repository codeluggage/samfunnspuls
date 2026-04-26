function Header({ active, onNav, onDonate }) {
  const links = [
    { id: 'home', label: 'Hjem' },
    { id: 'volunteer', label: 'Bli frivillig' },
    { id: 'help', label: 'Få hjelp' },
    { id: 'about', label: 'Om oss' },
    { id: 'news', label: 'Aktuelt' },
  ];
  return (
    <header className="rk-header">
      <div className="rk-header-inner">
        <a href="#" className="rk-logo" aria-label="Røde Kors forside">
          <img src="../../assets/red-cross-logo.svg" alt="Røde Kors" />
        </a>
        <nav className="rk-nav" aria-label="Hovednavigasjon">
          {links.map(l => (
            <button
              key={l.id}
              className={`rk-nav-link ${active === l.id ? 'is-active' : ''}`}
              onClick={() => onNav(l.id)}
            >{l.label}</button>
          ))}
        </nav>
        <div className="rk-header-actions">
          <button className="rk-lang" aria-label="Velg språk">NO · EN</button>
          <button className="rk-btn rk-btn-primary" onClick={onDonate}>Gi gave</button>
        </div>
      </div>
    </header>
  );
}
window.Header = Header;
