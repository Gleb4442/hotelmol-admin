import { ChatLog } from '../types/database';
import { safeApiCall } from '../lib/api';
import { sql } from '../lib/db';

export interface ChatSessionPreview {
    session_id: string;
    last_message_at: string;
    message_count: number;
    preview: string;
}

export const fetchChatSessions = async (): Promise<ChatSessionPreview[]> => {
    return safeApiCall(async () => {
        // Group by session_id to get a list of conversations
        const rows = await sql`
      SELECT 
        session_id,
        MAX(created_at) as last_message_at,
        COUNT(*) as message_count,
        (ARRAY_AGG(user_message ORDER BY created_at DESC))[1] as preview
      FROM chat_logs
      GROUP BY session_id
      ORDER BY last_message_at DESC
    `;
        return rows as ChatSessionPreview[];
    }, 'fetchChatSessions');
};

export const fetchChatLogsBySession = async (sessionId: string): Promise<ChatLog[]> => {
    return safeApiCall(async () => {
        const rows = await sql`
      SELECT * FROM chat_logs
      WHERE session_id = ${sessionId}
      ORDER BY created_at ASC
    `;
        return rows as ChatLog[];
    }, 'fetchChatLogsBySession');
};

export const fetchChatLogsByDateRange = async (dateFrom: string, dateTo: string): Promise<ChatLog[]> => {
    return safeApiCall(async () => {
        // Basic filter implementation
        const rows = await sql`
      SELECT * FROM chat_logs
      WHERE created_at >= ${dateFrom} AND created_at <= ${dateTo}
      ORDER BY created_at DESC
      LIMIT 100
     `;
        return rows as ChatLog[];
    }, 'fetchChatLogsByDateRange');
};
