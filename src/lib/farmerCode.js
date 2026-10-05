


// Some records were created with an "A-" prefix on the farmer code (e.g. "A-FARM2026001")
// and others without it (e.g. "FARM2026001"), depending on which screen created them.
// A farmer's login code may or may not carry that prefix either. Rather than requiring
// an exact string match against the backend, we normalise both sides before comparing.
export function normalizeFarmerCode(code) {
  return (code || '').toString().trim().toUpperCase().replace(/^A-/, '')
}

// Last-resort fallback: just the digits in the code (e.g. "C-FARM2026002" -> "2026002").
// This still matches even if the letters/prefix differ (A-, C-, or nothing at all),
// as long as the farmer's numeric id portion is the same.
function digitsOnly(code) {
  return (code || '').toString().replace(/\D/g, '')
}

export function matchesFarmerCode(recordCode, loginCode) {
  if (!recordCode || !loginCode) return false
  if (normalizeFarmerCode(recordCode) === normalizeFarmerCode(loginCode)) return true
  const recordDigits = digitsOnly(recordCode)
  const loginDigits = digitsOnly(loginCode)
  return recordDigits.length > 0 && recordDigits === loginDigits
}