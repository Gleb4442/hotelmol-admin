import React, { useState, useEffect } from 'react';
import { Save, X, Send, Loader2 } from 'lucide-react';
import { publishBlogPost, PublishPostPayload } from '../lib/n8n';
import { updateBlogPost, createLocalBlogPost } from '../services/blogService';
import { fetchAuthors } from '../services/authorsService';
import { BlogPost, Author } from '../types/database';

interface BlogPostFormProps {
  initialData?: BlogPost; // If present, we are in EDIT mode
  onCancel: () => void;
  onSuccess: () => void;
}

export const BlogPostForm: React.FC<BlogPostFormProps> = ({ initialData, onCancel, onSuccess }) => {
  const isEditMode = !!initialData;
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // State for active tab
  const [activeTab, setActiveTab] = useState<'ua' | 'ru' | 'en' | 'pl'>('ua');

  const [formData, setFormData] = useState<PublishPostPayload>({
    title: '',
    slug: '',
    content: '',
    // Переводы контента
    title_ru: '',
    content_ru: '',
    title_en: '',
    content_en: '',
    title_pl: '',
    content_pl: '',
    // SEO метаданные
    seo_title: '',
    seo_description: '',
    seo_title_ru: '',
    seo_description_ru: '',
    seo_title_en: '',
    seo_description_en: '',
    seo_title_pl: '',
    seo_description_pl: '',
    // Остальные поля
    status: 'draft',
    category: 'General',
    tags: [],
    author_id: 1, // Default Admin ID
    featured_image: ''
  });

  const [rawTags, setRawTags] = useState('');
  const [authors, setAuthors] = useState<Author[]>([]);

  useEffect(() => {
    fetchAuthors().then(data => setAuthors(data)).catch(console.error);
  }, []);

  // Load initial data if editing
  useEffect(() => {
    if (initialData) {
      setFormData({
        title: initialData.title || '',
        slug: initialData.slug || '',
        content: initialData.content || '',
        // Переводы контента
        title_ru: initialData.title_ru || '',
        content_ru: initialData.content_ru || '',
        title_en: initialData.title_en || '',
        content_en: initialData.content_en || '',
        title_pl: initialData.title_pl || '',
        content_pl: initialData.content_pl || '',
        // SEO метаданные
        seo_title: initialData.seo_title || '',
        seo_description: initialData.seo_description || '',
        seo_title_ru: initialData.seo_title_ru || '',
        seo_description_ru: initialData.seo_description_ru || '',
        seo_title_en: initialData.seo_title_en || '',
        seo_description_en: initialData.seo_description_en || '',
        seo_title_pl: initialData.seo_title_pl || '',
        seo_description_pl: initialData.seo_description_pl || '',
        // Остальные поля
        status: initialData.status || 'draft',
        category: initialData.category || '',
        tags: initialData.tags || [],
        author_id: initialData.author_id,
        featured_image: initialData.featured_image || '',
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

          {/* Табы для языков */}
          <div className="col-span-2">
            {/* Навигация табов */}
            <div className="border-b border-gray-200 mb-6">
              <div className="flex gap-1">
                {[
                  { key: 'ua', label: '🇺🇦 Українська', required: true },
                  { key: 'ru', label: '🇷🇺 Русский' },
                  { key: 'en', label: '🇺🇸 English' },
                  { key: 'pl', label: '🇵🇱 Polski' }
                ].map(tab => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setActiveTab(tab.key as any)}
                    className={`px-4 py-2 font-medium transition-colors ${activeTab === tab.key
                      ? 'text-blue-600 border-b-2 border-blue-600'
                      : 'text-gray-600 hover:text-gray-900'
                      }`}
                  >
                    {tab.label} {tab.required && '*'}
                  </button>
                ))}
              </div>
            </div>

            {/* УКРАИНСКАЯ ВКЛАДКА (Основная) */}
            {activeTab === 'ua' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Заголовок <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Зміст <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    rows={12}
                    required
                  />
                </div>
                {/* SEO для украинского */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold mb-4">SEO Configuration (UA)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Title
                        <span className="text-gray-500 text-xs ml-2">Макс 60 символів</span>
                      </label>
                      <input
                        type="text"
                        value={formData.seo_title}
                        onChange={(e) => setFormData({ ...formData, seo_title: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        maxLength={60}
                        placeholder="Залиште порожнім для автогенерації"

                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Description
                        <span className="text-gray-500 text-xs ml-2">Макс 160 символів</span>
                      </label>
                      <textarea
                        value={formData.seo_description}
                        onChange={(e) => setFormData({ ...formData, seo_description: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        maxLength={160}
                        placeholder="Короткий опис для пошукових систем"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* РУССКАЯ ВКЛАДКА */}
            {activeTab === 'ru' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Заголовок (Русский)
                  </label>
                  <input
                    type="text"
                    value={formData.title_ru}
                    onChange={(e) => setFormData({ ...formData, title_ru: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="Оставьте пустым, если нет перевода"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Содержание (Русский)
                  </label>
                  <textarea
                    value={formData.content_ru}
                    onChange={(e) => setFormData({ ...formData, content_ru: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    rows={12}
                    placeholder="Оставьте пустым, если нет перевода"
                  />
                </div>
                {/* SEO для русского */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold mb-4">SEO Configuration (RU)</h3>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Title
                        <span className="text-gray-500 text-xs ml-2">Макс 60 символов</span>
                      </label>
                      <input
                        type="text"
                        value={formData.seo_title_ru}
                        onChange={(e) => setFormData({ ...formData, seo_title_ru: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        maxLength={60}
                        placeholder="Оставьте пустым для автогенерации"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Description
                        <span className="text-gray-500 text-xs ml-2">Макс 160 символов</span>
                      </label>
                      <textarea
                        value={formData.seo_description_ru}
                        onChange={(e) => setFormData({ ...formData, seo_description_ru: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        maxLength={160}
                        placeholder="Краткое описание для поисковиков"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* АНГЛИЙСКАЯ ВКЛАДКА */}
            {activeTab === 'en' && (
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Title (English)
                  </label>
                  <input
                    type="text"
                    value={formData.title_en}
                    onChange={(e) => setFormData({ ...formData, title_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="Leave empty if no translation"
                  />
                </div>
                <div>

                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Content (English)
                  </label>
                  <textarea
                    value={formData.content_en}
                    onChange={(e) => setFormData({ ...formData, content_en: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    rows={12}
                    placeholder="Leave empty if no translation"
                  />
                </div>
                {/* SEO для английского */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold mb-4">SEO Configuration (EN)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Title
                        <span className="text-gray-500 text-xs ml-2">Max 60 chars</span>
                      </label>
                      <input
                        type="text"
                        value={formData.seo_title_en}
                        onChange={(e) => setFormData({ ...formData, seo_title_en: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        maxLength={60}
                        placeholder="Leave empty for auto-generation"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Description
                        <span className="text-gray-500 text-xs ml-2">Max 160 chars</span>
                      </label>
                      <textarea
                        value={formData.seo_description_en}
                        onChange={(e) => setFormData({ ...formData, seo_description_en: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        maxLength={160}
                        placeholder="Short description for search engines"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ПОЛЬСКАЯ ВКЛАДКА */}
            {activeTab === 'pl' && (

              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tytuł (Polski)
                  </label>
                  <input
                    type="text"
                    value={formData.title_pl}
                    onChange={(e) => setFormData({ ...formData, title_pl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    placeholder="Pozostaw puste, jeśli nie ma tłumaczenia"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Treść (Polski)
                  </label>
                  <textarea
                    value={formData.content_pl}
                    onChange={(e) => setFormData({ ...formData, content_pl: e.target.value })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-md"
                    rows={12}
                    placeholder="Pozostaw puste, jeśli nie ma tłumaczenia"
                  />
                </div>
                {/* SEO для польского */}
                <div className="border-t border-gray-200 pt-6">
                  <h3 className="text-lg font-semibold mb-4">SEO Configuration (PL)</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Tytuł
                        <span className="text-gray-500 text-xs ml-2">Maks 60 znaków</span>
                      </label>
                      <input
                        type="text"
                        value={formData.seo_title_pl}
                        onChange={(e) => setFormData({ ...formData, seo_title_pl: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        maxLength={60}
                        placeholder="Pozostaw puste dla automatycznego generowania"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        SEO Opis
                        <span className="text-gray-500 text-xs ml-2">Maks 160 znaków</span>
                      </label>
                      <textarea
                        value={formData.seo_description_pl}
                        onChange={(e) => setFormData({ ...formData, seo_description_pl: e.target.value })}
                        className="w-full px-4 py-2 border border-gray-300 rounded-md"
                        rows={3}
                        maxLength={160}
                        placeholder="Krótki opis dla wyszukiwarek"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
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
                className={`w-full flex items-center justify-center space-x-2 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${isEditMode
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
              <label className="block text-xs text-gray-500 mb-1">Author</label>
              <select
                name="author_id"
                value={formData.author_id || 0}
                onChange={(e) => setFormData({ ...formData, author_id: Number(e.target.value) })}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm bg-white"
              >
                <option value={0}>Editorial Team (Default)</option>
                {authors.map(author => (
                  <option key={author.id} value={author.id}>{author.full_name}</option>
                ))}
              </select>
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