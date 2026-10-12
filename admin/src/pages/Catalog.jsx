import React, { useState } from 'react';
import {
  Layers,
  Plus,
  Search,
  CheckCircle,
  XCircle,
  Tag,
  ArrowUpDown,
  Utensils,
  DollarSign,
  Package,
  Edit2,
  Trash2,
  X,
  Power,
  Image as ImageIcon,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { formatRupees, formatPaise } from '../utils/formatters';

const PRESET_IMAGES = [
  { name: 'Pizza', url: 'https://images.pexels.com/photos/1146760/pexels-photo-1146760.jpeg' },
  { name: 'Burger', url: 'https://images.pexels.com/photos/1639557/pexels-photo-1639557.jpeg' },
  { name: 'Biryani', url: 'https://images.pexels.com/photos/1624487/pexels-photo-1624487.jpeg' },
  { name: 'Paratha', url: 'https://images.pexels.com/photos/12737656/pexels-photo-12737656.jpeg' },
  { name: 'Noodles', url: 'https://images.pexels.com/photos/2347311/pexels-photo-2347311.jpeg' },
  { name: 'Desserts', url: 'https://images.pexels.com/photos/2144112/pexels-photo-2144112.jpeg' },
  { name: 'Rolls', url: 'https://images.pexels.com/photos/461198/pexels-photo-461198.jpeg' },
  { name: 'Thali', url: 'https://images.pexels.com/photos/958545/pexels-photo-958545.jpeg' },
  { name: 'Coffee / Tea', url: 'https://images.pexels.com/photos/312418/pexels-photo-312418.jpeg' },
  { name: 'Ice Cream', url: 'https://images.pexels.com/photos/1362534/pexels-photo-1362534.jpeg' },
];

export const Catalog = () => {
  const { categories, setCategories, menuItems, toggleItemStock, showToast } = useApp();
  const [activeTab, setActiveTab] = useState('ITEMS'); // ITEMS or CATEGORIES
  const [selectedCatFilter, setSelectedCatFilter] = useState('ALL');
  const [search, setSearch] = useState('');

  // Category Modal State
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catForm, setCatForm] = useState({
    name: '',
    image: PRESET_IMAGES[0].url,
    order: 1,
    isActive: true,
  });

  const filteredItems = menuItems.filter((item) => {
    const matchCat = selectedCatFilter === 'ALL' || item.category === selectedCatFilter;
    const matchSearch =
      item.name.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  const handleOpenAddCat = () => {
    setEditingCat(null);
    setCatForm({
      name: '',
      image: PRESET_IMAGES[0].url,
      order: categories.length + 1,
      isActive: true,
    });
    setIsCatModalOpen(true);
  };

  const handleOpenEditCat = (cat) => {
    setEditingCat(cat);
    setCatForm({
      name: cat.name || '',
      image: cat.image || PRESET_IMAGES[0].url,
      order: cat.order || 1,
      isActive: cat.active !== false,
    });
    setIsCatModalOpen(true);
  };

  const handleSaveCategory = async (e) => {
    e.preventDefault();
    if (!catForm.name.trim()) return;

    try {
      if (editingCat) {
        await api.updateCategory(editingCat.id, {
          name: catForm.name.trim(),
          image: catForm.image.trim(),
          order: Number(catForm.order) || 1,
          isActive: catForm.isActive,
        });
        setCategories((prev) =>
          prev.map((c) =>
            c.id === editingCat.id
              ? { ...c, name: catForm.name.trim(), image: catForm.image.trim(), order: Number(catForm.order), active: catForm.isActive }
              : c
          )
        );
        showToast(`Category "${catForm.name}" updated!`);
      } else {
        const created = await api.createCategory({
          name: catForm.name.trim(),
          image: catForm.image.trim(),
          order: Number(catForm.order) || categories.length + 1,
          isActive: catForm.isActive,
        });
        const newCat = {
          id: created?._id || `CAT-${Date.now().toString().slice(-3)}`,
          name: catForm.name.trim(),
          image: catForm.image.trim(),
          itemCount: 0,
          order: Number(catForm.order) || categories.length + 1,
          active: catForm.isActive,
        };
        setCategories([...categories, newCat]);
        showToast(`Category "${newCat.name}" added to database!`);
      }
      setIsCatModalOpen(false);
    } catch (err) {
      showToast(`Failed to save category: ${err.message}`, 'error');
    }
  };

  const handleDeleteCategory = async (id, name) => {
    if (!window.confirm(`Delete category "${name}"?`)) return;
    try {
      await api.deleteCategory(id);
      setCategories((prev) => prev.filter((c) => c.id !== id));
      showToast(`Category "${name}" deleted!`);
    } catch (err) {
      showToast(`Failed to delete category: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Catalog & Live Inventory
          </h2>
          <p className="text-xs text-slate-400">
            Control items, categories, pricing, and 1-click in-stock / out-of-stock switches
          </p>
        </div>

        <div className="flex items-center gap-2 bg-slate-900 p-1 rounded-xl border border-slate-800 self-start sm:self-auto">
          <button
            onClick={() => setActiveTab('ITEMS')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'ITEMS'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Menu Items ({menuItems.length})
          </button>
          <button
            onClick={() => setActiveTab('CATEGORIES')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition cursor-pointer ${
              activeTab === 'CATEGORIES'
                ? 'bg-orange-500 text-white shadow'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            Categories ({categories.length})
          </button>
        </div>
      </div>

      {activeTab === 'ITEMS' && (
        <div className="space-y-4">
          {/* Filter Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
            <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
              <button
                onClick={() => setSelectedCatFilter('ALL')}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                  selectedCatFilter === 'ALL'
                    ? 'bg-slate-200 text-slate-900 font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                All Items
              </button>
              {categories.map((c) => (
                <button
                  key={c.id}
                  onClick={() => setSelectedCatFilter(c.name)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                    selectedCatFilter === c.name
                      ? 'bg-slate-200 text-slate-900 font-bold'
                      : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {c.name}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Search menu items..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 focus:outline-none focus:border-orange-500"
              />
            </div>
          </div>

          {/* Items Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
                <tr>
                  <th className="px-5 py-3.5">Item Name</th>
                  <th className="px-5 py-3.5">Category</th>
                  <th className="px-5 py-3.5">Selling Price</th>
                  <th className="px-5 py-3.5">Availability</th>
                  <th className="px-5 py-3.5 text-right">Quick Stock Toggle</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/80">
                {filteredItems.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/40 transition">
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-3 h-3 rounded flex items-center justify-center border text-[8px] font-bold ${
                            item.isVeg
                              ? 'border-emerald-500 text-emerald-400'
                              : 'border-rose-500 text-rose-400'
                          }`}
                        >
                          ●
                        </span>
                        <div>
                          <span className="font-bold text-white text-sm">{item.name}</span>
                          <p className="text-[10px] font-mono text-slate-500">{item.id}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className="px-2.5 py-1 rounded-md bg-slate-800 text-slate-300 text-[11px] font-medium">
                        {item.category}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 font-bold font-mono text-emerald-400">
                      {formatRupees(item.price)}
                    </td>
                    <td className="px-5 py-3.5">
                      <span
                        className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                          item.inStock
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full ${
                            item.inStock ? 'bg-emerald-400' : 'bg-rose-400'
                          }`}
                        />
                        {item.inStock ? 'Available' : 'Sold Out'}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-right">
                      <button
                        onClick={() => toggleItemStock(item.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                          item.inStock
                            ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                      >
                        {item.inStock ? 'Mark Out-of-Stock' : 'Restock Item'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'CATEGORIES' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Food Categories Management</h3>
              <p className="text-xs text-slate-400">Order, active state, and category banners shown in apps</p>
            </div>
            <button
              onClick={handleOpenAddCat}
              className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition cursor-pointer"
            >
              <Plus size={15} />
              <span>Add Category</span>
            </button>
          </div>

          {/* Categories Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map((cat, idx) => (
              <div
                key={cat.id}
                className="p-4 rounded-2xl bg-slate-900/80 border border-slate-800 flex items-center justify-between gap-3 shadow-lg hover:border-slate-700 transition"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {cat.image ? (
                    <img
                      src={cat.image}
                      alt={cat.name}
                      className="w-11 h-11 rounded-xl object-cover bg-slate-800 shrink-0 border border-slate-700"
                    />
                  ) : (
                    <div className="w-11 h-11 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center shrink-0 border border-orange-500/20">
                      <Tag size={18} />
                    </div>
                  )}
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-[10px] text-slate-500">#{cat.order || idx + 1}</span>
                      <h4 className="font-bold text-white text-sm truncate">{cat.name}</h4>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{cat.itemCount || 0} items listed</p>
                  </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      cat.active !== false
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-rose-500/10 text-rose-400'
                    }`}
                  >
                    {cat.active !== false ? 'Active' : 'Hidden'}
                  </span>
                  <button
                    onClick={() => handleOpenEditCat(cat)}
                    className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                    title="Edit Category"
                  >
                    <Edit2 size={13} />
                  </button>
                  <button
                    onClick={() => handleDeleteCategory(cat.id, cat.name)}
                    className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                    title="Delete Category"
                  >
                    <Trash2 size={13} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add / Edit Category Modal */}
      {isCatModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingCat ? 'Edit Category' : 'Create Category'}
              </h3>
              <button
                onClick={() => setIsCatModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSaveCategory} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Category Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Pizza, Burger, North Indian"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Display Sort Order</label>
                <input
                  type="number"
                  value={catForm.order}
                  onChange={(e) => setCatForm({ ...catForm, order: Number(e.target.value) })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block font-semibold text-slate-300">Category Icon / Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.pexels.com/..."
                  value={catForm.image}
                  onChange={(e) => setCatForm({ ...catForm, image: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />

                <div className="pt-1">
                  <span className="text-[10px] text-slate-400 font-semibold">1-Click Presets:</span>
                  <div className="flex items-center gap-1.5 flex-wrap mt-1">
                    {PRESET_IMAGES.map((p) => (
                      <button
                        key={p.name}
                        type="button"
                        onClick={() => setCatForm({ ...catForm, image: p.url })}
                        className={`text-[10px] px-2 py-0.5 rounded-lg border transition cursor-pointer ${
                          catForm.image === p.url
                            ? 'bg-orange-500 text-white border-orange-500'
                            : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                        }`}
                      >
                        {p.name}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div className="pt-1">
                <label className="flex items-center gap-2 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={catForm.isActive}
                    onChange={(e) => setCatForm({ ...catForm, isActive: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 bg-slate-950 border-slate-800"
                  />
                  <span>Active in Customer Mobile App</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsCatModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  {editingCat ? 'Update Category' : 'Create Category'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
