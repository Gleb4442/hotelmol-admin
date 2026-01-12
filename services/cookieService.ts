import { CookieConsentParams, CookieConsentResponse } from '../types';
import { safeApiCall } from '../lib/api';
import { CONFIG } from '../constants';
import { CookieConsent } from '../types/database';

export const fetchCookieConsents = async (params: CookieConsentParams): Promise<CookieConsentResponse> => {
  return safeApiCall(async () => {
    // Build URL with query params (relative path for Vercel proxy)
    const queryParams = new URLSearchParams();
    queryParams.append('page', params.page.toString());
    queryParams.append('limit', params.pageSize.toString());
    if (params.dateFrom) queryParams.append('dateFrom', params.dateFrom);
    if (params.dateTo) queryParams.append('dateTo', params.dateTo);
    queryParams.append('sortDir', params.sortDir || 'desc');

    const url = `${CONFIG.N8N_COOKIE_URL}?${queryParams.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key-Blog-Publishing': CONFIG.N8N_WEBHOOK_SECRET
      }
    });

    if (!response.ok) {
      console.warn("Cookie Consent Fetch failed:", response.status);
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