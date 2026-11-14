/** Pixel size encoded in a Sanity image asset id ("image-<hash>-624x842-webp"). */
export function assetDimensions(ref: string | null | undefined): {
  width: number;
  height: number;
} | null {
  const match = ref?.match(/-(\d+)x(\d+)-[a-z0-9]+$/i);
  if (!match) return null;
  return { width: Number(match[1]), height: Number(match[2]) };
}

/**
 * Square crop that centres the face of the doctor's portrait cut-out (head in the
 * upper part, slightly left of centre) — for the round author avatars.
 */
export function portraitFaceRect(width: number, height: number) {
  const size = Math.round(Math.min(width * 0.52, height));
  const centreX = width * 0.425;
  const centreY = height * 0.205;
  const clamp = (v: number, max: number) => Math.round(Math.min(Math.max(v, 0), max));
  return {
    left: clamp(centreX - size / 2, width - size),
    top: clamp(centreY - size / 2, height - size),
    size,
  };
}

/** Minimal Portable Text shape the article helpers need. */
export interface PtBlockLike {
  _type: string;
  _key?: string;
  style?: string;
  listItem?: string;
  children?: Array<{ text?: string }>;
}

export function blockText(block: PtBlockLike): string {
  return (block.children ?? []).map((c) => c.text ?? "").join("");
}

/** "≈ 3 perc olvasás" estimate (200 words / minute, at least 1). */
export function readingMinutes(body: readonly PtBlockLike[]): number {
  const words = body
    .filter((b) => b._type === "block")
    .reduce((sum, b) => sum + (blockText(b).trim().match(/\S+/g)?.length ?? 0), 0);
  return Math.max(1, Math.round(words / 200));
}

export type ArticleSegment<T extends PtBlockLike> =
  | { kind: "lead"; key: string; blocks: T[] }
  | { kind: "callout"; key: string; heading: T; items: T[]; ordered: boolean; index: number }
  | { kind: "blocks"; key: string; blocks: T[] };

const isEmptyParagraph = (b: PtBlockLike) =>
  b._type === "block" && !b.listItem && blockText(b).trim() === "";
const isParagraph = (b: PtBlockLike) =>
  b._type === "block" && !b.listItem && (b.style ?? "normal") === "normal";

/**
 * Editorial layout of a blog body (BlogCikk): the first paragraph becomes the lead,
 * "intro paragraph + list" pairs become callout cards, empty spacer paragraphs are
 * dropped and everything else is rendered as regular Portable Text, in order.
 */
export function segmentArticle<T extends PtBlockLike>(body: readonly T[]): ArticleSegment<T>[] {
  const blocks = body.filter((b) => !isEmptyParagraph(b));
  const segments: ArticleSegment<T>[] = [];
  let run: T[] = [];
  let callouts = 0;

  const flush = () => {
    if (run.length) {
      segments.push({ kind: "blocks", key: `b-${run[0]?._key ?? segments.length}`, blocks: run });
      run = [];
    }
  };

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i] as T;
    if (i === 0 && isParagraph(block)) {
      segments.push({ kind: "lead", key: `l-${block._key ?? i}`, blocks: [block] });
      continue;
    }
    const next = blocks[i + 1];
    if (isParagraph(block) && next?.listItem) {
      const items: T[] = [];
      let j = i + 1;
      while (j < blocks.length && blocks[j]?.listItem === next.listItem) {
        items.push(blocks[j] as T);
        j++;
      }
      flush();
      segments.push({
        kind: "callout",
        key: `c-${block._key ?? i}`,
        heading: block,
        items,
        ordered: next.listItem === "number",
        index: callouts++,
      });
      i = j - 1;
      continue;
    }
    run.push(block);
  }
  flush();
  return segments;
}
