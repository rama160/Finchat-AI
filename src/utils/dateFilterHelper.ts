const INDONESIAN_MONTHS = [
  'Januari',
  'Februari',
  'Maret',
  'April',
  'Mei',
  'Juni',
  'Juli',
  'Agustus',
  'September',
  'Oktober',
  'November',
  'Desember',
];

const INDONESIAN_MONTHS_SHORT = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'Mei',
  'Jun',
  'Jul',
  'Agu',
  'Sep',
  'Okt',
  'Nov',
  'Des',
];

/**
 * Get the last day of a given year and month (1-indexed)
 */
export function getLastDayOfMonth(year: number, month1Indexed: number): number {
  return new Date(year, month1Indexed, 0).getDate();
}

/**
 * Checks if a given date range is exactly from the 1st day of a month
 * to the last day of that same month.
 */
export function isFullMonthRange(startDateStr: string, endDateStr: string): {
  isFullMonth: boolean;
  year?: number;
  monthName?: string;
  monthIndex?: number;
} {
  if (!startDateStr || !endDateStr) return { isFullMonth: false };

  const startParts = startDateStr.split('-').map(Number);
  const endParts = endDateStr.split('-').map(Number);

  if (startParts.length !== 3 || endParts.length !== 3) {
    return { isFullMonth: false };
  }

  const [sYear, sMonth, sDay] = startParts;
  const [eYear, eMonth, eDay] = endParts;

  // Must be same year and month
  if (sYear === eYear && sMonth === eMonth) {
    // Start must be day 1
    if (sDay === 1) {
      const lastDay = getLastDayOfMonth(sYear, sMonth);
      if (eDay === lastDay) {
        return {
          isFullMonth: true,
          year: sYear,
          monthName: INDONESIAN_MONTHS[sMonth - 1] || '',
          monthIndex: sMonth,
        };
      }
    }
  }

  return { isFullMonth: false };
}

/**
 * Format date range into an Indonesian user-friendly display title.
 * CRITICAL RULE: If the range is from the 1st of the month to the last day,
 * it returns just the Month and Year (e.g. "September 2026").
 */
export function formatRangeDisplayTitle(
  startDateStr: string | null,
  endDateStr: string | null,
  presetMode?: string
): string {
  if (presetMode === 'today') return 'Hari Ini';
  if (presetMode === 'this_week') return '7 Hari Terakhir';
  if (presetMode === 'all' || (!startDateStr && !endDateStr)) return 'Semua Waktu';

  if (!startDateStr && endDateStr) return `Hingga ${endDateStr}`;
  if (startDateStr && !endDateStr) return `Mulai ${startDateStr}`;
  if (!startDateStr || !endDateStr) return 'Semua Waktu';

  // Check 1st to last day of month
  const fullMonthCheck = isFullMonthRange(startDateStr, endDateStr);
  if (fullMonthCheck.isFullMonth) {
    return `${fullMonthCheck.monthName} ${fullMonthCheck.year}`;
  }

  // Single day selection
  if (startDateStr === endDateStr) {
    const [y, m, d] = startDateStr.split('-').map(Number);
    const monthName = INDONESIAN_MONTHS[m - 1] || '';
    return `${d} ${monthName} ${y}`;
  }

  // Custom range
  const [sy, sm, sd] = startDateStr.split('-').map(Number);
  const [ey, em, ed] = endDateStr.split('-').map(Number);

  const startMonthName = INDONESIAN_MONTHS_SHORT[sm - 1] || '';
  const endMonthName = INDONESIAN_MONTHS_SHORT[em - 1] || '';

  if (sy === ey) {
    if (sm === em) {
      return `${sd} - ${ed} ${startMonthName} ${sy}`;
    }
    return `${sd} ${startMonthName} - ${ed} ${endMonthName} ${sy}`;
  }

  return `${sd} ${startMonthName} ${sy} - ${ed} ${endMonthName} ${ey}`;
}
