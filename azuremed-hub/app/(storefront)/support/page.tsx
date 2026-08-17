import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import pool from "@/config/db";
import SupportView from "@/components/SupportView";
import type { RowDataPacket } from "mysql2";

// Explicit, not relying on getServerSession usage alone to signal dynamic
// rendering to Next — a build-time DB connection to a host unreachable from
// Vercel's build servers (like localhost) is fatal either way.
export const dynamic = "force-dynamic";

/** "Handle Customer Queries" — customer side: submit a question, see Staff's response here. */
export default async function SupportPage() {
  const session = await getServerSession(authOptions);
  if (!session?.user) redirect("/login");

  const [queries] = await pool.query<RowDataPacket[]>(
    `SELECT id, subject, message, status, staff_response, responded_at, created_at
     FROM customer_queries WHERE user_id = :userId ORDER BY created_at DESC`,
    { userId: Number(session.user.id) }
  );

  return (
    <SupportView
      queries={queries.map((query) => ({
        id: query.id,
        subject: query.subject,
        message: query.message,
        status: query.status,
        staff_response: query.staff_response,
        responded_at: query.responded_at,
        created_at: query.created_at,
      }))}
    />
  );
}
