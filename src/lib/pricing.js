import ShippingRule from "@/models/shippingrule.model";
import TaxRate from "@/models/taxrate.model";
import Settings from "@/models/settings.model";

/**
 * Resolve the real shipping cost server-side from active ShippingRule
 * documents matching the destination (state/city/pincode zones), never from
 * a client-supplied value. Rules with no zones configured apply everywhere.
 * Falls back to a flat rate only when no ShippingRule exists at all.
 *
 * Shared by order creation (src/app/api/orders/route.js) and the pre-order
 * estimate endpoint (src/app/api/orders/estimate/route.js) so both always
 * agree on the same number for the same address.
 */
export async function resolveShippingCost(shippingAddr, orderValue) {
  const rules = await ShippingRule.find({ isActive: true }).sort({
    sortOrder: 1,
  });

  const matchesZone = (rule) => {
    if (!rule.zones || rule.zones.length === 0) return true;
    return rule.zones.some(
      (zone) =>
        (zone.states || []).some(
          (s) => s.toLowerCase() === (shippingAddr.state || "").toLowerCase(),
        ) ||
        (zone.cities || []).some(
          (c) => c.toLowerCase() === (shippingAddr.city || "").toLowerCase(),
        ) ||
        (zone.pincodes || []).includes(shippingAddr.pincode),
    );
  };

  const matchedRule = rules.find(matchesZone);
  if (matchedRule) {
    return matchedRule.calculateCost(0, 0, orderValue);
  }

  // No ShippingRule configured for this destination — fall back to the
  // site-wide free-shipping threshold if set, otherwise a flat default.
  const settings = await Settings.getSettings();
  const threshold = settings?.shipping?.freeShippingThreshold;
  if (threshold != null && orderValue >= threshold) {
    return 0;
  }
  return 50;
}

/**
 * Resolve the effective GST rate server-side from active TaxRate documents
 * applicable to the shipping state, falling back to the site-wide default.
 */
export async function resolveTaxRatePercent(state) {
  const rates = await TaxRate.find({ isActive: true });
  const applicable = rates.find((r) => r.isApplicable(null, null, state));
  if (applicable) return applicable.rate;

  const settings = await Settings.getSettings();
  return settings?.tax?.enabled === false ? 0 : (settings?.tax?.defaultRate ?? 18);
}
