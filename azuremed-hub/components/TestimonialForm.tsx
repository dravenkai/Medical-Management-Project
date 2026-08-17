"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { FaStar } from "react-icons/fa";
import { useLanguage } from "@/components/LanguageContext";

export default function TestimonialForm({ onSubmitted }: { onSubmitted: () => void }) {
  const { data: session } = useSession();
  const { t } = useLanguage();
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [title, setTitle] = useState("");
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [notice, setNotice] = useState<{ type: "error" | "success"; message: string } | null>(null);
  // Only one testimonial per customer (see app/api/reviews POST) —
  // resubmitting edits it in place rather than adding a new one. Without
  // this, that looked like your first review had silently vanished; now the
  // form pre-fills and makes clear you're editing, not starting fresh.
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (!session?.user) return;
    fetch("/api/reviews/mine")
      .then((r) => r.json())
      .then((result) => {
        if (result.success && result.data) {
          setIsEditing(true);
          setTitle(result.data.title ?? "");
          setComment(result.data.comment ?? "");
          setRating(result.data.rating ?? 0);
        }
      });
  }, [session?.user]);

  if (!session?.user) {
    return (
      <div className="mt-8 rounded-2xl border border-zinc-100 bg-zinc-50 p-6 text-center text-sm text-zinc-500">
        <Link href="/login" className="font-bold text-indigo-600 hover:underline">
          {t("reviewForm.signIn")}
        </Link>{" "}
        {t("testimonialForm.signInPrompt")}
      </div>
    );
  }

  async function handleSubmit() {
    if (rating === 0) {
      setNotice({ type: "error", message: t("testimonialForm.pleaseSelectRating") });
      return;
    }
    if (!comment.trim()) {
      setNotice({ type: "error", message: t("testimonialForm.pleaseWriteComment") });
      return;
    }

    setSubmitting(true);
    setNotice(null);
    const result = await fetch("/api/reviews", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title, comment, rating }),
    }).then((r) => r.json());
    setSubmitting(false);

    if (!result.success) {
      setNotice({ type: "error", message: result.message ?? t("testimonialForm.couldNotSubmit") });
      return;
    }
    setNotice({
      type: "success",
      message: isEditing ? t("testimonialForm.updated") : t("testimonialForm.posted"),
    });
    setIsEditing(true);
    onSubmitted();
  }

  return (
    <div className="mt-8 rounded-2xl border border-zinc-100 bg-zinc-50 p-6">
      <p className="text-sm font-bold uppercase tracking-widest text-zinc-400">
        {isEditing ? t("testimonialForm.editHeading") : t("testimonialForm.shareHeading")}
      </p>
      {isEditing && (
        <p className="mt-1 text-xs text-zinc-500">{t("testimonialForm.editNotice")}</p>
      )}

      <div className="mt-3 flex items-center gap-3">
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              aria-label={`${star} star`}
              className="text-xl"
            >
              <FaStar className={(hoverRating || rating) >= star ? "text-yellow-400" : "text-zinc-300"} />
            </button>
          ))}
        </div>
        <span className="text-sm font-semibold text-zinc-500">
          {rating > 0 ? `${rating} ${t("reviewForm.ratingOf5")}` : t("reviewForm.noRating")}
        </span>
        {rating > 0 && (
          <button
            type="button"
            onClick={() => setRating(0)}
            className="text-sm font-semibold text-zinc-400 underline hover:text-zinc-600"
          >
            {t("reviewForm.clearRating")}
          </button>
        )}
      </div>

      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder={t("testimonialForm.titlePlaceholder")}
        className="mt-4 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
      />
      <textarea
        value={comment}
        onChange={(e) => setComment(e.target.value)}
        rows={3}
        placeholder={t("testimonialForm.commentPlaceholder")}
        className="mt-3 w-full rounded-xl border border-zinc-200 bg-white p-3 text-sm outline-none focus:border-indigo-500 focus:ring-2 focus:ring-indigo-50"
      />

      {notice && (
        <p className={`mt-3 text-sm font-semibold ${notice.type === "error" ? "text-red-600" : "text-emerald-600"}`}>
          {notice.message}
        </p>
      )}

      <button
        type="button"
        onClick={handleSubmit}
        disabled={submitting}
        className="mt-4 rounded-full bg-gradient-to-b from-indigo-400 to-indigo-600 px-6 py-2.5 text-sm font-bold text-white shadow-md hover:from-indigo-500 hover:to-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {submitting ? t("testimonialForm.saving") : isEditing ? t("testimonialForm.update") : t("testimonialForm.submit")}
      </button>
    </div>
  );
}
