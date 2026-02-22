import { type CSSProperties, useCallback, useMemo, useRef, useState } from "react";
import { type ArrayOfObjectsInputProps, set, unset } from "sanity";
import { getHungarianHolidays } from "./hungarianHolidays";

interface BlockedDateItem {
  _key: string;
  date: string;
  isHoliday: boolean;
}

const MONTH_NAMES = [
  "január",
  "február",
  "március",
  "április",
  "május",
  "június",
  "július",
  "augusztus",
  "szeptember",
  "október",
  "november",
  "december",
];

const DAY_HEADERS = ["H", "K", "Sze", "Cs", "P", "Szo", "V"];

function formatDateISO(year: number, month: number, day: number): string {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function getMonthGrid(year: number, month: number) {
  const firstDay = new Date(year, month, 1);
  // Convert Sunday-based (0-6) to Monday-based (0-6)
  let startDow = firstDay.getDay() - 1;
  if (startDow < 0) startDow = 6;
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  return { startDow, daysInMonth };
}

function getDatesInRange(start: string, end: string): string[] {
  const dates: string[] = [];
  const startDate = new Date(`${start}T00:00:00`);
  const endDate = new Date(`${end}T00:00:00`);
  const [from, to] = startDate <= endDate ? [startDate, endDate] : [endDate, startDate];
  const current = new Date(from);
  while (current <= to) {
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, "0");
    const d = String(current.getDate()).padStart(2, "0");
    dates.push(`${y}-${m}-${d}`);
    current.setDate(current.getDate() + 1);
  }
  return dates;
}

// --- Styles ---

const navBtnStyle: CSSProperties = {
  padding: "4px 12px",
  fontSize: 18,
  border: "1px solid #ccc",
  borderRadius: 4,
  backgroundColor: "#f5f5f5",
  cursor: "pointer",
  lineHeight: 1,
};

const headerCellStyle: CSSProperties = {
  textAlign: "center",
  fontSize: 12,
  fontWeight: 600,
  padding: "4px 0",
  color: "#666",
};

const baseDayCellStyle: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  minHeight: 36,
  borderRadius: 4,
  fontSize: 13,
  fontWeight: 500,
  background: "none",
  padding: 0,
  fontFamily: "inherit",
  transition: "background-color 0.15s, border-color 0.15s",
};

const legendDotStyle: CSSProperties = {
  width: 12,
  height: 12,
  borderRadius: 2,
  display: "inline-block",
};

function getDayCellStyle(opts: {
  isBlocked: boolean;
  isHoliday: boolean;
  isRangeStart: boolean;
  isInPreview: boolean;
  readOnly: boolean;
}): CSSProperties {
  let bgColor = "#ffffff";
  let textColor = "#1a1a1a";
  let border = "1px solid #e0e0e0";

  if (opts.isBlocked && opts.isHoliday) {
    bgColor = "#fff3e0";
    border = "1px solid #f59e0b";
    textColor = "#92400e";
  } else if (opts.isBlocked) {
    bgColor = "#fce4ec";
    border = "1px solid #ef4444";
    textColor = "#991b1b";
  } else if (opts.isInPreview) {
    bgColor = "#dbeafe";
    border = "1px solid #3b82f6";
    textColor = "#1e40af";
  } else if (opts.isRangeStart) {
    bgColor = "#bfdbfe";
    border = "2px solid #2563eb";
    textColor = "#1e3a8a";
  }

  return {
    ...baseDayCellStyle,
    backgroundColor: bgColor,
    color: textColor,
    border,
    cursor: opts.readOnly ? "default" : "pointer",
  };
}

// --- Component ---

export function BlockedDatesInput(props: ArrayOfObjectsInputProps) {
  const { value, onChange, readOnly } = props;
  const items = useMemo(() => (value ?? []) as BlockedDateItem[], [value]);

  const [view, setView] = useState(() => {
    const now = new Date();
    return { year: now.getFullYear(), month: now.getMonth() };
  });
  const [rangeStart, setRangeStart] = useState<string | null>(null);
  const [rangePreviewEnd, setRangePreviewEnd] = useState<string | null>(null);
  const touchStartRef = useRef<string | null>(null);

  const blockedSet = useMemo(() => new Set(items.map((i) => i.date)), [items]);
  const holidaySet = useMemo(
    () => new Set(items.filter((i) => i.isHoliday).map((i) => i.date)),
    [items],
  );

  const previewDates = useMemo(() => {
    if (!rangeStart || !rangePreviewEnd) return new Set<string>();
    return new Set(getDatesInRange(rangeStart, rangePreviewEnd));
  }, [rangeStart, rangePreviewEnd]);

  const { startDow, daysInMonth } = useMemo(
    () => getMonthGrid(view.year, view.month),
    [view.year, view.month],
  );

  const updateItems = useCallback(
    (newItems: BlockedDateItem[]) => {
      onChange(newItems.length === 0 ? unset() : set(newItems));
    },
    [onChange],
  );

  const handleDayClick = useCallback(
    (dateStr: string, shiftKey: boolean) => {
      if (readOnly) return;

      // If blocked, unblock it (including holidays)
      if (blockedSet.has(dateStr)) {
        updateItems(items.filter((item) => item.date !== dateStr));
        setRangeStart(null);
        setRangePreviewEnd(null);
        return;
      }

      if (shiftKey && rangeStart) {
        // Commit range
        const rangeDates = getDatesInRange(rangeStart, dateStr);
        const existing = new Set(items.map((item) => item.date));
        const newEntries: BlockedDateItem[] = rangeDates
          .filter((d) => !existing.has(d))
          .map((d) => ({ _key: d, date: d, isHoliday: false }));
        updateItems([...items, ...newEntries]);
        setRangeStart(null);
        setRangePreviewEnd(null);
      } else {
        // Set range start (resets any previous start)
        setRangeStart(dateStr);
        setRangePreviewEnd(null);
      }
    },
    [readOnly, blockedSet, rangeStart, items, updateItems],
  );

  const handleDayMouseEnter = useCallback(
    (dateStr: string) => {
      if (rangeStart && !blockedSet.has(dateStr)) {
        setRangePreviewEnd(dateStr);
      }
    },
    [rangeStart, blockedSet],
  );

  // --- Touch handlers ---

  const handleTouchStart = useCallback(
    (dateStr: string) => {
      if (readOnly) return;
      if (blockedSet.has(dateStr)) {
        updateItems(items.filter((item) => item.date !== dateStr));
        touchStartRef.current = null;
        return;
      }
      touchStartRef.current = dateStr;
      setRangeStart(dateStr);
      setRangePreviewEnd(null);
    },
    [readOnly, blockedSet, items, updateItems],
  );

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!touchStartRef.current) return;
    const touch = e.touches[0];
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const dateStr = el?.getAttribute("data-date");
    if (dateStr) {
      setRangePreviewEnd(dateStr);
    }
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (touchStartRef.current && rangePreviewEnd) {
      const rangeDates = getDatesInRange(touchStartRef.current, rangePreviewEnd);
      const existing = new Set(items.map((item) => item.date));
      const newEntries: BlockedDateItem[] = rangeDates
        .filter((d) => !existing.has(d))
        .map((d) => ({ _key: d, date: d, isHoliday: false }));
      updateItems([...items, ...newEntries]);
    }
    touchStartRef.current = null;
    setRangeStart(null);
    setRangePreviewEnd(null);
  }, [rangePreviewEnd, items, updateItems]);

  // --- Navigation ---

  const navigateMonth = useCallback((direction: -1 | 1) => {
    setView((prev) => {
      let newMonth = prev.month + direction;
      let newYear = prev.year;
      if (newMonth < 0) {
        newMonth = 11;
        newYear--;
      } else if (newMonth > 11) {
        newMonth = 0;
        newYear++;
      }
      return { year: newYear, month: newMonth };
    });
  }, []);

  const handleAddHolidays = useCallback(() => {
    if (readOnly) return;
    const holidays = getHungarianHolidays(view.year);
    const existing = new Set(items.map((item) => item.date));
    const newEntries: BlockedDateItem[] = holidays
      .filter((h) => !existing.has(h.date))
      .map((h) => ({ _key: h.date, date: h.date, isHoliday: true }));
    if (newEntries.length > 0) {
      updateItems([...items, ...newEntries]);
    }
  }, [readOnly, view.year, items, updateItems]);

  // --- Build calendar cells ---

  const cells: ({ day: number; dateStr: string } | null)[] = [];
  for (let i = 0; i < startDow; i++) cells.push(null);
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, dateStr: formatDateISO(view.year, view.month, day) });
  }
  while (cells.length % 7 !== 0) cells.push(null);

  const blockedCount = items.length;
  const holidayCount = items.filter((i) => i.isHoliday).length;

  return (
    <div style={{ fontFamily: "system-ui, sans-serif" }}>
      {/* Month navigation */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 12,
          padding: "8px 0",
        }}
      >
        <button
          type="button"
          onClick={() => navigateMonth(-1)}
          style={navBtnStyle}
          aria-label="Előző hónap"
        >
          &larr;
        </button>
        <span style={{ fontSize: 16, fontWeight: 600 }}>
          {view.year}. {MONTH_NAMES[view.month]}
        </span>
        <button
          type="button"
          onClick={() => navigateMonth(1)}
          style={navBtnStyle}
          aria-label="Következő hónap"
        >
          &rarr;
        </button>
      </div>

      {/* Holiday pre-population button */}
      <div style={{ marginBottom: 12 }}>
        <button
          type="button"
          onClick={handleAddHolidays}
          disabled={readOnly}
          style={{
            padding: "6px 12px",
            fontSize: 13,
            border: "1px solid #d4a574",
            borderRadius: 4,
            backgroundColor: "#fff8f0",
            color: "#8b5e34",
            cursor: readOnly ? "not-allowed" : "pointer",
            opacity: readOnly ? 0.5 : 1,
          }}
        >
          Magyar ünnepnapok hozzáadása ({view.year})
        </button>
      </div>

      {/* Calendar grid */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(7, 1fr)",
          gap: 2,
          userSelect: "none",
        }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* Day-of-week headers */}
        {DAY_HEADERS.map((d) => (
          <div key={d} style={headerCellStyle}>
            {d}
          </div>
        ))}

        {/* Day cells */}
        {cells.map((cell, cellIndex) => {
          if (!cell) {
            const row = Math.floor(cellIndex / 7);
            const col = cellIndex % 7;
            return <div key={`empty-${row}-${col}`} style={{ minHeight: 36 }} />;
          }

          const { day, dateStr } = cell;
          const isBlocked = blockedSet.has(dateStr);
          const isHoliday = holidaySet.has(dateStr);
          const isRangeStart = dateStr === rangeStart;
          const isInPreview = previewDates.has(dateStr) && !isBlocked;

          const title = isHoliday
            ? `${dateStr} — Ünnepnap`
            : isBlocked
              ? `${dateStr} — Blokkolt`
              : dateStr;

          return (
            <button
              key={dateStr}
              type="button"
              data-date={dateStr}
              onClick={(e) => handleDayClick(dateStr, e.shiftKey)}
              onMouseEnter={() => handleDayMouseEnter(dateStr)}
              onTouchStart={() => handleTouchStart(dateStr)}
              style={getDayCellStyle({
                isBlocked,
                isHoliday,
                isRangeStart,
                isInPreview,
                readOnly: !!readOnly,
              })}
              title={title}
            >
              {day}
            </button>
          );
        })}
      </div>

      {/* Legend */}
      <div
        style={{
          display: "flex",
          gap: 16,
          marginTop: 12,
          fontSize: 12,
          color: "#666",
          flexWrap: "wrap",
        }}
      >
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{ ...legendDotStyle, backgroundColor: "#fce4ec", border: "1px solid #ef4444" }}
          />
          Blokkolt nap
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{ ...legendDotStyle, backgroundColor: "#fff3e0", border: "1px solid #f59e0b" }}
          />
          Ünnepnap
        </span>
        <span style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <span
            style={{ ...legendDotStyle, backgroundColor: "#dbeafe", border: "1px solid #3b82f6" }}
          />
          Kijelölés
        </span>
      </div>

      {/* Status info */}
      <div style={{ marginTop: 8, fontSize: 12, color: "#888" }}>
        {blockedCount > 0 ? (
          <span>
            {blockedCount} blokkolt nap ({holidayCount} ünnepnap)
          </span>
        ) : (
          <span>Nincs blokkolt nap</span>
        )}
        {rangeStart && (
          <span style={{ marginLeft: 12 }}>
            Tartomány kezdete kijelölve — Shift+kattintás a végpontra
          </span>
        )}
      </div>
    </div>
  );
}
