import { safeApiCall } from '../lib/api';
import { CONFIG } from '../constants';
import { Logger } from '../lib/logger';

export interface IngestPayload {
    text: string; // The text content to ingest
    metadata?: Record<string, any>; // service_id, source, etc.
}

export interface ChatMessagePayload {
    message: string;
    sessionId: string;
}

export const ingestKnowledge = async (data: IngestPayload): Promise<boolean> => {
    return safeApiCall(async () => {
        const response = await fetch(CONFIG.N8N_INGEST_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
            },
            body: JSON.stringify(data)
        });

        if (!response.ok) {
            throw new Error(`Ingest failed: ${response.statusText}`);
        }

        return true;
    }, 'ingestKnowledge');
};

export const sendChatMessage = async (data: ChatMessagePayload): Promise<any> => {
    return safeApiCall(async () => {
        // Spec: POST /webhook/chat
        // Query Params? Body? Spec implies Body.
        const response = await fetch(CONFIG.N8N_CHAT_URL, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${CONFIG.N8N_WEBHOOK_SECRET}`
            },
            body: JSON.stringify({
                message: data.message,
                sessionId: data.sessionId,
                // Spec 2.2: "Input: { message, sessionId, ... }"
            })
        });

        if (!response.ok) {
            throw new Error(`Chat failed: ${response.statusText}`);
        }

        return await response.json();
        // Expected response: { "response": "AI answer..." }
    }, 'sendChatMessage');
};
