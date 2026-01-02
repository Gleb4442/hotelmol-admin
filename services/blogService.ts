import { BlogPost } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';

export interface BlogQueryParams {
  page: number;
  pageSize: number;
  status?: string;
}

export interface BlogResponse {
  items: BlogPost[];
  total: number;
}

// NOTE: Table name in DB is assumed to be 'blog_posts' based on Schema Viewer

export const fetchBlogPosts = async (params: BlogQueryParams): Promise<BlogResponse> => {
  return safeApiCall(async () => {
    const limit = params.pageSize;
    const offset = (params.page - 1) * params.pageSize;

    // Conditional Where Clause construction for Neon/Postgres
    // Note: @neondatabase/serverless supports template literals for parameterized queries

    let posts;
    let totalResult;

    if (params.status && params.status !== 'all') {
      // Fetch with Filter
      posts = await sql`
            SELECT * FROM blog_posts 
            WHERE status = ${params.status} 
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
          `;
      totalResult = await sql`SELECT COUNT(*) FROM blog_posts WHERE status = ${params.status}`;
    } else {
      // Fetch All
      posts = await sql`
            SELECT * FROM blog_posts 
            ORDER BY created_at DESC 
            LIMIT ${limit} OFFSET ${offset}
          `;
      totalResult = await sql`SELECT COUNT(*) FROM blog_posts`;
    }

    // Map DB result to TypeScript interface (ensure types match)
    const mappedPosts: BlogPost[] = posts.map((row: any) => ({
      ...row,
      // Ensure JSONB fields are parsed if driver returns string
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
    }));

    return {
      items: mappedPosts,
      total: Number(totalResult[0].count)
    };
  }, 'fetchBlogPosts');
};

export const fetchBlogPostById = async (id: number): Promise<BlogPost> => {
  return safeApiCall(async () => {
    const result = await sql`SELECT * FROM blog_posts WHERE id = ${id}`;

    if (result.length === 0) throw new Error('Post not found');

    const row = result[0];
    return {
      ...row,
      tags: typeof row.tags === 'string' ? JSON.parse(row.tags) : row.tags,
    } as BlogPost;
  }, `fetchBlogPostById:${id}`);
};

// Update local cache is removed because we now fetch real data
export const createLocalBlogPost = (data: Partial<BlogPost>) => {
  // This function previously updated a local array. 
  // In production mode with real DB, we might want to just reload the list, 
  // but for UI optimism we can keep it empty or refactor.
  console.log('Post created, refresh list to see changes.');
};

export const updateBlogPost = async (id: number, data: Partial<BlogPost>): Promise<BlogPost> => {
  return safeApiCall(async () => {
    // Dynamic update query construction is safer with ORM, but raw SQL:
    // We will update specific fields that are editable

    const result = await sql`
        UPDATE blog_posts 
        SET 
          title = ${data.title || ''},
          slug = ${data.slug || ''},
          content = ${data.content || ''},
          title_ru = ${data.title_ru || null},
          content_ru = ${data.content_ru || null},
          title_en = ${data.title_en || null},
          content_en = ${data.content_en || null},
          title_pl = ${data.title_pl || null},
          content_pl = ${data.content_pl || null},
          status = ${data.status || 'draft'},
          category = ${data.category || 'General'},
          tags = ${JSON.stringify(data.tags || [])},
          seo_title = ${data.seo_title || null},
          seo_description = ${data.seo_description || null},
          seo_title_ru = ${data.seo_title_ru || null},
          seo_description_ru = ${data.seo_description_ru || null},
          seo_title_en = ${data.seo_title_en || null},
          seo_description_en = ${data.seo_description_en || null},
          seo_title_pl = ${data.seo_title_pl || null},
          seo_description_pl = ${data.seo_description_pl || null},
          author_id = ${data.author_id || 0}, 
          updated_at = NOW()
        WHERE id = ${id}
        RETURNING *
      `;

    if (result.length === 0) throw new Error('Failed to update post');
    return result[0] as BlogPost;
  }, `updateBlogPost:${id}`);
};

export const deleteBlogPost = async (id: number): Promise<boolean> => {
  return safeApiCall(async () => {
    await sql`DELETE FROM blog_posts WHERE id = ${id}`;
    return true;
  }, `deleteBlogPost:${id}`);
};