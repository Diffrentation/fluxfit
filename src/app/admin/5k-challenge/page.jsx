"use client";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import AdminContent from "@/components/Admin/AdminContent";
import {
  CalendarClock,
  ExternalLink,
  Mail,
  Search,
  Users,
  Video,
} from "lucide-react";
export default function AdminChallengePage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [selected, setSelected] = useState(null);
  const [detailForm, setDetailForm] = useState(null);
  const [saving, setSaving] = useState(false);
  const [quickFilter, setQuickFilter] = useState("");

  useEffect(() => {
    fetchChallenges();
  }, []);

  const fetchChallenges = async () => {
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token"); // Fallback
      const res = await fetch("/api/admin/5k-challenge?limit=50", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      const data = await res.json();
      if (data.success) {
        setChallenges(data.data.challenges);
      } else {
        toast.error("Failed to load challenges");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  const updateChallenge = async (id, payload) => {
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const res = await fetch(`/api/admin/5k-challenge/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      return data;
    } catch (error) {
      return { success: false, error: "Network error" };
    }
  };

  const updateStatus = async (id, status) => {
    setUpdating(id);
    const data = await updateChallenge(id, { status });
    if (data.success) {
      toast.success(`Status updated to ${status}`);
      fetchChallenges();
    } else {
      toast.error(data.error || "Failed to update status");
    }
    setUpdating(null);
  };

  // <input type="datetime-local"> needs "YYYY-MM-DDTHH:mm" in local time (no timezone suffix).
  const toDatetimeLocalValue = (date) => {
    const d = new Date(date);
    const offsetMs = d.getTimezoneOffset() * 60000;
    return new Date(d.getTime() - offsetMs).toISOString().slice(0, 16);
  };

  const openDetails = (challenge) => {
    setSelected(challenge);
    setDetailForm({
      status: challenge.status,
      views: challenge.views,
      likes: challenge.likes,
      comments: challenge.comments,
      adminNotes: challenge.notes?.admin || "",
      deadline: toDatetimeLocalValue(challenge.deadline),
    });
  };

  const closeDetails = () => {
    setSelected(null);
    setDetailForm(null);
  };

  const adjustDeadline = (days) => {
    setDetailForm((prev) => {
      const base = prev.deadline ? new Date(prev.deadline) : new Date();
      base.setDate(base.getDate() + days);
      return { ...prev, deadline: toDatetimeLocalValue(base) };
    });
  };

  const resetDeadlineTo15Days = () => {
    const base = new Date();
    base.setDate(base.getDate() + 15);
    setDetailForm((prev) => ({ ...prev, deadline: toDatetimeLocalValue(base) }));
  };

  const saveDetails = async () => {
    if (!selected || !detailForm) return;
    setSaving(true);
    const data = await updateChallenge(selected._id, {
      status: detailForm.status,
      views: Number(detailForm.views) || 0,
      likes: Number(detailForm.likes) || 0,
      comments: Number(detailForm.comments) || 0,
      adminNotes: detailForm.adminNotes,
      deadline: new Date(detailForm.deadline).toISOString(),
    });
    if (data.success) {
      toast.success("Challenge updated successfully");
      await fetchChallenges();
      closeDetails();
    } else {
      toast.error(data.error || "Failed to update challenge");
    }
    setSaving(false);
  };

  const filteredChallenges = useMemo(() => {
    const query = quickFilter.trim().toLowerCase();
    if (!query) return challenges;

    return challenges.filter((challenge) =>
      [
        challenge.name,
        challenge.email,
        challenge.socialHandle,
        challenge.challengeId,
        challenge.order?.orderNumber,
        challenge.platform,
        challenge.status,
      ]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(query))
    );
  }, [challenges, quickFilter]);

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Participant",
        field: "name",
        minWidth: 175,
        flex: 1,
        cellRenderer: (p) => (
          <div className="flex h-full flex-col justify-center gap-1">
            <span className="font-semibold text-zinc-100 truncate">{p.data.name}</span>
            <span className="text-[#37c875] text-xs font-medium truncate">{p.data.socialHandle || "No handle"}</span>
          </div>
        ),
      },
      {
        headerName: "Email",
        field: "email",
        minWidth: 220,
        flex: 1.15,
        cellRenderer: (p) => (
          <div className="flex h-full items-center gap-2 text-zinc-300 min-w-0" title={p.value}>
            <Mail size={15} className="text-zinc-500 shrink-0" />
            <span className="truncate text-sm">{p.value || "—"}</span>
          </div>
        ),
      },
      {
        headerName: "Challenge ID",
        field: "challengeId",
        width: 145,
        cellRenderer: (p) => (
          <span className="bg-zinc-800/80 text-zinc-300 px-2.5 py-1.5 rounded-md text-xs font-mono border border-zinc-700/70">
            {p.value}
          </span>
        ),
      },
      {
        headerName: "Order",
        width: 128,
        cellRenderer: (p) =>
          p.data.order ? (
            <Link
              href={`/admin/orders/${p.data.order._id}`}
              className="text-blue-400 hover:text-blue-300 hover:underline font-medium"
            >
              {p.data.order.orderNumber}
            </Link>
          ) : (
            <span className="text-gray-500 italic">N/A</span>
          ),
      },
      {
        headerName: "Submission",
        width: 136,
        cellRenderer: (p) =>
          p.data.videoUrl ? (
            <a
              href={p.data.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[#35c979] hover:text-[#60e99b] text-xs font-bold bg-[#1e9a58]/10 hover:bg-[#1e9a58]/20 px-2.5 py-1.5 rounded-lg border border-[#1e9a58]/20 transition-colors"
            >
              <Video size={14} />
              View video
              <ExternalLink size={12} />
            </a>
          ) : (
            <span className="text-zinc-500 italic text-xs">Not submitted</span>
          ),
      },
      {
        headerName: "Platform",
        field: "platform",
        width: 108,
        cellRenderer: (p) => (
          <span className="text-zinc-300 text-xs font-bold tracking-wide uppercase">{p.value}</span>
        ),
      },
      {
        headerName: "Views / Likes / Comments",
        width: 165,
        cellRenderer: (p) => (
          <div className="text-xs text-gray-300 leading-5">
            <div>👁 {p.data.views?.toLocaleString() ?? 0}</div>
            <div>❤ {p.data.likes?.toLocaleString() ?? 0} &nbsp; 💬 {p.data.comments?.toLocaleString() ?? 0}</div>
          </div>
        ),
      },
      {
        headerName: "Deadline",
        field: "deadline",
        width: 142,
        cellRenderer: (p) => (
          <div className="flex h-full items-center gap-1.5 text-zinc-300 text-xs">
            <CalendarClock size={14} className="text-zinc-500" />
            {p.value ? new Date(p.value).toLocaleDateString() : "—"}
          </div>
        ),
      },
      {
        headerName: "Status",
        field: "status",
        width: 150,
        cellRenderer: (p) => (
          <span
            className={`px-2.5 py-1 rounded-full text-xs font-bold inline-block
              ${p.value === "qualified" || p.value === "completed" ? "bg-green-500/10 text-green-400 border border-green-500/20" : ""}
              ${p.value === "rejected" ? "bg-red-500/10 text-red-400 border border-red-500/20" : ""}
              ${p.value === "video_submitted" || p.value === "under_review" ? "bg-yellow-500/10 text-yellow-400 border border-yellow-500/20" : ""}
              ${p.value === "registered" || p.value === "active" ? "bg-blue-500/10 text-blue-400 border border-blue-500/20" : ""}
            `}
          >
            {p.value.replace("_", " ").toUpperCase()}
          </span>
        ),
      },
      {
        headerName: "Actions",
        width: 235,
        pinned: "right",
        cellRenderer: (p) => (
          <div className="flex h-full items-center gap-2">
            <select
              className="border border-zinc-700 rounded-lg px-2.5 py-2 text-xs bg-zinc-950 text-gray-200 focus:outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58] transition-all cursor-pointer hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
              value={p.data.status}
              onChange={(e) => updateStatus(p.data._id, e.target.value)}
              disabled={updating === p.data._id}
            >
              <option value="registered">Registered</option>
              <option value="active">Active</option>
              <option value="video_submitted">Video Submitted</option>
              <option value="under_review">Under Review</option>
              <option value="qualified">Qualified (Wait Refund)</option>
              <option value="completed">Completed (Refunded)</option>
              <option value="rejected">Rejected</option>
            </select>
            <button
              onClick={() => openDetails(p.data)}
              className="px-3 py-2 text-xs font-semibold rounded-lg border border-zinc-700 text-gray-300 hover:bg-zinc-800 hover:border-zinc-600 transition-colors whitespace-nowrap"
            >
              Details
            </button>
          </div>
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [challenges, updating]
  );

  if (loading) return <div className="p-8 text-gray-400">Loading challenges...</div>;

  return (
    <AdminContent>
      <div className="w-full">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-6 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">5K Challenge Management</h1>
          <p className="text-gray-400 text-sm">Review viral videos and update challenge statuses</p>
        </div>
        <div className="inline-flex items-center gap-2 self-start sm:self-auto rounded-xl border border-zinc-800 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-300">
          <Users size={16} className="text-[#37c875]" />
          <span><strong className="text-white">{challenges.length}</strong> participant{challenges.length === 1 ? "" : "s"}</span>
        </div>
      </div>
      
      <div className="bg-zinc-900 rounded-2xl shadow-2xl shadow-black/20 border border-zinc-800 overflow-hidden">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 border-b border-zinc-800 bg-zinc-900/80 px-4 py-3">
          <div>
            <h2 className="text-sm font-bold text-zinc-100">Challenge participants</h2>
            <p className="mt-0.5 text-xs text-zinc-500">Search by name, email, ID, order, or status</p>
          </div>
          <label className="relative block w-full sm:w-72">
            <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500" />
            <input
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              placeholder="Search participants"
              className="w-full rounded-lg border border-zinc-700 bg-zinc-950 py-2 pl-9 pr-3 text-sm text-zinc-100 placeholder:text-zinc-600 outline-none transition focus:border-[#37c875] focus:ring-1 focus:ring-[#37c875]"
            />
          </label>
        </div>
        <div className="max-h-[560px] overflow-auto">
          <table className="w-full min-w-[1540px] border-collapse text-left text-sm">
            <thead className="sticky top-0 z-10 bg-zinc-900 text-xs uppercase tracking-wide text-zinc-400 shadow-[0_1px_0_0_rgb(39_39_42)]">
              <tr>
                <th className="px-5 py-4 font-semibold">Participant</th>
                <th className="px-5 py-4 font-semibold">Email</th>
                <th className="px-5 py-4 font-semibold">Challenge ID</th>
                <th className="px-5 py-4 font-semibold">Order</th>
                <th className="px-5 py-4 font-semibold">Submission</th>
                <th className="px-5 py-4 font-semibold">Platform</th>
                <th className="px-5 py-4 font-semibold">Performance</th>
                <th className="px-5 py-4 font-semibold">Deadline</th>
                <th className="px-5 py-4 font-semibold">Status</th>
                <th className="px-5 py-4 font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800">
              {filteredChallenges.map((challenge) => (
                <tr key={challenge._id} className="bg-zinc-950/30 transition-colors hover:bg-zinc-800/50">
                  <td className="min-w-[185px] px-5 py-3.5">
                    <div className="font-semibold text-zinc-100">{challenge.name}</div>
                    <div className="mt-1 text-xs font-medium text-[#37c875]">{challenge.socialHandle || "No handle"}</div>
                  </td>
                  <td className="min-w-[230px] px-5 py-3.5">
                    <div className="flex items-center gap-2 text-zinc-300">
                      <Mail size={15} className="shrink-0 text-zinc-500" />
                      <span>{challenge.email || "—"}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="inline-flex whitespace-nowrap rounded-md border border-zinc-700 bg-zinc-800 px-2.5 py-1.5 font-mono text-xs text-zinc-300">
                      {challenge.challengeId}
                    </span>
                  </td>
                  <td className="px-5 py-3.5">
                    {challenge.order ? (
                      <Link href={`/admin/orders/${challenge.order._id}`} className="font-semibold text-blue-400 hover:text-blue-300 hover:underline">
                        {challenge.order.orderNumber}
                      </Link>
                    ) : <span className="text-zinc-500">N/A</span>}
                  </td>
                  <td className="px-5 py-3.5">
                    {challenge.videoUrl ? (
                      <a href={challenge.videoUrl} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-lg border border-[#1e9a58]/25 bg-[#1e9a58]/10 px-2.5 py-1.5 text-xs font-bold text-[#35c979] hover:bg-[#1e9a58]/20">
                        <Video size={14} /> View video <ExternalLink size={12} />
                      </a>
                    ) : <span className="text-xs italic text-zinc-500">Not submitted</span>}
                  </td>
                  <td className="px-5 py-3.5 text-xs font-bold uppercase tracking-wide text-zinc-300">{challenge.platform}</td>
                  <td className="px-5 py-3.5 text-xs leading-5 text-zinc-300">
                    <div>Views: <strong>{challenge.views?.toLocaleString() ?? 0}</strong></div>
                    <div className="text-zinc-500">Likes {challenge.likes?.toLocaleString() ?? 0} · Comments {challenge.comments?.toLocaleString() ?? 0}</div>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <div className="flex items-center gap-1.5 text-xs text-zinc-300">
                      <CalendarClock size={14} className="text-zinc-500" />
                      {challenge.deadline ? new Date(challenge.deadline).toLocaleDateString() : "—"}
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className={`inline-flex whitespace-nowrap rounded-full border px-2.5 py-1 text-xs font-bold
                      ${challenge.status === "qualified" || challenge.status === "completed" ? "border-green-500/20 bg-green-500/10 text-green-400" : ""}
                      ${challenge.status === "rejected" ? "border-red-500/20 bg-red-500/10 text-red-400" : ""}
                      ${challenge.status === "video_submitted" || challenge.status === "under_review" ? "border-yellow-500/20 bg-yellow-500/10 text-yellow-400" : ""}
                      ${challenge.status === "registered" || challenge.status === "active" ? "border-blue-500/20 bg-blue-500/10 text-blue-400" : ""}
                    `}>{challenge.status.replaceAll("_", " ").toUpperCase()}</span>
                  </td>
                  <td className="whitespace-nowrap px-5 py-3.5">
                    <div className="flex items-center gap-2">
                      <select
                        className="rounded-lg border border-zinc-700 bg-zinc-950 px-2.5 py-2 text-xs text-zinc-200 outline-none transition focus:border-[#1e9a58] disabled:cursor-not-allowed disabled:opacity-50"
                        value={challenge.status}
                        onChange={(e) => updateStatus(challenge._id, e.target.value)}
                        disabled={updating === challenge._id}
                      >
                        <option value="registered">Registered</option>
                        <option value="active">Active</option>
                        <option value="video_submitted">Video Submitted</option>
                        <option value="under_review">Under Review</option>
                        <option value="qualified">Qualified</option>
                        <option value="completed">Completed</option>
                        <option value="rejected">Rejected</option>
                      </select>
                      <button onClick={() => openDetails(challenge)} className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-semibold text-zinc-300 transition hover:border-zinc-600 hover:bg-zinc-800">
                        Details
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredChallenges.length === 0 && (
                <tr><td colSpan={10} className="px-5 py-16 text-center text-sm text-zinc-500">No challenge participants found.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && detailForm && (
        <div
          className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4"
          onClick={closeDetails}
        >
          <div
            className="bg-zinc-900 border border-zinc-800 rounded-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 sticky top-0 bg-zinc-900">
              <div>
                <h2 className="text-lg font-bold text-white">{selected.challengeId}</h2>
                <p className="text-gray-400 text-xs">Registered {new Date(selected.createdAt).toLocaleString()}</p>
              </div>
              <button onClick={closeDetails} className="text-gray-400 hover:text-white text-2xl leading-none">
                &times;
              </button>
            </div>

            <div className="px-6 py-5 space-y-6">
              {/* Read-only info */}
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Full Name</p>
                  <p className="text-gray-200 font-semibold">{selected.name}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Email</p>
                  <p className="text-gray-200 font-semibold break-all">{selected.email}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Social Handle</p>
                  <p className="text-gray-200 font-semibold">{selected.socialHandle}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Platform</p>
                  <p className="text-gray-200 font-semibold uppercase">{selected.platform}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Order</p>
                  {selected.order ? (
                    <Link
                      href={`/admin/orders/${selected.order._id}`}
                      className="text-blue-400 hover:text-blue-300 hover:underline font-semibold"
                    >
                      {selected.order.orderNumber} &middot; ₹{selected.order.total} &middot; {selected.order.status}
                    </Link>
                  ) : (
                    <p className="text-gray-500 italic">N/A</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Linked Account</p>
                  {selected.user ? (
                    <p className="text-gray-200 font-semibold">
                      {selected.user.firstname} {selected.user.lastname}
                      <span className="block text-gray-400 text-xs font-normal">
                        {selected.user.email} {selected.user.phone ? `· ${selected.user.phone}` : ""}
                      </span>
                    </p>
                  ) : (
                    <p className="text-gray-500 italic">Guest checkout</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Video URL</p>
                  {selected.videoUrl ? (
                    <a
                      href={selected.videoUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="text-[#1e9a58] hover:underline font-semibold break-all"
                    >
                      {selected.videoUrl}
                    </a>
                  ) : (
                    <p className="text-gray-500 italic">Not submitted</p>
                  )}
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Agreed to Terms</p>
                  <p className="text-gray-200 font-semibold">{selected.agreedToTerms ? "Yes" : "No"}</p>
                </div>
                <div>
                  <p className="text-gray-500 text-xs mb-0.5">Last Updated</p>
                  <p className="text-gray-200 font-semibold">
                    {selected.updatedAt ? new Date(selected.updatedAt).toLocaleString() : "-"}
                  </p>
                </div>
              </div>

              {/* Editable fields */}
              <div className="border-t border-zinc-800 pt-5 space-y-4">
                <p className="text-xs font-bold uppercase text-gray-400 tracking-wide">Admin Controls</p>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Challenge Timer (Deadline)</label>
                  <input
                    type="datetime-local"
                    value={detailForm.deadline}
                    onChange={(e) => setDetailForm((prev) => ({ ...prev, deadline: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-gray-200 text-sm focus:outline-none focus:border-[#1e9a58]"
                  />
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <button
                      type="button"
                      onClick={() => adjustDeadline(1)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-700 text-gray-300 hover:bg-zinc-800 transition-colors"
                    >
                      +1 day
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustDeadline(7)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-700 text-gray-300 hover:bg-zinc-800 transition-colors"
                    >
                      +7 days
                    </button>
                    <button
                      type="button"
                      onClick={() => adjustDeadline(-1)}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-700 text-gray-300 hover:bg-zinc-800 transition-colors"
                    >
                      -1 day
                    </button>
                    <button
                      type="button"
                      onClick={resetDeadlineTo15Days}
                      className="px-2.5 py-1 text-xs font-medium rounded-md border border-zinc-700 text-gray-300 hover:bg-zinc-800 transition-colors"
                    >
                      Reset to 15 days from now
                    </button>
                    <span className="text-xs text-gray-500 ml-auto">
                      {(() => {
                        const diffMs = new Date(detailForm.deadline) - new Date();
                        if (isNaN(diffMs)) return "";
                        const days = Math.floor(Math.abs(diffMs) / (1000 * 60 * 60 * 24));
                        const hours = Math.floor((Math.abs(diffMs) / (1000 * 60 * 60)) % 24);
                        return diffMs >= 0
                          ? `${days}d ${hours}h remaining`
                          : `Expired ${days}d ${hours}h ago`;
                      })()}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Views</label>
                    <input
                      type="number"
                      min="0"
                      value={detailForm.views}
                      onChange={(e) => setDetailForm((prev) => ({ ...prev, views: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-gray-200 text-sm focus:outline-none focus:border-[#1e9a58]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Likes</label>
                    <input
                      type="number"
                      min="0"
                      value={detailForm.likes}
                      onChange={(e) => setDetailForm((prev) => ({ ...prev, likes: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-gray-200 text-sm focus:outline-none focus:border-[#1e9a58]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-gray-500 mb-1">Comments</label>
                    <input
                      type="number"
                      min="0"
                      value={detailForm.comments}
                      onChange={(e) => setDetailForm((prev) => ({ ...prev, comments: e.target.value }))}
                      className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-gray-200 text-sm focus:outline-none focus:border-[#1e9a58]"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Status</label>
                  <select
                    value={detailForm.status}
                    onChange={(e) => setDetailForm((prev) => ({ ...prev, status: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-gray-200 text-sm focus:outline-none focus:border-[#1e9a58]"
                  >
                    <option value="registered">Registered</option>
                    <option value="active">Active</option>
                    <option value="video_submitted">Video Submitted</option>
                    <option value="under_review">Under Review</option>
                    <option value="qualified">Qualified (Wait Refund)</option>
                    <option value="completed">Completed (Refunded)</option>
                    <option value="rejected">Rejected</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs text-gray-500 mb-1">Admin Notes / Rejection Reason</label>
                  <textarea
                    rows={3}
                    value={detailForm.adminNotes}
                    onChange={(e) => setDetailForm((prev) => ({ ...prev, adminNotes: e.target.value }))}
                    className="w-full px-3 py-2 rounded-lg bg-zinc-950 border border-zinc-700 text-gray-200 text-sm focus:outline-none focus:border-[#1e9a58] resize-none"
                    placeholder="Internal notes visible only to admins..."
                  />
                </div>
              </div>
            </div>

            <div className="px-6 py-4 border-t border-zinc-800 flex justify-end gap-3 sticky bottom-0 bg-zinc-900">
              <button
                onClick={closeDetails}
                className="px-4 py-2 rounded-lg text-sm font-medium text-gray-300 hover:bg-zinc-800 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={saveDetails}
                disabled={saving}
                className="px-5 py-2 rounded-lg text-sm font-bold bg-[#1e9a58] hover:bg-[#188048] text-white transition-colors disabled:opacity-60"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}
      </div>
    </AdminContent>
  );
}
