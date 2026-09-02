"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ChallengeDashboard() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();
  const [loading, setLoading] = useState(true);
  const [challengeData, setChallengeData] = useState(null);
  
  // Login State
  const [email, setEmail] = useState("");
  const [orderNumber, setOrderNumber] = useState("");
  const [loggingIn, setLoggingIn] = useState(false);

  // Submit Video State
  const [videoUrl, setVideoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!hydrated || isAuthenticated) return;
    router.replace("/auth/login?redirect=/5k-challenge/dashboard");
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    checkSession();
    // The session check only needs to run when the signed-in account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const checkSession = async () => {
    try {
      const res = await fetch("/api/5k-challenge/login", { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setChallengeData(data.data);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoggingIn(true);
    try {
      const res = await fetch("/api/5k-challenge/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ email, orderNumber }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Welcome back!");
        checkSession();
      } else {
        toast.error(data.error || "Login failed");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setLoggingIn(false);
    }
  };

  const handleSubmitVideo = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/5k-challenge/submit-video", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ videoUrl }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Video submitted for review!");
        setChallengeData(prev => ({ ...prev, status: data.data.status, videoUrl: data.data.videoUrl }));
      } else {
        toast.error(data.error || "Failed to submit video");
      }
    } catch (error) {
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  if (!hydrated || !isAuthenticated || loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!challengeData) {
    return (
      <div className="min-h-screen bg-neutral-50 flex flex-col items-center justify-center p-4">
        <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 max-w-md w-full">
          <h1 className="text-2xl font-black text-center mb-6">5K CHALLENGE DASHBOARD</h1>
          <p className="text-gray-500 text-sm text-center mb-6">Enter your details to track your challenge status.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-semibold mb-1">Email Address</label>
              <input required type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#1e9a58]" placeholder="john@example.com" />
            </div>
            <div>
              <label className="block text-sm font-semibold mb-1">Order Number</label>
              <input required type="text" value={orderNumber} onChange={(e) => setOrderNumber(e.target.value)} className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none focus:border-[#1e9a58]" placeholder="ORD-123456" />
            </div>
            <button type="submit" disabled={loggingIn} className="w-full bg-black text-white font-bold py-3 rounded-xl hover:bg-gray-800 transition-all">
              {loggingIn ? "Checking..." : "ACCESS DASHBOARD"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  // Calculate days left
  const deadlineDate = new Date(challengeData.deadline);
  const now = new Date();
  const daysRemaining = Math.max(0, Math.ceil((deadlineDate - now) / (1000 * 60 * 60 * 24)));

  return (
    <div className="min-h-screen bg-neutral-50 p-4 sm:p-8">
      <div className="max-w-2xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100 flex justify-between items-center">
          <div>
            <h1 className="text-xl font-black">CHALLENGE DASHBOARD</h1>
            <p className="text-gray-500 text-sm">ID: {challengeData.challengeId}</p>
          </div>
          <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-bold uppercase">
            {challengeData.status.replace("_", " ")}
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">Views Verified</p>
            <p className="text-3xl font-black">{challengeData.views.toLocaleString()} <span className="text-sm font-medium text-gray-400">/ 5,000</span></p>
          </div>
          <div className="bg-white p-6 rounded-3xl shadow-sm border border-gray-100">
            <p className="text-gray-500 text-sm font-medium mb-1">Days Remaining</p>
            <p className="text-3xl font-black text-[#1e9a58]">{daysRemaining}</p>
          </div>
        </div>

        {/* Action Area */}
        <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100">
          {(challengeData.status === "registered" || challengeData.status === "active") && !challengeData.videoUrl ? (
            <div>
              <h2 className="text-lg font-bold mb-2">Submit Your Video</h2>
              <p className="text-gray-500 text-sm mb-6">Ensure your profile is public and you have used the #Fluxfit5K hashtag.</p>
              <form onSubmit={handleSubmitVideo} className="flex gap-2">
                <input required type="url" placeholder="https://instagram.com/reel/..." value={videoUrl} onChange={(e) => setVideoUrl(e.target.value)} className="flex-1 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1e9a58]" />
                <button type="submit" disabled={submitting} className="px-6 bg-[#1e9a58] hover:bg-[#188048] text-white font-bold rounded-xl transition-all">
                  {submitting ? "..." : "SUBMIT"}
                </button>
              </form>
            </div>
          ) : (
            <div>
              <h2 className="text-lg font-bold mb-2">Video Submitted</h2>
              <a href={challengeData.videoUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:underline text-sm break-all">
                {challengeData.videoUrl}
              </a>
              
              <div className="mt-6 pt-6 border-t border-gray-100">
                <h3 className="font-bold mb-2">Verification Status</h3>
                <p className="text-gray-500 text-sm">
                  {challengeData.status === "video_submitted" && "Your video has been submitted and is waiting for views to accumulate."}
                  {challengeData.status === "under_review" && "Our team is currently reviewing your video and verifying the organic views."}
                  {challengeData.status === "qualified" && "Congratulations! Your video has qualified. Refund is being processed."}
                  {challengeData.status === "completed" && "Challenge complete! Your 100% refund has been processed."}
                  {challengeData.status === "rejected" && "Unfortunately, your submission was rejected. Check your email for details."}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
