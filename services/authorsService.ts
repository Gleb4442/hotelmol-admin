import { Author } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';
import { sendToN8n } from '../lib/n8n';

export const fetchAuthors = async (): Promise<Author[]> => {
    return safeApiCall(async () => {
        // In production, fetch from DB
        // For now we assume the table 'authors' exists
        const result = await sql`SELECT * FROM authors ORDER BY id DESC`;
        return result as Author[];
    }, 'fetchAuthors');
};

export const createAuthor = async (formData: FormData): Promise<any> => {
    // Add logic flag for N8N to know this is an author creation
    formData.append('action', 'create_author');
    formData.append('source', 'admin_panel');

    // Send to N8N
    return sendToN8n(formData);
};

export const updateAuthor = async (id: number, formData: FormData): Promise<any> => {
    formData.append('action', 'update_author');
    formData.append('author_id', id.toString());
    formData.append('source', 'admin_panel');

    // Send to N8N
    return sendToN8n(formData);
};
