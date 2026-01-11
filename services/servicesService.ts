import { Service } from '../types/database';
import { safeApiCall } from '../lib/api';
import { CONFIG } from '../constants';
import { Logger } from '../lib/logger';
import { sendDeleteItemN8N } from '../lib/n8n';

// "Services" here refers to AI Knowledge Base entries (Services offered by hotel).
// Operations must go through N8N.

export const fetchServices = async (): Promise<Service[]> => {
    return safeApiCall(async () => {
        const response = await fetch(CONFIG.N8N_SERVICES_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
            }
        });

        if (!response.ok) return [];
        const data = await response.json();
        return (data.services || data.items || []) as Service[];
    }, 'fetchServices');
};

export const createService = async (data: Partial<Service>): Promise<Service> => {
    return safeApiCall(async () => {
        const response = await fetch(CONFIG.N8N_SERVICES_URL, {
            method: 'POST', // or Use Ingest URL if strict separation? Reusing Services CRUD URL for consistency.
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
            },
            body: JSON.stringify({
                action: 'create',
                service: { ...data, category: (data as any).category }
            })
        });
        const json = await response.json();
        return (json.service || data) as Service;
    }, 'createService');
};

export const updateService = async (id: number, data: Partial<Service>): Promise<Service> => {
    return safeApiCall(async () => {
        const response = await fetch(CONFIG.N8N_SERVICES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
            },
            body: JSON.stringify({
                action: 'update',
                service: { ...data, id, category: (data as any).category }
            })
        });
        const json = await response.json();
        return (json.service || { ...data, id }) as Service;
    }, 'updateService');
};

export const deleteService = async (id: number): Promise<void> => {
    return safeApiCall(async () => {
        // Reuse Delete Item generic or Services specific?
        // Let's use Delete Item generic if N8N handles 'type: service'
        try {
            await sendDeleteItemN8N({ type: 'service', id });
        } catch (e) {
            // Fallback to services endpoint if generic fails
            await fetch(CONFIG.N8N_SERVICES_URL, {
                method: 'DELETE', // If supported, or POST with action delete
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}` },
                body: JSON.stringify({ action: 'delete', id })
            });
        }
    }, 'deleteService');
};
