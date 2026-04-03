/**
 * Strict MongoDB ObjectId string check (24 hex chars).
 * Use for API validation — mongoose.Types.ObjectId.isValid accepts some invalid strings.
 */
export function isStrictMongoObjectIdString(value) {
  if (value == null) return false;
  const s = String(value).trim();
  return /^[a-f0-9]{24}$/i.test(s);
}
