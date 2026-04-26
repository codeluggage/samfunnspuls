function Donate({ onClose }) {
  const [amount, setAmount] = React.useState(500);
  const [custom, setCustom] = React.useState('');
  const [frequency, setFrequency] = React.useState('once');
  const [stage, setStage] = React.useState('amount');

  const presets = [200, 500, 1000, 2500];

  if (stage === 'thanks') {
    return (
      <div className="rk-donate">
        <h2>Takk!</h2>
        <p className="rk-lead">Gaven din på <strong>{amount} kr</strong> {frequency === 'monthly' ? 'i måneden' : ''} hjelper mennesker i nød.</p>
        <button className="rk-btn rk-btn-primary rk-btn-lg" onClick={onClose}>Lukk</button>
      </div>
    );
  }

  return (
    <div className="rk-donate">
      <h2>Gi en gave</h2>
      <p className="rk-lead">Velg et beløp som passer for deg.</p>

      <div className="rk-segmented" role="radiogroup" aria-label="Frekvens">
        <button role="radio" aria-checked={frequency === 'once'} className={frequency === 'once' ? 'is-active' : ''} onClick={() => setFrequency('once')}>Engangsgave</button>
        <button role="radio" aria-checked={frequency === 'monthly'} className={frequency === 'monthly' ? 'is-active' : ''} onClick={() => setFrequency('monthly')}>Hver måned</button>
      </div>

      <div className="rk-amounts">
        {presets.map(p => (
          <button key={p}
            className={`rk-amount ${amount === p && !custom ? 'is-active' : ''}`}
            onClick={() => { setAmount(p); setCustom(''); }}
          >{p} kr</button>
        ))}
      </div>

      <label className="rk-field">
        <span>Annet beløp</span>
        <input type="number" placeholder="kr" value={custom}
          onChange={e => { setCustom(e.target.value); if (e.target.value) setAmount(Number(e.target.value)); }} />
      </label>

      <button className="rk-btn rk-btn-primary rk-btn-lg" style={{width:'100%'}}
        onClick={() => setStage('thanks')}>
        Gi {amount} kr {frequency === 'monthly' ? 'i måneden' : 'nå'}
      </button>
      <p className="rk-fineprint">Skattefradrag for gaver fra 500 kr til 25 000 kr per år.</p>
    </div>
  );
}
window.Donate = Donate;
