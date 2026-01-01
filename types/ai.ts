
export interface Service {
    id: number;
    title: string;
    price: string;
    description: string;
    created_at?: string;
}

export interface ChatLog {
    id: number;
    session_id: string;
    user_message: string;
    ai_response: string;
    created_at: string;
}

export interface ChatSession {
    session_id: string;
    last_message_at: string;
    message_count: number;
    preview: string;
}
