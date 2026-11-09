export const MIN_UNITS = 20;
export const MAX_UNITS = 5000;
export const MONTHLY_PER_UNIT = 3;
export const NEW_MEMBER_PERCENT = 10;

const terms = {
  "1y": { months: 12, percent: 0 },
  "2y": { months: 24, percent: 20 },
  "3y": { months: 36, percent: 30 }
};

export function normalizeUnits(value) {
  const count = Math.trunc(Number(value));
  return Number.isFinite(count) ? Math.max(MIN_UNITS, Math.min(MAX_UNITS, count)) : MIN_UNITS;
}

function termQuote(units, term, newMember) {
  const base = units * MONTHLY_PER_UNIT * term.months;
  const total = Math.round(base * (100 - term.percent) * (newMember ? 100 - NEW_MEMBER_PERCENT : 100) / 10000);
  return { total, saved: base - total, monthly: total / term.months, perUnitMonthly: total / term.months / units };
}

export function quotePlans(value, newMember = false) {
  const units = normalizeUnits(value);
  const plans = Object.fromEntries(Object.entries(terms).map(([key, term]) => [key, termQuote(units, term, newMember)]));
  return { units, plans };
}
