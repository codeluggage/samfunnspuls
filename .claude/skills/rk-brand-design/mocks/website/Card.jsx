function Card({ tint, accent, title, children, meta, onClick }) {
  const cls = ['rk-card'];
  if (tint) cls.push('rk-card-tinted');
  if (accent) cls.push('rk-card-accent');
  return (
    <article className={cls.join(' ')} onClick={onClick} role={onClick ? 'button' : undefined} tabIndex={onClick ? 0 : undefined}>
      {title && <h3 className="rk-card-title">{title}</h3>}
      <div className="rk-card-body">{children}</div>
      {meta && <div className="rk-card-meta">{meta}</div>}
    </article>
  );
}
window.Card = Card;
