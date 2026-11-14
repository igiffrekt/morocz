import type { ReactNode } from "react";

function Svg({ d, size = 26 }: { d: string; size?: number }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d={d} />
    </svg>
  );
}

/** Round icon + H1 + lead at the top of the form card. */
export function AuthCardHeading({
  icon,
  iconClassName = "bg-sage text-teal-ink",
  title,
  lead,
}: {
  icon: string;
  iconClassName?: string;
  title: ReactNode;
  lead?: ReactNode;
}) {
  return (
    <>
      <span
        aria-hidden="true"
        className={`inline-flex h-16 w-16 items-center justify-center rounded-full ${iconClassName}`}
      >
        <Svg d={icon} size={26} />
      </span>
      <div className="flex flex-col gap-2">
        <h1 className="m-0 text-[30px] font-extrabold tracking-[-0.03em] text-navy sm:text-[34px]">
          {title}
        </h1>
        {lead && <p className="m-0 text-[15px] leading-relaxed text-muted">{lead}</p>}
      </div>
    </>
  );
}

export const AUTH_ICONS = {
  lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
  key: "M21 2l-2 2m-7.61 7.61a5.5 5.5 0 1 1-7.778 7.778 5.5 5.5 0 0 1 7.777-7.777zm0 0L15.5 7.5m0 0 3 3L22 7l-3-3m-3.5 3.5L19 4",
  home: "m3 10 9-7 9 7v10a2 2 0 0 1-2 2h-4v-7H9v7H5a2 2 0 0 1-2-2z",
  user: "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z",
  alert: "M12 9v4m0 4h.01M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z",
};
