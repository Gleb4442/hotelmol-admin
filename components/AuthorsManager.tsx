import React, { useState, useEffect } from 'react';
import { Plus, Edit2, User, Loader2, Save, X, Mail, Trash2 } from 'lucide-react';
import { Author } from '../types/database';
import { fetchAuthors, createAuthor, updateAuthor, deleteAuthor, AuthorInput } from '../services/authorsService';
import { fileToBase64 } from '../lib/n8n';

// Email validation regex
const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
};

export const AuthorsManager: React.FC = () => {
    const [authors, setAuthors] = useState<Author[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [view, setView] = useState<'list' | 'form'>('list');
    const [editingAuthor, setEditingAuthor] = useState<Author | null>(null);

    // Form State - updated to include email (required per spec)
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        bio: ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        loadAuthors();
    }, []);

    const loadAuthors = async () => {
        setIsLoading(true);
        try {
            const data = await fetchAuthors();
            setAuthors(data);
        } catch (e) {
            console.error('Failed to load authors', e);
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateClick = () => {
        setEditingAuthor(null);
        setFormData({ name: '', email: '', bio: '' });
        setSelectedFile(null);
        setPreviewUrl(null);
        setError(null);
        setView('form');
    };

    const handleEditClick = (author: Author) => {
        setEditingAuthor(author);
        setFormData({
            name: author.name,
            email: author.email || '',
            bio: author.bio || ''
        });
        setSelectedFile(null);
        setPreviewUrl(author.avatar_url || null);
        setError(null);
        setView('form');
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const file = e.target.files[0];
            setSelectedFile(file);
            setPreviewUrl(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        // Validate email
        if (!formData.email || !validateEmail(formData.email)) {
            setError('Please enter a valid email address');
            setIsSubmitting(false);
            return;
        }

        try {
            const authorData: AuthorInput = {
                name: formData.name,
                email: formData.email,
                bio: formData.bio || undefined
            };

            if (selectedFile) {
                const dataUrl = await fileToBase64(selectedFile);
                authorData.avatar_url = dataUrl;
            } else if (editingAuthor?.avatar_url) {
                authorData.avatar_url = editingAuthor.avatar_url;
            }

            if (editingAuthor) {
                await updateAuthor(editingAuthor.id, authorData);
            } else {
                await createAuthor(authorData);
            }

            setView('list');
            loadAuthors(); // Reload to get updated data
        } catch (err: any) {
            setError(err.message || 'Failed to save author');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (id: number) => {
        if (window.confirm('Are you sure you want to delete this author? This action is irreversible.')) {
            try {
                await deleteAuthor(id);
                loadAuthors(); // Refresh the list
            } catch (err: any) {
                setError(err.message || 'Failed to delete author');
            }
        }
    };

    if (view === 'form') {
        return (
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm animate-fade-in-up max-w-2xl mx-auto">
                <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
                    <h3 className="font-semibold text-gray-900">
                        {editingAuthor ? 'Edit Author' : 'Add New Author'}
                    </h3>
                    <button onClick={() => setView('list')} className="text-gray-500 hover:text-gray-700">
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="p-6 space-y-6">
                    {/* Photo Upload */}
                    <div className="flex flex-col items-center justify-center mb-6">
                        <div className="w-32 h-32 rounded-full overflow-hidden bg-gray-100 border-2 border-dashed border-gray-300 relative group">
                            {previewUrl ? (
                                <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                    <User size={48} />
                                </div>
                            )}
                            <label className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                                <span className="text-xs font-medium">Change Photo</span>
                                <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                            </label>
                        </div>
                        <p className="text-xs text-gray-500 mt-2">Recommended: 400x400px (Face focus)</p>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                        <input
                            type="text"
                            required
                            value={formData.name}
                            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="e.g. Sarah Johnson"
                        />
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-2.5 text-gray-400" size={16} />
                            <input
                                type="email"
                                required
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                                onBlur={(e) => {
                                    if (e.target.value && !validateEmail(e.target.value)) {
                                        setError('Invalid email format');
                                    } else {
                                        setError(null);
                                    }
                                }}
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                                placeholder="e.g. author@example.com"
                            />
                        </div>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                        <textarea
                            rows={4}
                            value={formData.bio}
                            onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                            placeholder="Short biography (optional)..."
                        />
                    </div>

                    {error && (
                        <div className="p-3 bg-red-50 text-red-700 text-sm rounded-lg border border-red-200">
                            {error}
                        </div>
                    )}

                    <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
                        <button
                            type="button"
                            onClick={() => setView('list')}
                            className="px-4 py-2 text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2 transition-colors"
                        >
                            {isSubmitting ? <Loader2 className="animate-spin" size={18} /> : <Save size={18} />}
                            {editingAuthor ? 'Update Author' : 'Create Author'}
                        </button>
                    </div>
                </form>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-xl border border-gray-200 shadow-sm flex flex-col h-full animate-fade-in">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-semibold text-gray-900">Authors Directory</h3>
                <button
                    onClick={handleCreateClick}
                    className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
                >
                    <Plus size={16} />
                    <span>Add Author</span>
                </button>
            </div>

            <div className="flex-1 overflow-auto p-0">
                {isLoading ? (
                    <div className="flex justify-center items-center h-64 text-gray-400">
                        <Loader2 className="animate-spin" size={32} />
                    </div>
                ) : authors.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-64 text-gray-400">
                        <User size={48} className="mb-2 opacity-20" />
                        <p>No authors found. Create one above.</p>
                    </div>
                ) : (
                    <table className="w-full text-left text-sm">
                        <thead className="bg-gray-50 text-gray-700 font-medium sticky top-0 z-10 shadow-sm border-b border-gray-200">
                            <tr>
                                <th className="px-6 py-3 w-16">Avatar</th>
                                <th className="px-6 py-3">Name</th>
                                <th className="px-6 py-3">Email</th>
                                <th className="px-6 py-3">Bio</th>
                                <th className="px-6 py-3 text-right">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {authors.map((author) => (
                                <tr key={author.id} className="hover:bg-gray-50 transition-colors group">
                                    <td className="px-6 py-3">
                                        <div className="w-10 h-10 rounded-full bg-gray-200 overflow-hidden border border-gray-200">
                                            {author.avatar_url ? (
                                                <img src={author.avatar_url} alt={author.name} className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="w-full h-full flex items-center justify-center text-gray-400">
                                                    <User size={20} />
                                                </div>
                                            )}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 font-medium text-gray-900">{author.name}</td>
                                    <td className="px-6 py-3 text-gray-500">
                                        <div className="flex items-center gap-1.5">
                                            <Mail size={14} />
                                            {author.email}
                                        </div>
                                    </td>
                                    <td className="px-6 py-3 text-gray-500 max-w-xs truncate" title={author.bio || ''}>
                                        {author.bio || '-'}
                                    </td>
                                    <td className="px-6 py-3 text-right">
                                        <div className="flex items-center justify-end">
                                            <button
                                                onClick={() => handleEditClick(author)}
                                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                                                title="Edit Author"
                                            >
                                                <Edit2 size={16} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(author.id)}
                                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                                title="Delete Author"
                                            >
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>
        </div>
    );
};
