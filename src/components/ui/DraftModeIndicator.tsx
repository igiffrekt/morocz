import { draftMode } from "next/headers";
import Link from "next/link";

export async function DraftModeIndicator() {
  const { isEnabled } = await draftMode();

  if (!isEnabled) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[60] bg-primary text-white py-2 px-4 flex justify-center items-center gap-4">
      <span className="text-sm font-bold">Előnézet mód aktív</span>
      <Link
        href="/api/disable-draft"
        className="rounded-lg bg-white/20 hover:bg-white/30 text-white px-3 py-1 text-sm transition-colors"
      >
        Kilépés
      </Link>
    </div>
  );
}
