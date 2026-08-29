"use client";
import { useState, useEffect, useMemo } from "react";
import toast from "react-hot-toast";
import Link from "next/link";
import { AgGridReact } from "ag-grid-react";
import {
  ModuleRegistry,
  AllCommunityModule,
  themeQuartz,
  colorSchemeDark,
} from "ag-grid-community";

ModuleRegistry.registerModules([AllCommunityModule]);
const myDarkTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "#09090b",
  foregroundColor: "#e4e4e7",
  headerBackgroundColor: "#18181b",
  borderColor: "#27272a",
  rowHoverColor: "#18181b",
});

export default function AdminChallengePage() {
  const [challenges, setChallenges] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(null);
  const [isClient, setIsClient] = useState(false);

  useEffect(() => {
    setIsClient(true);
  }, []);

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

  const updateStatus = async (id, status) => {
    setUpdating(id);
    try {
      const token = localStorage.getItem("admin_token") || localStorage.getItem("token");
      const res = await fetch(`/api/admin/5k-challenge/${id}`, {
        method: "PUT",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ status })
      });
      const data = await res.json();
      if (data.success) {
        toast.success(`Status updated to ${status}`);
        fetchChallenges();
      } else {
        toast.error(data.error || "Failed to update status");
      }
    } catch (error) {
      toast.error("Error updating status");
    } finally {
      setUpdating(null);
    }
  };

  const columnDefs = useMemo(
    () => [
      {
        headerName: "Challenge ID",
        field: "challengeId",
        width: 160,
        cellRenderer: (p) => (
          <span className="bg-zinc-800 text-zinc-300 px-2.5 py-1 rounded-md text-xs font-mono">
            {p.value}
          </span>
        ),
      },
      {
        headerName: "Customer",
        width: 220,
        cellRenderer: (p) => (
          <div className="py-2">
            <div className="font-semibold text-gray-200">{p.data.name}</div>
            <div className="text-gray-400 text-xs mt-1">{p.data.email}</div>
            <div className="text-[#1e9a58] text-xs font-medium mt-1">
              {p.data.socialHandle}
            </div>
          </div>
        ),
      },
      {
        headerName: "Order",
        width: 140,
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
        headerName: "Video URL",
        width: 170,
        cellRenderer: (p) =>
          p.data.videoUrl ? (
            <a
              href={p.data.videoUrl}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1.5 text-[#1e9a58] hover:text-[#25b569] font-semibold bg-[#1e9a58]/10 hover:bg-[#1e9a58]/20 px-3 py-1.5 rounded-lg transition-colors"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="7 10 12 15 17 10"></polyline>
                <line x1="12" y1="15" x2="12" y2="3"></line>
              </svg>
              Watch Video
            </a>
          ) : (
            <span className="text-gray-500 italic">Not Submitted</span>
          ),
      },
      {
        headerName: "Status",
        field: "status",
        width: 160,
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
        width: 200,
        pinned: "right",
        cellRenderer: (p) => (
          <select
            className="border border-zinc-700 rounded-lg px-3 py-2 text-sm bg-zinc-950 text-gray-200 focus:outline-none focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58] transition-all cursor-pointer hover:border-zinc-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
        ),
      },
    ],
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [challenges, updating]
  );

  if (loading) return <div className="p-8 text-gray-400">Loading challenges...</div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl mx-auto w-full">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl lg:text-3xl font-bold text-white mb-2">5K Challenge Management</h1>
          <p className="text-gray-400 text-sm">Review viral videos and update challenge statuses</p>
        </div>
      </div>
      
      <div className="bg-zinc-900 rounded-2xl shadow-sm border border-zinc-800 overflow-hidden p-2">
        {isClient ? (
          <div style={{ width: "100%", height: 560 }}>
            <AgGridReact
              theme={myDarkTheme}
              modules={[AllCommunityModule]}
              rowData={challenges}
              columnDefs={columnDefs}
              defaultColDef={{ sortable: true, resizable: true }}
              getRowId={(p) => String(p.data._id)}
              animateRows
              rowHeight={64}
              headerHeight={44}
              loading={loading}
              suppressCellFocus
              overlayNoRowsTemplate="No challenges found."
            />
          </div>
        ) : (
          <div className="h-[560px]" />
        )}
      </div>
    </div>
  );
}
