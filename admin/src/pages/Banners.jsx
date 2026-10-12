import React, { useState, useEffect } from 'react';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Power,
  ExternalLink,
  Link as LinkIcon,
  X,
  Edit2,
  RefreshCw,
  Palette,
  Sparkles,
  Eye,
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';

const COLOR_PRESETS = [
  { name: 'Teal', colors: ['#0D9488', '#0F766E'], bg: 'bg-gradient-to-r from-teal-600 to-teal-800' },
  { name: 'Amber', colors: ['#F59E0B', '#D97706'], bg: 'bg-gradient-to-r from-amber-500 to-amber-700' },
  { name: 'Orange', colors: ['#EA580C', '#C2410C'], bg: 'bg-gradient-to-r from-orange-600 to-orange-800' },
  { name: 'Flame', colors: ['#F97316', '#EA580C'], bg: 'bg-gradient-to-r from-orange-500 to-orange-600' },
  { name: 'Emerald', colors: ['#10B981', '#059669'], bg: 'bg-gradient-to-r from-emerald-500 to-emerald-700' },
  { name: 'Indigo', colors: ['#6366F1', '#4F46E5'], bg: 'bg-gradient-to-r from-indigo-500 to-indigo-700' },
  { name: 'Rose', colors: ['#E11D48', '#BE123C'], bg: 'bg-gradient-to-r from-rose-600 to-rose-800' },
  { name: 'Dark Slate', colors: ['#1E293B', '#0F172A'], bg: 'bg-gradient-to-r from-slate-800 to-slate-950' },
];

const IMAGE_PRESETS = [
  { label: 'Pizza Feast', url: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=800&q=80' },
  { label: 'Gourmet Burger', url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=800&q=80' },
  { label: 'Biryani Platter', url: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=800&q=80' },
  { label: 'Indian Thali', url: 'https://images.unsplash.com/photo-1626777552726-4a6b54c97e46?w=800&q=80' },
  { label: 'Fresh Desserts', url: 'https://images.unsplash.com/photo-1551024506-0bccd828d307?w=800&q=80' },
  { label: '10-Min Grocery Mart', url: 'https://images.unsplash.com/photo-1542838132-92c53300491e?w=800&q=80' },
];

export const Banners = () => {
  const { showToast } = useApp();
  const [banners, setBanners] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('ALL'); // ALL, FOOD_HERO, OFFERS_FOR_YOU, SPOTLIGHT, GROCERY_HERO

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    subtitle: '',
    tag: 'PROMO',
    imageUrl: IMAGE_PRESETS[0].url,
    section: 'FOOD_HERO',
    targetType: 'category', // restaurant, category, cuisine, coupon, search, none
    targetId: 'biryani',
    colorTheme: COLOR_PRESETS[0].name,
    order: 1,
  });

  const loadBanners = async () => {
    setLoading(true);
    try {
      const items = await api.getBanners(activeTab === 'ALL' ? {} : { section: activeTab });
      setBanners(Array.isArray(items) ? items : []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadBanners();
  }, [activeTab]);

  const handleOpenAdd = () => {
    setEditingBanner(null);
    setFormData({
      title: '',
      subtitle: 'Flat 40% OFF',
      tag: 'PROMO',
      imageUrl: IMAGE_PRESETS[0].url,
      section: activeTab === 'ALL' ? 'FOOD_HERO' : activeTab,
      targetType: 'category',
      targetId: 'biryani',
      colorTheme: COLOR_PRESETS[0].name,
      order: banners.length + 1,
    });
    setIsModalOpen(true);
  };

  const handleOpenEdit = (b) => {
    setEditingBanner(b);
    setFormData({
      title: b.title || '',
      subtitle: b.subtitle || '',
      tag: b.tag || 'PROMO',
      imageUrl: b.image || b.imageUrl || '',
      section: b.section || b.position || 'FOOD_HERO',
      targetType: b.targetType || 'category',
      targetId: b.targetId || b.targetValue || '',
      colorTheme: b.colorTheme || COLOR_PRESETS[0].name,
      order: b.order || 1,
    });
    setIsModalOpen(true);
  };

  const handleToggle = async (id) => {
    try {
      await api.toggleBanner(id);
      showToast('Banner visibility updated!');
      setBanners((prev) =>
        prev.map((b) => (b._id === id ? { ...b, isActive: !b.isActive } : b))
      );
    } catch (err) {
      showToast(`Failed to toggle banner: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this promotional banner?')) return;
    try {
      await api.deleteBanner(id);
      showToast('Banner deleted!');
      setBanners((prev) => prev.filter((b) => b._id !== id));
    } catch (err) {
      showToast(`Failed to delete banner: ${err.message}`, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.imageUrl.trim()) return;

    try {
      const payload = {
        title: formData.title.trim() || 'Promotional Offer',
        subtitle: formData.subtitle.trim() || undefined,
        tag: formData.tag.trim() || 'PROMO',
        image: formData.imageUrl.trim(),
        imageUrl: formData.imageUrl.trim(),
        section: formData.section,
        position: formData.section,
        targetType: formData.targetType,
        targetId: formData.targetId.trim(),
        targetValue: formData.targetId.trim(),
        order: Number(formData.order) || 1,
        colorTheme: formData.colorTheme,
        isActive: true,
      };

      if (editingBanner) {
        await api.updateBanner(editingBanner._id, payload);
        showToast('Banner updated successfully!');
      } else {
        await api.createBanner(payload);
        showToast('Banner published to mobile app!');
      }

      setIsModalOpen(false);
      loadBanners();
    } catch (err) {
      showToast(`Failed to save banner: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Marketing Banners & Carousels
          </h2>
          <p className="text-xs text-slate-400">
            Control customer app homepage hero sliders, offer posters, and spotlight banners
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadBanners}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenAdd}
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Create Banner</span>
          </button>
        </div>
      </div>

      {/* Section Tabs (Matching mobile banners.tsx) */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 border-b border-slate-800/80">
        {[
          { key: 'ALL', label: 'All Banners' },
          { key: 'FOOD_HERO', label: 'Food Hero Carousel' },
          { key: 'GROCERY_HERO', label: '10-Min Grocery Mart' },
          { key: 'OFFERS_FOR_YOU', label: 'Offers For You' },
          { key: 'SPOTLIGHT', label: 'Spotlight Deals' },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              activeTab === tab.key
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'text-slate-400 hover:text-white bg-slate-900/60'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Banners Grid */}
      {loading ? (
        <div className="py-16 text-center text-slate-500">Loading promotional banners...</div>
      ) : banners.length === 0 ? (
        <div className="py-16 text-center text-slate-500 space-y-2 bg-slate-900/40 rounded-2xl border border-slate-800">
          <p className="text-sm">No banners published for this section.</p>
          <button
            onClick={handleOpenAdd}
            className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
          >
            + Create the first promotional poster
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {banners.map((banner) => {
            const img = banner.image || banner.imageUrl || IMAGE_PRESETS[0].url;
            return (
              <div
                key={banner._id}
                className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden flex flex-col justify-between hover:border-slate-700 transition shadow-xl"
              >
                <div>
                  {/* Banner Image Preview */}
                  <div className="relative h-40 bg-slate-950 overflow-hidden">
                    <img
                      src={img}
                      alt={banner.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        e.target.src = IMAGE_PRESETS[0].url;
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-black/30" />
                    <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-black/60 text-white backdrop-blur-sm border border-white/10 uppercase">
                        {banner.section || banner.position || 'PROMO'}
                      </span>
                      {banner.tag && (
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-orange-500 text-white">
                          {banner.tag}
                        </span>
                      )}
                    </div>
                    <div className="absolute bottom-2.5 left-2.5 right-2.5 text-white">
                      <h4 className="font-extrabold text-sm drop-shadow line-clamp-1">
                        {banner.title || 'Untitled Banner'}
                      </h4>
                      {banner.subtitle && (
                        <p className="text-[11px] text-orange-300 font-semibold drop-shadow">
                          {banner.subtitle}
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="p-4 space-y-2 text-xs text-slate-400">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="flex items-center gap-1 text-slate-300">
                        <LinkIcon size={12} className="text-orange-400" />
                        Target: <strong className="text-white">{banner.targetType || 'category'}</strong>
                      </span>
                      <span className="font-mono text-slate-500 truncate max-w-[120px]">
                        {banner.targetId || banner.targetValue || '-'}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bottom Actions */}
                <div className="p-3 border-t border-slate-800 flex items-center justify-between bg-slate-950/40">
                  <button
                    onClick={() => handleToggle(banner._id)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                      banner.isActive !== false
                        ? 'bg-emerald-500/10 text-emerald-400 hover:bg-rose-500/10 hover:text-rose-400'
                        : 'bg-rose-500/10 text-rose-400 hover:bg-emerald-500/10 hover:text-emerald-400'
                    }`}
                  >
                    <Power size={12} />
                    <span>{banner.isActive !== false ? 'Live' : 'Hidden'}</span>
                  </button>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => handleOpenEdit(banner)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                      title="Edit Banner"
                    >
                      <Edit2 size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(banner._id)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                      title="Delete Banner"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingBanner ? 'Edit Banner' : 'Create Promotional Banner'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Headline Title *</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Biryani Bonanza, Weekend Feast"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Subtitle / Offer</label>
                  <input
                    type="text"
                    placeholder="e.g. Up to 50% OFF + Free Delivery"
                    value={formData.subtitle}
                    onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target Section</label>
                  <select
                    value={formData.section}
                    onChange={(e) => setFormData({ ...formData, section: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="FOOD_HERO">Food Hero Carousel</option>
                    <option value="GROCERY_HERO">10-Min Grocery Mart</option>
                    <option value="OFFERS_FOR_YOU">Offers For You</option>
                    <option value="SPOTLIGHT">Spotlight Deals</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Tag / Badge</label>
                  <input
                    type="text"
                    placeholder="e.g. BESTSELLER, PROMO, NEW"
                    value={formData.tag}
                    onChange={(e) => setFormData({ ...formData, tag: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Target Routing */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">On-Click Action</label>
                  <select
                    value={formData.targetType}
                    onChange={(e) => setFormData({ ...formData, targetType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500 cursor-pointer"
                  >
                    <option value="category">Category (e.g. biryani, pizza)</option>
                    <option value="restaurant">Specific Restaurant ID</option>
                    <option value="cuisine">Cuisine Tag</option>
                    <option value="coupon">Apply Coupon Code</option>
                    <option value="search">Open Search Screen</option>
                    <option value="none">None (Static Poster)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Target ID / Slug</label>
                  <input
                    type="text"
                    placeholder="e.g. biryani, REST-101"
                    value={formData.targetId}
                    onChange={(e) => setFormData({ ...formData, targetId: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              {/* Image URL & 1-Click Presets */}
              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Banner Image URL *</label>
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />

                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold">1-Click Presets:</span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {IMAGE_PRESETS.map((p) => (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => setFormData({ ...formData, imageUrl: p.url })}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                          formData.imageUrl === p.url
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  {editingBanner ? 'Update Banner' : 'Publish Banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
