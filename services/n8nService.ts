import { CONFIG } from '../constants';
import { safeApiCall } from '../lib/api';

export const testN8nConnection = async (): Promise<{ success: boolean; message: string; latency: number }> => {
  return safeApiCall(async () => {
    const start = performance.now();

    // We test the "Get Blog Data" endpoint as a known GET operation via Proxy
    // We simply check if we can reach it (even empty list is success)
    const url = CONFIG.N8N_BLOG_GET_URL; // e.g. /api/n8n/get-blog-data

    // Append a small limit to be lightweight
    const testUrl = `${url}?limit=1`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
      }
    });

    if (!response.ok) {
      throw new Error(`Proxy Error: ${response.status}`);
    }

    // We don't strictly need to parse JSON to know connection worked, 
    // but good to verify it's valid JSON coming back.
    await response.json();

    const end = performance.now();
    return {
      success: true,
      message: "Proxy Active (N8N Reachable)",
      latency: Math.round(end - start)
    };
  }, 'testN8nConnection');
};