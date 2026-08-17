import { Suspense } from "react";
import Image from "next/image";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";
import ProductCard from "@/components/ProductCard";
import ProductToolbar from "@/components/ProductToolbar";
import { ProductsCatalogBadge, ProductsTitle, ProductsFoundBadge, ProductsEmptyState } from "@/components/ProductsPageText";

// Only 3 pieces of category art exist from the old taxonomy; the 3 new
// categories without a match (Fitness & Supplement, Sexual Wellness, Mother
// & Child) just render the plain gradient banner below — `banner &&` in the
// JSX already handles an undefined lookup gracefully.
const BANNER_ART: Record<string, string> = {
  "Fever, Cough & Cold": "/images/Engmedicines/Hero.png",
  "Traditional Medicine": "/images/categories/myanmar-medicine.png",
  "Personal Care & Equipment": "/images/categories/medical-equipment.png",
};

// Keys match ProductToolbar's SORT_OPTIONS. Anything unrecognized (or the
// default "featured", which has no dedicated column to rank by) falls back
// to id ASC — stable catalog/insertion order.
const SORT_CLAUSES: Record<string, string> = {
  newest: "created_at DESC",
  "name-asc": "name ASC",
  "price-asc": "selling_price_ks ASC",
  "price-desc": "selling_price_ks DESC",
};

// No auth/session call here for Next to detect as a "dynamic API", so it
// gets silently build-time prerendered otherwise — which tries to connect
// to the DB at build time and fails on hosts (Vercel) that can't reach it.
export const dynamic = "force-dynamic";

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: { category?: string; search?: string; sort?: string };
}) {
  const category = searchParams.category?.trim();
  const search = searchParams.search?.trim();
  const sort = searchParams.sort?.trim() ?? "featured";
  const title = category ?? "All Products";
  const banner = category ? BANNER_ART[category] : "/images/hero-medical-supplies.png";
  const orderBy = SORT_CLAUSES[sort] ?? "id ASC";

  const [products] = await pool.query<RowDataPacket[]>(
    `SELECT id, name, category, description, image_url, selling_price_ks, stock_qty, reserved_qty, status
     FROM medicines
     WHERE is_active = 1
       AND (:category IS NULL OR category = :category)
       AND (:search IS NULL OR name LIKE CONCAT('%', :search, '%'))
     ORDER BY ${orderBy}`,
    { category: category || null, search: search || null }
  );

  return (
    <div className="pt-32">
      {/* Category banner — redesigned to match the gradient hero treatment */}
      <div className="relative h-64 w-full overflow-hidden">
        {banner && <Image src={banner} alt={title} fill sizes="100vw" className="object-cover" />}
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/80 via-blue-800/60 to-indigo-900/80" />
        <div className="pointer-events-none absolute -top-20 -right-20 h-72 w-72 rounded-full bg-blue-400/20 blur-3xl" />
        <div className="relative flex h-full flex-col items-center justify-center gap-3 text-center px-6">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-4 py-1.5 text-xs font-bold uppercase tracking-widest text-blue-50 ring-1 ring-white/30 backdrop-blur-sm">
            <ProductsCatalogBadge />
          </span>
          <h1 className="text-3xl md:text-5xl font-extrabold text-white drop-shadow-sm">
            <ProductsTitle category={category} />
          </h1>
        </div>
      </div>

      <div className="max-w-[1400px] mx-auto px-10 py-10">
        <Suspense fallback={null}>
          <ProductToolbar activeCategory={category} activeSearch={search} activeSort={sort} />
        </Suspense>

        <div className="flex items-center gap-3 mt-6">
          <span className="rounded-full bg-blue-100 px-4 py-1.5 text-sm font-bold text-blue-700">
            <ProductsFoundBadge count={products.length} />
          </span>
        </div>

        {products.length === 0 ? (
          <ProductsEmptyState />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-9 mt-10">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={{
                  id: product.id,
                  name: product.name,
                  category: product.category,
                  image_url: product.image_url,
                  selling_price_ks: product.selling_price_ks,
                  stock_qty: product.stock_qty,
                  reserved_qty: product.reserved_qty,
                }}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
