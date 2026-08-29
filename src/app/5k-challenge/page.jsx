"use client";
import { useState, useEffect } from "react";
import toast from "react-hot-toast";

export default function ChallengePage() {
  const [spots, setSpots] = useState(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
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

  useEffect(() => {
    fetchSpots();
  }, []);

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

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
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
      } else {
        toast.error(data.error || "Failed to register.");
      }
    } catch (error) {
      toast.error("An error occurred. Please try again later.");
    } finally {
      setRegistering(false);
    }
  };

  return (
    <div className="min-h-screen bg-neutral-50 pb-20">
      {/* Hero Section */}
      <section className="bg-white pt-32 sm:pt-40 pb-20 text-center border-b border-gray-100 px-4">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-5xl font-black text-gray-900 tracking-tight mb-6 uppercase">
            Hit 5,000 Views.<br />
            <span className="text-[#1e9a58]">Get Your Purchase Money Back.</span>
          </h1>
          <p className="text-lg text-gray-600 mb-8 max-w-xl mx-auto font-medium">
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
      <section className="max-w-5xl mx-auto py-16 px-4">
        <h2 className="text-2xl font-bold text-center mb-12 uppercase tracking-wide">How it works</h2>
        <div className="grid md:grid-cols-4 gap-8">
          {[
            { step: "01", title: "BUY", desc: "Purchase any eligible Fluxfit product & wait for delivery." },
            { step: "02", title: "REGISTER", desc: "Enter your delivered Order ID below to claim your spot." },
            { step: "03", title: "POST", desc: "Create an Instagram Reel or YouTube Short using our tags." },
            { step: "04", title: "HIT 5K", desc: "Reach 5,000 genuine views within 15 days & get your refund!" },
          ].map((item, idx) => (
            <div key={idx} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 text-center relative">
              <div className="text-4xl font-black text-gray-100 absolute -top-4 -left-2 z-0">{item.step}</div>
              <h3 className="text-lg font-bold mb-2 relative z-10">{item.title}</h3>
              <p className="text-gray-500 text-sm relative z-10">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Registration Form */}
      <section className="max-w-xl mx-auto px-4">
        <div className="bg-white p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-gray-100">
          <h2 className="text-2xl font-bold mb-6 text-center">Claim Your Spot</h2>
          
          {spots && spots.remainingSpots === 0 ? (
            <div className="bg-red-50 text-red-700 p-4 rounded-xl text-center font-semibold">
              Sorry, this batch is currently full! Please check back later.
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-2 gap-4">
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
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#1e9a58] focus:ring-1 focus:ring-[#1e9a58] outline-none transition-all"
                  placeholder="e.g. ORD-123456"
                />
              </div>

              <div className="grid grid-cols-[1fr_100px] gap-4">
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
                disabled={registering}
                className="w-full mt-6 bg-[#1e9a58] hover:bg-[#188048] text-white font-bold py-3.5 rounded-xl transition-all active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                {registering ? "Registering..." : "CLAIM MY SPOT"}
              </button>
            </form>
          )}
        </div>
      </section>
    </div>
  );
}
