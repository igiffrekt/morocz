"use client";

import { PortableText, type PortableTextComponents } from "@portabletext/react";
import Image from "next/image";
import { useId, useRef } from "react";
import { ICON_PATHS, PathIcon } from "@/components/home/PathIcon";
import { Modal } from "@/components/ui/Modal";
import { ArrowIcon } from "@/components/ui/PillButton";
import { telHref } from "@/lib/site-nav";
import { YOGA_DAY_NAMES, type YogaInstructor, type YogaSession } from "@/lib/yoga";

const PHONE_PATH =
  "M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z";
const LINK_PATH =
  "M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71";
const FACEBOOK_PATH = "M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z";
const PIN_PATH =
  "M12 22s7-6.2 7-12a7 7 0 1 0-14 0c0 5.8 7 12 7 12zM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z";

const descriptionComponents: PortableTextComponents = {
  block: {
    normal: ({ children }) => (
      <p className="m-0 text-[15px] leading-[1.65] text-muted-strong">{children}</p>
    ),
    h3: ({ children }) => (
      <h3 className="m-0 mt-1 text-base font-extrabold text-navy">{children}</h3>
    ),
    h4: ({ children }) => (
      <h4 className="m-0 mt-1 text-[15px] font-extrabold text-teal-ink">{children}</h4>
    ),
  },
  list: {
    bullet: ({ children }) => (
      <ul className="m-0 flex list-none flex-col gap-1.5 p-0">{children}</ul>
    ),
    number: ({ children }) => (
      <ol className="m-0 flex list-decimal flex-col gap-1.5 pl-5 text-[15px] text-muted-strong">
        {children}
      </ol>
    ),
  },
  listItem: {
    bullet: ({ children }) => (
      <li className="flex items-start gap-2.5 text-[15px] leading-[1.5] text-muted-strong">
        <span
          aria-hidden="true"
          className="mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-mint-pale text-yoga"
        >
          <PathIcon d={ICON_PATHS.tick} size={12} strokeWidth={3} />
        </span>
        <span className="min-w-0">{children}</span>
      </li>
    ),
  },
  marks: {
    link: ({ children, value }) => (
      <a
        href={value?.href}
        target="_blank"
        rel="noopener noreferrer"
        className="font-bold text-navy underline underline-offset-2"
      >
        {children}
      </a>
    ),
  },
};

function CloseButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label="Bezárás"
      className="btn-lift absolute top-4 right-4 inline-flex h-11 w-11 items-center justify-center rounded-full border-0 bg-white/60 text-navy"
    >
      <svg
        width="18"
        height="18"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.4"
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
      >
        <path d="M18 6 6 18M6 6l12 12" />
      </svg>
    </button>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-[13px] font-bold text-[#6b7280]">{label}</span>
      {children}
    </div>
  );
}

function Avatar({
  url,
  size,
  className,
}: {
  url: string | null;
  size: number;
  className?: string;
}) {
  if (!url) {
    return (
      <span
        aria-hidden="true"
        className={`inline-flex shrink-0 items-center justify-center rounded-full bg-sage text-teal-ink ${className ?? ""}`}
        style={{ width: size, height: size }}
      >
        <PathIcon
          d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z"
          size={size / 2.4}
        />
      </span>
    );
  }
  return (
    <Image
      src={url}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-full object-cover ${className ?? ""}`}
      style={{ width: size, height: size }}
    />
  );
}

/** Keeps the last non-null value so a closing modal still shows its content while it animates out. */
function useRetained<T>(value: T | null): T | null {
  const ref = useRef(value);
  if (value != null) ref.current = value;
  return ref.current;
}

// ─── Class ─────────────────────────────────────────────────────────────────────

interface ClassModalProps {
  session: YogaSession | null;
  instructor: YogaInstructor | null;
  onClose: () => void;
  onOpenInstructor: (slug: string) => void;
}

export function ClassModal({
  session: current,
  instructor: currentInstructor,
  onClose,
  onOpenInstructor,
}: ClassModalProps) {
  const titleId = useId();
  const shown = useRetained(current ? { session: current, instructor: currentInstructor } : null);
  const session = shown?.session ?? null;
  const instructor = shown?.instructor ?? null;
  const day = session ? YOGA_DAY_NAMES[session.day] : "";
  return (
    <Modal
      open={current != null}
      onClose={onClose}
      variant="sheet"
      size="sm"
      labelledBy={titleId}
      header={
        session && (
          <div
            className="relative flex shrink-0 flex-col gap-1.5 px-7 pt-[26px] pb-6"
            style={{ background: session.color, color: session.ink }}
          >
            <CloseButton onClick={onClose} />
            <span className="text-[13px] font-bold tracking-[.1em] uppercase opacity-80">
              {day}
            </span>
            <h2 id={titleId} className="m-0 pr-12 text-[26px] leading-[1.2] font-extrabold">
              {session.className}
            </h2>
          </div>
        )
      }
    >
      {session && (
        <div className="flex flex-col gap-[18px] pt-2">
          <Field label="Időpont">
            <span className="text-lg font-extrabold text-navy tabular-nums">
              {day}, {session.start} – {session.end}
              {session.recurrence && (
                <span className="ml-2 text-sm font-semibold text-muted">
                  ({session.recurrence})
                </span>
              )}
            </span>
          </Field>
          {session.instructor && (
            <Field label="Oktató">
              {instructor ? (
                <button
                  type="button"
                  onClick={() => onOpenInstructor(instructor.slug)}
                  className="chip-lift inline-flex items-center gap-3 self-start rounded-full border-[1.5px] border-line-soft bg-white py-1.5 pr-5 pl-1.5 font-extrabold whitespace-nowrap text-navy hover:border-navy"
                >
                  <Avatar url={instructor.avatarUrl} size={40} />
                  {instructor.name}
                  <ArrowIcon size={14} />
                </button>
              ) : (
                <span className="font-extrabold text-navy">{session.instructor}</span>
              )}
            </Field>
          )}
          {session.location && (
            <Field label="Helyszín">
              <span className="inline-flex items-center gap-2 font-bold text-navy">
                <PathIcon d={PIN_PATH} size={18} strokeWidth={2} />
                {session.location}
              </span>
            </Field>
          )}
          {session.description && (
            <Field label="Leírás">
              <div className="flex flex-col gap-2.5">
                <PortableText
                  value={session.description as Parameters<typeof PortableText>[0]["value"]}
                  components={descriptionComponents}
                />
              </div>
            </Field>
          )}
          {session.notes && (
            <div className="flex flex-col gap-1 rounded-[22px] bg-canvas px-[18px] py-4">
              <span className="text-[13px] font-bold text-[#6b7280]">Megjegyzés</span>
              <span className="text-[15px] font-semibold text-navy">{session.notes}</span>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}

// ─── Instructor ────────────────────────────────────────────────────────────────

interface InstructorModalProps {
  instructor: YogaInstructor | null;
  sessions: YogaSession[];
  onClose: () => void;
  onOpenSession: (id: string) => void;
}

function linkIcon(url: string): string {
  return /facebook\.com|fb\.me/i.test(url) ? FACEBOOK_PATH : LINK_PATH;
}

export function InstructorModal({
  instructor: current,
  sessions,
  onClose,
  onOpenSession,
}: InstructorModalProps) {
  const titleId = useId();
  const instructor = useRetained(current);
  const own = instructor ? sessions.filter((s) => s.instructor === instructor.name) : [];
  const iconStyle = instructor
    ? { background: instructor.color, color: instructor.ink }
    : undefined;
  const iconClass = "inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-full";

  return (
    <Modal
      open={current != null}
      onClose={onClose}
      variant="sheet"
      size="sm"
      labelledBy={titleId}
      header={
        instructor && (
          <div
            className="relative flex shrink-0 items-center gap-4 p-6"
            style={{ background: instructor.color, color: instructor.ink }}
          >
            <CloseButton onClick={onClose} />
            <Avatar url={instructor.avatarUrl} size={84} className="border-4 border-white/55" />
            <span className="flex min-w-0 flex-col gap-0.5 pr-12">
              <h2 id={titleId} className="m-0 text-2xl leading-tight font-extrabold">
                {instructor.name}
              </h2>
              <span className="text-sm opacity-80">Jóga oktató</span>
            </span>
          </div>
        )
      }
    >
      {instructor && (
        <div className="flex flex-col gap-[22px] pt-2">
          {instructor.bio.length > 0 && (
            <Field label="Bemutatkozás">
              {instructor.bio.map((paragraph) => (
                <p key={paragraph} className="m-0 text-[15px] leading-[1.7] text-muted-strong">
                  {paragraph}
                </p>
              ))}
            </Field>
          )}
          {own.length > 0 && (
            <Field label="Órái">
              <span className="flex flex-wrap gap-2">
                {own.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => onOpenSession(s.id)}
                    className="chip-lift inline-flex min-h-10 items-center gap-2 rounded-full border-[1.5px] border-line-soft bg-white px-4 py-1.5 text-left text-[13px] font-bold whitespace-nowrap text-navy hover:border-navy"
                  >
                    <span
                      aria-hidden="true"
                      className="h-2.5 w-2.5 shrink-0 rounded-full"
                      style={{ background: s.color }}
                    />
                    {YOGA_DAY_NAMES[s.day]} {s.start} · {s.className}
                  </button>
                ))}
              </span>
            </Field>
          )}
          {(instructor.phone || instructor.email || instructor.links.length > 0) && (
            <div className="flex flex-col gap-2.5 border-t border-line-soft pt-[18px]">
              <span className="text-[13px] font-bold text-[#6b7280]">Kapcsolat</span>
              {instructor.phone && (
                <a
                  href={telHref(instructor.phone)}
                  className="link-grow inline-flex items-center gap-3 self-start font-bold text-navy"
                >
                  <span className={iconClass} style={iconStyle}>
                    <PathIcon d={PHONE_PATH} size={18} strokeWidth={2} />
                  </span>
                  {instructor.phone}
                </a>
              )}
              {instructor.email && (
                <a
                  href={`mailto:${instructor.email}`}
                  className="link-grow inline-flex items-center gap-3 self-start font-bold break-all text-navy"
                >
                  <span className={iconClass} style={iconStyle}>
                    <PathIcon d={ICON_PATHS.mail} size={18} strokeWidth={2} />
                  </span>
                  {instructor.email}
                </a>
              )}
              {instructor.links.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="link-grow inline-flex items-center gap-3 self-start font-bold text-navy"
                >
                  <span className={iconClass} style={iconStyle}>
                    <PathIcon d={linkIcon(link.url)} size={18} strokeWidth={2} />
                  </span>
                  {link.label}
                  <span className="sr-only"> (új lapon)</span>
                </a>
              ))}
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
