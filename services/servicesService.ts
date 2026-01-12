import { Service } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';

// "Services" here refers to AI Knowledge Base entries.
// Direct Neon DB operations (no N8N webhook for services)

export const fetchServices = async (): Promise<Service[]> => {
    return safeApiCall(async () => {
        try {
            const result = await sql`
                SELECT * FROM services
                ORDER BY updated_at DESC
            `;
            return result as Service[];
        } catch (e) {
            console.warn("Fetch services failed", e);
            return [];
        }
    }, 'fetchServices');
};

export const createService = async (data: Partial<Service>): Promise<Service> => {
    return safeApiCall(async () => {
        const result = await sql`
            INSERT INTO services (title, price, description, active, updated_at)
            VALUES (
                ${data.title || ''},
                ${data.price || ''},
                ${data.description || ''},
                ${data.active !== false},
                NOW()
            )
            RETURNING *
        `;

        if (result.length === 0) {
            throw new Error('Failed to create service');
        }

        return result[0] as Service;
    }, 'createService');
};

export const updateService = async (id: number, data: Partial<Service>): Promise<Service> => {
    return safeApiCall(async () => {
        const result = await sql`
            UPDATE services
            SET
                title = COALESCE(${data.title}, title),
                price = COALESCE(${data.price}, price),
                description = COALESCE(${data.description}, description),
                active = COALESCE(${data.active}, active),
                updated_at = NOW()
            WHERE id = ${id}
            RETURNING *
        `;

        if (result.length === 0) {
            throw new Error('Service not found');
        }

        return result[0] as Service;
    }, 'updateService');
};

export const deleteService = async (id: number): Promise<void> => {
    return safeApiCall(async () => {
        await sql`DELETE FROM services WHERE id = ${id}`;
    }, 'deleteService');
};
