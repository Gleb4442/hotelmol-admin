import { BlogPost } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sendBlogOpsN8N, sendBlogOpsWithFile, sendDeleteItemN8N, fetchBlogDataN8N, BlogOpsPayload } from '../lib/n8n';

export interface BlogQueryParams {
  page: number;
  pageSize: number;
  status?: string;
  search?: string;
  author_id?: number;
}

export interface BlogResponse {
  items: BlogPost[];
  total: number;
}

/**
 * Fetch blog posts from N8N
 */
export const fetchBlogPosts = async (params: BlogQueryParams): Promise<BlogResponse> => {
  return safeApiCall(async () => {
    const result = await fetchBlogDataN8N({
      filters: {
        status: params.status !== 'all' ? params.status : undefined,
        search: params.search,
        author_id: params.author_id,
      },
      sort: { field: 'created_at', order: 'desc' },
      pagination: { page: params.page, limit: params.pageSize },
    });

    if (!result.success) {
      throw new Error('Failed to fetch posts');
    }

    const posts = result.data?.posts || result.posts || [];

    return {
      items: posts as BlogPost[],
      total: result.data?.pagination?.total || result.totalPosts || posts.length
    };
  }, 'fetchBlogPosts');
};

/**
 * Fetch single blog post by ID
 */
export const fetchBlogPostById = async (id: number): Promise<BlogPost> => {
  return safeApiCall(async () => {
    const result = await fetchBlogDataN8N({
      filters: {},
      pagination: { page: 1, limit: 100 }, // Get all and filter
    });

    if (!result.success) {
      throw new Error('Post not found');
    }

    const posts = result.data?.posts || result.posts || [];
    const post = posts.find((p: any) => p.id === id);

    if (!post) throw new Error('Post not found in response');

    return post as BlogPost;
  }, `fetchBlogPostById:${id}`);
};

/**
 * Create a new blog post with optional file upload
 * @param data - Blog post data
 * @param featuredImageFile - Optional File object for featured image
 */
export const createBlogPost = async (data: Partial<BlogPost>, featuredImageFile?: File | null): Promise<BlogPost> => {
  return safeApiCall(async () => {
    // If there's a file, use FormData endpoint
    if (featuredImageFile) {
      const result = await sendBlogOpsWithFile({
        action: 'create',
        title: data.title || '',
        slug: data.slug || '',
        content: data.content || '',
        excerpt: data.excerpt || '',
        author_id: data.author_id || 1,
        status: data.status || 'draft',
        category: data.category,
        featuredImageFile: featuredImageFile
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to create post via N8N');
      }

      return (result.post || result.data || data) as BlogPost;
    }

    // Otherwise use JSON endpoint (no image)
    const payload: BlogOpsPayload = {
      action: 'create',
      title: data.title || '',
      slug: data.slug || '',
      content: data.content || '',
      excerpt: data.excerpt || '',
      featured_image_url: data.featured_image_url || null,
      author_id: data.author_id || 1,
      status: data.status || 'draft',
    };

    const result = await sendBlogOpsN8N(payload);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create post via N8N');
    }

    return (result.post || result.data || data) as BlogPost;
  }, 'createBlogPost');
};

/**
 * Update an existing blog post with optional file upload
 * @param id - Post ID
 * @param data - Blog post data
 * @param featuredImageFile - Optional File object for featured image
 */
export const updateBlogPost = async (id: number, data: Partial<BlogPost>, featuredImageFile?: File | null): Promise<BlogPost> => {
  return safeApiCall(async () => {
    // If there's a file, use FormData endpoint
    if (featuredImageFile) {
      const result = await sendBlogOpsWithFile({
        action: 'update',
        post_id: id,
        title: data.title || '',
        slug: data.slug || '',
        content: data.content || '',
        excerpt: data.excerpt || '',
        author_id: data.author_id || 1,
        status: data.status || 'draft',
        category: data.category,
        featuredImageFile: featuredImageFile
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to update post via N8N');
      }

      return (result.post || result.data || { ...data, id }) as BlogPost;
    }

    // Otherwise use JSON endpoint (no image change)
    const payload: BlogOpsPayload = {
      action: 'update',
      post_id: id,
      title: data.title,
      slug: data.slug,
      content: data.content,
      excerpt: data.excerpt,
      featured_image_url: data.featured_image_url,
      author_id: data.author_id,
      status: data.status,
    };

    const result = await sendBlogOpsN8N(payload);

    if (!result.success) {
      throw new Error(result.error || 'Failed to update post via N8N');
    }

    return (result.post || result.data || { ...data, id }) as BlogPost;
  }, `updateBlogPost:${id}`);
};

/**
 * Delete a blog post
 */
export const deleteBlogPost = async (id: number, author_id?: number): Promise<boolean> => {
  return safeApiCall(async () => {
    await sendDeleteItemN8N({
      action: 'delete',
      type: 'post',
      id: id,
      author_id: author_id,
    });
    return true;
  }, `deleteBlogPost:${id}`);
};
