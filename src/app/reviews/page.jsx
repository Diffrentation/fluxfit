"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import axios from "axios";
import { Button, Spin, message } from "antd";
import { IconStarFilled } from "@tabler/icons-react";

export default function ReviewsPage() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [limit] = useState(10);
  const [rating, setRating] = useState("");
  const [search, setSearch] = useState("");
  const [pagination, setPagination] = useState({ totalPages: 1 });

  const fetchReviews = useCallback(async () => {
    try {
      setLoading(true);
      const { data } = await axios.get("/api/reviews", {
        params: { page, limit, rating: rating || undefined, search: search || undefined },
      });

      if (data?.success) {
        setReviews(data.reviews || data.data?.reviews || []);
        setPagination(data.data?.pagination || { totalPages: 1 });
      } else {
        setReviews([]);
      }
    } catch (error) {
      console.error("Reviews listing fetch error:", error);
      message.error("Failed to fetch reviews");
    } finally {
      setLoading(false);
    }
  }, [limit, page, rating, search]);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const totalHelpful = useMemo(
    () => reviews.reduce((sum, review) => sum + (review.helpful?.count || 0), 0),
    [reviews]
  );

  return (
    <div className="container mx-auto px-4 py-10">
      <h1 className="text-2xl font-semibold mb-4">Customer Reviews</h1>
      <p className="text-sm text-gray-500 mb-6">Helpful votes on this page: {totalHelpful}</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <select
          value={rating}
          onChange={(e) => {
            setPage(1);
            setRating(e.target.value);
          }}
          className="border border-gray-300 rounded px-3 py-2 text-sm"
        >
          <option value="">All ratings</option>
          <option value="5">5 stars</option>
          <option value="4">4 stars</option>
          <option value="3">3 stars</option>
          <option value="2">2 stars</option>
          <option value="1">1 star</option>
        </select>
        <input
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
          placeholder="Search by title or comment"
          className="border border-gray-300 rounded px-3 py-2 text-sm min-w-[260px]"
        />
      </div>

      {loading ? (
        <div className="py-8 flex justify-center">
          <Spin />
        </div>
      ) : reviews.length === 0 ? (
        <p className="text-gray-500">No reviews found.</p>
      ) : (
        <div className="space-y-4">
          {reviews.map((review) => (
            <div key={review.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">{review.user?.name || "Anonymous"}</p>
                  <p className="text-xs text-gray-500">
                    {review.product?.name ? (
                      <Link href={`/product-details/${review.product.id || review.product.slug}`}>
                        {review.product.name}
                      </Link>
                    ) : (
                      "Product"
                    )}
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  {[1, 2, 3, 4, 5].map((s) => (
                    <IconStarFilled
                      key={s}
                      className={`w-4 h-4 ${s <= review.rating ? "text-yellow-400" : "text-gray-300"}`}
                    />
                  ))}
                </div>
              </div>
              <p className="mt-2 text-sm text-gray-700">{review.comment}</p>
              <p className="mt-2 text-xs text-gray-500">
                Helpful: {review.helpful?.count || 0} | {new Date(review.createdAt).toLocaleString()}
              </p>
            </div>
          ))}
        </div>
      )}

      {pagination.totalPages > 1 && (
        <div className="flex items-center gap-2 mt-6">
          <Button size="small" disabled={page <= 1} onClick={() => setPage((p) => p - 1)}>
            Previous
          </Button>
          <span className="text-sm text-gray-600">
            Page {page} / {pagination.totalPages}
          </span>
          <Button
            size="small"
            disabled={page >= pagination.totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            Next
          </Button>
        </div>
      )}
    </div>
  );
}
