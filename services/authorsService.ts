import { Author } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';
import { sendToN8n, deleteItem } from '../lib/n8n';

export const fetchAuthors = async (): Promise<Author[]> => {
    return safeApiCall(async () => {
        // In production, fetch from DB
        // For now we assume the table 'authors' exists
        const result = await sql`SELECT * FROM authors ORDER BY id DESC`;
        return result as Author[];
    }, 'fetchAuthors');
};

export const createAuthor = async (data: object): Promise<any> => {
    const payload = {
        ...data,
        action: 'create_author',
        source: 'admin_panel'
    };
    return sendToN8n(payload);
};

export const deleteAuthor = async (id: number): Promise<any> => {
    return deleteItem('author', id);
};

export const updateAuthor = async (id: number, data: object): Promise<any> => {
    const payload = {
        ...data,
        action: 'update_author',
        author_id: id,
        source: 'admin_panel'
    };
    return sendToN8n(payload);
};
