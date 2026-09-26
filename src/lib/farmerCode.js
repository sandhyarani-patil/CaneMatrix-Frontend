// Some records were created with an "A-" prefix on the farmer code (e.g. "A-FARM2026001")
// and others without it (e.g. "FARM2026001"), depending on which screen created them.
// A farmer's login code may or may not carry that prefix either. Rather than requiring
// an exact string match against the backend, we normalise both sides before comparing.
export function normalizeFarmerCode(code) {
  return (code || '').toString().trim().toUpperCase().replace(/^A-/, '')
}

export function matchesFarmerCode(recordCode, loginCode) {
  if (!recordCode || !loginCode) return false
  return normalizeFarmerCode(recordCode) === normalizeFarmerCode(loginCode)
}
