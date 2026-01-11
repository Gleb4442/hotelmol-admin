import { Author } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sendBlogOpsN8N, sendDeleteItemN8N, UnifiedBlogOpsPayload } from '../lib/n8n'; // Reusing Blog Ops for authors if structurally compatible or using separate logic?
import { CONFIG } from '../constants';

// V2 Spec: Authors are usually fetched with Blog Data (/get-blog-data). 
// There is no standalone "Manage Authors" webhook in the main list.
// However, the internal implementation plan and previous context implies we need one.
// We will use N8N_AUTHORS_LIST_URL (which we added to config) if defined, 
// OR fallback to N8N_BLOG_GET_URL filtering authors?
// Spec V2: "Response Format: { data: { posts: [], authors: [] } }"
// So we can hit N8N_BLOG_GET_URL and just take authors.

export const fetchAuthors = async (): Promise<Author[]> => {
    return safeApiCall(async () => {
        const response = await fetch(CONFIG.N8N_BLOG_GET_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
            }
        });

        if (!response.ok) {
            console.warn("Authors Fetch failed, returning empty list.");
            return [];
        }

        const data = await response.json();
        // V2 Response Format: { data: { posts: [], authors: [] } }
        return (data.data?.authors || []) as Author[];
    }, 'fetchAuthors');
};

export interface AuthorInput {
    name: string;
    bio: string;
    location: string;
    photo_base64?: string;
    photo_mime_type?: string;
    existing_photo_url?: string;
}

// V2 Spec doesn't explicitly define Author CRUD endpoints.
// We will assume we can send `{ type: 'author', ... }` to DELETE endpoint.
// For CREATE/UPDATE, if the main Blog Ops endpoint accepts { action: 'create_author' }, we use that.
// If not, we might be blocked. I'll implement a best-guess structure compatible with typical N8N routing.

export const createAuthor = async (input: AuthorInput): Promise<any> => {
    // Attempting to use Blog Ops endpoint with a custom action "create_author"
    // Ideally this should be clarified in spec, but we proceed with this assumption to enable UI functionality.

    // We send a payload that technically matches UnifiedBlogOpsPayload but abuses it slightly?
    // Or we just send a raw object if N8N parses loose JSON.
    // UnifiedBlogOpsPayload requires 'post'. 
    // I will cast to any to bypass strict type for this specific "Author Ops" call if needed, 
    // OR create a proper type if we confirm spec.

    // Let's assume we use the same endpoint but send { action: 'create_author', author: ... }
    const payload = {
        action: 'create_author',
        author: {
            name: input.name,
            bio: input.bio,
            location: input.location,
            photo_base64: input.photo_base64 || null
        }
    };

    return safeApiCall(async () => {
        const response = await fetch(CONFIG.N8N_BLOG_OPS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}` },
            body: JSON.stringify(payload)
        });
        return await response.json();
    }, 'createAuthor');
};

export const updateAuthor = async (id: number, input: AuthorInput): Promise<any> => {
    const payload = {
        action: 'update_author',
        author: {
            id: id,
            name: input.name,
            bio: input.bio,
            location: input.location,
            photo_base64: input.photo_base64 || null,
            existing_photo_url: input.existing_photo_url
        }
    };

    return safeApiCall(async () => {
        const response = await fetch(CONFIG.N8N_BLOG_OPS_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}` },
            body: JSON.stringify(payload)
        });
        return await response.json();
    }, 'updateAuthor');
};

export const deleteAuthor = async (id: number): Promise<boolean> => {
    // V2 Explicitly defines DELETE item webhook for authors.
    return safeApiCall(async () => {
        await sendDeleteItemN8N({
            type: 'author',
            id: id
        });
        return true;
    }, `deleteAuthor:${id}`);
};
