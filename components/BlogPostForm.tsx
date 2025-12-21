import React, { useState, useEffect } from 'react';
import { Save, X, Send, Loader2 } from 'lucide-react';
import { publishBlogPost, PublishPostPayload } from '../lib/n8n';
import { updateBlogPost, createLocalBlogPost } from '../services/blogService';
import { BlogPost } from '../types/database';

interface BlogPostFormProps {
  initialData?: BlogPost; // If present, we are in EDIT mode
  onCancel: () => void;
  onSuccess: () => void;
}

export const BlogPostForm: React.FC<BlogPostFormProps> = ({ initialData, onCancel, onSuccess }) => {
  const isEditMode = !!initialData;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<PublishPostPayload>({
    title: '',
    slug: '',
    content: '',
    status: 'draft',
    category: 'General',
    tags: [],
    author_id: 1, // Default Admin ID
    seo_title: '',
    seo_description: ''
  });

  const [rawTags, setRawTags] = useState('');

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title,
        slug: initialData.slug,
        content: initialData.content,
        status: initialData.status,
        category: initialData.category,
        tags: initialData.tags,
        author_id: initialData.author_id,
        seo_title: initialData.seo_title || '',
        seo_description: initialData.seo_description || ''
      });
      setRawTags(initialData.tags?.join(', ') || '');
    }
  }, [initialData]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => {
      const updates: any = { [name]: value };
      
      // Auto-generate slug from title ONLY if creating new post and slug is untouched
      if (!isEditMode && name === 'title' && (!prev.slug || prev.slug === prev.title.toLowerCase().replace(/[^a-z0-9]+/g, '-'))) {
        updates.slug = value.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
      }
      
      return { ...prev, ...updates };
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      // Process tags
      const processedTags = rawTags.split(',').map(t => t.trim()).filter(Boolean);
      const payload = { ...formData, tags: processedTags };

      if (isEditMode && initialData) {
        // UPDATE MODE: Simulate PATCH request to DB
        // We cast payload to any because PublishPostPayload.status is string, but updateBlogPost expects specific union type.
        // The form select ensures validity.
        await updateBlogPost(initialData.id, payload as unknown as Partial<BlogPost>);
      } else {
        // CREATE MODE: Send to N8N
        const n8nResult = await publishBlogPost(payload);
        
        // If N8N success, we also create it locally to update the UI immediately
        if (n8nResult.success) {
           createLocalBlogPost(payload as unknown as Partial<BlogPost>);
        }
      }

      onSuccess();
    } catch (err: any) {
      setError(err.message || 'Failed to save post');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden animate-fade-in-up">
      <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
        <h3 className="font-semibold text-gray-900">
          {isEditMode ? `Edit Post: ${initialData.title}` : 'New Blog Post'}
        </h3>
        <button onClick={onCancel} className="text-gray-500 hover:text-gray-700">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleSubmit} className="p-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Main Content */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              name="title"
              required
              value={formData.title}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all"
              placeholder="Enter post title..."
            />
          </div>

          {/* Slug */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Slug (URL)</label>
            <div className="flex rounded-md shadow-sm">
              <span className="inline-flex items-center px-3 rounded-l-md border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm">
                /blog/
              </span>
              <input
                type="text"
                name="slug"
                value={formData.slug}
                onChange={handleInputChange}
                className="flex-1 min-w-0 block w-full px-4 py-2 rounded-none rounded-r-md border border-gray-300 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
            <textarea
              name="content"
              required
              rows={12}
              value={formData.content}
              onChange={handleInputChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none font-mono text-sm"
              placeholder="Write your content here (Markdown supported)..."
            />
          </div>

          {/* SEO Section */}
          <div className="pt-4 border-t border-gray-100">
            <h4 className="text-sm font-semibold text-gray-900 mb-4">SEO Configuration</h4>
            <div className="grid grid-cols-1 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">SEO Title</label>
                <input
                  type="text"
                  name="seo_title"
                  value={formData.seo_title}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Meta title (optional)"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-500 uppercase mb-1">SEO Description</label>
                <textarea
                  name="seo_description"
                  rows={3}
                  value={formData.seo_description}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                  placeholder="Meta description (optional)"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Metadata */}
        <div className="space-y-6">
          
          {/* Publish Actions */}
          <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h4 className="text-sm font-medium text-gray-900 mb-3">Publishing</h4>
            <div className="space-y-3">
              <select
                name="status"
                value={formData.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
              
              <button
                type="submit"
                disabled={isLoading}
                className={`w-full flex items-center justify-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                  isEditMode 
                    ? 'bg-emerald-600 hover:bg-emerald-700' 
                    : 'bg-blue-600 hover:bg-blue-700'
                }`}
              >
                {isLoading ? <Loader2 className="animate-spin" size={18} /> : (isEditMode ? <Save size={18} /> : <Send size={18} />)}
                <span>
                  {isLoading ? 'Processing...' : (isEditMode ? 'Update Post' : 'Publish via N8N')}
                </span>
              </button>
            </div>
          </div>

          {/* Taxonomy */}
          <div className="p-4 border border-gray-200 rounded-lg">
             <h4 className="text-sm font-medium text-gray-900 mb-3">Organization</h4>
             <div className="space-y-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Category</label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 bg-white border border-gray-300 rounded-md text-sm"
                  >
                    <option value="General">General</option>
                    <option value="Revenue">Revenue Management</option>
                    <option value="Marketing">Hotel Marketing</option>
                    <option value="Operations">Operations</option>
                    <option value="Tech">Technology</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Tags (comma separated)</label>
                  <input
                    type="text"
                    value={rawTags}
                    onChange={(e) => setRawTags(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    placeholder="finance, growth, summer..."
                  />
                </div>
             </div>
          </div>

          {/* Author */}
          <div className="p-4 border border-gray-200 rounded-lg">
             <h4 className="text-sm font-medium text-gray-900 mb-3">Attribution</h4>
             <div>
                <label className="block text-xs text-gray-500 mb-1">Author ID</label>
                <input
                  type="number"
                  name="author_id"
                  value={formData.author_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-gray-50"
                  readOnly
                />
             </div>
          </div>

          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg">
              {error}
            </div>
          )}

        </div>
      </form>
    </div>
  );
};