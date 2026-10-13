import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Plus,
  Search,
  Power,
  Tag,
  Package,
  CheckCircle,
  XCircle,
  X,
  Edit2,
  Trash2,
  RefreshCw,
  Sparkles,
  Leaf,
  Flame,
} from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { formatRupees, paiseToRupees, rupeesToPaise } from '../utils/formatters';
import { Pagination } from '../components/common/Pagination';

export const GroceryProducts = () => {
  const { showToast } = useApp();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [selectedCat, setSelectedCat] = useState('ALL');
  const [stockFilter, setStockFilter] = useState('ALL'); // ALL, IN_STOCK, OUT_OF_STOCK
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  // Add / Edit Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'Daily Staples',
    unit: '1 kg',
    price: 99,
    mrp: 120,
    stock: 50,
    imageUrl: '',
    description: '',
    isOrganic: false,
    isSpecialDeal: false,
    isTrending: false,
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const [prodRes, catRes] = await Promise.allSettled([
        api.getGroceryProducts({ limit: 100 }),
        api.getGroceryCategories(),
      ]);

      if (prodRes.status === 'fulfilled') {
        setProducts(Array.isArray(prodRes.value) ? prodRes.value : []);
      }
      if (catRes.status === 'fulfilled') {
        setCategories(Array.isArray(catRes.value) ? catRes.value : []);
      }
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleOpenAddModal = () => {
    setEditingProduct(null);
    setFormData({
      name: '',
      category: categories.length > 0 ? categories[0].name || categories[0] : 'Daily Staples',
      unit: '1 unit',
      price: 99,
      mrp: 120,
      stock: 50,
      imageUrl: '',
      description: '',
      isOrganic: false,
      isSpecialDeal: false,
      isTrending: false,
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (p) => {
    setEditingProduct(p);
    const priceVal = paiseToRupees(p.pricePaise ?? p.price ?? 0);
    const mrpVal = paiseToRupees(p.mrpPaise ?? p.mrp ?? p.originalPrice ?? 0);
    setFormData({
      name: p.name || '',
      category: p.category?.name || p.category || 'Daily Staples',
      unit: p.unit || '1 unit',
      price: priceVal || 99,
      mrp: mrpVal || 120,
      stock: p.stock?.available ?? p.stockQuantity ?? p.stock ?? 50,
      imageUrl: p.imageUrl || p.images?.[0] || '',
      description: p.description || '',
      isOrganic: Boolean(p.isOrganic),
      isSpecialDeal: Boolean(p.isSpecialDeal),
      isTrending: Boolean(p.isTrending),
    });
    setIsModalOpen(true);
  };

  const handleToggleAvailability = async (id) => {
    try {
      await api.toggleGroceryProduct(id);
      showToast('Product availability updated!');
      setProducts((prev) =>
        prev.map((p) => (p._id === id ? { ...p, isAvailable: !p.isAvailable } : p))
      );
    } catch (err) {
      showToast(`Failed to update product: ${err.message}`, 'error');
    }
  };

  const handleDeleteProduct = async (id, name) => {
    if (!window.confirm(`Permanently remove "${name}" from grocery inventory?`)) return;
    try {
      await api.deleteGroceryProduct(id);
      showToast(`Product "${name}" deleted!`);
      setProducts((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      showToast(`Failed to delete product: ${err.message}`, 'error');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) return;

    try {
      const payload = {
        name: formData.name.trim(),
        category: formData.category,
        unit: formData.unit,
        pricePaise: rupeesToPaise(formData.price),
        mrpPaise: rupeesToPaise(formData.mrp),
        price: rupeesToPaise(formData.price),
        originalPrice: rupeesToPaise(formData.mrp),
        stock: Number(formData.stock) || 0,
        stockQuantity: Number(formData.stock) || 0,
        imageUrl: formData.imageUrl.trim() || undefined,
        images: formData.imageUrl.trim() ? [formData.imageUrl.trim()] : [],
        description: formData.description.trim() || undefined,
        isOrganic: Boolean(formData.isOrganic),
        isSpecialDeal: Boolean(formData.isSpecialDeal),
        isTrending: Boolean(formData.isTrending),
        isAvailable: true,
      };

      if (editingProduct) {
        await api.updateGroceryProduct(editingProduct._id, payload);
        showToast(`Product "${formData.name}" updated!`);
      } else {
        await api.createGroceryProduct(payload);
        showToast(`Product "${formData.name}" added to inventory!`);
      }

      setIsModalOpen(false);
      loadData();
    } catch (err) {
      showToast(`Failed to save product: ${err.message}`, 'error');
    }
  };

  // Filter products with useMemo
  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return products.filter((p) => {
      const pCat = p.category?.name || p.category || '';
      const matchCat = selectedCat === 'ALL' || pCat.toLowerCase() === selectedCat.toLowerCase();
      const matchSearch =
        !q ||
        (p.name || '').toLowerCase().includes(q) ||
        pCat.toLowerCase().includes(q);
      const isAvail = p.isAvailable !== false;
      const matchStock =
        stockFilter === 'ALL' ||
        (stockFilter === 'IN_STOCK' && isAvail) ||
        (stockFilter === 'OUT_OF_STOCK' && !isAvail);

      return matchCat && matchSearch && matchStock;
    });
  }, [products, selectedCat, search, stockFilter]);

  const paginatedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            10-Min Dark Store Grocery Inventory
          </h2>
          <p className="text-xs text-slate-400">
            Real-time quick-commerce item stock, MRP, selling price, categories, and out-of-stock switches
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={loadData}
            className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 transition cursor-pointer"
            title="Refresh"
          >
            <RefreshCw size={15} className={loading ? 'animate-spin' : ''} />
          </button>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition cursor-pointer"
          >
            <Plus size={16} />
            <span>Add Grocery Item</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-3">
        {/* Categories Bar */}
        <div className="flex items-center gap-1.5 overflow-x-auto w-full md:w-auto pb-1 md:pb-0">
          <button
            onClick={() => setSelectedCat('ALL')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
              selectedCat === 'ALL'
                ? 'bg-emerald-600 text-white font-bold'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200'
            }`}
          >
            All Items ({products.length})
          </button>
          {categories.map((c) => {
            const cName = c.name || c;
            return (
              <button
                key={c._id || cName}
                onClick={() => setSelectedCat(cName)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition cursor-pointer ${
                  selectedCat.toLowerCase() === cName.toLowerCase()
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {cName}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto">
          {/* Stock Filter */}
          <select
            value={stockFilter}
            onChange={(e) => setStockFilter(e.target.value)}
            className="bg-slate-900 border border-slate-800 rounded-xl px-3 py-1.5 text-xs text-slate-300 focus:outline-none focus:border-emerald-500 cursor-pointer"
          >
            <option value="ALL">All Stock</option>
            <option value="IN_STOCK">In Stock Only</option>
            <option value="OUT_OF_STOCK">Sold Out Only</option>
          </select>

          {/* Search */}
          <div className="relative flex-1 md:w-64">
            <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Search grocery products..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-3 py-1.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
            />
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900/80 overflow-hidden shadow-xl">
        <table className="w-full text-left text-xs text-slate-300">
          <thead className="bg-slate-950/70 text-slate-400 uppercase text-[10px] font-bold tracking-wider border-b border-slate-800">
            <tr>
              <th className="px-5 py-3.5">Item Name</th>
              <th className="px-5 py-3.5">Category</th>
              <th className="px-5 py-3.5">Unit / Weight</th>
              <th className="px-5 py-3.5">Selling Price</th>
              <th className="px-5 py-3.5">MRP</th>
              <th className="px-5 py-3.5">Stock Level</th>
              <th className="px-5 py-3.5">Status</th>
              <th className="px-5 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-800/80">
            {loading ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  Loading dark store inventory from MongoDB...
                </td>
              </tr>
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan={8} className="p-8 text-center text-slate-500">
                  No grocery items found matching your filters.
                </td>
              </tr>
            ) : (
              paginatedProducts.map((item) => (
                <tr key={item._id} className="hover:bg-slate-800/40 transition">
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {item.imageUrl || item.images?.[0] ? (
                        <img
                          src={item.imageUrl || item.images[0]}
                          alt={item.name}
                          className="w-9 h-9 rounded-lg object-cover bg-slate-800 shrink-0 border border-slate-700"
                        />
                      ) : (
                        <div className="w-9 h-9 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/20">
                          <Package size={17} />
                        </div>
                      )}
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="font-bold text-white text-sm">{item.name}</span>
                          {item.isOrganic && (
                            <span className="bg-emerald-500/20 text-emerald-300 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Leaf size={9} /> Organic
                            </span>
                          )}
                          {item.isSpecialDeal && (
                            <span className="bg-amber-500/20 text-amber-300 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Sparkles size={9} /> Deal
                            </span>
                          )}
                          {item.isTrending && (
                            <span className="bg-rose-500/20 text-rose-300 text-[9px] font-bold px-1.5 py-0.2 rounded flex items-center gap-0.5">
                              <Flame size={9} /> Hot
                            </span>
                          )}
                        </div>
                        <span className="text-[10px] font-mono text-slate-500">{item._id}</span>
                      </div>
                    </div>
                  </td>
                  <td className="px-5 py-3.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-800 text-slate-300 text-[10px] font-medium">
                      {item.category?.name || item.category || 'General'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-slate-400 font-medium">
                    {item.unit || '1 piece'}
                  </td>
                  <td className="px-5 py-3.5 font-bold font-mono text-emerald-400">
                    {formatRupees(paiseToRupees(item.pricePaise ?? item.price ?? 0))}
                  </td>
                  <td className="px-5 py-3.5 font-mono text-slate-500 line-through">
                    {formatRupees(paiseToRupees(item.mrpPaise ?? item.mrp ?? item.originalPrice ?? 0))}
                  </td>
                  <td className="px-5 py-3.5 font-mono font-bold text-slate-200">
                    {item.stock?.available ?? item.stockQuantity ?? item.stock ?? 25} units
                  </td>
                  <td className="px-5 py-3.5">
                    <span
                      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                        item.isAvailable !== false
                          ? 'bg-emerald-500/10 text-emerald-400'
                          : 'bg-rose-500/10 text-rose-400'
                      }`}
                    >
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          item.isAvailable !== false ? 'bg-emerald-400' : 'bg-rose-400'
                        }`}
                      />
                      {item.isAvailable !== false ? 'Available' : 'Out of Stock'}
                    </span>
                  </td>
                  <td className="px-5 py-3.5 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <button
                        onClick={() => handleToggleAvailability(item._id)}
                        className={`px-2.5 py-1 rounded-lg text-xs font-semibold transition cursor-pointer ${
                          item.isAvailable !== false
                            ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                            : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                        }`}
                      >
                        {item.isAvailable !== false ? 'Sold Out' : 'Restock'}
                      </button>
                      <button
                        onClick={() => handleOpenEditModal(item)}
                        className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800 transition cursor-pointer"
                        title="Edit Item"
                      >
                        <Edit2 size={14} />
                      </button>
                      <button
                        onClick={() => handleDeleteProduct(item._id, item.name)}
                        className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                        title="Delete Item"
                      >
                        <Trash2 size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />

      {/* Add / Edit Product Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">
                {editingProduct ? 'Edit Grocery Item' : 'Add Grocery Item'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Amul Pure Ghee (1L), Fortune Sunflower Oil"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 cursor-pointer"
                  >
                    {categories.length > 0 ? (
                      categories.map((c) => {
                        const name = c.name || c;
                        return (
                          <option key={name} value={name}>
                            {name}
                          </option>
                        );
                      })
                    ) : (
                      <option value="Daily Staples">Daily Staples</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Unit / Pack Size</label>
                  <input
                    type="text"
                    placeholder="e.g. 1 kg, 500 ml, 1 bunch"
                    value={formData.unit}
                    onChange={(e) => setFormData({ ...formData, unit: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Selling Price (₹) *</label>
                  <input
                    type="number"
                    required
                    value={formData.price}
                    onChange={(e) => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">MRP Price (₹)</label>
                  <input
                    type="number"
                    value={formData.mrp}
                    onChange={(e) => setFormData({ ...formData, mrp: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Stock Count</label>
                  <input
                    type="number"
                    value={formData.stock}
                    onChange={(e) => setFormData({ ...formData, stock: Number(e.target.value) })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Image URL</label>
                <input
                  type="text"
                  placeholder="https://images.unsplash.com/..."
                  value={formData.imageUrl}
                  onChange={(e) => setFormData({ ...formData, imageUrl: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-emerald-500"
                />
              </div>

              {/* Badges Checklist */}
              <div className="flex items-center gap-4 pt-1">
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isOrganic}
                    onChange={(e) => setFormData({ ...formData, isOrganic: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-emerald-500 bg-slate-950 border-slate-800"
                  />
                  <span>Organic</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isSpecialDeal}
                    onChange={(e) => setFormData({ ...formData, isSpecialDeal: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-amber-500 bg-slate-950 border-slate-800"
                  />
                  <span>Special Deal</span>
                </label>
                <label className="flex items-center gap-1.5 text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={formData.isTrending}
                    onChange={(e) => setFormData({ ...formData, isTrending: e.target.checked })}
                    className="w-3.5 h-3.5 rounded text-rose-500 bg-slate-950 border-slate-800"
                  />
                  <span>Trending</span>
                </label>
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
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-bold shadow-lg shadow-emerald-600/20 cursor-pointer"
                >
                  {editingProduct ? 'Update Product' : 'Add Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
