function Hero({ onPrimary, onSecondary }) {
  return (
    <section className="rk-hero">
      <div className="rk-hero-bg" aria-hidden="true">
        <img src="../../assets/herosectionbg.png" alt="" />
      </div>
      <div className="rk-hero-content">
        <h1 className="rk-hero-title">Sammen redder vi liv — hver dag</h1>
        <p className="rk-hero-lead">
          Røde Kors hjelper mennesker i nød i Norge og verden rundt. Du kan
          være forskjellen i dag.
        </p>
        <div className="rk-hero-actions">
          <button className="rk-btn rk-btn-primary rk-btn-lg" onClick={onPrimary}>Gi gave</button>
          <button className="rk-btn rk-btn-secondary rk-btn-lg" onClick={onSecondary}>Bli frivillig</button>
        </div>
      </div>
    </section>
  );
}
window.Hero = Hero;
