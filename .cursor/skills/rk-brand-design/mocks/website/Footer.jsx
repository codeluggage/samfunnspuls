function Footer() {
  return (
    <footer className="rk-footer" data-color-scheme="dark">
      <div className="rk-footer-inner">
        <div className="rk-footer-col rk-footer-brand">
          <img src="../../assets/red-cross-logo.svg" alt="Røde Kors" className="rk-footer-logo" />
          <p>Norges Røde Kors er en del av verdens største humanitære nettverk.</p>
        </div>
        <div className="rk-footer-col">
          <h4>Kontakt</h4>
          <ul>
            <li>815 33 300 — Krise­telefon, døgnåpent</li>
            <li>Hausmanns gate 7, 0186 Oslo</li>
            <li><a href="#">post@redcross.no</a></li>
          </ul>
        </div>
        <div className="rk-footer-col">
          <h4>Engasjer deg</h4>
          <ul>
            <li><a href="#">Bli frivillig</a></li>
            <li><a href="#">Bli medlem</a></li>
            <li><a href="#">Gi en gave</a></li>
          </ul>
        </div>
        <div className="rk-footer-col">
          <h4>Få hjelp</h4>
          <ul>
            <li><a href="#">Kors på halsen</a></li>
            <li><a href="#">Besøkstjenesten</a></li>
            <li><a href="#">Beredskap</a></li>
          </ul>
        </div>
      </div>
      <div className="rk-footer-base">
        <span>© Norges Røde Kors</span>
        <span className="rk-footer-meta">Org.nr. 864 053 712 · <a href="#">Personvern</a> · <a href="#">Tilgjengelighet</a></span>
      </div>
    </footer>
  );
}
window.Footer = Footer;
