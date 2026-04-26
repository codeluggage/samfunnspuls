function Button({ variant = 'primary', size = 'md', children, onClick, ariaLabel, type }) {
  const cls = `rk-btn rk-btn-${variant} rk-btn-${size}`;
  return (
    <button className={cls} onClick={onClick} aria-label={ariaLabel} type={type || 'button'}>{children}</button>
  );
}
window.Button = Button;
