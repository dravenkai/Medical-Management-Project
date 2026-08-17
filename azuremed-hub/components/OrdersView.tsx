"use client";

import { useLanguage } from "@/components/LanguageContext";
import type { TranslationKey } from "@/lib/translations";

interface OrderItem {
  qty: number;
  unit_price_ks: number;
  total_price_ks: number;
  name: string;
}

interface Order {
  id: number;
  order_code: string;
  payment_method: string;
  subtotal_ks: number;
  tax_ks: number;
  delivery_fee_ks: number;
  discount_ks: number;
  promo_code: string | null;
  total_ks: number;
  status: string;
  payment_status: string;
  created_at: string;
  items: OrderItem[];
}

const STATUS_KEYS: Record<string, TranslationKey> = {
  pending: "orders.statusPending",
  confirmed: "orders.statusConfirmed",
  processing: "orders.statusProcessing",
  shipped: "orders.statusShipped",
  delivered: "orders.statusDelivered",
  cancelled: "orders.statusCancelled",
};

/**
 * app/(storefront)/orders/page.tsx is a Server Component (auth check + DB
 * queries) so it can't call the client-only useLanguage() hook — this takes
 * the already-fetched data and does all the rendering/translation.
 */
export default function OrdersView({
  orders,
  placedCode,
  timesBought,
  itemsPurchased,
  totalSpent,
}: {
  orders: Order[];
  placedCode?: string;
  timesBought: number;
  itemsPurchased: number;
  totalSpent: number;
}) {
  const { t } = useLanguage();

  return (
    <div className="mx-auto max-w-5xl px-6 py-28 sm:px-10">
      <h1 className="text-3xl font-bold text-zinc-800">{t("orders.heading")}</h1>
      <p className="mt-1 text-sm text-zinc-500">{t("orders.subheading")}</p>

      {placedCode && (
        <div className="mt-4 rounded-2xl border border-emerald-200 bg-emerald-50 px-5 py-3 text-sm font-semibold text-emerald-700">
          {t("orders.placedSuccess").replace("{code}", placedCode)}
        </div>
      )}

      <div className="mt-8 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{t("orders.timesBought")}</p>
          <p className="mt-2 text-2xl font-black text-zinc-900">{timesBought}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{t("orders.itemsPurchased")}</p>
          <p className="mt-2 text-2xl font-black text-zinc-900">{itemsPurchased}</p>
        </div>
        <div className="rounded-2xl border border-zinc-200 bg-white p-5">
          <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">{t("orders.totalSpent")}</p>
          <p className="mt-2 text-2xl font-black text-zinc-900">{totalSpent.toLocaleString()} MMK</p>
        </div>
      </div>

      <div className="mt-8 space-y-6">
        {orders.length === 0 && <p className="py-16 text-center text-zinc-500">{t("orders.noOrdersYet")}</p>}
        {orders.map((order, index) => (
          <div key={order.id} className="rounded-2xl border border-zinc-200 bg-white p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-black text-zinc-800">{t("orders.billNumber").replace("{n}", String(orders.length - index))}</p>
                <p className="text-xs text-zinc-400">
                  {new Date(order.created_at).toLocaleString()} | {order.order_code}
                </p>
              </div>
              <div className="flex gap-2">
                <span className="rounded-full bg-blue-100 px-3 py-1 text-xs font-bold uppercase text-blue-700">
                  {order.payment_method === "kpay" ? t("checkout.kbzPay") : t("checkout.cashOnDelivery")}
                </span>
                <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-bold uppercase text-amber-700">
                  {t(STATUS_KEYS[order.status] ?? "orders.statusPending")}
                </span>
                {order.payment_status === "pending_review" && (
                  <span className="rounded-full bg-yellow-100 px-3 py-1 text-xs font-bold uppercase text-yellow-700">
                    {t("orders.paymentUnderReview")}
                  </span>
                )}
                {order.payment_status === "confirmed" && (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold uppercase text-emerald-700">
                    {t("orders.paymentVerified")}
                  </span>
                )}
                {order.payment_status === "rejected" && (
                  <span className="rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase text-red-700">
                    {t("orders.paymentRejected")}
                  </span>
                )}
              </div>
            </div>

            <table className="mt-4 w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wider text-zinc-400">
                  <th className="py-2">{t("orders.item")}</th>
                  <th>{t("checkout.qty")}</th>
                  <th>{t("orders.price")}</th>
                  <th>{t("orders.total")}</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item, i) => (
                  <tr key={i} className="border-t border-zinc-100">
                    <td className="py-2 font-semibold text-zinc-800">{item.name}</td>
                    <td>{item.qty}</td>
                    <td>{Number(item.unit_price_ks).toLocaleString()} MMK</td>
                    <td className="font-bold text-zinc-900">{Number(item.total_price_ks).toLocaleString()} MMK</td>
                  </tr>
                ))}
              </tbody>
            </table>

            <div className="mt-4 ml-auto w-full max-w-xs space-y-1 text-sm">
              <div className="flex justify-between">
                <span className="text-zinc-500">{t("cart.subtotal")}</span>
                <span className="font-bold text-zinc-800">{Number(order.subtotal_ks).toLocaleString()} MMK</span>
              </div>
              <div className="flex justify-between">
                <span className="text-zinc-500">{t("orders.tax")}</span>
                <span className="font-bold text-zinc-800">{Number(order.tax_ks).toLocaleString()} MMK</span>
              </div>
              {Number(order.delivery_fee_ks) > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t("checkout.deliveryFee")}</span>
                  <span className="font-bold text-zinc-800">{Number(order.delivery_fee_ks).toLocaleString()} MMK</span>
                </div>
              )}
              {Number(order.discount_ks) > 0 && (
                <div className="flex justify-between">
                  <span className="text-zinc-500">{t("orders.promo").replace("{code}", order.promo_code ?? "")}</span>
                  <span className="font-bold text-emerald-600">-{Number(order.discount_ks).toLocaleString()} MMK</span>
                </div>
              )}
              <div className="flex justify-between border-t border-zinc-200 pt-2">
                <span className="font-black text-zinc-700">{t("orders.total")}</span>
                <span className="font-black text-blue-700">{Number(order.total_ks).toLocaleString()} MMK</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
