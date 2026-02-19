"use client";

interface MobileMenuProps {
  isOpen: boolean;
  navigationLinks?: Array<{ _key: string; label?: string; href?: string }>;
  phone?: string;
  onClose?: () => void;
}

export function MobileMenu({ isOpen, navigationLinks, phone, onClose }: MobileMenuProps) {
  return (
    <div
      className="overflow-hidden transition-[max-height] duration-300 ease-in-out bg-surface-white rounded-b-3xl shadow-lg"
      style={{ maxHeight: isOpen ? "500px" : "0" }}
      aria-hidden={!isOpen}
    >
      <nav className="flex flex-col px-4 pb-4" aria-label="Mobil navigáció">
        {navigationLinks?.map((link) => (
          <a
            key={link._key}
            href={link.href ?? "#"}
            onClick={onClose}
            className="py-3 px-4 text-text-light font-semibold text-sm border-b border-gray-100 min-h-[44px] flex items-center hover:text-primary transition-colors"
          >
            {link.label}
          </a>
        ))}

        <div className="mt-4">
          <a
            href={phone ? `tel:${phone}` : "#kapcsolat"}
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full px-6 py-3 rounded-full border border-gray-200 hover:bg-gray-50 transition-colors text-sm font-bold text-primary min-h-[44px]"
          >
            Foglaljon időpontot
          </a>
        </div>
      </nav>
    </div>
  );
}
