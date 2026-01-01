import { Service } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';
import { CONFIG } from '../constants';
import { Logger } from '../lib/logger';

export const fetchServices = async (): Promise<Service[]> => {
    return safeApiCall(async () => {
        const rows = await sql`SELECT * FROM services ORDER BY updated_at DESC`;
        return rows as Service[];
    }, 'fetchServices');
};

export const createService = async (data: Partial<Service>): Promise<Service> => {
    return safeApiCall(async () => {
        const result = await sql`
      INSERT INTO services (title, price, description, updated_at)
      VALUES (${data.title}, ${data.price}, ${data.description}, NOW())
      RETURNING *
    `;
        const newService = result[0] as Service;

        // Sync to n8n
        await syncServiceToN8n(newService);

        return newService;
    }, 'createService');
};

export const updateService = async (id: number, data: Partial<Service>): Promise<Service> => {
    return safeApiCall(async () => {
        const result = await sql`
      UPDATE services
      SET title = ${data.title}, price = ${data.price}, description = ${data.description}, updated_at = NOW()
      WHERE id = ${id}
      RETURNING *
    `;
        const updatedService = result[0] as Service;

        // Sync to n8n
        await syncServiceToN8n(updatedService);

        return updatedService;
    }, 'updateService');
};

export const deleteService = async (id: number): Promise<void> => {
    return safeApiCall(async () => {
        await sql`DELETE FROM services WHERE id = ${id}`;
    }, 'deleteService');
};

const syncServiceToN8n = async (service: Service) => {
    const webhookUrl = 'https://n8n.myn8napp.online/webhook/update-ai-knowledge';

    try {
        // Note: In a real secure app, we'd do this via backend to hide the flow URL or auth
        await fetch(webhookUrl, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                service_id: service.id,
                title: service.title,
                price: service.price,
                description: service.description
            })
        });
        Logger.info(`Synced service ${service.id} to AI`);
    } catch (err) {
        Logger.error(`Failed to sync service ${service.id} to AI`, err);
        // We don't block the UI for this background task
    }
};
