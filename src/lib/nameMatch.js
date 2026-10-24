const nameCollator = new Intl.Collator(undefined, { sensitivity: 'base', numeric: true });

export function normalizeDoctorName(value = '') {
  return String(value)
    .normalize('NFKD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/^(?:dr|doctor)\b\.?\s*/i, '')
    .replace(/[^a-z0-9]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function editDistance(left, right, cutoff) {
  if (Math.abs(left.length - right.length) > cutoff) return cutoff + 1;
  let previous = Array.from({ length: right.length + 1 }, (_, index) => index);

  for (let row = 1; row <= left.length; row += 1) {
    const current = [row];
    let rowMinimum = row;
    for (let column = 1; column <= right.length; column += 1) {
      const cost = left[row - 1] === right[column - 1] ? 0 : 1;
      current[column] = Math.min(
        current[column - 1] + 1,
        previous[column] + 1,
        previous[column - 1] + cost,
      );
      rowMinimum = Math.min(rowMinimum, current[column]);
    }
    if (rowMinimum > cutoff) return cutoff + 1;
    previous = current;
  }
  return previous[right.length];
}

function hasAdjacentTransposition(left, right) {
  if (left.length !== right.length) return false;
  let index = 0;
  while (index < left.length && left[index] === right[index]) index += 1;
  return index < left.length - 1
    && left[index] === right[index + 1]
    && left[index + 1] === right[index]
    && left.slice(index + 2) === right.slice(index + 2);
}

function tokenMatchScore(queryToken, nameToken) {
  if (queryToken === nameToken) return 100;
  if (nameToken.startsWith(queryToken)) return 92;
  if (nameToken.includes(queryToken)) return 86;
  if (queryToken.startsWith(nameToken)) return 78;
  if (queryToken.includes(nameToken)) return 72;
  if (queryToken.length < 4 || nameToken.length < 4) return 0;
  if (hasAdjacentTransposition(queryToken, nameToken)) return 68;

  const cutoff = Math.max(queryToken.length, nameToken.length) >= 10 ? 2 : 1;
  const distance = editDistance(queryToken, nameToken, cutoff);
  return distance <= cutoff ? 68 - (distance - 1) * 8 : 0;
}

export function doctorNameMatchScore(query = '', candidate = '') {
  const normalizedQuery = normalizeDoctorName(query);
  const normalizedCandidate = normalizeDoctorName(candidate);
  if (normalizedQuery.length < 2 || !normalizedCandidate) return 0;
  if (normalizedQuery === normalizedCandidate) return 100;
  if (normalizedCandidate.startsWith(normalizedQuery)) return 96;
  if (normalizedCandidate.includes(normalizedQuery)) return 90;

  const queryTokens = normalizedQuery.split(' ');
  const candidateTokens = normalizedCandidate.split(' ');
  const tokenScores = queryTokens.map(queryToken =>
    Math.max(0, ...candidateTokens.map(nameToken => tokenMatchScore(queryToken, nameToken))),
  );
  if (tokenScores.some(score => score === 0)) return 0;
  return Math.round(tokenScores.reduce((sum, score) => sum + score, 0) / tokenScores.length);
}

export function doctorNameMatches(candidate = '', existing = '') {
  return doctorNameMatchScore(candidate, existing) >= 68;
}

export function relevantDoctorMatches(query = '', people = []) {
  return people
    .map(person => ({ person, score: doctorNameMatchScore(query, person.name) }))
    .filter(match => match.score > 0)
    .sort((left, right) => right.score - left.score || nameCollator.compare(left.person.name || '', right.person.name || ''))
    .map(({ person }) => person);
}

export function doctorSearchMatches(query = '', people = [], additionalFields = []) {
  const normalizedQuery = normalizeDoctorName(query);
  if (!normalizedQuery) return people;

  const digits = String(query).replace(/\D/g, '');
  return people
    .map(person => {
      const nameScore = doctorNameMatchScore(query, person.name);
      const fieldMatch = additionalFields.some(field =>
        normalizeDoctorName(person[field] || '').includes(normalizedQuery),
      );
      const phoneMatch = digits.length >= 3 && ['phone', 'whatsapp'].some(field =>
        String(person[field] || '').replace(/\D/g, '').includes(digits),
      );
      return { person, score: nameScore, matches: nameScore > 0 || fieldMatch || phoneMatch };
    })
    .filter(result => result.matches)
    .sort((left, right) => right.score - left.score || nameCollator.compare(left.person.name || '', right.person.name || ''))
    .map(({ person }) => person);
}
