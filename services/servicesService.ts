import { Service } from '../types/database';
import { safeApiCall } from '../lib/api';
import { CONFIG } from '../constants';
import { Logger } from '../lib/logger';

// "Services" here refers to AI Knowledge Base entries (Services offered by hotel).
// Operations must go through N8N.

export const fetchServices = async (): Promise<Service[]> => {
    return safeApiCall(async () => {
        const response = await fetch(CONFIG.N8N_SERVICES_URL, {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json'
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
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'create',
                service: { ...data, category: (data as any).category }
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Server error ${response.status}: ${text.substring(0, 100)}`);
        }

        const json = await response.json();
        return (json.service || data) as Service;
    }, 'createService');
};

export const updateService = async (id: number, data: Partial<Service>): Promise<Service> => {
    return safeApiCall(async () => {
        const response = await fetch(CONFIG.N8N_SERVICES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                action: 'update',
                service: { ...data, id, category: (data as any).category }
            })
        });

        if (!response.ok) {
            const text = await response.text();
            throw new Error(`Server error ${response.status}: ${text.substring(0, 100)}`);
        }

        const json = await response.json();
        return (json.service || { ...data, id }) as Service;
    }, 'updateService');
};

export const deleteService = async (id: number): Promise<void> => {
    return safeApiCall(async () => {
        // Services have their own endpoint for deletion
        const response = await fetch(CONFIG.N8N_SERVICES_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ action: 'delete', id })
        });

        if (!response.ok) {
            throw new Error(`Failed to delete service: ${response.status}`);
        }
    }, 'deleteService');
};
