import { ChatLog } from '../types/database';
import { safeApiCall } from '../lib/api';
import { CONFIG } from '../constants';

export interface ChatSessionPreview {
    session_id: string;
    last_message_at: string;
    message_count: number;
    preview: string;
}

export const fetchChatSessions = async (): Promise<ChatSessionPreview[]> => {
    return safeApiCall(async () => {
        // Fetch from N8N Webhook
        const response = await fetch(CONFIG.N8N_CHAT_HISTORY_URL + '?type=sessions', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
            }
        });

        if (!response.ok) {
            console.warn("Chat Sessions Fetch failed");
            return [];
        }

        const data = await response.json();
        return (data.sessions || []) as ChatSessionPreview[];
    }, 'fetchChatSessions');
};

export const fetchChatLogsBySession = async (sessionId: string): Promise<ChatLog[]> => {
    return safeApiCall(async () => {
        const url = new URL(CONFIG.N8N_CHAT_HISTORY_URL);
        url.searchParams.append('type', 'logs');
        url.searchParams.append('sessionId', sessionId);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        return (data.logs || []) as ChatLog[];
    }, 'fetchChatLogsBySession');
};

export const fetchChatLogsByDateRange = async (dateFrom: string, dateTo: string): Promise<ChatLog[]> => {
    return safeApiCall(async () => {
        const url = new URL(CONFIG.N8N_CHAT_HISTORY_URL);
        url.searchParams.append('type', 'logs');
        url.searchParams.append('from', dateFrom);
        url.searchParams.append('to', dateTo);

        const response = await fetch(url.toString(), {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
            }
        });

        if (!response.ok) return [];

        const data = await response.json();
        return (data.logs || []) as ChatLog[];
    }, 'fetchChatLogsByDateRange');
};
