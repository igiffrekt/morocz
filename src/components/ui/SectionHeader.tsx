interface SectionHeaderProps {
  label: string;
  title: string;
  subtitle: string;
}

export function SectionHeader({ label, title, subtitle }: SectionHeaderProps) {
  return (
    <div style={{ marginBottom: "24px" }}>
      <span
        style={{
          display: "inline-flex",
          alignItems: "center",
          gap: "10px",
          fontSize: "0.7rem",
          fontWeight: 600,
          letterSpacing: "0.2em",
          textTransform: "uppercase",
          color: "rgba(36, 42, 95, 0.4)",
          marginBottom: "12px",
        }}
      >
        <span
          style={{
            width: "28px",
            height: "1px",
            background: "rgba(36, 42, 95, 0.2)",
          }}
        />
        {label}
      </span>
      <h2
        style={{
          fontSize: "clamp(1.25rem, 5vw, 2.75rem)",
          fontWeight: 800,
          color: "#1e2952",
          lineHeight: 1.2,
          margin: 0,
          marginBottom: "8px",
        }}
      >
        {title}
      </h2>
      <p
        style={{
          fontSize: "0.8rem",
          color: "rgba(36, 42, 95, 0.45)",
          lineHeight: 1.5,
        }}
      >
        {subtitle}
      </p>
    </div>
  );
}
