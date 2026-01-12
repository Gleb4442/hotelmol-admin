import { CONFIG } from '../constants';
import { safeApiCall } from '../lib/api';

export const testN8nConnection = async (): Promise<{ success: boolean; message: string; latency: number }> => {
  return safeApiCall(async () => {
    const start = performance.now();

    // Test the "Get Blog Data" endpoint via proxy
    // Note: This endpoint requires Header Auth
    const url = CONFIG.N8N_BLOG_GET_URL; // /api/n8n/get-blog-data
    const testUrl = `${url}?limit=1`;

    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key-Blog-Publishing': CONFIG.N8N_WEBHOOK_SECRET
      }
    });

    if (!response.ok) {
      throw new Error(`N8N Error: ${response.status}`);
    }

    await response.json();

    const end = performance.now();
    return {
      success: true,
      message: "N8N Connected via Proxy",
      latency: Math.round(end - start)
    };
  }, 'testN8nConnection');
};