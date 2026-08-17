import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/config/db";
import type { RowDataPacket } from "mysql2";
import OrdersView from "@/components/OrdersView";

// Explicit, not relying on searchParams/getServerSession usage alone to
// signal dynamic rendering to Next — a build-time DB connection to a host
// unreachable from Vercel's build servers (like localhost) is fatal either way.
export const dynamic = "force-dynamic";

/** Ported from Medical_Product/src/components/Orders/Orders.jsx ("Purchase Bills"). */
export default async function PurchaseBillsPage({
  searchParams,
}: {
  searchParams: { placed?: string };
}) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    redirect("/login");
  }

  const [orders] = await pool.query<RowDataPacket[]>(
    `SELECT id, order_code, payment_method, shipping_name, shipping_phone, subtotal_ks, tax_ks,
            delivery_fee_ks, discount_ks, promo_code, total_ks, status, payment_status, created_at
     FROM orders WHERE user_id = :userId ORDER BY created_at DESC`,
    { userId: Number(session.user.id) }
  );

  for (const order of orders) {
    const [items] = await pool.query<RowDataPacket[]>(
      `SELECT oi.qty, oi.unit_price_ks, oi.total_price_ks, m.name
       FROM order_items oi JOIN medicines m ON m.id = oi.medicine_id
       WHERE oi.order_id = :orderId`,
      { orderId: order.id }
    );
    order.items = items;
  }

  const timesBought = orders.length;
  const itemsPurchased = orders.reduce(
    (sum, order) => sum + order.items.reduce((s: number, item: RowDataPacket) => s + item.qty, 0),
    0
  );
  const totalSpent = orders.reduce((sum, order) => sum + order.total_ks, 0);

  return (
    <OrdersView
      orders={orders.map((order) => ({
        id: order.id,
        order_code: order.order_code,
        payment_method: order.payment_method,
        subtotal_ks: order.subtotal_ks,
        tax_ks: order.tax_ks,
        delivery_fee_ks: order.delivery_fee_ks,
        discount_ks: order.discount_ks,
        promo_code: order.promo_code,
        total_ks: order.total_ks,
        status: order.status,
        payment_status: order.payment_status,
        created_at: order.created_at,
        items: order.items.map((item: RowDataPacket) => ({
          qty: item.qty,
          unit_price_ks: item.unit_price_ks,
          total_price_ks: item.total_price_ks,
          name: item.name,
        })),
      }))}
      placedCode={searchParams.placed}
      timesBought={timesBought}
      itemsPurchased={itemsPurchased}
      totalSpent={totalSpent}
    />
  );
}
