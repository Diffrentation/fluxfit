"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

export default function ChallengePage() {
  const router = useRouter();
  const { isAuthenticated, hydrated } = useAuth();
  const [spots, setSpots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [orderEligibility, setOrderEligibility] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    orderNumber: "",
    socialHandle: "",
    platform: "instagram",
    agreedToTerms: false,
    agreedToOrganic: false,
    agreedToTags: false,
    agreedToMarketing: false,
  });

  // Set once registration succeeds (or an existing session is found), which
  // swaps the registration form out for the status / video-submission view.
  const [challengeData, setChallengeData] = useState(null);
  const [checkingSession, setCheckingSession] = useState(true);
  const [videoUrl, setVideoUrl] = useState("");
  const [submittingVideo, setSubmittingVideo] = useState(false);
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    if (!hydrated || isAuthenticated) return;
    router.replace("/auth/login?redirect=/5k-challenge");
  }, [hydrated, isAuthenticated, router]);

  useEffect(() => {
    if (!hydrated || !isAuthenticated) return;
    fetchSpots();
    checkSession();
    // The session check only needs to run when the signed-in account changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hydrated, isAuthenticated]);

  const authHeaders = () => {
    const token = localStorage.getItem("token");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  // Live 15-day countdown, ticks only while a registered challenge is shown.
  useEffect(() => {
    if (!challengeData) return;
    const interval = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(interval);
  }, [challengeData]);

  const fetchSpots = async () => {
    try {
      const res = await fetch("/api/5k-challenge/spots");
      const data = await res.json();
      if (data.success) {
        setSpots(data.data);
      }
    } catch (error) {
      console.error("Error fetching spots:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkSession = async () => {
    try {
      const res = await fetch("/api/5k-challenge/login", { headers: authHeaders() });
      const data = await res.json();
      if (data.success) {
        setChallengeData(data.data);
      }
    } catch (error) {
      console.error("Error checking challenge session:", error);
    } finally {
      setCheckingSession(false);
    }
  };

  // Falls back to logging the user into their existing challenge session when
  // registration fails because they (or someone else) already registered this
  // order — covers registrations that predate the auto-login-on-register cookie.
  const loginToExistingChallenge = async (email, orderNumber) => {
    try {
      const res = await fetch("/api/5k-challenge/login", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ email, orderNumber }),
      });
      const data = await res.json();
      if (data.success) {
        await checkSession();
        return true;
      }
    } catch (error) {
      console.error("Error logging into existing challenge:", error);
    }
    return false;
  };

  const handleSubmitVideo = async (e) => {
    e.preventDefault();
    setSubmittingVideo(true);
    try {
      const res = await fetch("/api/5k-challenge/submit-video", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders() },
        body: JSON.stringify({ videoUrl }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Video submitted for review!");
        setChallengeData((prev) => ({ ...prev, status: data.data.status, videoUrl: data.data.videoUrl }));
      } else {
        toast.error(data.error || "Failed to submit video");
      }
    } catch (error) {
      toast.error("Network error. Please try again later.");
    } finally {
      setSubmittingVideo(false);
    }
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    if (name === "orderNumber") setOrderEligibility(null);
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const checkOrderEligibility = async () => {
    const orderNumber = formData.orderNumber.trim();
    if (!orderNumber) return;

    setOrderEligibility({ checking: true });
    try {
      const res = await fetch(
        `/api/5k-challenge/register?orderNumber=${encodeURIComponent(orderNumber)}`,
        { headers: authHeaders() },
      );
      const data = await res.json();
      if (data.success) {
        setOrderEligibility({ checking: false, ...data.data });
      } else {
        setOrderEligibility({ checking: false, eligible: false, message: data.error || "Unable to verify this order." });
      }
    } catch {
      setOrderEligibility({ checking: false, eligible: false, message: "Unable to verify this order. Please try again." });
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (orderEligibility && !orderEligibility.checking && !orderEligibility.eligible) {
      toast.error(orderEligibility.message || "This order must be delivered before joining the challenge.");
      return;
    }
    if (
      !formData.agreedToTerms ||
      !formData.agreedToOrganic ||
      !formData.agreedToTags ||
      !formData.agreedToMarketing
    ) {
      toast.error("Please agree to all terms before registering.");
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch("/api/5k-challenge/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          orderNumber: formData.orderNumber,
          socialHandle: formData.socialHandle,
          platform: formData.platform,
          agreedToTerms: true,
        }),
      });

      const data = await res.json();
      if (data.success) {
        toast.success("Successfully registered for the 5K Challenge!");
        setChallengeData(data.data);
        setFormData({
          name: "",
          email: "",
          orderNumber: "",
          socialHandle: "",
          platform: "instagram",
          agreedToTerms: false,
          agreedToOrganic: false,
          agreedToTags: false,
          agreedToMarketing: false,
        });
        fetchSpots(); // Refresh spots
      } else if (data.error && data.error.toLowerCase().includes("already exists")) {
        const loggedIn = await loginToExistingChallenge(formData.email, formData.orderNumber);
        if (loggedIn) {
          toast.success("You're already registered — here's your challenge status.");
        } else {
          toast.error("This order is already registered. Use the same name/email you registered with, or check the 5K Challenge dashboard.");
        }
      } else {
        toast.error(data.error || "Failed to register.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setRegistering(false);
    }
  };

  // Live countdown against the (admin-controlled) 15-day challenge deadline.
  let countdown = null;
  if (challengeData) {
    const diffMs = new Date(challengeData.deadline).getTime() - now.getTime();
    const expired = diffMs <= 0;
    const abs = Math.abs(diffMs);
    countdown = {
      expired,
      days: Math.floor(abs / (1000 * 60 * 60 * 24)),
      hours: Math.floor((abs / (1000 * 60 * 60)) % 24),
      minutes: Math.floor((abs / (1000 * 60)) % 60),
      seconds: Math.floor((abs / 1000) % 60),
    };
  }

  if (!hydrated || !isAuthenticated) {
    return <div className="min-h-screen bg-neutral-50" />;
  }

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Hero Section */}
      <section className="bg-white pt-20 sm:pt-24 pb-8 text-center border-b border-gray-100 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-black text-gray-900 tracking-tight mb-3 uppercase">
            Hit 5,000 Views.<br />
            <span className="text-[#1e9a58]">Get Your Purchase Money Back.</span>
          </h1>
          <p className="text-sm sm:text-base text-gray-600 mb-4 max-w-2xl mx-auto font-medium">
            Join the exclusive Fluxfit 5K Challenge. Post a Reel or Short wearing our gear, hit 5,000 organic views in 15 days, and get a 100% bank refund on your eligible item!
          </p>
          
          {loading ? (
            <div className="inline-block bg-gray-100 text-gray-600 px-6 py-2 rounded-full font-bold animate-pulse">
              Loading spots...
            </div>
          ) : spots ? (
            <div className={`inline-block px-6 py-2 rounded-full font-bold text-sm shadow-sm ${spots.remainingSpots > 0 ? "bg-orange-100 text-orange-700 border border-orange-200" : "bg-red-100 text-red-700 border border-red-200"}`}>
              🔥 Only {spots.remainingSpots} of {spots.totalSpots} spots remaining!
            </div>
          ) : null}
        </div>
      </section>

      {/* 4-Step Process */}
      <section className="max-w-5xl mx-auto py-8 px-4">
        <h2 className="text-lg font-bold text-center mb-5 uppercase tracking-wide">How it works</h2>
        <div className="grid md:grid-cols-4 gap-4">
          {[
            { step: "01", title: "BUY", desc: "Purchase any eligible Fluxfit product & wait for delivery." },
            { step: "02", title: "REGISTER", desc: "Enter your delivered Order ID below to claim your spot." },
            { step: "03", title: "POST", desc: "Create an Instagram Reel or YouTube Short using our tags." },
            { step: "04", title: "HIT 5K", desc: "Reach 5,000 genuine views within 15 days & get your refund!" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-4 rounded-2xl shadow-sm border border-gray-100 text-center relative">
              <div className="text-3xl font-black text-gray-100 absolute -top-3 -left-1 z-0">{item.step}</div>
              <h3 className="text-base font-bold mb-1 relative z-10">{item.title}</h3>
              <p className="text-gray-500 text-sm relative z-10">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Registration Form / Post-Registration Status */}
      <section className="max-w-5xl mx-auto px-4">
        {checkingSession ? (
          <div className="max-w-xl mx-auto bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100 text-center text-gray-400 font-medium">
            Loading...
          </div>
        ) : challengeData ? (
          <div className="grid gap-6 md:grid-cols-2 items-start">
            {/* Submitted Details */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              <div className="flex flex-wrap justify-between items-center gap-2 mb-6">
                <h2 className="text-xl sm:text-2xl font-bold">You&apos;re Registered!</h2>
                <span className="px-3 py-1 bg-gray-100 rounded-lg text-xs font-bold uppercase">
                  {challengeData.status.replace("_", " ")}
                </span>
              </div>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <dt className="text-gray-400 font-medium mb-0.5">Full Name</dt>
                  <dd className="font-semibold text-gray-900">{challengeData.name}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-medium mb-0.5">Email</dt>
                  <dd className="font-semibold text-gray-900 break-all">{challengeData.email}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-medium mb-0.5">Order Number</dt>
                  <dd className="font-semibold text-gray-900">{challengeData.orderNumber}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-medium mb-0.5">Challenge ID</dt>
                  <dd className="font-semibold text-gray-900">{challengeData.challengeId}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-medium mb-0.5">Social Handle</dt>
                  <dd className="font-semibold text-gray-900">{challengeData.socialHandle}</dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-medium mb-0.5">Platform</dt>
                  <dd className="font-semibold text-gray-900 uppercase">{challengeData.platform}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-gray-400 font-medium mb-0.5">
                    Time Remaining <span className="text-gray-300">(due {new Date(challengeData.deadline).toLocaleString()})</span>
                  </dt>
                  <dd className={`font-bold text-base ${countdown.expired ? "text-red-600" : "text-[#1e9a58]"}`}>
                    {countdown.expired
                      ? "Deadline passed"
                      : `${countdown.days}d ${countdown.hours}h ${countdown.minutes}m ${countdown.seconds}s left`}
                  </dd>
                </div>
                <div>
                  <dt className="text-gray-400 font-medium mb-0.5">Views Verified</dt>
                  <dd className="font-semibold text-gray-900">{challengeData.views.toLocaleString()} / 5,000</dd>
                </div>
              </dl>
            </div>

            {/* Video Submission */}
            <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
              {(challengeData.status === "registered" || challengeData.status === "active") && !challengeData.videoUrl ? (
                <div>
                  <h2 className="text-lg font-bold mb-2">Submit Your Video</h2>
                  <p className="text-gray-500 text-sm mb-6">
                    Post your Reel/Short, make sure it hits 5,000 organic views within 15 days, then drop the link
                    below.
                  </p>
                  <form onSubmit={handleSubmitVideo} className="flex flex-col sm:flex-row gap-2">
                    <input
                      required
                      type="url"
                      placeholder="https://instagram.com/reel/..."
                      value={videoUrl}
                      onChange={(e) => setVideoUrl(e.target.value)}
                      className="flex-1 min-w-0 px-4 py-3 rounded-xl border border-gray-200 outline-none focus:border-[#1e9a58]"
                    />
                    <button
                      type="submit"
                      disabled={submittingVideo}
                      className="px-6 py-3 sm:py-0 bg-[#1e9a58] hover:bg-[#188048] text-white font-bold rounded-xl transition-all disabled:opacity-70"
                    >
                      {submittingVideo ? "..." : "SUBMIT"}
                    </button>
                  </form>
                </div>
              ) : (
                <div>
                  <h2 className="text-lg font-bold mb-2">Video Submitted</h2>
                  <a
                    href={challengeData.videoUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-blue-600 hover:underline text-sm break-all"
                  >
                    {challengeData.videoUrl}
                  </a>
                  <div className="mt-6 pt-6 border-t border-gray-100">
                    <h3 className="font-bold mb-2">Verification Status</h3>
                    <p className="text-gray-500 text-sm">
                      {challengeData.status === "video_submitted" &&
                        "Your video has been submitted and is waiting for views to accumulate."}
                      {challengeData.status === "under_review" &&
                        "Our team is currently reviewing your video and verifying the organic views."}
                      {challengeData.status === "qualified" &&
                        "Congratulations! Your video has qualified. Refund is being processed."}
                      {challengeData.status === "completed" &&
                        "Challenge complete! Your 100% refund has been processed."}
                      {challengeData.status === "rejected" &&
                        "Unfortunately, your submission was rejected. Check your email for details."}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        ) : (
        <div className="max-w-xl mx-auto bg-white p-6 sm:p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-center">Claim Your Spot</h2>

          {spots && spots.remainingSpots === 0 ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-semibold">
              Sorry, this batch is currently full! Please check back later.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Full Name</label>
                  <input
                    required
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58] outline-none transition-all"
                    placeholder="John Doe"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Email</label>
                  <input
                    required
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58] outline-none transition-all"
                    placeholder="john@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold mb-1">Order Number (Must be Delivered)</label>
                <input
                  required
                  type="text"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={handleChange}
                  onBlur={checkOrderEligibility}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58] outline-none transition-all"
                  placeholder="e.g. ORD-123456"
                />
                {orderEligibility?.checking && (
                  <p className="mt-1.5 text-xs text-gray-500">Checking delivery status...</p>
                )}
                {orderEligibility && !orderEligibility.checking && (
                  <p className={`mt-1.5 text-xs font-medium ${orderEligibility.eligible ? "text-[#1e9a58]" : "text-amber-700"}`}>
                    {orderEligibility.eligible
                      ? "Delivered — this order is eligible for the challenge."
                      : orderEligibility.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-[1fr_100px] gap-4">
                <div>
                  <label className="block text-sm font-semibold mb-1">Social Handle</label>
                  <input
                    required
                    type="text"
                    name="socialHandle"
                    value={formData.socialHandle}
                    onChange={handleChange}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58] outline-none transition-all"
                    placeholder="@yourhandle"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold mb-1">Platform</label>
                  <select
                    name="platform"
                    value={formData.platform}
                    onChange={handleChange}
                    className="w-full px-3 py-2.5 rounded-xl border border-gray-200 focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58] outline-none transition-all bg-white"
                  >
                    <option value="instagram">IG</option>
                    <option value="youtube">YT</option>
                  </select>
                </div>
              </div>

              {/* Strict Terms Checkboxes */}
              <div className="space-y-3 pt-4 border-t border-gray-100">
                <p className="text-sm font-bold text-red-600 mb-2">Important Rules (Must Agree)</p>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" name="agreedToOrganic" checked={formData.agreedToOrganic} onChange={handleChange} className="mt-1 w-4 h-4 text-[#1e9a58] rounded border-gray-300 focus:ring-[#1e9a58]" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">I understand that <b>ONLY ORGANIC</b> views qualify. Bot/paid views will be instantly rejected.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" name="agreedToTags" checked={formData.agreedToTags} onChange={handleChange} className="mt-1 w-4 h-4 text-[#1e9a58] rounded border-gray-300 focus:ring-[#1e9a58]" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">My profile is PUBLIC, and I will use <b>#Fluxfit5K</b> & tag <b>@FluxfitOfficial</b> in my post.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" name="agreedToMarketing" checked={formData.agreedToMarketing} onChange={handleChange} className="mt-1 w-4 h-4 text-[#1e9a58] rounded border-gray-300 focus:ring-[#1e9a58]" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">I give Fluxfit the right to use this video for marketing/ads.</span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer group">
                  <input type="checkbox" name="agreedToTerms" checked={formData.agreedToTerms} onChange={handleChange} className="mt-1 w-4 h-4 text-[#1e9a58] rounded border-gray-300 focus:ring-[#1e9a58]" />
                  <span className="text-sm text-gray-600 group-hover:text-gray-900">I agree to the 15-day deadline and that refunds are only processed after manual verification.</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={registering || orderEligibility?.checking || orderEligibility?.eligible === false}
                className="w-full mt-6 bg-[#1e9a58] hover:bg-[#188048] text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {registering ? "Registering..." : "CLAIM MY SPOT"}
              </button>
            </form>
          )}
        </div>
        )}
      </section>
    </div>
  );
}
