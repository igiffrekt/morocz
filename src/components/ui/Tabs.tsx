"use client";

import {
  type HTMLAttributes,
  type KeyboardEvent,
  type ReactNode,
  useId,
  useRef,
  useState,
} from "react";
import { cn } from "@/lib/cn";

export interface TabItem<T extends string = string> {
  value: T;
  label: ReactNode;
}

/** Stable DOM ids that connect a tab to its panel. */
export function tabIds(base: string, value: string) {
  const safe = value.replace(/[^a-zA-Z0-9_-]/g, "-");
  return { tab: `${base}-tab-${safe}`, panel: `${base}-panel-${safe}` };
}

interface TabListProps<T extends string> {
  /** Shared id prefix; pass the same value to the matching <TabPanel>s. */
  idBase: string;
  items: readonly TabItem<T>[];
  value: T;
  onChange: (value: T) => void;
  label: string;
  tone?: "white" | "light";
  className?: string;
}

/**
 * role="tablist" pill bar with a sliding navy indicator. Automatic activation:
 * arrow keys / Home / End select and focus the neighbouring tab.
 */
export function TabList<T extends string>({
  idBase,
  items,
  value,
  onChange,
  label,
  tone = "white",
  className,
}: TabListProps<T>) {
  const refs = useRef<Array<HTMLButtonElement | null>>([]);
  const count = Math.max(items.length, 1);
  const selected = Math.max(
    items.findIndex((t) => t.value === value),
    0,
  );

  const focusAt = (index: number) => {
    const item = items[index];
    if (!item) return;
    onChange(item.value);
    refs.current[index]?.focus();
  };

  const onKeyDown = (event: KeyboardEvent<HTMLButtonElement>, index: number) => {
    const last = items.length - 1;
    const map: Record<string, number> = {
      ArrowRight: index === last ? 0 : index + 1,
      ArrowLeft: index === 0 ? last : index - 1,
      Home: 0,
      End: last,
    };
    const next = map[event.key];
    if (next === undefined) return;
    event.preventDefault();
    focusAt(next);
  };

  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn(
        "relative grid min-w-0 rounded-full p-[5px]",
        tone === "white" ? "bg-white" : "bg-canvas",
        className,
      )}
      style={{ gridTemplateColumns: `repeat(${count}, minmax(0, 1fr))` }}
    >
      <span
        aria-hidden="true"
        className="slide-indicator absolute top-[5px] bottom-[5px] left-[5px] rounded-full bg-navy shadow-[0_8px_20px_-10px_rgba(36,42,95,.5)]"
        style={{
          width: `calc((100% - 10px) / ${count})`,
          transform: `translateX(${selected * 100}%)`,
        }}
      />
      {items.map((item, index) => {
        const isOn = index === selected;
        const ids = tabIds(idBase, item.value);
        return (
          <button
            key={item.value}
            ref={(el) => {
              refs.current[index] = el;
            }}
            id={ids.tab}
            type="button"
            role="tab"
            aria-selected={isOn}
            aria-controls={ids.panel}
            tabIndex={isOn ? 0 : -1}
            onClick={() => onChange(item.value)}
            onKeyDown={(event) => onKeyDown(event, index)}
            className={cn(
              "relative z-[1] h-12 whitespace-nowrap rounded-full border-0 bg-transparent px-3 text-sm font-extrabold transition-colors duration-[350ms]",
              isOn ? "text-white" : "text-muted hover:text-navy",
            )}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

interface TabPanelProps extends HTMLAttributes<HTMLDivElement> {
  idBase: string;
  value: string;
  children: ReactNode;
}

export function TabPanel({ idBase, value, children, className, ...rest }: TabPanelProps) {
  const ids = tabIds(idBase, value);
  return (
    <div
      id={ids.panel}
      role="tabpanel"
      aria-labelledby={ids.tab}
      // biome-ignore lint/a11y/noNoninteractiveTabindex: APG tabpanel pattern (focusable panel)
      tabIndex={0}
      className={cn("focus-visible:outline-none", className)}
      {...rest}
    >
      {children}
    </div>
  );
}

interface TabsProps<T extends string> {
  items: readonly (TabItem<T> & { content: ReactNode })[];
  label: string;
  value?: T;
  defaultValue?: T;
  onChange?: (value: T) => void;
  tone?: "white" | "light";
  className?: string;
  listClassName?: string;
  panelClassName?: string;
}

/** Convenience wrapper: tab bar above the active panel (controlled or uncontrolled). */
export function Tabs<T extends string>({
  items,
  label,
  value,
  defaultValue,
  onChange,
  tone,
  className,
  listClassName,
  panelClassName,
}: TabsProps<T>) {
  const idBase = useId().replace(/:/g, "");
  const [inner, setInner] = useState<T | undefined>(defaultValue ?? items[0]?.value);
  const current = value ?? inner;
  const active = items.find((i) => i.value === current) ?? items[0];

  const select = (next: T) => {
    if (value === undefined) setInner(next);
    onChange?.(next);
  };

  if (!active) return null;

  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <TabList
        idBase={idBase}
        items={items}
        value={active.value}
        onChange={select}
        label={label}
        tone={tone}
        className={listClassName}
      />
      <TabPanel key={active.value} idBase={idBase} value={active.value} className={panelClassName}>
        {active.content}
      </TabPanel>
    </div>
  );
}
