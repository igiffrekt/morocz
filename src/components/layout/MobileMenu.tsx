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
      className="overflow-hidden transition-[max-height] duration-300 ease-in-out bg-surface-white"
      style={{ maxHeight: isOpen ? "500px" : "0" }}
      aria-hidden={!isOpen}
    >
      <nav className="flex flex-col" aria-label="Mobil navigáció">
        {navigationLinks?.map((link) => (
          <a
            key={link._key}
            href={link.href ?? "#"}
            onClick={onClose}
            className="py-3 px-6 text-text-light font-medium border-b border-gray-100 min-h-[44px] flex items-center hover:text-primary transition-colors"
          >
            {link.label}
          </a>
        ))}

        <div className="my-4 mx-6">
          {phone ? (
            <a
              href={`tel:${phone}`}
              onClick={onClose}
              className="block w-full bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors text-center min-h-[44px] flex items-center justify-center"
            >
              Foglaljon időpontot
            </a>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="w-full bg-primary text-white px-6 py-2.5 rounded-xl font-semibold hover:bg-primary/90 transition-colors min-h-[44px]"
            >
              Foglaljon időpontot
            </button>
          )}
        </div>
      </nav>
    </div>
  );
}
