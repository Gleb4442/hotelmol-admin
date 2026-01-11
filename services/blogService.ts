import { BlogPost } from '../types/database';
import { safeApiCall } from '../lib/api';
import { CONFIG } from '../constants';
import { sendBlogOpsN8N, sendDeleteItemN8N, UnifiedBlogOpsPayload } from '../lib/n8n';

export interface BlogQueryParams {
  page: number;
  pageSize: number;
  status?: string;
}

export interface BlogResponse {
  items: BlogPost[];
  total: number;
}

export const fetchBlogPosts = async (params: BlogQueryParams): Promise<BlogResponse> => {
  return safeApiCall(async () => {
    const url = new URL(CONFIG.N8N_BLOG_GET_URL);
    url.searchParams.append('limit', params.pageSize.toString());
    url.searchParams.append('offset', ((params.page - 1) * params.pageSize).toString());

    // Spec also mentions sort/order
    url.searchParams.append('sort', 'created_at');
    url.searchParams.append('order', 'desc');

    if (params.status && params.status !== 'all') {
      url.searchParams.append('status', params.status);
    }

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`,
      }
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch posts: ${response.statusText}`);
    }

    const data = await response.json();
    // V2 Spec: { success: true, data: { posts: [], authors: [], pagination: {} } }
    const posts = data.data?.posts || [];

    return {
      items: posts.map((item: any) => ({
        ...item,
        tags: typeof item.tags === 'string' ? JSON.parse(item.tags) : (item.tags || []),
      })),
      total: data.data?.pagination?.total || posts.length
    };
  }, 'fetchBlogPosts');
};

export const fetchBlogPostById = async (id: number): Promise<BlogPost> => {
  return safeApiCall(async () => {
    const url = new URL(CONFIG.N8N_BLOG_GET_URL);
    url.searchParams.append('id', id.toString());

    const response = await fetch(url.toString(), {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`,
      }
    });

    if (!response.ok) throw new Error('Post not found');

    const data = await response.json();
    // If response is list with 1 item
    const post = data.data?.posts?.[0] || data.post;
    if (!post) throw new Error('Post not found in response');

    return {
      ...post,
      tags: typeof post.tags === 'string' ? JSON.parse(post.tags) : (post.tags || []),
    } as BlogPost;
  }, `fetchBlogPostById:${id}`);
};

export const createLocalBlogPost = (data: Partial<BlogPost>) => {
  // Deprecated in favor of reload
};

export const updateBlogPost = async (id: number, data: Partial<BlogPost>): Promise<BlogPost> => {
  return safeApiCall(async () => {
    // V2 Payload Construction
    const payload: UnifiedBlogOpsPayload = {
      action: 'update',
      post: {
        id: id,
        title: data.title || '',
        slug: data.slug || '',
        content: data.content || '',
        status: data.status || 'draft',

        // V2 uses 'image_file' for base64 or URL
        image_file: data.featured_image,
        seo_title: data.seo_title,
        seo_description: data.seo_description,

        // Multilingual fields
        title_ru: data.title_ru,
        content_ru: data.content_ru,
        title_en: data.title_en,
        content_en: data.content_en,
        title_pl: data.title_pl,
        content_pl: data.content_pl,
        seo_title_ru: data.seo_title_ru,
        seo_description_ru: data.seo_description_ru,
        seo_title_en: data.seo_title_en,
        seo_description_en: data.seo_description_en,
        seo_title_pl: data.seo_title_pl,
        seo_description_pl: data.seo_description_pl,

        author_id: data.author_id || 0
      }
    };

    const result = await sendBlogOpsN8N(payload);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update post via N8N');
    }

    return (result.post || result.data || {}) as BlogPost;
  }, `updateBlogPost:${id}`);
};

export const deleteBlogPost = async (id: number): Promise<boolean> => {
  return safeApiCall(async () => {
    await sendDeleteItemN8N({
      type: 'post',
      id: id
    });
    return true;
  }, `deleteBlogPost:${id}`);
};