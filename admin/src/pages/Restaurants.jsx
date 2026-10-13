import React, { useState, useMemo } from 'react';
import {
  Store,
  Plus,
  Search,
  Star,
  MapPin,
  Phone,
  Power,
  Percent,
  CheckCircle,
  X,
  UtensilsCrossed,
  ShieldCheck,
  ShieldAlert,
  Trash2,
  Edit2,
  RefreshCw,
  Leaf,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';
import { formatRupees, rupeesToPaise } from '../utils/formatters';
import { Pagination } from '../components/common/Pagination';

export const Restaurants = () => {
  const { restaurants, toggleRestaurantStatus, showToast, refetchAll } = useApp();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newRest, setNewRest] = useState({
    name: '',
    category: 'Food',
    cuisine: '',
    locality: '',
    phone: '',
    commissionRate: 18,
  });

  // Menu Modal State
  const [selectedRestForMenu, setSelectedRestForMenu] = useState(null);
  const [menuCategories, setMenuCategories] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(false);
  const [dishSearch, setDishSearch] = useState('');
  const [activeMenuCat, setActiveMenuCat] = useState('ALL');

  // Add Dish Modal State
  const [isAddDishOpen, setIsAddDishOpen] = useState(false);
  const [newDish, setNewDish] = useState({
    name: '',
    categoryName: 'Main Course',
    price: '',
    description: '',
    isVeg: true,
    image: '',
  });

  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);

  const filtered = useMemo(() => {
    const q = search.toLowerCase().trim();
    return restaurants.filter((r) => {
      const matchCat = selectedCategory === 'ALL' || r.category === selectedCategory;
      const matchSearch =
        !q ||
        (r.name || '').toLowerCase().includes(q) ||
        (r.cuisine || '').toLowerCase().includes(q) ||
        (r.locality || '').toLowerCase().includes(q);
      return matchCat && matchSearch;
    });
  }, [restaurants, selectedCategory, search]);

  const paginatedRestaurants = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filtered.slice(start, start + pageSize);
  }, [filtered, page, pageSize]);

  const handleAddRestaurant = async (e) => {
    e.preventDefault();
    if (!newRest.name || !newRest.cuisine) {
      showToast('Please fill all required fields', 'error');
      return;
    }

    try {
      await api.createRestaurant({
        name: newRest.name,
        type: newRest.category === 'Grocery' ? 'grocery' : 'restaurant',
        cuisines: newRest.cuisine.split(',').map((s) => s.trim()),
        phone: newRest.phone || '+91 98000 00000',
        commissionRate: Number(newRest.commissionRate),
        address: {
          line1: newRest.locality || 'City Centre',
          city: 'Noida',
        },
      });

      setIsModalOpen(false);
      setNewRest({
        name: '',
        category: 'Food',
        cuisine: '',
        locality: '',
        phone: '',
        commissionRate: 18,
      });
      showToast(`Store ${newRest.name} onboarded and saved to MongoDB!`);
      refetchAll();
    } catch (err) {
      showToast(`Failed to onboard store: ${err.message}`, 'error');
    }
  };

  const handleToggleVerification = async (rest) => {
    const nextVal = !rest.isVerified;
    try {
      await api.updateRestaurantStatus(rest.id, { isVerified: nextVal });
      showToast(`${rest.name} verification status set to ${nextVal ? 'VERIFIED' : 'UNVERIFIED'}`);
      refetchAll();
    } catch (err) {
      showToast(`Failed to update verification: ${err.message}`, 'error');
    }
  };

  // Open Menu Management
  const handleOpenMenu = async (rest) => {
    setSelectedRestForMenu(rest);
    setDishSearch('');
    setActiveMenuCat('ALL');
    setLoadingMenu(true);
    try {
      const data = await api.getRestaurantMenu(rest.id);
      setMenuCategories(Array.isArray(data) ? data : []);
    } catch (err) {
      showToast(`Could not load store menu: ${err.message}`, 'error');
      setMenuCategories([]);
    } finally {
      setLoadingMenu(false);
    }
  };

  const handleToggleDish = async (dish) => {
    if (!selectedRestForMenu) return;
    try {
      await api.toggleRestaurantMenuItemAvailability(selectedRestForMenu.id, dish._id);
      setMenuCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: (cat.items || []).map((it) =>
            it._id === dish._id ? { ...it, isAvailable: !it.isAvailable } : it
          ),
        }))
      );
      showToast(`Availability updated for ${dish.name}!`);
    } catch (err) {
      showToast(`Failed to toggle dish: ${err.message}`, 'error');
    }
  };

  const handleDeleteDish = async (dish) => {
    if (!selectedRestForMenu) return;
    if (!window.confirm(`Permanently remove "${dish.name}" from ${selectedRestForMenu.name}?`)) return;
    try {
      await api.deleteRestaurantMenuItem(selectedRestForMenu.id, dish._id);
      setMenuCategories((prev) =>
        prev.map((cat) => ({
          ...cat,
          items: (cat.items || []).filter((it) => it._id !== dish._id),
        }))
      );
      showToast(`Dish "${dish.name}" deleted!`);
    } catch (err) {
      showToast(`Failed to delete dish: ${err.message}`, 'error');
    }
  };

  const handleAddDish = async (e) => {
    e.preventDefault();
    if (!selectedRestForMenu || !newDish.name.trim() || !newDish.price) return;
    try {
      await api.addRestaurantMenuItem(selectedRestForMenu.id, {
        name: newDish.name.trim(),
        category: newDish.categoryName,
        price: rupeesToPaise(newDish.price),
        description: newDish.description.trim(),
        isVeg: Boolean(newDish.isVeg),
        isAvailable: true,
        images: newDish.image ? [newDish.image] : [],
      });
      showToast(`"${newDish.name}" added to menu!`);
      setIsAddDishOpen(false);
      setNewDish({
        name: '',
        categoryName: 'Main Course',
        price: '',
        description: '',
        isVeg: true,
        image: '',
      });
      handleOpenMenu(selectedRestForMenu);
    } catch (err) {
      showToast(`Failed to add dish: ${err.message}`, 'error');
    }
  };

  // Flatten menu items for filtering
  const allDishes = menuCategories.flatMap((cat) =>
    (cat.items || []).map((it) => ({
      ...it,
      catName: cat.name || 'General',
    }))
  );

  const filteredDishes = allDishes.filter((dish) => {
    const matchCat = activeMenuCat === 'ALL' || dish.catName === activeMenuCat;
    const matchSearch =
      dish.name.toLowerCase().includes(dishSearch.toLowerCase()) ||
      (dish.description || '').toLowerCase().includes(dishSearch.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">
            Restaurants & Merchant Stores
          </h2>
          <p className="text-xs text-slate-400">
            Manage vendor onboarding, verified badges, menus, dishes, and open/close status
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition self-start sm:self-auto cursor-pointer"
        >
          <Plus size={16} />
          <span>Onboard New Partner</span>
        </button>
      </div>

      {/* Filters & Search */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          {['ALL', 'Food', 'Grocery'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                selectedCategory === cat
                  ? 'bg-slate-200 text-slate-900 font-bold'
                  : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
              }`}
            >
              {cat === 'ALL' ? 'All Partners' : cat}
            </button>
          ))}
        </div>

        <div className="relative w-full sm:w-72">
          <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            placeholder="Search by restaurant name, cuisine..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-1.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {paginatedRestaurants.map((rest) => (
          <div
            key={rest.id}
            className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4 flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded-md ${
                        rest.category === 'Grocery'
                          ? 'bg-emerald-500/20 text-emerald-300'
                          : 'bg-orange-500/20 text-orange-300'
                      }`}
                    >
                      {rest.category}
                    </span>
                    <button
                      onClick={() => handleToggleVerification(rest)}
                      title="Click to toggle store verification"
                      className={`flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-md transition cursor-pointer ${
                        rest.isVerified
                          ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                          : 'bg-slate-800 text-slate-400 hover:text-slate-200'
                      }`}
                    >
                      {rest.isVerified ? (
                        <>
                          <ShieldCheck size={11} className="text-blue-400" /> Verified
                        </>
                      ) : (
                        <>
                          <ShieldAlert size={11} /> Unverified
                        </>
                      )}
                    </button>
                    <span className="text-[11px] font-mono text-slate-500 truncate max-w-[100px]">{rest.id}</span>
                  </div>
                  <h3 className="font-bold text-white text-base mt-1.5">{rest.name}</h3>
                  <p className="text-xs text-slate-400 line-clamp-1">{rest.cuisine}</p>
                </div>

                <div className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 rounded-lg text-amber-300 text-xs font-bold shrink-0">
                  <Star size={12} fill="currentColor" />
                  <span>
                    {typeof rest.rating === 'object' && rest.rating !== null
                      ? rest.rating.average || 4.5
                      : rest.rating || 4.5}
                  </span>
                </div>
              </div>

              <div className="space-y-1.5 text-xs text-slate-400">
                <div className="flex items-center gap-1.5">
                  <MapPin size={13} className="text-slate-500 shrink-0" />
                  <span className="truncate">{rest.locality}</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Phone size={13} className="text-slate-500 shrink-0" />
                  <span>{rest.phone}</span>
                </div>
              </div>

              <div className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex items-center justify-between text-xs">
                <span className="text-slate-400 flex items-center gap-1">
                  <Percent size={13} className="text-orange-400" /> Commission:
                </span>
                <span className="font-bold text-slate-200">{rest.commissionRate}%</span>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="pt-3 border-t border-slate-800/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2.5 h-2.5 rounded-full ${
                      rest.isOpen ? 'bg-emerald-400 animate-pulse' : 'bg-slate-600'
                    }`}
                  />
                  <span
                    className={`text-xs font-bold ${
                      rest.isOpen ? 'text-emerald-400' : 'text-slate-500'
                    }`}
                  >
                    {rest.isOpen ? 'ACCEPTING ORDERS' : 'STORE CLOSED'}
                  </span>
                </div>

                <button
                  onClick={() => toggleRestaurantStatus(rest.id)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    rest.isOpen
                      ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                  }`}
                >
                  <Power size={13} />
                  <span>{rest.isOpen ? 'Force Close' : 'Open Store'}</span>
                </button>
              </div>

              {/* Menu Management Button */}
              <button
                onClick={() => handleOpenMenu(rest)}
                className="w-full py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-800 text-orange-400 text-xs font-bold flex items-center justify-center gap-1.5 border border-slate-700/60 transition cursor-pointer"
              >
                <UtensilsCrossed size={14} />
                <span>Manage Store Menu & Dishes</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={filtered.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[6, 9, 18, 30]}
      />

      {/* Menu Management Modal */}
      {selectedRestForMenu && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-orange-500/20 text-orange-400 flex items-center justify-center">
                  <UtensilsCrossed size={20} />
                </div>
                <div>
                  <h3 className="font-extrabold text-white text-base">
                    {selectedRestForMenu.name} — Menu & Dishes
                  </h3>
                  <p className="text-xs text-slate-400">
                    Live menu items, dish availability toggles, and pricing controls
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => setIsAddDishOpen(true)}
                  className="px-3 py-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <Plus size={14} />
                  <span>Add Dish</span>
                </button>
                <button
                  onClick={() => setSelectedRestForMenu(null)}
                  className="p-1.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer"
                >
                  <X size={18} />
                </button>
              </div>
            </div>

            {/* Sub-bar: Search & Categories */}
            <div className="p-4 border-b border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 bg-slate-900/40">
              <div className="flex items-center gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0">
                <button
                  onClick={() => setActiveMenuCat('ALL')}
                  className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                    activeMenuCat === 'ALL'
                      ? 'bg-orange-500 text-white'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  All Items ({allDishes.length})
                </button>
                {menuCategories.map((c) => (
                  <button
                    key={c._id || c.name}
                    onClick={() => setActiveMenuCat(c.name)}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold whitespace-nowrap cursor-pointer ${
                      activeMenuCat === c.name
                        ? 'bg-orange-500 text-white'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    {c.name} ({(c.items || []).length})
                  </button>
                ))}
              </div>

              <div className="relative w-full sm:w-64">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
                <input
                  type="text"
                  placeholder="Search dishes..."
                  value={dishSearch}
                  onChange={(e) => setDishSearch(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-3 py-1 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-orange-500"
                />
              </div>
            </div>

            {/* Dishes Content */}
            <div className="flex-1 overflow-y-auto p-5">
              {loadingMenu ? (
                <div className="py-12 flex flex-col items-center justify-center text-slate-400 gap-2">
                  <RefreshCw size={24} className="animate-spin text-orange-500" />
                  <span className="text-xs">Loading store menu from database...</span>
                </div>
              ) : filteredDishes.length === 0 ? (
                <div className="py-12 text-center text-slate-500 space-y-2">
                  <p className="text-sm">No dishes found in this category.</p>
                  <button
                    onClick={() => setIsAddDishOpen(true)}
                    className="text-xs font-bold text-orange-400 hover:underline cursor-pointer"
                  >
                    + Add the first dish to this menu
                  </button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                  {filteredDishes.map((dish) => (
                    <div
                      key={dish._id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-start justify-between gap-3 hover:border-slate-700 transition"
                    >
                      <div className="space-y-1 flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span
                            className={`w-3.5 h-3.5 rounded flex items-center justify-center border text-[9px] font-bold ${
                              dish.isVeg
                                ? 'border-emerald-500 text-emerald-400'
                                : 'border-rose-500 text-rose-400'
                            }`}
                          >
                            ●
                          </span>
                          <h4 className="font-bold text-white text-sm truncate">{dish.name}</h4>
                          <span className="text-[10px] bg-slate-800 text-slate-400 px-1.5 py-0.5 rounded font-medium">
                            {dish.catName}
                          </span>
                        </div>
                        <p className="text-xs font-mono font-bold text-emerald-400">
                          {formatRupees(dish.price ? dish.price / 100 : 0)}
                        </p>
                        {dish.description && (
                          <p className="text-[11px] text-slate-400 line-clamp-2">{dish.description}</p>
                        )}
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={() => handleToggleDish(dish)}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition cursor-pointer ${
                            dish.isAvailable !== false
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-rose-500/10 hover:text-rose-400 hover:border-rose-500/20'
                              : 'bg-rose-500/10 text-rose-400 border border-rose-500/20 hover:bg-emerald-500/10 hover:text-emerald-400 hover:border-emerald-500/20'
                          }`}
                        >
                          {dish.isAvailable !== false ? 'In Stock' : 'Sold Out'}
                        </button>
                        <button
                          onClick={() => handleDeleteDish(dish)}
                          className="p-1 rounded text-slate-500 hover:text-rose-400 hover:bg-slate-900 transition cursor-pointer"
                          title="Delete Dish"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Add Dish Modal */}
      {isAddDishOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Add Dish to Menu</h3>
              <button onClick={() => setIsAddDishOpen(false)} className="text-slate-400 hover:text-white cursor-pointer">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddDish} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Dish / Item Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Paneer Butter Masala, Chicken Dum Biryani"
                  value={newDish.name}
                  onChange={(e) => setNewDish({ ...newDish, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Price (₹) *</label>
                  <input
                    type="number"
                    required
                    placeholder="e.g. 249"
                    value={newDish.price}
                    onChange={(e) => setNewDish({ ...newDish, price: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Category</label>
                  <input
                    type="text"
                    placeholder="e.g. Main Course, Starters"
                    value={newDish.categoryName}
                    onChange={(e) => setNewDish({ ...newDish, categoryName: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Description</label>
                <textarea
                  rows={2}
                  placeholder="Rich creamy gravy cooked with farm fresh paneer cubes..."
                  value={newDish.description}
                  onChange={(e) => setNewDish({ ...newDish, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="flex items-center gap-4">
                <label className="flex items-center gap-2 cursor-pointer text-slate-300">
                  <input
                    type="checkbox"
                    checked={newDish.isVeg}
                    onChange={(e) => setNewDish({ ...newDish, isVeg: e.target.checked })}
                    className="w-4 h-4 rounded text-orange-500 bg-slate-950 border-slate-800"
                  />
                  <span>Pure Vegetarian (Veg)</span>
                </label>
              </div>

              <div className="pt-2 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddDishOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 cursor-pointer"
                >
                  Save Dish
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Onboarding Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-lg p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Onboard New Merchant Partner</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white cursor-pointer"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddRestaurant} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Store / Restaurant Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chai Point, Behrouz Biryani"
                  value={newRest.name}
                  onChange={(e) => setNewRest({ ...newRest, name: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Vertical *</label>
                  <select
                    value={newRest.category}
                    onChange={(e) => setNewRest({ ...newRest, category: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="Food">Food & Restaurants</option>
                    <option value="Grocery">Quick Grocery / Mart</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Commission %</label>
                  <input
                    type="number"
                    value={newRest.commissionRate}
                    onChange={(e) =>
                      setNewRest({ ...newRest, commissionRate: Number(e.target.value) })
                    }
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">
                  Cuisines / Specialties *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. North Indian, Biryani, Mughlai"
                  value={newRest.cuisine}
                  onChange={(e) => setNewRest({ ...newRest, cuisine: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Locality / Area</label>
                  <input
                    type="text"
                    placeholder="e.g. Sector 18, Indirapuram"
                    value={newRest.locality}
                    onChange={(e) => setNewRest({ ...newRest, locality: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Contact Phone</label>
                  <input
                    type="text"
                    placeholder="+91 98000 00000"
                    value={newRest.phone}
                    onChange={(e) => setNewRest({ ...newRest, phone: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                  />
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
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
