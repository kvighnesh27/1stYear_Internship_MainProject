"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/store/auth-context";

export function ReviewPanel() {
  const { token } = useAuth();
  const [rating, setRating] = useState(0);
  const [hover, setHover] = useState(0);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState("");
  const [reviews, setReviews] = useState<{
    total: number;
    average_rating: number;
    reviews: Array<{ rating: number; comment: string | null }>;
  } | null>(null);

  useEffect(() => {
    if (!token) return;
    api.getReviews(token).then(setReviews).catch(() => {});
  }, [token]);

  const handleSubmit = async () => {
    if (!token || rating === 0) return;
    setSubmitting(true);
    setMessage("");
    try {
      await api.submitReview(token, rating, comment);
      setMessage("Review submitted — thank you!");
      const updated = await api.getReviews(token);
      setReviews(updated);
    } catch (e: any) {
      setMessage(e.message || "Failed to submit.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Summary */}
      {reviews && (
        <div className="rounded-lg border border-cyan-300/10 bg-white/5 p-5">
          <h3 className="mb-3 text-sm font-semibold uppercase tracking-widest text-cyan-300">
            Community Ratings
          </h3>
          <div className="flex items-end gap-3">
            <span className="text-5xl font-bold text-cyan-100">
              {reviews.average_rating.toFixed(1)}
            </span>
            <div className="pb-1">
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((s) => (
                  <Star
                    key={s}
                    className={`h-5 w-5 ${
                      s <= Math.round(reviews.average_rating)
                        ? "fill-yellow-400 text-yellow-400"
                        : "text-slate-600"
                    }`}
                  />
                ))}
              </div>
              <p className="mt-1 text-xs text-slate-400">
                {reviews.total} {reviews.total === 1 ? "review" : "reviews"}
              </p>
            </div>
          </div>

          {/* Recent comments */}
          {reviews.reviews.filter((r) => r.comment).length > 0 && (
            <div className="mt-4 space-y-3">
              {reviews.reviews
                .filter((r) => r.comment)
                .slice(-5)
                .reverse()
                .map((r, i) => (
                  <div
                    key={i}
                    className="flex gap-3 rounded-md border border-cyan-300/10 bg-slate-950/40 p-3"
                  >
                    <MessageSquare className="mt-0.5 h-4 w-4 shrink-0 text-cyan-400" />
                    <div>
                      <div className="mb-1 flex gap-0.5">
                        {[1, 2, 3, 4, 5].map((s) => (
                          <Star
                            key={s}
                            className={`h-3 w-3 ${
                              s <= r.rating
                                ? "fill-yellow-400 text-yellow-400"
                                : "text-slate-600"
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-sm text-slate-300">{r.comment}</p>
                    </div>
                  </div>
                ))}
            </div>
          )}
        </div>
      )}

      {/* Submit form */}
      <div className="rounded-lg border border-cyan-300/10 bg-white/5 p-5">
        <h3 className="mb-4 text-sm font-semibold uppercase tracking-widest text-cyan-300">
          Leave a Review
        </h3>

        {/* Star picker */}
        <div className="mb-4 flex gap-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setRating(s)}
              aria-label={`${s} star`}
            >
              <Star
                className={`h-8 w-8 transition-colors ${
                  s <= (hover || rating)
                    ? "fill-yellow-400 text-yellow-400"
                    : "text-slate-600 hover:text-yellow-300"
                }`}
              />
            </button>
          ))}
        </div>

        {/* Comment */}
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Share your experience (optional)"
          rows={3}
          className="w-full resize-none rounded-md border border-cyan-300/20 bg-slate-950/60 px-3 py-2 text-sm text-slate-200 placeholder-slate-500 outline-none focus:border-cyan-400/50 focus:ring-1 focus:ring-cyan-400/20"
        />

        {message && (
          <p className={`mt-2 text-sm ${message.includes("thank") ? "text-cyan-400" : "text-red-400"}`}>
            {message}
          </p>
        )}

        <Button
          onClick={handleSubmit}
          disabled={rating === 0 || submitting}
          className="mt-3 flex items-center gap-2"
        >
          <Send className="h-4 w-4" />
          {submitting ? "Submitting…" : "Submit Review"}
        </Button>
      </div>
    </div>
  );
}