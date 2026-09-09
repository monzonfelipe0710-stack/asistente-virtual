import { Link } from "react-router-dom";

export default function ServiceItem({ num, title, tag, to, light = false }) {
  return (
    <Link
      to={to}
      className={`service-row group flex items-center gap-4 py-8 md:py-10 no-underline ${
        light ? "" : ""
      }`}
    >
      <span className="w-8 flex-none md:w-12">
        <span className={`fig-num ${light ? "text-[#f3f1e9]/50" : ""}`}>{num}</span>
      </span>
      <span className="min-w-0 flex-1">
        <span
          className={`service-title block font-neue text-[clamp(1.5rem,4.5vw,2.9rem)] leading-none font-extrabold tracking-tight ${
            light ? "text-[#f3f1e9]" : "text-ink"
          }`}
        >
          {title}
        </span>
      </span>
      <span className="hidden md:block shrink-0">
        <span className={`service-tag ${light ? "border-[#f3f1e9]/25 text-[#f3f1e9]/60" : ""}`}>
          {tag}
          <svg className="h-3.5 w-3.5 transition-transform duration-200 group-hover:translate-x-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </span>
      </span>
    </Link>
  );
}