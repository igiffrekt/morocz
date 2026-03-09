"use client";

interface MobileMenuProps {
  isOpen: boolean;
  navigationLinks?: Array<{ _key: string; label?: string; href?: string }>;
  phone?: string;
  onClose?: () => void;
  onPhoneClick?: () => void;
}

export function MobileMenu({
  isOpen,
  navigationLinks,
  phone,
  onClose,
  onPhoneClick,
}: MobileMenuProps) {
  const handlePhoneClick = () => {
    onClose?.();
    onPhoneClick?.();
  };

  return (
    <div
      className="overflow-hidden transition-[max-height] duration-300 ease-in-out bg-surface-white rounded-b-3xl shadow-lg"
      style={{ maxHeight: isOpen ? "600px" : "0" }}
      aria-hidden={!isOpen}
    >
      <nav className="flex flex-col px-5 pt-8 pb-6" aria-label="Mobil navigáció">
        {navigationLinks?.map((link) => (
          <a
            key={link._key}
            href={link.href ?? "#"}
            onClick={onClose}
            className="py-4 px-4 text-text-light font-semibold text-lg border-b border-gray-100 min-h-[52px] flex items-center hover:text-primary transition-colors"
          >
            {link.label}
          </a>
        ))}

        <div className="mt-6">
          <a
            href="/idopontfoglalas"
            onClick={onClose}
            className="flex items-center justify-center gap-2 w-full px-6 py-4 rounded-full bg-[#a3dac2] hover:bg-[#8fcdb3] transition-colors text-base font-bold text-primary min-h-[52px]"
          >
            Foglaljon időpontot
            <svg
              className="w-5 h-5"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </nav>
    </div>
  );
}
