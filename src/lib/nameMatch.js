export function normalizeDoctorName(value = '') {
  return value
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/\bdr\b\.?/g, ' ')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function doctorNameMatches(candidate = '', existing = '') {
  const a = normalizeDoctorName(candidate);
  const b = normalizeDoctorName(existing);
  if (!a || !b) return false;
  if (a === b) return true;
  return a.includes(b) || b.includes(a);
}

export function relevantDoctorMatches(query = '', people = []) {
  const normalizedQuery = normalizeDoctorName(query);
  if (!normalizedQuery) return [];
  return people
    .map(person => ({ person, normalized: normalizeDoctorName(person.name) }))
    .filter(({ normalized }) => normalized && (normalized.includes(normalizedQuery) || normalizedQuery.includes(normalized)))
    .sort((a, b) => {
      const aExact = a.normalized === normalizedQuery ? 0 : 1;
      const bExact = b.normalized === normalizedQuery ? 0 : 1;
      return aExact - bExact || a.normalized.length - b.normalized.length;
    })
    .map(({ person }) => person);
}
