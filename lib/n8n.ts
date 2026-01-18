import { CONFIG } from '../constants';
import { Logger } from './logger';
import { safeApiCall } from './api';

/**
 * Blog Operations Payload - matches N8N spec
 * Uses upsert_post_existing_author for all blog post operations
 * Note: For internal use only - will be converted to proper N8N scenario
 */
export interface BlogOpsPayload {
  action: 'create' | 'update' | 'delete'; // Internal action type, converted to N8N scenario
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
 * Uses scenario: upsert_post_existing_author
 */
export async function sendBlogOpsN8N(payload: BlogOpsPayload) {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_BLOG_OPS_URL) throw new Error("Missing N8N_BLOG_OPS_URL");

    Logger.info("Initiating Blog Ops N8N Call", { url: CONFIG.N8N_BLOG_OPS_URL, action: payload.action });

    // Always use upsert_post_existing_author scenario for blog posts
    const payloadWithScenario = {
      ...payload,
      scenario: 'upsert_post_existing_author',
      action: 'upsert_post_existing_author'
    };

    const response = await fetch(CONFIG.N8N_BLOG_OPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // N8N webhooks don't require Authorization by default
      },
      body: JSON.stringify(payloadWithScenario),
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
 * Endpoint: /webhook/get-blog-data (GET with Header Auth)
 */
export async function fetchBlogDataN8N(params?: {
  filters?: { status?: string; author_id?: number; search?: string };
  sort?: { field: string; order: 'asc' | 'desc' };
  pagination?: { page: number; limit: number };
}) {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_BLOG_GET_URL) throw new Error("Missing N8N_BLOG_GET_URL");

    // Build query string for GET request
    const queryParams = new URLSearchParams();

    if (params?.pagination?.page) queryParams.set('page', String(params.pagination.page));
    if (params?.pagination?.limit) queryParams.set('limit', String(params.pagination.limit));
    if (params?.filters?.status) queryParams.set('status', params.filters.status);
    if (params?.filters?.author_id) queryParams.set('author_id', String(params.filters.author_id));
    if (params?.filters?.search) queryParams.set('search', params.filters.search);
    if (params?.sort?.field) queryParams.set('sort_field', params.sort.field);
    if (params?.sort?.order) queryParams.set('sort_order', params.sort.order);

    const url = `${CONFIG.N8N_BLOG_GET_URL}?${queryParams.toString()}`;

    Logger.info("Fetching Blog Data from N8N", { url });

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'X-Api-Key-Blog-Publishing': CONFIG.N8N_WEBHOOK_SECRET
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N Get Data Error: ${response.status} - ${errorText.substring(0, 100)}`);
    }

    return await response.json();
  }, 'fetchBlogDataN8N');
}

/**
 * Upload content image (inline image) using N8N
 * Uses scenario: upload_content_image
 */
export async function uploadContentImage(imageFile: File): Promise<string> {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_BLOG_OPS_URL) throw new Error("Missing N8N_BLOG_OPS_URL");

    Logger.info("Uploading content image to N8N", { fileName: imageFile.name });

    const formData = new FormData();
    formData.append('scenario', 'upload_content_image');
    formData.append('action', 'upload_content_image');
    formData.append('data', imageFile, imageFile.name);

    const response = await fetch(CONFIG.N8N_BLOG_OPS_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Failed to upload content image: ${response.status} ${errorText.substring(0, 200)}`);
    }

    const result = await response.json();
    const imageUrl = result.secure_url || result.url;

    if (!imageUrl) {
      throw new Error('No image URL returned from N8N');
    }

    Logger.info("Content image uploaded successfully", { url: imageUrl });
    return imageUrl;
  }, 'uploadContentImage');
}

/**
 * Send Author Operation with File Upload using FormData
 * N8N requires multipart/form-data with binary file named 'data'
 */
export async function sendAuthorOpsWithFile(payload: {
  action: 'create_author' | 'update_author';
  author_id?: number;
  name: string;
  email: string;
  bio?: string | null;
  avatarFile?: File | null;
}) {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_BLOG_OPS_URL) throw new Error("Missing N8N_BLOG_OPS_URL");

    Logger.info("Initiating Author Ops with File Upload", { action: payload.action, name: payload.name });

    // Create FormData
    const formData = new FormData();
    formData.append('action', payload.action);
    formData.append('scenario', payload.action); // Add scenario field
    formData.append('name', payload.name);
    formData.append('email', payload.email);

    if (payload.author_id) {
      formData.append('author_id', payload.author_id.toString());
    }

    if (payload.bio) {
      formData.append('bio', payload.bio);
    }

    // ВАЖНО: имя поля ОБЯЗАТЕЛЬНО должно быть 'data'
    if (payload.avatarFile) {
      formData.append('data', payload.avatarFile, payload.avatarFile.name);
    }

    const response = await fetch(CONFIG.N8N_BLOG_OPS_URL, {
      method: 'POST',
      // НЕ УСТАНАВЛИВАЕМ Content-Type! Браузер сам установит с boundary
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N Author Error: ${response.status} ${errorText.substring(0, 200)}`);
    }

    return await response.json();
  }, 'sendAuthorOpsWithFile');
}

/**
 * Send Blog Post Operation with File Upload using FormData
 * N8N requires multipart/form-data with binary file named 'data'
 * Uses correct N8N workflow scenarios: upload_post_image, upsert_post_existing_author
 */
export async function sendBlogOpsWithFile(payload: {
  action: 'create' | 'update';
  post_id?: number;
  title: string;
  slug: string;
  content: string;
  excerpt?: string;
  author_id: number;
  status: 'draft' | 'published' | 'archived';
  category?: string;
  featuredImageFile?: File | null;
}) {
  return safeApiCall(async () => {
    if (!CONFIG.N8N_BLOG_OPS_URL) throw new Error("Missing N8N_BLOG_OPS_URL");

    Logger.info("Initiating Blog Ops with File Upload", { action: payload.action, title: payload.title });

    // Step 1: Upload featured image if provided - uses 'upload_post_image' scenario
    let featured_image_url = null;
    if (payload.featuredImageFile) {
      const imageFormData = new FormData();
      imageFormData.append('scenario', 'upload_post_image');
      imageFormData.append('action', 'upload_post_image');
      imageFormData.append('data', payload.featuredImageFile, payload.featuredImageFile.name);

      const imageResponse = await fetch(CONFIG.N8N_BLOG_OPS_URL, {
        method: 'POST',
        body: imageFormData,
      });

      if (!imageResponse.ok) {
        const errorText = await imageResponse.text();
        throw new Error(`Failed to upload image: ${imageResponse.status} ${errorText.substring(0, 200)}`);
      }

      const imageResult = await imageResponse.json();
      featured_image_url = imageResult.secure_url || imageResult.url;
      Logger.info("Image uploaded successfully", { url: featured_image_url });
    }

    // Step 2: Create/Update post - uses 'upsert_post_existing_author' scenario
    const postPayload: any = {
      scenario: 'upsert_post_existing_author',
      action: 'upsert_post_existing_author',
      title: payload.title,
      slug: payload.slug,
      content: payload.content,
      author_id: payload.author_id,
      status: payload.status
    };

    if (payload.post_id) {
      postPayload.post_id = payload.post_id;
    }

    if (payload.excerpt) {
      postPayload.excerpt = payload.excerpt;
    }

    if (payload.category) {
      postPayload.category = payload.category;
    }

    if (featured_image_url) {
      postPayload.featured_image_url = featured_image_url;
    }

    const response = await fetch(CONFIG.N8N_BLOG_OPS_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(postPayload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`N8N Blog Error: ${response.status} ${errorText.substring(0, 200)}`);
    }

    return await response.json();
  }, 'sendBlogOpsWithFile');
}
