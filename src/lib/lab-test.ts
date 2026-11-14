/**
 * Lab package bodies (Sanity `labTest.body`, Portable Text) follow one editorial pattern:
 * h2 sections ("Mikor válassza…", "Mit vizsgálunk? (20 paraméter)", "Felkészülés…",
 * "Eredmények"), h3 parameter groups each followed by a comma-separated bullet, plain
 * bullets for preparation steps and normal paragraphs (bold marks only). This turns that
 * into a structure the redesigned page can lay out; anything else makes `parseLabBody`
 * return null so the page falls back to the generic Portable Text renderer.
 */

export interface LabSpan {
  text: string;
  strong: boolean;
}

export type LabBlock =
  | { kind: "p"; spans: LabSpan[] }
  /** Parameter group: h3 title + the parameters of the bullets under it. */
  | { kind: "group"; title: string; params: string[] }
  /** Plain bullet list (preparation steps, notes). */
  | { kind: "list"; items: LabSpan[][] };

export interface LabSection {
  title: string;
  blocks: LabBlock[];
}

interface PtSpan {
  _type?: string;
  text?: string;
  marks?: string[] | null;
}

export interface PtBlockLike {
  _type?: string;
  style?: string | null;
  listItem?: string | null;
  children?: PtSpan[] | null;
}

/** "GOT, GPT, ALP (máj-, csont- és izomműködés)" → ["GOT", "GPT", "ALP (máj-, csont- és izomműködés)"]. */
export function splitParams(text: string): string[] {
  const out: string[] = [];
  let depth = 0;
  let current = "";
  for (const ch of text) {
    if (ch === "(") depth += 1;
    if (ch === ")") depth = Math.max(0, depth - 1);
    if (ch === "," && depth === 0) {
      if (current.trim()) out.push(current.trim());
      current = "";
      continue;
    }
    current += ch;
  }
  if (current.trim()) out.push(current.trim());
  return out;
}

/** "Mit vizsgálunk? (20 paraméter)" → "20 paraméter". */
export function paramCount(title: string): string | null {
  return title.match(/\(([^)]*paraméter)\)/i)?.[1]?.trim() ?? null;
}

function spansOf(block: PtBlockLike): LabSpan[] | null {
  const spans: LabSpan[] = [];
  for (const child of block.children ?? []) {
    if (child._type && child._type !== "span") return null;
    const marks = child.marks ?? [];
    if (marks.some((m) => m !== "strong" && m !== "em")) return null;
    spans.push({ text: child.text ?? "", strong: marks.includes("strong") });
  }
  return spans;
}

const plain = (spans: LabSpan[]) =>
  spans
    .map((s) => s.text)
    .join("")
    .trim();

export function parseLabBody(body: readonly PtBlockLike[] | null | undefined): LabSection[] | null {
  if (!body?.length) return null;
  const sections: LabSection[] = [];
  let section: LabSection | null = null;
  let group: Extract<LabBlock, { kind: "group" }> | null = null;

  const current = (): LabSection => {
    if (!section) {
      section = { title: "", blocks: [] };
      sections.push(section);
    }
    return section;
  };

  for (const block of body) {
    if (block._type !== "block") return null;
    const spans = spansOf(block);
    if (!spans) return null;
    const text = plain(spans);
    if (!text) continue;
    const style = block.style ?? "normal";

    if (style === "h2") {
      section = { title: text, blocks: [] };
      sections.push(section);
      group = null;
      continue;
    }
    if (style === "h3") {
      group = { kind: "group", title: text, params: [] };
      current().blocks.push(group);
      continue;
    }
    if (style !== "normal") return null;

    if (block.listItem) {
      if (block.listItem !== "bullet") return null;
      if (group) {
        group.params.push(...splitParams(text));
        continue;
      }
      const target = current();
      const last = target.blocks.at(-1);
      if (last?.kind === "list") last.items.push(spans);
      else target.blocks.push({ kind: "list", items: [spans] });
      continue;
    }

    group = null;
    current().blocks.push({ kind: "p", spans });
  }

  return sections.length ? sections : null;
}
