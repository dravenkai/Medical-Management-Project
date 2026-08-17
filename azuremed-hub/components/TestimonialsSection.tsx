"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { IoIosArrowBack, IoIosArrowForward } from "react-icons/io";
import { FaStar } from "react-icons/fa";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";
import Heading from "@/components/Heading";
import TestimonialForm from "@/components/TestimonialForm";
import { useLanguage } from "@/components/LanguageContext";

interface Review {
  id: number;
  name: string;
  title: string | null;
  comment: string;
  rating: number;
  avatar_url: string | null;
}

/** "Aung Kyaw" -> "AK", "Yan Naing" -> "YN", single-word names -> first 2 letters. */
function getInitials(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "?";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[words.length - 1][0]).toUpperCase();
}

const AVATAR_COLORS = [
  "bg-blue-500",
  "bg-indigo-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-rose-500",
  "bg-purple-500",
];

/** Deterministic color per name, so the same person always gets the same color rather than a random one each render. */
function getAvatarColor(name: string): string {
  const hash = Array.from(name).reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return AVATAR_COLORS[hash % AVATAR_COLORS.length];
}

// A character-count cutoff doesn't track actual rendered height — Burmese
// text (combining marks, wider glyphs) or a long wrapping name/title header
// eats more vertical space per "character" than English, so a fixed count
// either clips text that would've fit or (as reported) truncates it but
// still overflows the fixed-height card with the "See More" link scrolled
// out of view below the fold. Measuring the real DOM overflow instead —
// clamp to a few lines, then check scrollHeight vs clientHeight — only
// shows the link when the text actually exceeds the available space.
// (line-clamp-3 is a literal string, not built from a constant — Tailwind's
// content scanner can't see a dynamically-interpolated class name like
// `line-clamp-${n}` and would silently never generate that CSS.)
function ReviewComment({ text }: { text: string }) {
  const [expanded, setExpanded] = useState(false);
  const [isOverflowing, setIsOverflowing] = useState(false);
  const paragraphRef = useRef<HTMLParagraphElement>(null);
  const { t } = useLanguage();

  useEffect(() => {
    const el = paragraphRef.current;
    if (!el) return;
    setIsOverflowing(el.scrollHeight > el.clientHeight + 1);
  }, [text]);

  return (
    <div>
      <p
        ref={paragraphRef}
        className={`text-zinc-600 ${expanded ? "" : "line-clamp-3"}`}
      >
        {text}
      </p>
      {isOverflowing && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          className="mt-1 text-sm font-bold text-indigo-600 hover:underline"
        >
          {expanded ? t("testimonials.seeLess") : t("testimonials.seeMore")}
        </button>
      )}
    </div>
  );
}

/** Faithful port of Medical_Product/src/components/Testimonials/Testimonials.jsx, backed by real /api/reviews. */
export default function TestimonialsSection() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const { t } = useLanguage();

  function loadReviews() {
    return fetch("/api/reviews")
      .then((r) => r.json())
      .then((result) => result.success && setReviews(result.data.reviews));
  }

  useEffect(() => {
    loadReviews();

    // Next's built-in anchor scroll for a Link like "/#testimonials" races
    // against this section mounting when navigating in from a *different*
    // page — it lands on the Hero instead, and only a second click (now a
    // same-page hash jump the browser handles natively) actually scrolls
    // here. Scrolling explicitly once mounted makes the first click work.
    if (typeof window !== "undefined" && window.location.hash === "#testimonials") {
      document.getElementById("testimonials")?.scrollIntoView({ behavior: "smooth" });
    }
  }, []);

  return (
    <section id="testimonials" className="scroll-mt-28">
      <div className="max-w-[1400px] mx-auto px-10 py-16">
        <Heading highlight={t("testimonials.highlight")} heading={t("testimonials.heading")} />

        {reviews.length > 0 ? (
          <>
            <div className="flex justify-end mt-5 py-5 gap-x-3">
              <button className="custom-prev text-2xl text-zinc-800 rounded-lg w-11 h-11 flex justify-center items-center bg-zinc-100 hover:bg-gradient-to-b hover:from-indigo-400 hover:to-indigo-600 hover:text-white">
                <IoIosArrowBack />
              </button>
              <button className="custom-next text-2xl text-zinc-800 rounded-lg w-11 h-11 flex justify-center items-center bg-zinc-100 hover:bg-gradient-to-b hover:from-indigo-400 hover:to-indigo-600 hover:text-white">
                <IoIosArrowForward />
              </button>
            </div>

            <Swiper
              navigation={{ nextEl: ".custom-next", prevEl: ".custom-prev" }}
              loop={reviews.length > 3}
              breakpoints={{
                640: { slidesPerView: 1, spaceBetween: 20 },
                768: { slidesPerView: 2, spaceBetween: 20 },
                1024: { slidesPerView: 3, spaceBetween: 20 },
              }}
              modules={[Navigation]}
            >
              {reviews.map((item) => (
                <SwiperSlide
                  key={item.id}
                  className="flex flex-col bg-zinc-100 rounded-xl p-8"
                  // Inline style so this reliably wins regardless of
                  // swiper/css vs Tailwind load order — every card is
                  // exactly the same height. The comment area below scrolls
                  // internally on "See More" instead of growing the box.
                  style={{ height: 260 }}
                >
                  <div className="flex gap-5 items-center">
                    <div className="relative w-16 h-16 rounded-full overflow-hidden outline outline-orange-500 outline-offset-4 shrink-0">
                      {item.avatar_url ? (
                        <Image src={item.avatar_url} alt={item.name} fill sizes="64px" className="object-cover" />
                      ) : (
                        <div
                          className={`flex h-full w-full items-center justify-center text-lg font-bold text-white ${getAvatarColor(item.name)}`}
                        >
                          {getInitials(item.name)}
                        </div>
                      )}
                    </div>
                    <div>
                      <h5 className="text-xl font-bold">{item.name}</h5>
                      <p className="text-zinc-600">{item.title || t("testimonials.verifiedCustomer")}</p>
                      <span className="mt-3 flex items-center gap-2">
                        <span className="flex text-xl gap-1">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <FaStar key={star} className={item.rating >= star ? "text-yellow-400" : "text-zinc-300"} />
                          ))}
                        </span>
                        <span className="text-sm font-semibold text-zinc-500">{item.rating} {t("reviewForm.ratingOf5")}</span>
                      </span>
                    </div>
                  </div>
                  <div className="mt-6 flex-1 overflow-y-auto pr-1">
                    <ReviewComment text={item.comment} />
                  </div>
                </SwiperSlide>
              ))}
            </Swiper>
          </>
        ) : (
          <div className="rounded-xl bg-zinc-100 p-6 text-zinc-600">{t("testimonials.noReviews")}</div>
        )}

        <TestimonialForm onSubmitted={loadReviews} />
      </div>
    </section>
  );
}
