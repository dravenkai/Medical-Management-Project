"use client";

import Image from "next/image";
import { Star } from "lucide-react";
import { useLanguage } from "@/components/LanguageContext";
import ProductReviewForm from "@/components/ProductReviewForm";
import AddToCartButton from "@/components/AddToCartButton";

interface Review {
  id: number;
  rating: number;
  comment: string | null;
  created_at: string;
  reviewer_name: string;
}

interface Product {
  id: number;
  name: string;
  category: string;
  description: string | null;
  image_url: string | null;
  selling_price_ks: number;
  stock_qty: number;
  reserved_qty?: number;
}

export default function ProductDetailView({
  product,
  reviews,
  reviewCount,
  averageRating,
}: {
  product: Product;
  reviews: Review[];
  reviewCount: number;
  averageRating: number;
}) {
  const { t } = useLanguage();
  const availableQty = product.stock_qty - (product.reserved_qty ?? 0);

  return (
    <div className="pt-32 pb-20">
      <div className="max-w-[1400px] mx-auto px-10 grid md:grid-cols-2 gap-12">
        <div className="relative h-[360px] md:h-[440px] w-full rounded-3xl bg-gradient-to-br from-blue-50 to-indigo-50">
          {product.image_url && (
            <Image
              src={product.image_url}
              alt={product.name}
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-contain p-8"
              priority
            />
          )}
        </div>

        <div>
          <p className="inline-block rounded-full bg-blue-50 px-3 py-1 text-xs font-bold uppercase tracking-widest text-blue-600">
            {product.category}
          </p>
          <h1 className="mt-3 text-3xl md:text-4xl font-extrabold tracking-tight text-zinc-900">{product.name}</h1>

          <div className="mt-3 flex items-center gap-2">
            <div className="flex">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  size={18}
                  className={averageRating >= star - 0.5 ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                />
              ))}
            </div>
            <span className="text-sm font-semibold text-slate-500">
              {reviewCount > 0
                ? `${averageRating.toFixed(1)} (${reviewCount} ${reviewCount === 1 ? t("productDetail.review") : t("productDetail.reviews")})`
                : t("productDetail.noRating")}
            </span>
          </div>

          <p className="mt-5 text-3xl font-black bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            {Number(product.selling_price_ks).toLocaleString()} <span className="text-sm font-bold">MMK</span>
          </p>

          <p className="mt-2 text-sm font-bold uppercase tracking-wider text-emerald-600">
            {availableQty > 0 ? `${availableQty} ${t("product.available")}` : t("product.outOfStock")}
          </p>

          {product.description && <p className="mt-5 text-zinc-600 leading-relaxed">{product.description}</p>}

          <div className="mt-8">
            <AddToCartButton
              product={{
                id: product.id,
                name: product.name,
                category: product.category,
                image_url: product.image_url,
                price: product.selling_price_ks,
              }}
              disabled={availableQty <= 0}
            />
          </div>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 mt-16 grid md:grid-cols-[1.2fr_0.8fr] gap-10">
        <div>
          <h2 className="text-xl font-black text-zinc-900">{t("productDetail.reviewsHeading")}</h2>
          <div className="mt-5 space-y-4">
            {reviews.length === 0 && (
              <p className="rounded-2xl border border-slate-100 bg-white p-6 text-center text-sm text-slate-500">
                {t("productDetail.noReviews")}
              </p>
            )}
            {reviews.map((review) => (
              <div key={review.id} className="rounded-2xl border border-slate-100 bg-white p-5">
                <div className="flex items-center justify-between">
                  <p className="font-bold text-slate-800">{review.reviewer_name}</p>
                  <div className="flex">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star
                        key={star}
                        size={14}
                        className={review.rating >= star ? "fill-amber-400 text-amber-400" : "text-slate-300"}
                      />
                    ))}
                  </div>
                </div>
                {review.comment && <p className="mt-2 text-sm text-zinc-600">{review.comment}</p>}
                <p className="mt-2 text-xs text-slate-400">{new Date(review.created_at).toLocaleDateString()}</p>
              </div>
            ))}
          </div>
        </div>

        <div>
          <ProductReviewForm medicineId={product.id} />
        </div>
      </div>
    </div>
  );
}
