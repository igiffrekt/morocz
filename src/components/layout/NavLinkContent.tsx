export const YOGA_NAV_COLOR = "#0a7d73"; // turquoise, 4.5:1 on the header grey

export function isYogaLink(href?: string) {
  return href === "/joga" || href?.startsWith("/joga/") === true;
}

function Lotus({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true" className={className}>
      <path d="M12 3c1.9 2.2 2.9 4.6 2.9 7.2 0 2.2-1 4.2-2.9 5.8-1.9-1.6-2.9-3.6-2.9-5.8C9.1 7.6 10.1 5.2 12 3z" />
      <path
        d="M5 8.5c2.6.2 4.7 1.3 6 3.2.7 1.1.9 2.4.6 3.7-2.7.1-4.9-.9-6.3-2.8C4.5 11.2 4.4 10 5 8.5z"
        opacity=".85"
      />
      <path
        d="M19 8.5c-2.6.2-4.7 1.3-6 3.2-.7 1.1-.9 2.4-.6 3.7 2.7.1 4.9-.9 6.3-2.8.8-1.4.9-2.6.3-4.1z"
        opacity=".85"
      />
      <path
        d="M2.5 13.5c2.4-.2 4.6.5 6.2 2 .9.9 1.4 2 1.5 3.2-2.6.5-4.9-.1-6.5-1.7-.9-.9-1.3-2-1.2-3.5z"
        opacity=".7"
      />
      <path
        d="M21.5 13.5c-2.4-.2-4.6.5-6.2 2-.9.9-1.4 2-1.5 3.2 2.6.5 4.9-.1 6.5-1.7.9-.9 1.3-2 1.2-3.5z"
        opacity=".7"
      />
    </svg>
  );
}

/** Nav label; the yoga item gets a turquoise colour and a slanted lotus after the text. */
export function NavLinkContent({ label, href }: { label?: string; href?: string }) {
  if (!isYogaLink(href)) return <>{label}</>;
  return (
    <span className="relative inline-flex items-center pr-5" style={{ color: YOGA_NAV_COLOR }}>
      {label}
      <Lotus className="absolute -right-1 -top-2.5 h-5 w-5 rotate-45" />
    </span>
  );
}
