export interface JobFilterState {
  keyword?: string;
  levels?: string[];
  sort?: string;
  page?: number;
  pageSize?: number;
}

/**
 * Generates a Sieve string by distributing ANDs over ORs.
 * This guarantees Sieve parses logic correctly without parenthesis.
 * Sieve evaluates `,` (AND) before `|` (OR).
 * So `A,B|A,C` means `(A AND B) OR (A AND C)`.
 */
export function distributeSieveFilters(filterGroups: string[][]): string {
  if (!filterGroups || filterGroups.length === 0) return "";
  
  // Filter out any empty groups
  const validGroups = filterGroups.filter(g => g && g.length > 0);
  if (validGroups.length === 0) return "";

  let result = validGroups[0];
  
  for (let i = 1; i < validGroups.length; i++) {
    const nextResult: string[] = [];
    for (const current of result) {
      for (const item of validGroups[i]) {
        nextResult.push(`${current},${item}`);
      }
    }
    result = nextResult;
  }
  
  return result.join('|');
}

/**
 * Generic utility to build a Sieve query string from a filter state.
 */
export function buildSieveQuery(state: JobFilterState): string {
  const queryParams = new URLSearchParams();

  if (state.page) queryParams.append('page', state.page.toString());
  if (state.pageSize) queryParams.append('pageSize', state.pageSize.toString());
  if (state.sort) queryParams.append('sorts', state.sort);

  const filterGroups: string[][] = [];

  // Keyword filter
  if (state.keyword && state.keyword.trim() !== '') {
    const keyword = encodeURIComponent(state.keyword.trim());
    filterGroups.push([`name@=${keyword}`, `location@=${keyword}`]);
  }

  // Levels filter
  if (state.levels && state.levels.length > 0) {
    const levelFilter = state.levels.map(level => `level==${level}`);
    filterGroups.push(levelFilter);
  }

  const finalFilter = distributeSieveFilters(filterGroups);
  if (finalFilter) {
    queryParams.append('filters', finalFilter);
  }

  return queryParams.toString();
}
