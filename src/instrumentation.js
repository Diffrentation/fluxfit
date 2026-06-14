// Next.js Instrumentation file - runs once on server startup
// This is the correct place to set global Node.js settings like DNS

export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    const dns = await import("dns");
    // Fix: ISP blocks MongoDB SRV DNS queries, use Google's public DNS
    dns.default.setDefaultResultOrder("ipv4first");
    dns.default.setServers(["8.8.8.8", "8.8.4.4"]);
    console.log("✅ DNS overridden to use Google DNS (8.8.8.8) for MongoDB SRV resolution");
  }
}
