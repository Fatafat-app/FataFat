import React, { useState, useEffect, useMemo } from 'react';
import { Tag, Plus, Trash2, Power, Calendar, Percent, DollarSign, X } from 'lucide-react';
import { api } from '../services/api';
import { useApp } from '../context/AppContext';
import { formatRupees, formatPaise, rupeesToPaise } from '../utils/formatters';
import { Pagination } from '../components/common/Pagination';

export const Coupons = () => {
  const { showToast } = useApp();
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(9);
  const [formData, setFormData] = useState({
    code: '',
    discountType: 'PERCENTAGE', // or FLAT
    discountValue: 20,
    minOrderAmount: 299,
    maxDiscount: 100,
    expiresInDays: 30,
    description: '',
  });

  const loadCoupons = async () => {
    setLoading(true);
    try {
      const items = await api.getCoupons();
      setCoupons(Array.isArray(items) ? items : []);
    } catch {
      // Fallback
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCoupons();
  }, []);

  const handleToggle = async (id) => {
    try {
      await api.toggleCoupon(id);
      showToast('Coupon status updated!');
      setCoupons((prev) =>
        prev.map((c) => (c._id === id ? { ...c, isActive: !c.isActive } : c))
      );
    } catch (err) {
      showToast(`Failed to toggle coupon: ${err.message}`, 'error');
    }
  };

  const handleDelete = async (id) => {
    try {
      await api.deleteCoupon(id);
      showToast('Coupon deleted!');
      setCoupons((prev) => prev.filter((c) => c._id !== id));
    } catch (err) {
      showToast(`Failed to delete coupon: ${err.message}`, 'error');
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    if (!formData.code.trim()) return;

    try {
      const expiry = new Date();
      expiry.setDate(expiry.getDate() + Number(formData.expiresInDays));

      await api.createCoupon({
        code: formData.code.trim().toUpperCase(),
        discountType: formData.discountType.toLowerCase(),
        discountPercentage: formData.discountType === 'PERCENTAGE' ? Number(formData.discountValue) : undefined,
        discountAmount: formData.discountType === 'FLAT' ? rupeesToPaise(formData.discountValue) : undefined,
        minOrderAmount: rupeesToPaise(formData.minOrderAmount),
        maxDiscount: rupeesToPaise(formData.maxDiscount),
        expiresAt: expiry.toISOString(),
        description: formData.description || `${formData.discountValue}% OFF on orders above ₹${formData.minOrderAmount}`,
        isActive: true,
      });

      showToast(`Coupon ${formData.code.toUpperCase()} created successfully!`);
      setIsModalOpen(false);
      setFormData({
        code: '',
        discountType: 'PERCENTAGE',
        discountValue: 20,
        minOrderAmount: 299,
        maxDiscount: 100,
        expiresInDays: 30,
        description: '',
      });
      loadCoupons();
    } catch (err) {
      showToast(`Failed to create coupon: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Coupons & Promo Codes</h2>
          <p className="text-xs text-slate-400">
            Create promotional discount codes for customer checkout on mobile app
          </p>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-bold shadow-lg shadow-orange-500/20 flex items-center gap-1.5 transition self-start sm:self-auto"
        >
          <Plus size={16} />
          <span>Create Promo Code</span>
        </button>
      </div>

      {/* Grid of Coupons */}
      {coupons.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-slate-900/60 border border-slate-800 space-y-2">
          <Tag size={36} className="mx-auto text-slate-600" />
          <h4 className="font-bold text-slate-300 text-sm">No Active Coupons Found</h4>
          <p className="text-xs text-slate-500">
            Click "Create Promo Code" to launch your first promotional offer.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {coupons.slice((page - 1) * pageSize, page * pageSize).map((coupon) => (
            <div
              key={coupon._id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 flex flex-col justify-between space-y-4 hover:border-slate-700 transition"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-mono text-sm font-black tracking-wider px-2.5 py-1 rounded-lg bg-orange-500/10 text-orange-400 border border-orange-500/20">
                    {coupon.code}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                      coupon.isActive
                        ? 'bg-emerald-500/10 text-emerald-400'
                        : 'bg-slate-800 text-slate-500'
                    }`}
                  >
                    {coupon.isActive ? 'ACTIVE' : 'INACTIVE'}
                  </span>
                </div>

                <p className="text-xs text-slate-300 font-medium">{coupon.description || 'Special Discount Offer'}</p>

                <div className="pt-1 space-y-1 text-slate-400 text-[11px]">
                  <p>
                    Min Order:{' '}
                    <span className="text-slate-200 font-bold">
                      {formatPaise(coupon.minOrderAmount)}
                    </span>
                  </p>
                  {coupon.maxDiscount && (
                    <p>
                      Max Discount:{' '}
                      <span className="text-slate-200 font-bold">
                        {formatPaise(coupon.maxDiscount)}
                      </span>
                    </p>
                  )}
                  {coupon.expiresAt && (
                    <p className="flex items-center gap-1 text-slate-500">
                      <Calendar size={12} />
                      <span>Expires: {new Date(coupon.expiresAt).toLocaleDateString()}</span>
                    </p>
                  )}
                </div>
              </div>

              <div className="pt-3 border-t border-slate-800 flex items-center justify-between">
                <button
                  onClick={() => handleToggle(coupon._id)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer ${
                    coupon.isActive
                      ? 'bg-rose-500/10 text-rose-300 hover:bg-rose-500/20 border border-rose-500/30'
                      : 'bg-emerald-500/10 text-emerald-300 hover:bg-emerald-500/20 border border-emerald-500/30'
                  }`}
                >
                  <Power size={13} />
                  <span>{coupon.isActive ? 'Deactivate' : 'Activate'}</span>
                </button>

                <button
                  onClick={() => handleDelete(coupon._id)}
                  className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-slate-800 transition cursor-pointer"
                  title="Delete Coupon"
                >
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={coupons.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
        pageSizeOptions={[6, 9, 18]}
      />

      {/* Create Coupon Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h3 className="font-bold text-white text-base">Create Promo Code</h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-white">
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="block font-semibold text-slate-300 mb-1">Coupon Code *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FATAFAT50, WELCOME100"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white font-mono uppercase focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Discount Type</label>
                  <select
                    value={formData.discountType}
                    onChange={(e) => setFormData({ ...formData, discountType: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500"
                  >
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">
                    {formData.discountType === 'PERCENTAGE' ? 'Discount %' : 'Flat Off (₹)'}
                  </label>
                  <input
                    type="number"
                    value={formData.discountValue}
                    onChange={(e) => setFormData({ ...formData, discountValue: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Min Order Amount (₹)</label>
                  <input
                    type="number"
                    value={formData.minOrderAmount}
                    onChange={(e) => setFormData({ ...formData, minOrderAmount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-slate-300 mb-1">Max Cap (₹)</label>
                  <input
                    type="number"
                    value={formData.maxDiscount}
                    onChange={(e) => setFormData({ ...formData, maxDiscount: e.target.value })}
                    className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-white focus:outline-none focus:border-orange-500 font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Validity (In Days)</label>
                <input
                  type="number"
                  value={formData.expiresInDays}
                  onChange={(e) => setFormData({ ...formData, expiresInDays: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500 font-mono"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-300 mb-1">Offer Description</label>
                <input
                  type="text"
                  placeholder="e.g. 50% OFF up to ₹100 on orders above ₹299"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold"
                >
                  Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
