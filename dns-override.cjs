// This script runs before Next.js starts (via NODE_OPTIONS or --require)
// It overrides the DNS servers used by Node.js for ALL queries,
// including MongoDB's internal SRV lookups.
// This is needed because the ISP/local DNS blocks MongoDB SRV queries.

const dns = require("dns");
dns.setServers(["8.8.8.8", "8.8.4.4"]);
dns.setDefaultResultOrder("ipv4first");
