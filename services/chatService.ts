import { ChatLog } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';

export interface ChatSessionPreview {
    session_id: string;
    last_message_at: string;
    message_count: number;
    preview: string;
}

// Direct Neon DB queries (no N8N webhook for chat-history)
export const fetchChatSessions = async (): Promise<ChatSessionPreview[]> => {
    return safeApiCall(async () => {
        try {
            const result = await sql`
                SELECT
                    session_id,
                    MAX(created_at) as last_message_at,
                    COUNT(*) as message_count,
                    (SELECT user_message FROM chat_logs c2
                     WHERE c2.session_id = chat_logs.session_id
                     ORDER BY created_at DESC LIMIT 1) as preview
                FROM chat_logs
                GROUP BY session_id
                ORDER BY last_message_at DESC
                LIMIT 50
            `;

            return result.map((r: any) => ({
                session_id: r.session_id,
                last_message_at: r.last_message_at,
                message_count: Number(r.message_count),
                preview: r.preview?.substring(0, 50) || ''
            }));
        } catch (e) {
            console.warn("Chat Sessions Fetch failed", e);
            return [];
        }
    }, 'fetchChatSessions');
};

export const fetchChatLogsBySession = async (sessionId: string): Promise<ChatLog[]> => {
    return safeApiCall(async () => {
        try {
            const result = await sql`
                SELECT * FROM chat_logs
                WHERE session_id = ${sessionId}
                ORDER BY created_at ASC
            `;
            return result as ChatLog[];
        } catch (e) {
            console.warn("Chat Logs by Session failed", e);
            return [];
        }
    }, 'fetchChatLogsBySession');
};

export const fetchChatLogsByDateRange = async (dateFrom: string, dateTo: string): Promise<ChatLog[]> => {
    return safeApiCall(async () => {
        try {
            const result = await sql`
                SELECT * FROM chat_logs
                WHERE created_at >= ${dateFrom}::timestamp
                  AND created_at <= ${dateTo}::timestamp
                ORDER BY created_at DESC
                LIMIT 100
            `;
            return result as ChatLog[];
        } catch (e) {
            console.warn("Chat Logs by Date failed", e);
            return [];
        }
    }, 'fetchChatLogsByDateRange');
};
