// Due dates are stored as calendar dates at 00:00 UTC (the date input sends "YYYY-MM-DD").
// So "today" is also computed in UTC to keep comparisons consistent.
function startOfTodayUTC() {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
}

function addDays(date, days) {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

module.exports = { startOfTodayUTC, addDays };
