export default function CaFrame({ children, className = "", innerClassName = "", as: Tag = "div" }) {
  return (
    <Tag className={`ca-frame ${className}`}>
      <div className={`ca-frame-inner ${innerClassName}`}>{children}</div>
    </Tag>
  );
}
