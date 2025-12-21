import { CookieConsentParams, CookieConsentResponse } from '../types';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';
import { CookieConsent } from '../types/database';

export const fetchCookieConsents = async (params: CookieConsentParams): Promise<CookieConsentResponse> => {
  return safeApiCall(async () => {
    // Pagination
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;
    const sortDir = params.sortDir === 'asc' ? sql`ASC` : sql`DESC`;

    // Construct WHERE clause based on params
    let whereClause = sql`WHERE true`;

    if (params.dateFrom) {
      whereClause = sql`${whereClause} AND timestamp >= ${new Date(params.dateFrom).toISOString()}`;
    }
    if (params.dateTo) {
      // Set to end of day
      const toDate = new Date(params.dateTo);
      toDate.setHours(23, 59, 59, 999);
      whereClause = sql`${whereClause} AND timestamp <= ${toDate.toISOString()}`;
    }

    // 1. Fetch Items
    const items = await sql`
        SELECT * FROM cookie_consents 
        ${whereClause}
        ORDER BY timestamp ${sortDir}
        LIMIT ${limit} OFFSET ${offset}
      `;

    // 2. Fetch Total Count (for pagination)
    const countResult = await sql`
        SELECT COUNT(*) FROM cookie_consents ${whereClause}
      `;

    // Map JSONB fields if necessary (neon http driver sometimes returns string for json)
    const mappedItems: CookieConsent[] = items.map((row: any) => ({
      ...row,
      consent_categories: typeof row.consent_categories === 'string'
        ? JSON.parse(row.consent_categories)
        : row.consent_categories
    }));

    return {
      items: mappedItems,
      total: Number(countResult[0].count)
    };
  }, 'fetchCookieConsents');
};