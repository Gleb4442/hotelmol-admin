import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Calendar, User, UserCog, Clock, RefreshCw } from 'lucide-react';
import { ChatLog } from '../types/database';
import { fetchChatSessions, fetchChatLogsBySession, ChatSessionPreview } from '../services/chatService';

export const ChatHistory: React.FC = () => {
    const [sessions, setSessions] = useState<ChatSessionPreview[]>([]);
    const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
    const [chatLogs, setChatLogs] = useState<ChatLog[]>([]);
    const [isLoadingList, setIsLoadingList] = useState(true);
    const [isLoadingChat, setIsLoadingChat] = useState(false);

    const loadSessions = useCallback(async () => {
        setIsLoadingList(true);
        try {
            const data = await fetchChatSessions();
            setSessions(data);
            if (data.length > 0 && !selectedSessionId) {
                // Optionally select first session
                // setSelectedSessionId(data[0].session_id);
            }
        } catch (error) {
            console.error("Failed to load sessions", error);
        } finally {
            setIsLoadingList(false);
        }
    }, [selectedSessionId]);

    useEffect(() => {
        loadSessions();
    }, [loadSessions]);

    // Load Chat Logs when session is selected
    useEffect(() => {
        if (!selectedSessionId) {
            setChatLogs([]);
            return;
        }

        const fetchLogs = async () => {
            setIsLoadingChat(true);
            try {
                const logs = await fetchChatLogsBySession(selectedSessionId);
                setChatLogs(logs);
            } catch (error) {
                console.error("Failed to load logs", error);
            } finally {
                setIsLoadingChat(false);
            }
        };

        fetchLogs();
    }, [selectedSessionId]);

    return (
        <div className="flex h-[calc(100vh-140px)] bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
            {/* Sidebar: Session List */}
            <div className="w-80 border-r border-gray-200 flex flex-col bg-gray-50">
                <div className="p-4 border-b border-gray-200 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">Conversations</h3>
                    <button
                        onClick={loadSessions}
                        className="text-gray-500 hover:text-blue-600"
                        title="Refresh"
                    >
                        <RefreshCw size={16} />
                    </button>
                </div>
                <div className="overflow-y-auto flex-1">
                    {isLoadingList ? (
                        <div className="p-8 text-center text-gray-400">Loading...</div>
                    ) : (
                        <div className="divide-y divide-gray-100">
                            {sessions.map(session => (
                                <button
                                    key={session.session_id}
                                    onClick={() => setSelectedSessionId(session.session_id)}
                                    className={`w-full text-left p-4 hover:bg-white transition-colors group ${selectedSessionId === session.session_id ? 'bg-white border-l-4 border-blue-600 shadow-sm' : 'border-l-4 border-transparent'
                                        }`}
                                >
                                    <div className="flex justify-between items-start mb-1">
                                        <span className="font-mono text-xs text-gray-500 truncate w-24" title={session.session_id}>
                                            {session.session_id.substring(0, 8)}...
                                        </span>
                                        <span className="text-[10px] text-gray-400 flex items-center gap-1">
                                            <Clock size={10} />
                                            {new Date(session.last_message_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                        </span>
                                    </div>
                                    <p className="text-sm font-medium text-gray-900 truncate mb-1">
                                        {session.preview || 'No messages'}
                                    </p>
                                    <div className="flex gap-2">
                                        <span className="text-xs text-blue-600 bg-blue-50 px-1.5 py-0.5 rounded">
                                            {session.message_count} msgs
                                        </span>
                                    </div>
                                </button>
                            ))}
                            {sessions.length === 0 && (
                                <div className="p-6 text-center text-gray-400 text-sm">
                                    No chat sessions recorded yet.
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>

            {/* Main Area: Chat Transcript */}
            <div className="flex-1 flex flex-col bg-white">
                {selectedSessionId ? (
                    <>
                        {/* Chat Header */}
                        <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-white z-10">
                            <div>
                                <h3 className="font-bold text-gray-900 flex items-center gap-2">
                                    <MessageSquare size={18} className="text-blue-600" />
                                    Session: {selectedSessionId}
                                </h3>
                                <p className="text-xs text-gray-500 mt-1">
                                    Viewing full conversation history
                                </p>
                            </div>
                        </div>

                        {/* Messages Area */}
                        <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-slate-50/50">
                            {isLoadingChat ? (
                                <div className="text-center py-10 text-gray-400">Loading transcript...</div>
                            ) : (
                                chatLogs.map(log => (
                                    <div key={log.id} className="space-y-4">
                                        {/* User Message */}
                                        <div className="flex gap-4 flex-row-reverse">
                                            <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0 text-indigo-700">
                                                <User size={16} />
                                            </div>
                                            <div className="flex flex-col items-end max-w-[80%]">
                                                <div className="bg-indigo-600 text-white px-4 py-3 rounded-2xl rounded-tr-sm text-sm shadow-sm">
                                                    {log.user_message}
                                                </div>
                                                <span className="text-[10px] text-gray-400 mt-1">
                                                    {new Date(log.created_at).toLocaleTimeString()}
                                                </span>
                                            </div>
                                        </div>

                                        {/* AI Response */}
                                        <div className="flex gap-4">
                                            <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0 text-green-700">
                                                <UserCog size={16} />
                                            </div>
                                            <div className="flex flex-col items-start max-w-[80%]">
                                                <div className="bg-white border border-gray-200 text-gray-800 px-4 py-3 rounded-2xl rounded-tl-sm text-sm shadow-sm whitespace-pre-wrap">
                                                    {log.ai_response}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-gray-300">
                        <MessageSquare size={64} className="mb-4 opacity-20" />
                        <p className="text-lg font-medium text-gray-400">Select a session to view details</p>
                    </div>
                )}
            </div>
        </div>
    );
};
