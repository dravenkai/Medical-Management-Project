"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import { useLanguage } from "@/components/LanguageContext";

interface Advertisement {
  id: number;
  title: string;
  description: string | null;
  title_my: string | null;
  description_my: string | null;
  image_url: string;
  link_url: string | null;
}

/** Admin-managed promo slideshow, backed by /api/advertisements. Renders nothing if there are no active slides, rather than showing an empty section. */
export default function AdvertisementSlideshow() {
  const { lang } = useLanguage();
  const [ads, setAds] = useState<Advertisement[]>([]);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    fetch("/api/advertisements")
      .then((r) => r.json())
      .then((result) => result.success && setAds(result.data))
      .finally(() => setLoaded(true));
  }, []);

  if (!loaded || ads.length === 0) return null;

  return (
    <section className="max-w-[1400px] mx-auto px-10 pt-4">
      <Swiper
        modules={[Autoplay, Pagination]}
        autoplay={{ delay: 4500, disableOnInteraction: false }}
        pagination={{ clickable: true }}
        loop={ads.length > 1}
        className="ad-slideshow overflow-hidden rounded-3xl shadow-lg"
      >
        {ads.map((ad) => {
          // Myanmar fields are optional per slide — fall back to English
          // whenever the admin left them blank, rather than showing nothing.
          const title = lang === "my" && ad.title_my ? ad.title_my : ad.title;
          const description = lang === "my" && ad.description_my ? ad.description_my : ad.description;

          const content = (
            <div className="relative h-[220px] md:h-[300px] w-full">
              <Image
                src={ad.image_url}
                alt={title}
                fill
                sizes="100vw"
                className="object-cover"
                priority={ad.id === ads[0].id}
              />
              {/* Gradient overlay so light text stays readable regardless of the photo underneath */}
              <div className="absolute inset-0 bg-gradient-to-r from-blue-950/85 via-blue-900/50 to-transparent" />
              <div className="relative z-10 flex h-full max-w-xl flex-col justify-center gap-3 px-8 md:px-12">
                <h2 className="text-2xl md:text-3xl font-black text-white drop-shadow-sm">{title}</h2>
                {description && (
                  <p className="text-sm md:text-base text-blue-50/90 leading-relaxed">{description}</p>
                )}
              </div>
            </div>
          );
          return (
            <SwiperSlide key={ad.id}>
              {ad.link_url ? (
                <Link href={ad.link_url} className="block">
                  {content}
                </Link>
              ) : (
                content
              )}
            </SwiperSlide>
          );
        })}
      </Swiper>

      <style jsx global>{`
        .ad-slideshow .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.5);
          opacity: 1;
        }
        .ad-slideshow .swiper-pagination-bullet-active {
          background: #ffffff;
        }
      `}</style>
    </section>
  );
}
