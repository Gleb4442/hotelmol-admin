import { CONFIG } from '../constants';
import { Logger } from './logger';
import { safeApiCall } from './api';

export interface UnifiedBlogOpsPayload {
  action: 'create' | 'update';
  post: {
    id?: string | number | null;
    title: string;
    slug: string;
    content: string;
    status: string;
    author_id: number | null;
    image_file?: string | null; // Base64
    seo_title?: string;
    seo_description?: string;
    // Multilingual fields (preserving them as they are likely in DB schema)
    title_ru?: string;
    content_ru?: string;
    title_en?: string;
    content_en?: string;
    title_pl?: string;
    content_pl?: string;
    seo_title_ru?: string;
    seo_description_ru?: string;
    seo_title_en?: string;
    seo_description_en?: string;
    seo_title_pl?: string;
    seo_description_pl?: string;
  };
}

export interface DeleteItemPayload {
  type: 'post' | 'author';
  id: string | number;
}

/**
 * Send data to N8N Blog Operations Webhook
 */
export async function sendBlogOpsN8N(payload: UnifiedBlogOpsPayload) {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_BLOG_OPS_URL) throw new Error("Missing N8N_BLOG_OPS_URL");

    Logger.info("Initiating Blog Ops N8N Call", { url: CONFIG.N8N_BLOG_OPS_URL, action: payload.action });

    const response = await fetch(CONFIG.N8N_BLOG_OPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N Gateway Error: ${response.status} ${errorText}`);
    }

    return await response.json();
  }, 'sendBlogOpsN8N');
}

/**
 * Send data to N8N Delete Item Webhook
 */
export async function sendDeleteItemN8N(payload: DeleteItemPayload) {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_DELETE_ITEM_URL) throw new Error("Missing N8N_DELETE_ITEM_URL");

    Logger.info("Initiating Delete Item N8N Call", { url: CONFIG.N8N_DELETE_ITEM_URL, type: payload.type, id: payload.id });

    const response = await fetch(CONFIG.N8N_DELETE_ITEM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`N8N Delete Error: ${response.status}`);
    }

    return await response.json();
  }, 'sendDeleteItemN8N');
}

// Helper to convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Remove data:image/xxx;base64, prefix if needed, or keep it. 
      // Spec says "photo_base64" + "photo_mime_type", usually implies raw base64 string without prefix.
      // But standard DataURL includes it. Let's send pure base64.
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = error => reject(error);
  });
};
