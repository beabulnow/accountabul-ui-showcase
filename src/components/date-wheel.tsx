import { useEffect, useRef } from "react";

const ITEM_HEIGHT = 40;
const VISIBLE_ITEMS = 5;

const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

function daysInMonth(year: number, month: number) {
  return new Date(year, month, 0).getDate();
}

function pad(value: number) {
  return String(value).padStart(2, "0");
}

/** Parses `YYYY-MM-DD`, falling back to a sensible starting point. */
function parseValue(value: string) {
  const match = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value);
  const fallbackYear = new Date().getFullYear() - 30;
  if (!match) return { year: fallbackYear, month: 1, day: 1, empty: true };
  return {
    year: Number(match[1]),
    month: Number(match[2]),
    day: Number(match[3]),
    empty: false,
  };
}

/**
 * iPhone-style date picker: three snap-scrolling wheels for month, day and
 * year. Nothing is typed, so the value is always a valid calendar date.
 */
export function DateWheel({
  id,
  value,
  onChange,
  minYear,
  maxYear = new Date().getFullYear(),
  disabled,
}: {
  id?: string;
  value: string;
  onChange: (next: string) => void;
  minYear?: number;
  maxYear?: number;
  disabled?: boolean;
}) {
  const current = parseValue(value);
  const firstYear = minYear ?? maxYear - 110;
  const years = Array.from({ length: maxYear - firstYear + 1 }, (_, i) => maxYear - i);
  const months = MONTH_NAMES.map((label, index) => ({ label, value: index + 1 }));
  const dayCount = daysInMonth(current.year, current.month);
  const days = Array.from({ length: dayCount }, (_, i) => i + 1);

  function commit(next: { year?: number; month?: number; day?: number }) {
    const year = next.year ?? current.year;
    const month = next.month ?? current.month;
    const day = Math.min(next.day ?? current.day, daysInMonth(year, month));
    onChange(`${year}-${pad(month)}-${pad(day)}`);
  }

  return (
    <div
      id={id}
      role="group"
      aria-label="Date of birth"
      className="relative overflow-hidden rounded-2xl border border-input bg-surface"
      style={{ height: ITEM_HEIGHT * VISIBLE_ITEMS }}
    >
      {/* Selection band */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-2 z-10 rounded-xl bg-primary/10 ring-1 ring-primary/25"
        style={{ height: ITEM_HEIGHT, top: ITEM_HEIGHT * 2 }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 z-20 bg-gradient-to-b from-surface via-transparent to-surface"
      />
      <div className="relative grid h-full grid-cols-[1.4fr_0.8fr_1fr]">
        <Wheel
          label="Month"
          disabled={disabled}
          options={months.map((month) => ({ value: month.value, label: month.label }))}
          selected={current.month}
          onSelect={(month) => commit({ month })}
        />
        <Wheel
          label="Day"
          disabled={disabled}
          options={days.map((day) => ({ value: day, label: String(day) }))}
          selected={current.day}
          onSelect={(day) => commit({ day })}
        />
        <Wheel
          label="Year"
          disabled={disabled}
          options={years.map((year) => ({ value: year, label: String(year) }))}
          selected={current.year}
          onSelect={(year) => commit({ year })}
        />
      </div>
    </div>
  );
}

function Wheel({
  label,
  options,
  selected,
  onSelect,
  disabled,
}: {
  label: string;
  options: { value: number; label: string }[];
  selected: number;
  onSelect: (value: number) => void;
  disabled?: boolean;
}) {
  const listRef = useRef<HTMLUListElement>(null);
  const frame = useRef<number | null>(null);
  const scrolling = useRef(false);

  const index = Math.max(
    0,
    options.findIndex((option) => option.value === selected),
  );

  // Keep the wheel aligned with the current value (including external changes).
  useEffect(() => {
    const node = listRef.current;
    if (!node || scrolling.current) return;
    const target = index * ITEM_HEIGHT;
    if (Math.abs(node.scrollTop - target) > 1) {
      node.scrollTo({ top: target, behavior: "auto" });
    }
  }, [index]);

  function handleScroll() {
    const node = listRef.current;
    if (!node || disabled) return;
    scrolling.current = true;
    if (frame.current) window.clearTimeout(frame.current);
    frame.current = window.setTimeout(() => {
      scrolling.current = false;
      const nextIndex = Math.round(node.scrollTop / ITEM_HEIGHT);
      const option = options[Math.min(Math.max(nextIndex, 0), options.length - 1)];
      if (option && option.value !== selected) onSelect(option.value);
    }, 120);
  }

  return (
    <ul
      ref={listRef}
      aria-label={label}
      onScroll={handleScroll}
      className="scrollbar-none h-full snap-y snap-mandatory overflow-y-scroll overscroll-contain text-center"
      style={{
        paddingTop: ITEM_HEIGHT * 2,
        paddingBottom: ITEM_HEIGHT * 2,
        scrollbarWidth: "none",
      }}
    >
      {options.map((option) => {
        const isSelected = option.value === selected;
        return (
          <li
            key={option.value}
            className="snap-center"
            style={{ height: ITEM_HEIGHT, lineHeight: `${ITEM_HEIGHT}px` }}
          >
            <button
              type="button"
              disabled={disabled}
              aria-pressed={isSelected}
              onClick={() => onSelect(option.value)}
              className={`w-full truncate px-1 text-sm transition-colors ${
                isSelected ? "font-medium text-foreground" : "text-muted-foreground"
              }`}
            >
              {option.label}
            </button>
          </li>
        );
      })}
    </ul>
  );
}
