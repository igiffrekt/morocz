"use client";

import { FadeIn } from "@/components/motion/FadeIn";
import { urlFor } from "@/sanity/lib/image";
import Image from "next/image";
import { motion, AnimatePresence } from "motion/react";
import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";

interface YogaInstructor {
  _id: string;
  name: string;
  slug?: { current: string };
  photo?: {
    asset?: { _ref: string };
  };
  bio?: string;
  phone?: string;
  email?: string;
  color?: string;
}

interface YogaInstructorsSectionProps {
  instructors: YogaInstructor[];
}

const DEFAULT_COLOR = "#76c8b6";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

export function YogaInstructorsSection({
  instructors,
}: YogaInstructorsSectionProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [selectedInstructor, setSelectedInstructor] = useState<YogaInstructor | null>(null);

  const getInstructorSlug = (instructor: YogaInstructor) =>
    instructor.slug?.current || slugify(instructor.name);

  // Open modal from URL on mount
  useEffect(() => {
    const oktato = searchParams.get("oktato");
    if (oktato && instructors.length > 0) {
      const found = instructors.find((i) => getInstructorSlug(i) === oktato);
      if (found) {
        setSelectedInstructor(found);
      }
    }
  }, [searchParams, instructors]);

  const openModal = (instructor: YogaInstructor) => {
    const slug = getInstructorSlug(instructor);
    router.push(`/joga?oktato=${slug}`, { scroll: false });
    setSelectedInstructor(instructor);
  };

  const closeModal = () => {
    router.push("/joga", { scroll: false });
    setSelectedInstructor(null);
  };

  return (
    <section id="oktatok" className="py-16 lg:py-24 bg-secondary/30">
      <div className="max-w-7xl mx-auto px-4">
        {/* Header */}
        <FadeIn direction="up">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-3 text-xs font-semibold tracking-[0.2em] uppercase text-primary/40 mb-4">
              <span className="w-8 h-px bg-primary/20" />
              Oktatóink
              <span className="w-8 h-px bg-primary/20" />
            </span>
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-extrabold leading-tight text-primary">
              Ismerd meg oktatóinkat
            </h2>
          </div>
        </FadeIn>

        {/* Instructors Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8">
          {instructors.map((instructor, index) => {
            const photoUrl = instructor.photo?.asset
              ? urlFor(instructor.photo).width(400).height(400).fit("crop").url()
              : null;
            const accentColor = instructor.color || DEFAULT_COLOR;

            return (
              <FadeIn key={instructor._id} direction="up" delay={0.1 * index}>
                <motion.button
                  onClick={() => openModal(instructor)}
                  className="bg-white rounded-3xl overflow-hidden border border-gray-100 shadow-sm hover:shadow-md transition-shadow w-full text-left cursor-pointer"
                  whileHover={{ y: -4 }}
                  transition={{ duration: 0.2 }}
                >
                  {/* Photo */}
                  <div className="aspect-square relative bg-gray-100">
                    {photoUrl ? (
                      <Image
                        src={photoUrl}
                        alt={instructor.name}
                        fill
                        className="object-cover"
                        sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-6xl text-gray-300">
                        🧘
                      </div>
                    )}
                    {/* Color accent */}
                    <div
                      className="absolute bottom-0 left-0 right-0 h-1"
                      style={{ backgroundColor: accentColor }}
                    />
                  </div>

                  {/* Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-primary mb-2">
                      {instructor.name}
                    </h3>
                    {instructor.bio && (
                      <p className="text-gray-600 text-sm leading-relaxed line-clamp-2">
                        {instructor.bio}
                      </p>
                    )}
                  </div>
                </motion.button>
              </FadeIn>
            );
          })}
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {selectedInstructor && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => closeModal()}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              transition={{ type: "spring", bounce: 0.25 }}
              className="bg-white rounded-3xl rounded-b-lg max-w-md w-full overflow-hidden shadow-2xl flex flex-col"
              style={{ maxHeight: "577px" }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header with photo */}
              <div
                className="flex-shrink-0 relative"
                style={{
                  backgroundColor: selectedInstructor.color || DEFAULT_COLOR,
                }}
              >
                <button
                  onClick={() => closeModal()}
                  className="absolute top-4 right-4 w-10 h-10 min-w-[40px] min-h-[40px] rounded-full bg-white/50 flex items-center justify-center hover:bg-white/70 transition-colors flex-shrink-0 z-10"
                >
                  <svg className="w-5 h-5 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>

                <div className="p-6 pb-4 flex items-center gap-4">
                  {selectedInstructor.photo?.asset ? (
                    <img
                      src={urlFor(selectedInstructor.photo).width(160).height(160).url()}
                      alt={selectedInstructor.name}
                      className="w-20 h-20 rounded-full object-cover border-4 border-white/50"
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-white/30 flex items-center justify-center text-3xl">
                      🧘
                    </div>
                  )}
                  <div className="pr-10">
                    <h3 className="text-2xl font-bold text-primary">
                      {selectedInstructor.name}
                    </h3>
                    <p className="text-primary/70 text-sm">Jóga oktató</p>
                  </div>
                </div>
              </div>

              {/* Scrollable content */}
              <style>{`
                .instructor-modal-content::-webkit-scrollbar {
                  width: 8px;
                }
                .instructor-modal-content::-webkit-scrollbar-track {
                  background: transparent;
                }
                .instructor-modal-content::-webkit-scrollbar-thumb {
                  background: ${selectedInstructor.color || DEFAULT_COLOR};
                  border-radius: 4px;
                }
                .instructor-modal-content::-webkit-scrollbar-thumb:hover {
                  background: ${selectedInstructor.color || DEFAULT_COLOR}dd;
                }
              `}</style>
              <div
                className="instructor-modal-content flex-1 min-h-0 p-6 pb-8 space-y-4 overflow-y-auto"
                style={{
                  scrollbarWidth: "thin",
                  scrollbarColor: `${selectedInstructor.color || DEFAULT_COLOR} transparent`,
                } as React.CSSProperties}
              >
                {/* Bio */}
                {selectedInstructor.bio && (
                  <div>
                    <div className="text-sm text-gray-500 mb-2">Bemutatkozás</div>
                    <p className="text-gray-700 leading-relaxed whitespace-pre-line">
                      {selectedInstructor.bio}
                    </p>
                  </div>
                )}

                {/* Contact */}
                {(selectedInstructor.phone || selectedInstructor.email) && (
                  <div className="border-t border-gray-100 pt-4">
                    <div className="text-sm text-gray-500 mb-3">Kapcsolat</div>
                    <div className="space-y-3">
                      {selectedInstructor.phone && (
                        <a
                          href={`tel:${selectedInstructor.phone}`}
                          className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${selectedInstructor.color || DEFAULT_COLOR}30` }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"
                              />
                            </svg>
                          </div>
                          <span className="font-medium">{selectedInstructor.phone}</span>
                        </a>
                      )}
                      {selectedInstructor.email && (
                        <a
                          href={`mailto:${selectedInstructor.email}`}
                          className="flex items-center gap-3 text-primary hover:text-primary/80 transition-colors"
                        >
                          <div
                            className="w-10 h-10 rounded-full flex items-center justify-center"
                            style={{ backgroundColor: `${selectedInstructor.color || DEFAULT_COLOR}30` }}
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"
                              />
                            </svg>
                          </div>
                          <span className="font-medium">{selectedInstructor.email}</span>
                        </a>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
