import { Link } from "react-router-dom";

export default function SplitCta({
  left = "Empezar",
  right = "Chatear",
  to,
  href,
  onClick,
  className = "",
}) {
  const inner = (
    <>
      <span data-text className="split-cta-cell">
        {left}
      </span>
      <span data-text className="split-cta-cell split-cta-cell-accent">
        {right}
        <span className="status-dot bg-brand" aria-hidden="true" />
      </span>
    </>
  );

  const cls = `split-cta ${className}`;

  if (to) {
    return (
      <Link to={to} className={cls} onClick={onClick}>
        {inner}
      </Link>
    );
  }
  if (href) {
    return (
      <a href={href} className={cls} onClick={onClick}>
        {inner}
      </a>
    );
  }
  return (
    <button type="button" className={cls} onClick={onClick}>
      {inner}
    </button>
  );
}
