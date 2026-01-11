import { CookieConsentParams, CookieConsentResponse } from '../types';
import { safeApiCall } from '../lib/api';
import { CONFIG } from '../constants';
import { CookieConsent } from '../types/database';

export const fetchCookieConsents = async (params: CookieConsentParams): Promise<CookieConsentResponse> => {
  return safeApiCall(async () => {
    // Construct Query Params
    const url = new URL(CONFIG.N8N_COOKIE_URL);
    url.searchParams.append('page', params.page.toString());
    url.searchParams.append('limit', params.pageSize.toString());
    if (params.dateFrom) url.searchParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) url.searchParams.append('dateTo', params.dateTo);
    url.searchParams.append('sortDir', params.sortDir || 'desc');

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
      }
    });

    if (!response.ok) {
      console.warn("Cookie Consent Fetch failed");
      return { items: [], total: 0 };
    }

    const data = await response.json();
    // Expected format: { items: [], total: number } or { consents: [] }
    const items = data.items || data.consents || [];

    const mappedItems: CookieConsent[] = items.map((row: any) => ({
      ...row,
      consent_categories: typeof row.consent_categories === 'string'
        ? JSON.parse(row.consent_categories)
        : (row.consent_categories || {})
    }));

    return {
      items: mappedItems,
      total: data.total || items.length
    };
  }, 'fetchCookieConsents');
};