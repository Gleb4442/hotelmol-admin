import { CONFIG } from '../constants';
import { Logger } from './logger';
import { safeApiCall } from './api';

/**
 * Blog Operations Payload - matches N8N spec
 * Supports: create, update, delete actions
 */
export interface BlogOpsPayload {
  action: 'create' | 'update' | 'delete';
  post_id?: number;           // For update/delete
  title?: string;
  slug?: string;
  content?: string;
  excerpt?: string;
  featured_image_url?: string | null;
  author_id?: number;
  status?: 'draft' | 'published' | 'archived';
}

/**
 * Author Operations Payload - matches N8N spec
 */
export interface AuthorOpsPayload {
  action: 'create_author' | 'update_author';
  author_id?: number;         // For update
  name: string;
  email: string;              // Required per spec
  bio?: string | null;
  avatar_url?: string | null;
}

/**
 * Delete Payload - for blog-delete endpoint
 */
export interface DeleteItemPayload {
  action: 'delete';
  type: 'post' | 'author';
  id: number;
  author_id?: number;  // Required for post deletion per spec
}

/**
 * Send data to N8N Blog Write Operations Webhook
 * Endpoint: /webhook/blog-write-ops
 */
export async function sendBlogOpsN8N(payload: BlogOpsPayload) {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_BLOG_OPS_URL) throw new Error("Missing N8N_BLOG_OPS_URL");

    Logger.info("Initiating Blog Ops N8N Call", { url: CONFIG.N8N_BLOG_OPS_URL, action: payload.action });

    const response = await fetch(CONFIG.N8N_BLOG_OPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // N8N webhooks don't require Authorization by default
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N Gateway Error: ${response.status} ${errorText.substring(0, 200)}`);
    }

    return await response.json();
  }, 'sendBlogOpsN8N');
}

/**
 * Send data to N8N Author Operations Webhook
 * Uses same endpoint: /webhook/blog-write-ops
 */
export async function sendAuthorOpsN8N(payload: AuthorOpsPayload) {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_BLOG_OPS_URL) throw new Error("Missing N8N_BLOG_OPS_URL");

    Logger.info("Initiating Author Ops N8N Call", { url: CONFIG.N8N_BLOG_OPS_URL, action: payload.action });

    const response = await fetch(CONFIG.N8N_BLOG_OPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N Author Error: ${response.status} ${errorText.substring(0, 200)}`);
    }

    return await response.json();
  }, 'sendAuthorOpsN8N');
}

/**
 * Send delete request to N8N Delete Webhook
 * Endpoint: /webhook/blog-delete
 */
export async function sendDeleteItemN8N(payload: DeleteItemPayload) {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_DELETE_ITEM_URL) throw new Error("Missing N8N_DELETE_ITEM_URL");

    Logger.info("Initiating Delete N8N Call", { url: CONFIG.N8N_DELETE_ITEM_URL, type: payload.type, id: payload.id });

    const response = await fetch(CONFIG.N8N_DELETE_ITEM_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N Delete Error: ${response.status} ${errorText.substring(0, 200)}`);
    }

    return await response.json();
  }, 'sendDeleteItemN8N');
}

/**
 * Fetch blog data from N8N
 * Endpoint: /webhook/blog-get-data
 */
export async function fetchBlogDataN8N(params?: {
  filters?: { status?: string; author_id?: number; search?: string };
  sort?: { field: string; order: 'asc' | 'desc' };
  pagination?: { page: number; limit: number };
}) {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_BLOG_GET_URL) throw new Error("Missing N8N_BLOG_GET_URL");

    const payload = {
      filters: params?.filters || {},
      sort: params?.sort || { field: 'created_at', order: 'desc' },
      pagination: params?.pagination || { page: 1, limit: 20 },
    };

    Logger.info("Fetching Blog Data from N8N", { url: CONFIG.N8N_BLOG_GET_URL });

    const response = await fetch(CONFIG.N8N_BLOG_GET_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      throw new Error(`N8N Get Data Error: ${response.status}`);
    }

    return await response.json();
  }, 'fetchBlogDataN8N');
}

// Helper to convert File to Base64
export const fileToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      // Return full data URL for avatar_url field
      resolve(result);
    };
    reader.onerror = error => reject(error);
  });
};
