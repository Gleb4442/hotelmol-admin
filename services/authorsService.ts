import { Author } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sendAuthorOpsN8N, sendDeleteItemN8N, fetchBlogDataN8N, AuthorOpsPayload } from '../lib/n8n';

/**
 * Fetches authors from the N8N Blog Data endpoint.
 * Response: { success: true, data: { posts: [], authors: [], ... } }
 */
export const fetchAuthors = async (): Promise<Author[]> => {
    return safeApiCall(async () => {
        const result = await fetchBlogDataN8N();

        if (!result.success) {
            console.warn("Authors Fetch failed, returning empty list.");
            return [];
        }

        return (result.data?.authors || result.authors || []) as Author[];
    }, 'fetchAuthors');
};

/**
 * Author input interface - matches N8N spec
 */
export interface AuthorInput {
    name: string;
    email: string;           // Required per spec
    bio?: string;
    avatar_url?: string;     // For image upload (as data URL or actual URL)
}

/**
 * Create a new author
 */
export const createAuthor = async (input: AuthorInput): Promise<any> => {
    const payload: AuthorOpsPayload = {
        action: 'create_author',
        name: input.name,
        email: input.email,
        bio: input.bio || null,
        avatar_url: input.avatar_url || null
    };

    return sendAuthorOpsN8N(payload);
};

/**
 * Update an existing author
 */
export const updateAuthor = async (id: number, input: AuthorInput): Promise<any> => {
    const payload: AuthorOpsPayload = {
        action: 'update_author',
        author_id: id,
        name: input.name,
        email: input.email,
        bio: input.bio || null,
        avatar_url: input.avatar_url || null
    };

    return sendAuthorOpsN8N(payload);
};

/**
 * Delete an author
 */
export const deleteAuthor = async (id: number): Promise<boolean> => {
    return safeApiCall(async () => {
        await sendDeleteItemN8N({
            action: 'delete',
            type: 'author',
            id: id
        });
        return true;
    }, `deleteAuthor:${id}`);
};
