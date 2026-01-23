import { Author } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sendAuthorOpsN8N, sendAuthorOpsWithFile, sendDeleteItemN8N, fetchBlogDataN8N, AuthorOpsPayload } from '../lib/n8n';

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
 * Author input interface - updated to accept File
 */
export interface AuthorInput {
    name: string;
    email: string;           // Required per spec
    bio?: string;
    avatarFile?: File | null; // Changed to accept File object
    avatar_url?: string;      // Keep for backward compatibility (when no new file)
}

/**
 * Create a new author with optional file upload
 */
export const createAuthor = async (input: AuthorInput): Promise<any> => {
    return safeApiCall(async () => {
        // If there's a file, use FormData endpoint
        if (input.avatarFile) {
            const result = await sendAuthorOpsWithFile({
                action: 'create_author',
                name: input.name,
                email: input.email,
                bio: input.bio || null,
                avatarFile: input.avatarFile
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to create author via N8N');
            }

            return result.author || result.data || input;
        }

        // Otherwise use JSON endpoint (no image)
        const payload: AuthorOpsPayload = {
            action: 'create_author',
            name: input.name,
            email: input.email,
            bio: input.bio || null,
            avatar_url: input.avatar_url || null
        };

        const result = await sendAuthorOpsN8N(payload);

        if (!result.success) {
            throw new Error(result.error || 'Failed to create author via N8N');
        }

        return result.author || result.data || input;
    }, 'createAuthor');
};

/**
 * Update an existing author with optional file upload
 */
export const updateAuthor = async (id: number, input: AuthorInput): Promise<any> => {
    return safeApiCall(async () => {
        // If there's a file, use FormData endpoint
        if (input.avatarFile) {
            const result = await sendAuthorOpsWithFile({
                action: 'update_author',
                author_id: id,
                name: input.name,
                email: input.email,
                bio: input.bio || null,
                avatarFile: input.avatarFile
            });

            if (!result.success) {
                throw new Error(result.error || 'Failed to update author via N8N');
            }

            return result.author || result.data || { ...input, id };
        }

        // Otherwise use JSON endpoint (no image change)
        const payload: AuthorOpsPayload = {
            action: 'update_author',
            author_id: id,
            name: input.name,
            email: input.email,
            bio: input.bio || null,
            avatar_url: input.avatar_url || null
        };

        const result = await sendAuthorOpsN8N(payload);

        if (!result.success) {
            throw new Error(result.error || 'Failed to update author via N8N');
        }

        return result.author || result.data || { ...input, id };
    }, `updateAuthor:${id}`);
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
