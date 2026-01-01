import React, { useState, useEffect, useCallback } from 'react';
import { Plus, Pencil, Trash2, X, Save, RefreshCw, Loader2 } from 'lucide-react';
import { Service } from '../types/database';
import { fetchServices, createService, updateService, deleteService } from '../services/servicesService';

export const ServicesManager: React.FC = () => {
    const [services, setServices] = useState<Service[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [currentService, setCurrentService] = useState<Partial<Service>>({});
    const [isSaving, setIsSaving] = useState(false);

    const loadServices = useCallback(async () => {
        setIsLoading(true);
        try {
            const data = await fetchServices();
            setServices(data);
        } catch (error) {
            console.error("Failed to load services", error);
        } finally {
            setIsLoading(false);
        }
    }, []);

    useEffect(() => {
        loadServices();
    }, [loadServices]);

    const handleEdit = (service: Service) => {
        setCurrentService(service);
        setIsEditing(true);
    };

    const handleCreate = () => {
        setCurrentService({
            title: '',
            price: '',
            description: ''
        });
        setIsEditing(true);
    };

    const handleDelete = async (id: number) => {
        if (!window.confirm('Are you sure you want to delete this service?')) return;
        try {
            await deleteService(id);
            loadServices();
        } catch (error) {
            console.error("Failed to delete", error);
        }
    };

    const handleSave = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSaving(true);
        try {
            if (currentService.id) {
                await updateService(currentService.id, currentService);
            } else {
                await createService(currentService);
            }
            setIsEditing(false);
            loadServices();
        } catch (error) {
            console.error("Failed to save", error);
            alert("Failed to save service. Check logs.");
        } finally {
            setIsSaving(false);
        }
    };

    return (
        <div className="flex flex-col h-[calc(100vh-140px)] gap-6">
            {/* Header / Toolbar */}
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-gray-900">Knowledge Base</h2>
                    <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">{services.length} items</span>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={loadServices}
                        className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
                        title="Refresh"
                    >
                        <RefreshCw size={18} />
                    </button>
                    <button
                        onClick={handleCreate}
                        className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2"
                    >
                        <Plus size={18} />
                        <span>Add Service</span>
                    </button>
                </div>
            </div>

            <div className="flex-1 bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden flex flex-col">
                {isLoading ? (
                    <div className="flex-1 flex items-center justify-center">
                        <Loader2 className="animate-spin text-blue-600" size={32} />
                    </div>
                ) : (
                    <div className="overflow-auto flex-1">
                        <table className="w-full text-left text-sm">
                            <thead className="bg-gray-50 text-gray-700 font-medium sticky top-0 z-10 border-b border-gray-200">
                                <tr>
                                    <th className="px-6 py-3 w-16">ID</th>
                                    <th className="px-6 py-3">Title</th>
                                    <th className="px-6 py-3 w-32">Price</th>
                                    <th className="px-6 py-3">Description</th>
                                    <th className="px-6 py-3 w-32 text-right">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100">
                                {services.map(service => (
                                    <tr key={service.id} className="hover:bg-gray-50 group">
                                        <td className="px-6 py-4 text-gray-500 font-mono text-xs">{service.id}</td>
                                        <td className="px-6 py-4 font-medium text-gray-900">{service.title}</td>
                                        <td className="px-6 py-4 text-gray-600">{service.price}</td>
                                        <td className="px-6 py-4 text-gray-500 truncate max-w-xs" title={service.description}>
                                            {service.description}
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => handleEdit(service)}
                                                    className="p-1.5 text-blue-600 hover:bg-blue-50 rounded"
                                                    title="Edit"
                                                >
                                                    <Pencil size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDelete(service.id)}
                                                    className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                                                    title="Delete"
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                                {services.length === 0 && (
                                    <tr>
                                        <td colSpan={5} className="text-center py-12 text-gray-400">
                                            No services found. Add one to train the AI.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Edit/Create Modal (Slide-over or centered) */}
            {isEditing && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm p-4">
                    <div className="bg-white rounded-xl shadow-xl w-full max-w-lg overflow-hidden animate-fade-in-up">
                        <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                            <h3 className="font-semibold text-gray-900">
                                {currentService.id ? 'Edit Service' : 'New Service'}
                            </h3>
                            <button onClick={() => setIsEditing(false)} className="text-gray-500 hover:text-gray-700">
                                <X size={20} />
                            </button>
                        </div>
                        <form onSubmit={handleSave} className="p-6 space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Service Title</label>
                                <input
                                    type="text"
                                    required
                                    value={currentService.title || ''}
                                    onChange={e => setCurrentService(p => ({ ...p, title: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. Standard Room Cleaning"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Price</label>
                                <input
                                    type="text"
                                    required
                                    value={currentService.price || ''}
                                    onChange={e => setCurrentService(p => ({ ...p, price: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder="e.g. $50 or 'Custom'"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Description (AI Knowledge)</label>
                                <textarea
                                    required
                                    value={currentService.description || ''}
                                    onChange={e => setCurrentService(p => ({ ...p, description: e.target.value }))}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 min-h-[120px]"
                                    placeholder="Detailed description of the service..."
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Updates will be sent to N8N webhook automatically.
                                </p>
                            </div>
                            <div className="flex justify-end gap-3 pt-2">
                                <button
                                    type="button"
                                    onClick={() => setIsEditing(false)}
                                    className="px-4 py-2 text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSaving}
                                    className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 flex items-center gap-2 disabled:opacity-50"
                                >
                                    {isSaving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} />}
                                    Save Service
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};
