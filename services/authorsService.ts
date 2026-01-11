import { Author } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sendAuthorOpsN8N, sendDeleteItemN8N, UnifiedAuthorOpsPayload } from '../lib/n8n';
import { CONFIG } from '../constants';

/**
 * Fetches authors from the N8N Blog Data endpoint.
 * V2 Spec: { data: { posts: [], authors: [] } }
 */
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
        return (data.data?.authors || []) as Author[];
    }, 'fetchAuthors');
};

export interface AuthorInput {
    name: string;
    bio: string;
    location: string;
    photo_base64?: string; // We'll map this to image_file in the payload
    existing_photo_url?: string;
}

export const createAuthor = async (input: AuthorInput): Promise<any> => {
    return sendAuthorOpsN8N({
        action: 'create_author',
        author: {
            name: input.name,
            bio: input.bio,
            location: input.location,
            image_file: input.photo_base64 || null
        }
    });
};

export const updateAuthor = async (id: number, input: AuthorInput): Promise<any> => {
    return sendAuthorOpsN8N({
        action: 'update_author',
        author: {
            id: id,
            name: input.name,
            bio: input.bio,
            location: input.location,
            image_file: input.photo_base64 || null
        }
    });
};

export const deleteAuthor = async (id: number): Promise<boolean> => {
    return safeApiCall(async () => {
        await sendDeleteItemN8N({
            type: 'author',
            id: id
        });
        return true;
    }, `deleteAuthor:${id}`);
};
