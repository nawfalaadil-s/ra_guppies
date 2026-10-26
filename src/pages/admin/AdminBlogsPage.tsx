import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
  Plus, Search, Edit2, Trash2, 
  ExternalLink, X, Save,
  Upload 
} from 'lucide-react';
import { mockDb } from '../../lib/mockDatabase';
import { BlogPost, BlogCategory } from '../../lib/types';
import { formatDate } from '../../lib/utils';
import { useToast } from '../../contexts/ToastContext';
import { ConfirmDialog } from '../../components/common/ConfirmDialog';
import { MediaPickerModal, SelectedMedia } from '../../components/common/MediaPickerModal';

const BLOG_CATEGORIES: BlogCategory[] = [
  'Guppy Care & Water Quality',
  'Breeding & Genetics',
  'Feeding & Live Foods',
  'Aquatic Plants & Aquascaping',
  'Acclimation & Fish Health',
  'Aquarium Setup & Supplies',
];

export const AdminBlogsPage: React.FC = () => {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<BlogPost[]>(() => mockDb.getBlogPosts());

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
  const [deletePostTarget, setDeletePostTarget] = useState<BlogPost | null>(null);

  // Media Picker State
  const [isMediaPickerOpen, setIsMediaPickerOpen] = useState(false);
  const [mediaPickerTarget, setMediaPickerTarget] = useState<'featured-image' | 'content-media' | null>(null);
  const [mediaPickerType, setMediaPickerType] = useState<'all' | 'image' | 'video'>('all');

  // Form State
  const [title, setTitle] = useState('');
  const [slug, setSlug] = useState('');
  const [category, setCategory] = useState<BlogCategory>('Guppy Care & Water Quality');
  const [excerpt, setExcerpt] = useState('');
  const [contentHtml, setContentHtml] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [readTime, setReadTime] = useState(5);
  const [authorName, setAuthorName] = useState('Rishan K.C.');
  const [authorRole, setAuthorRole] = useState('Master Line Breeder & Founder');
  const [authorAvatar, setAuthorAvatar] = useState('/logo.jpeg');
  const [tagsString, setTagsString] = useState('Guppy Care, Water Chemistry');
  const [isPublished, setIsPublished] = useState(true);

  // Escape key handler
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (isMediaPickerOpen) setIsMediaPickerOpen(false);
        else if (deletePostTarget) setDeletePostTarget(null);
        else if (isModalOpen) setIsModalOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isMediaPickerOpen, deletePostTarget, isModalOpen]);

  const refreshPosts = () => {
    setPosts(mockDb.getBlogPosts());
  };

  const handleOpenAdd = () => {
    setEditingPost(null);
    setTitle('');
    setSlug('');
    setCategory('Guppy Care & Water Quality');
    setExcerpt('');
    setContentHtml('<h2>Introduction</h2>\n<p>Write your detailed guppy care article body here...</p>\n\n<h3>Key Care Steps</h3>\n<ul>\n  <li>Step 1: Check mineral hardness (GH 10-18 dGH) and temperature (24-27°C)</li>\n  <li>Step 2: Buffer with sponge bio-filtration and clean aerated water</li>\n</ul>');
    setImageUrl('https://images.unsplash.com/photo-1522069169874-c58ec4b76be5?auto=format&fit=crop&w=1200&q=80');
    setReadTime(5);
    setAuthorName('Rishan K.C.');
    setAuthorRole('Master Line Breeder & Founder');
    setAuthorAvatar('/logo.jpeg');
    setTagsString('Guppy Care, Water Chemistry');
    setIsPublished(true);
    setIsModalOpen(true);
  };

  const handleOpenEdit = (post: BlogPost) => {
    setEditingPost(post);
    setTitle(post.title);
    setSlug(post.slug);
    setCategory(post.category);
    setExcerpt(post.excerpt);
    setContentHtml(post.content_html);
    setImageUrl(post.featured_image);
    setReadTime(post.read_time_minutes);
    setAuthorName(post.author.name);
    setAuthorRole(post.author.role);
    setAuthorAvatar(post.author.avatar);
    setTagsString(post.tags.join(', '));
    setIsPublished(post.is_published);
    setIsModalOpen(true);
  };

  const handleTitleChange = (val: string) => {
    setTitle(val);
    if (!editingPost) {
      // Auto generate slug on create
      const generated = val.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
      setSlug(generated);
    }
  };

  const handleOpenMediaPicker = (target: 'featured-image' | 'content-media', type: 'all' | 'image' | 'video' = 'all') => {
    setMediaPickerTarget(target);
    setMediaPickerType(type);
    setIsMediaPickerOpen(true);
  };

  const handleMediaSelected = (media: SelectedMedia) => {
    if (mediaPickerTarget === 'featured-image') {
      setImageUrl(media.url);
      showToast('Featured banner image updated', 'success');
    } else if (mediaPickerTarget === 'content-media') {
      const isVid = media.mime_type?.startsWith('video/') || media.url.match(/\.(mp4|webm)$/i);
      const tag = isVid
        ? `\n<video controls playsinline preload="metadata" class="w-full rounded-2xl shadow-md my-4" poster="${media.thumbnail_url || ''}">\n  <source src="${media.url}" type="${media.mime_type || 'video/mp4'}">\n</video>\n`
        : `\n<img src="${media.url}" alt="${media.alt_text || 'Aquarium care journal'}" class="w-full rounded-2xl shadow-md my-4" />\n`;
      setContentHtml((prev) => prev + tag);
      showToast('Media inserted into article body!', 'success');
    }
  };

  const handleSavePost = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !slug.trim()) {
      showToast('Article title and URL slug are required', 'error');
      return;
    }

    const cleanSlug = slug.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    const tags = tagsString.split(',').map(t => t.trim()).filter(Boolean);

    const saved = mockDb.saveBlogPost({
      id: editingPost ? editingPost.id : undefined,
      title: title.trim(),
      slug: cleanSlug,
      category,
      excerpt: excerpt.trim(),
      content_html: contentHtml,
      featured_image: imageUrl.trim(),
      read_time_minutes: Number(readTime) || 5,
      is_published: isPublished,
      tags,
      author: {
        name: authorName.trim(),
        role: authorRole.trim(),
        avatar: authorAvatar.trim(),
      },
    });

    refreshPosts();
    setIsModalOpen(false);
    showToast(`Article "${saved.title}" saved successfully!`, 'success');
  };

  const handleDeleteClick = (post: BlogPost) => {
    setDeletePostTarget(post);
  };

  const handleConfirmDelete = () => {
    if (!deletePostTarget) return;
    mockDb.deleteBlogPost(deletePostTarget.id);
    refreshPosts();
    showToast('Article removed from knowledge base', 'info');
    setDeletePostTarget(null);
  };

  const filteredPosts = posts.filter((post) => {
    if (categoryFilter !== 'all' && post.category !== categoryFilter) return false;
    if (statusFilter === 'published' && !post.is_published) return false;
    if (statusFilter === 'draft' && post.is_published) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      const matchTitle = post.title.toLowerCase().includes(q);
      const matchTag = post.tags.some(t => t.toLowerCase().includes(q));
      const matchAuthor = post.author.name.toLowerCase().includes(q);
      if (!matchTitle && !matchTag && !matchAuthor) return false;
    }
    return true;
  });

  const totalViews = posts.reduce((acc, p) => acc + (p.views_count || 0), 0);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-20">
      {/* Page Title & Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-xs font-bold uppercase tracking-wider text-blue-900 font-mono">
            Educational Publishing
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 font-display">
            Care Guides & Article Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Publish expert fishkeeping articles, acclimation whitepapers, and genetics guides to educate customers.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/blog"
            target="_blank"
            className="px-3.5 py-2 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
            aria-label="View live customer blog (opens in new tab)"
          >
            <span>Live Blog</span>
            <ExternalLink className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
          </Link>

          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-blue-900 hover:bg-blue-800 text-white text-xs font-bold flex items-center gap-1.5 transition-colors shadow-sm"
          >
            <Plus className="w-4 h-4" aria-hidden="true" />
            <span>Write New Article</span>
          </button>
        </div>
      </div>

      {/* KPI Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block">Total Articles</span>
          <strong className="text-xl font-black text-slate-900">{posts.length}</strong>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block">Published Live</span>
          <strong className="text-xl font-black text-blue-700">
            {posts.filter(p => p.is_published).length}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block">Drafts</span>
          <strong className="text-xl font-black text-red-600">
            {posts.filter(p => !p.is_published).length}
          </strong>
        </div>

        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
          <span className="text-slate-400 font-medium block">Total Reader Views</span>
          <strong className="text-xl font-black text-slate-900">{totalViews.toLocaleString()}</strong>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white rounded-2xl p-4 border border-slate-200 shadow-xs flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 text-xs">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" aria-hidden="true" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search articles by title, tag, or author..."
            aria-label="Search articles by title, tag, or author"
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-3.5 py-2 text-xs text-slate-900 placeholder:text-slate-400 outline-none focus:border-blue-600 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <label htmlFor="blog-filter-category" className="text-slate-500 font-semibold text-[11px]">Category:</label>
            <select
              id="blog-filter-category"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="bg-transparent text-slate-900 font-bold outline-none cursor-pointer text-xs"
            >
              <option value="all">All Categories</option>
              {BLOG_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200 rounded-xl px-2.5 py-1.5">
            <label htmlFor="blog-filter-status" className="text-slate-500 font-semibold text-[11px]">Status:</label>
            <select
              id="blog-filter-status"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-transparent text-slate-900 font-bold outline-none cursor-pointer text-xs"
            >
              <option value="all">All</option>
              <option value="published">Published</option>
              <option value="draft">Drafts</option>
            </select>
          </div>
        </div>
      </div>

      {/* Articles Table & Mobile List */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-xs overflow-hidden">
        {/* Desktop Table View */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full text-left text-xs">
            <caption className="sr-only">Educational Care Guides and Blog Articles Index</caption>
            <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider text-[11px] font-semibold border-b border-slate-200">
              <tr>
                <th scope="col" className="p-4">Article / Topic</th>
                <th scope="col" className="p-4">Category</th>
                <th scope="col" className="p-4">Author</th>
                <th scope="col" className="p-4">Engagement</th>
                <th scope="col" className="p-4">Status</th>
                <th scope="col" className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-600">
              {filteredPosts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    No articles found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredPosts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50/60 transition-colors">
                    <td className="p-4 max-w-sm">
                      <div className="flex items-center gap-3">
                        <img
                          src={post.featured_image}
                          alt=""
                          aria-hidden="true"
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div>
                          <strong className="font-bold text-slate-900 block line-clamp-1">{post.title}</strong>
                          <span className="text-[10px] text-slate-400 font-mono">/blog/{post.slug}</span>
                        </div>
                      </div>
                    </td>

                    <td className="p-4">
                      <span className="font-semibold text-blue-900 bg-blue-50 border border-blue-200 px-2.5 py-0.5 rounded-full text-[11px]">
                        {post.category}
                      </span>
                    </td>

                    <td className="p-4">
                      <div className="font-semibold text-slate-900">{post.author.name}</div>
                      <div className="text-[10px] text-slate-400">{post.author.role}</div>
                    </td>

                    <td className="p-4">
                      <div className="font-bold text-slate-900">{post.views_count.toLocaleString()} Views</div>
                      <div className="text-[10px] text-slate-400">{post.read_time_minutes} min read &bull; {formatDate(post.published_at)}</div>
                    </td>

                    <td className="p-4">
                      <span
                        className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                          post.is_published
                            ? 'bg-blue-50 text-blue-700 border-blue-200'
                            : 'bg-red-50 text-red-700 border-red-200'
                        }`}
                      >
                        {post.is_published ? 'Published' : 'Draft'}
                      </span>
                    </td>

                    <td className="p-4 text-right space-x-1">
                      <Link
                        to={`/blog/${post.slug}`}
                        target="_blank"
                        className="p-1.5 text-slate-400 hover:text-blue-900 hover:bg-slate-100 rounded-lg inline-block transition-colors focus-visible:ring-2 focus-visible:ring-blue-900"
                        aria-label={`View live article "${post.title}"`}
                      >
                        <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </Link>
                      <button
                        onClick={() => handleOpenEdit(post)}
                        className="p-1.5 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-blue-900"
                        aria-label={`Edit article "${post.title}"`}
                      >
                        <Edit2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                      <button
                        onClick={() => handleDeleteClick(post)}
                        className="p-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-red-600"
                        aria-label={`Delete article "${post.title}"`}
                      >
                        <Trash2 className="w-4 h-4" aria-hidden="true" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Mobile Card List View */}
        <div className="md:hidden divide-y divide-slate-100">
          {filteredPosts.length === 0 ? (
            <div className="py-12 text-center text-slate-400 text-xs">
              No articles found matching your criteria.
            </div>
          ) : (
            filteredPosts.map((post) => (
              <div key={post.id} className="p-4 space-y-3">
                <div className="flex items-start gap-3">
                  <img
                    src={post.featured_image}
                    alt=""
                    aria-hidden="true"
                    className="w-16 h-16 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <span className="text-[10px] font-bold text-blue-900 uppercase block">{post.category}</span>
                    <h3 className="font-bold text-slate-900 text-xs sm:text-sm line-clamp-2 mt-0.5">{post.title}</h3>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5">{formatDate(post.published_at)}</div>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1">
                  <div className="text-[11px] text-slate-500">
                    <strong>{post.views_count}</strong> views &bull; {post.read_time_minutes} min read
                  </div>
                  <span
                    className={`inline-block px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase border ${
                      post.is_published
                        ? 'bg-blue-50 text-blue-700 border-blue-200'
                        : 'bg-red-50 text-red-700 border-red-200'
                    }`}
                  >
                    {post.is_published ? 'Published' : 'Draft'}
                  </span>
                </div>

                <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
                  <Link
                    to={`/blog/${post.slug}`}
                    target="_blank"
                    className="flex-1 min-h-[44px] py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-900"
                    aria-label={`View live article "${post.title}"`}
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-blue-700" aria-hidden="true" />
                    <span>View</span>
                  </Link>
                  <button
                    onClick={() => handleOpenEdit(post)}
                    className="flex-1 min-h-[44px] py-1.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 focus-visible:ring-2 focus-visible:ring-blue-900"
                    aria-label={`Edit article "${post.title}"`}
                  >
                    <Edit2 className="w-3.5 h-3.5" aria-hidden="true" />
                    <span>Edit</span>
                  </button>
                  <button
                    onClick={() => handleDeleteClick(post)}
                    className="min-h-[44px] px-3.5 py-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded-xl text-xs font-bold transition-colors flex items-center justify-center border border-red-200 focus-visible:ring-2 focus-visible:ring-red-600"
                    aria-label={`Delete article "${post.title}"`}
                  >
                    <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* CREATE / EDIT ARTICLE MODAL */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="blog-modal-title"
        >
          <div className="fixed inset-0 bg-slate-950/40 backdrop-blur-xs" onClick={() => setIsModalOpen(false)} />
          <div className="relative bg-white border border-slate-200 rounded-3xl p-6 sm:p-8 max-w-3xl w-full z-10 text-xs text-slate-700 space-y-4 max-h-[92vh] overflow-y-auto shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <span className="text-[10px] font-bold font-mono text-blue-900 uppercase tracking-wider">
                  Care Guide Authoring
                </span>
                <h2 id="blog-modal-title" className="text-base font-bold text-slate-900">
                  {editingPost ? 'Edit Care Journal Article' : 'Write & Publish New Care Guide'}
                </h2>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg min-h-[44px] min-w-[44px] flex items-center justify-center"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" aria-hidden="true" />
              </button>
            </div>

            <form onSubmit={handleSavePost} className="space-y-4">
              {/* Title & Slug */}
              <div>
                <label htmlFor="blog-title" className="block text-slate-700 font-bold mb-1">Article Title *</label>
                <input
                  id="blog-title"
                  type="text"
                  required
                  value={title}
                  onChange={(e) => handleTitleChange(e.target.value)}
                  placeholder="e.g. The Science of Drip Acclimation for High-Grade Guppies"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="blog-slug" className="block text-slate-700 font-bold mb-1">URL Slug *</label>
                  <div className="flex items-center bg-slate-50 border border-slate-200 rounded-xl px-3 py-2">
                    <span className="text-slate-400 font-mono">/blog/</span>
                    <input
                      id="blog-slug"
                      type="text"
                      required
                      value={slug}
                      onChange={(e) => setSlug(e.target.value)}
                      placeholder="acclimating-show-guppies"
                      className="w-full bg-transparent text-xs text-blue-900 font-mono outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="blog-category" className="block text-slate-700 font-bold mb-1">Category *</label>
                  <select
                    id="blog-category"
                    value={category}
                    onChange={(e) => setCategory(e.target.value as BlogCategory)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  >
                    {BLOG_CATEGORIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Read Time & Image */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label htmlFor="blog-read-time" className="block text-slate-700 font-bold mb-1">Estimated Read Time (Mins)</label>
                  <input
                    id="blog-read-time"
                    type="number"
                    min="1"
                    max="60"
                    value={readTime}
                    onChange={(e) => setReadTime(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div className="sm:col-span-2">
                  <div className="flex items-center justify-between mb-1">
                    <label htmlFor="blog-image-url" className="block text-slate-700 font-bold">Featured Banner Image URL *</label>
                    <button
                      type="button"
                      onClick={() => handleOpenMediaPicker('featured-image', 'image')}
                      className="text-[11px] font-bold text-blue-900 hover:underline flex items-center gap-1"
                    >
                      <Upload className="w-3 h-3" />
                      <span>Choose / Upload Image</span>
                    </button>
                  </div>
                  <div className="flex gap-2">
                    <input
                      id="blog-image-url"
                      type="text"
                      required
                      value={imageUrl}
                      onChange={(e) => setImageUrl(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                    />
                    {imageUrl && (
                      <img 
                        src={imageUrl} 
                        alt="Preview" 
                        className="w-10 h-10 rounded-xl object-cover border border-slate-200 shrink-0" 
                      />
                    )}
                  </div>
                </div>
              </div>

              {/* Author Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label htmlFor="blog-author-name" className="block text-slate-700 font-bold mb-1">Author Name</label>
                  <input
                    id="blog-author-name"
                    type="text"
                    value={authorName}
                    onChange={(e) => setAuthorName(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>

                <div>
                  <label htmlFor="blog-author-role" className="block text-slate-700 font-bold mb-1">Author Professional Role</label>
                  <input
                    id="blog-author-role"
                    type="text"
                    value={authorRole}
                    onChange={(e) => setAuthorRole(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                  />
                </div>
              </div>

              {/* Excerpt */}
              <div>
                <label htmlFor="blog-excerpt" className="block text-slate-700 font-bold mb-1">Lead Excerpt / Summary (2-3 Sentences) *</label>
                <textarea
                  id="blog-excerpt"
                  rows={2}
                  required
                  value={excerpt}
                  onChange={(e) => setExcerpt(e.target.value)}
                  placeholder="Summarize the core takeaway of this article for search engine snippets and preview cards..."
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Rich Body HTML */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label htmlFor="blog-content-html" className="block text-slate-700 font-bold">Article Body Content (HTML Supported) *</label>
                  <button
                    type="button"
                    onClick={() => handleOpenMediaPicker('content-media', 'all')}
                    className="px-2.5 py-1 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-900 border border-blue-200 text-[11px] font-bold flex items-center gap-1 transition-colors"
                  >
                    <Upload className="w-3 h-3" />
                    <span>Insert Image / Video</span>
                  </button>
                </div>
                <textarea
                  id="blog-content-html"
                  rows={10}
                  required
                  value={contentHtml}
                  onChange={(e) => setContentHtml(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-800 font-mono outline-none focus:border-blue-600 focus:bg-white leading-relaxed"
                />
              </div>

              {/* Tags */}
              <div>
                <label htmlFor="blog-tags" className="block text-slate-700 font-bold mb-1">Tags (Comma-separated)</label>
                <input
                  id="blog-tags"
                  type="text"
                  value={tagsString}
                  onChange={(e) => setTagsString(e.target.value)}
                  placeholder="Acclimation, Water Chemistry, Show Guppies"
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl p-2.5 text-xs text-slate-900 outline-none focus:border-blue-600 focus:bg-white"
                />
              </div>

              {/* Publish Toggle Box */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 flex items-center justify-between">
                <div>
                  <strong className="text-slate-900 block text-xs">Publish Status</strong>
                  <span className="text-[11px] text-slate-500">
                    {isPublished ? 'This article will be visible immediately to all website visitors.' : 'Saved as a private draft. Hidden from the public.'}
                  </span>
                </div>
                <label htmlFor="blog-is-published" className="flex items-center gap-2 cursor-pointer">
                  <input
                    id="blog-is-published"
                    type="checkbox"
                    checked={isPublished}
                    onChange={(e) => setIsPublished(e.target.checked)}
                    className="accent-blue-900 w-4 h-4 rounded cursor-pointer"
                  />
                  <span className="font-bold text-xs text-slate-800">
                    {isPublished ? 'Publish Live' : 'Draft Mode'}
                  </span>
                </label>
              </div>

              {/* Form Controls */}
              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs text-slate-700 font-semibold min-h-[44px]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold text-xs rounded-xl shadow-md transition-all flex items-center gap-1.5 min-h-[44px]"
                >
                  <Save className="w-4 h-4" aria-hidden="true" />
                  <span>{editingPost ? 'Save Changes' : 'Publish Article'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* CONFIRM DELETE DIALOG */}
      <ConfirmDialog
        isOpen={!!deletePostTarget}
        title="Delete Educational Article"
        message={`Are you sure you want to permanently delete "${deletePostTarget?.title}"? This will remove the article from the public care guide index.`}
        confirmLabel="Delete Article"
        cancelLabel="Cancel"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onCancel={() => setDeletePostTarget(null)}
      />

      {/* REUSABLE MEDIA PICKER MODAL */}
      <MediaPickerModal
        isOpen={isMediaPickerOpen}
        onClose={() => setIsMediaPickerOpen(false)}
        onSelect={handleMediaSelected}
        mediaType={mediaPickerType}
        title={
          mediaPickerTarget === 'featured-image'
            ? 'Select or Upload Article Featured Banner'
            : 'Select Media to Insert into Article'
        }
      />
    </div>
  );
};
