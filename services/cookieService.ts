import { CookieConsentParams, CookieConsentResponse } from '../types';
import { safeApiCall } from '../lib/api';
import { CONFIG } from '../constants';
import { CookieConsent } from '../types/database';

export const fetchCookieConsents = async (params: CookieConsentParams): Promise<CookieConsentResponse> => {
  return safeApiCall(async () => {
    // Build request body with parameters
    const requestBody = {
      page: params.page,
      limit: params.pageSize,
      dateFrom: params.dateFrom,
      dateTo: params.dateTo,
      sortDir: params.sortDir || 'desc'
    };

    const url = CONFIG.N8N_COOKIE_URL;

    console.log('[CookieService] Fetching from:', url);
    console.log('[CookieService] Request body:', requestBody);
    console.log('[CookieService] Headers:', { 'X-Api-Key-Blog-Publishing': '***' });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key-Blog-Publishing': CONFIG.N8N_WEBHOOK_SECRET
      },
      body: JSON.stringify(requestBody)
    });

    console.log('[CookieService] Response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`[CookieService] Fetch failed: ${response.status}`, errorText);
      throw new Error(`Failed to fetch cookie consents: ${response.status} - ${errorText}`);
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