import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Bike,
  Clock,
  Phone,
  MapPin,
  AlertTriangle,
  ArrowRight,
  Volume2,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatRupees } from '../utils/formatters';
import { Pagination } from '../components/common/Pagination';

export const LiveOrders = () => {
  const { orders, updateOrderStatus, audioChimeEnabled, setAudioChimeEnabled } = useApp();
  const [selectedFilter, setSelectedFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const filters = useMemo(
    () => [
      { key: 'ALL', label: 'All Orders', count: orders.length },
      {
        key: 'PENDING',
        label: 'Pending',
        count: orders.filter((o) => o.status === 'PENDING').length,
      },
      {
        key: 'PREPARING',
        label: 'Preparing',
        count: orders.filter((o) => o.status === 'PREPARING').length,
      },
      {
        key: 'OUT_FOR_DELIVERY',
        label: 'Out for Delivery',
        count: orders.filter((o) => o.status === 'OUT_FOR_DELIVERY').length,
      },
      {
        key: 'DELIVERED',
        label: 'Delivered',
        count: orders.filter((o) => o.status === 'DELIVERED').length,
      },
      {
        key: 'CANCELLED',
        label: 'Cancelled',
        count: orders.filter((o) => o.status === 'CANCELLED').length,
      },
    ],
    [orders]
  );

  const filteredOrders = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return orders.filter((order) => {
      const matchesFilter = selectedFilter === 'ALL' || order.status === selectedFilter;
      const matchesSearch =
        !q ||
        (order.id || '').toLowerCase().includes(q) ||
        (order.customerName || '').toLowerCase().includes(q) ||
        (order.customerPhone || '').includes(q) ||
        (order.restaurantName || '').toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  }, [orders, selectedFilter, searchQuery]);

  const paginatedOrders = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredOrders.slice(start, start + pageSize);
  }, [filteredOrders, page, pageSize]);

  const handleFilterChange = (key) => {
    setSelectedFilter(key);
    setPage(1);
  };

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Live Order Dispatch</h2>
          <p className="text-xs text-slate-400">
            Real-time order statuses, rider assignment, and customer fulfillment controls
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="relative">
            <Search
              size={15}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
            />
            <input
              type="text"
              placeholder="Filter by Order ID, name, phone..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-slate-900 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-orange-500 transition w-64"
            />
          </div>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-800/80">
        {filters.map((f) => (
          <button
            key={f.key}
            onClick={() => handleFilterChange(f.key)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-2 cursor-pointer ${
              selectedFilter === f.key
                ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                : 'bg-slate-900 text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <span>{f.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                selectedFilter === f.key
                  ? 'bg-orange-600 text-white'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              {f.count}
            </span>
          </button>
        ))}
      </div>

      {/* Orders Grid / List */}
      <div className="grid grid-cols-1 gap-4">
        {filteredOrders.length === 0 ? (
          <div className="p-12 text-center rounded-2xl bg-slate-900/40 border border-slate-800">
            <ShoppingBag className="mx-auto text-slate-600 mb-2" size={36} />
            <p className="text-sm font-semibold text-slate-300">No orders found in this view</p>
            <p className="text-xs text-slate-500">Try changing the search query or status filter.</p>
          </div>
        ) : (
          paginatedOrders.map((order) => (
            <div
              key={order.id}
              className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 hover:border-slate-700 transition space-y-4 shadow-xl"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
                <div className="flex items-center gap-3">
                  <span className="font-mono text-sm font-bold text-orange-400 bg-orange-500/10 px-2.5 py-1 rounded-lg border border-orange-500/20">
                    {order.id}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white">{order.restaurantName}</h4>
                    <p className="text-xs text-slate-400 flex items-center gap-1.5">
                      <span>Customer: {order.customerName}</span>
                      <span>•</span>
                      <Phone size={12} className="text-slate-500" />
                      <span>{order.customerPhone}</span>
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-extrabold text-white">{formatRupees(order.totalAmount)}</p>
                    <p className="text-[11px] text-slate-400 uppercase font-mono">
                      {order.paymentMethod}
                    </p>
                  </div>

                  <span
                    className={`px-3 py-1 rounded-lg text-xs font-bold ${
                      order.status === 'PREPARING'
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : order.status === 'PENDING'
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : order.status === 'OUT_FOR_DELIVERY'
                        ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        : order.status === 'DELIVERED'
                        ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {order.status}
                  </span>
                </div>
              </div>

              {/* Order Details & Items */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
                {/* Items */}
                <div className="space-y-1.5 md:col-span-2">
                  <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
                    Order Items
                  </p>
                  <div className="space-y-1">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between py-1 border-b border-slate-800/40"
                      >
                        <span className="text-slate-200">
                          <span className="font-bold text-orange-400">{item.qty}x</span> {item.name}
                        </span>
                        <span className="text-slate-400">{formatRupees(item.price * item.qty)}</span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-center gap-1.5 text-slate-400 pt-1">
                    <MapPin size={13} className="text-slate-500 shrink-0" />
                    <span className="text-[11px] text-slate-300">{order.address}</span>
                  </div>
                </div>

                {/* Rider Info & Actions */}
                <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800/80 flex flex-col justify-between">
                  <div>
                    <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                      <Bike size={13} className="text-blue-400" />
                      Delivery Partner
                    </p>
                    <p className="text-xs font-bold text-slate-200 mt-1">{order.riderName}</p>
                    <p className="text-[11px] text-slate-500">{order.riderPhone}</p>
                  </div>

                  {/* Operational Status Action Buttons */}
                  <div className="pt-3 border-t border-slate-800/60 mt-3 flex items-center gap-2">
                    {order.status === 'PENDING' && (
                      <>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'PREPARING')}
                          className="flex-1 py-1.5 rounded-lg bg-orange-500 hover:bg-orange-600 text-white font-semibold text-xs transition cursor-pointer"
                        >
                          Accept & Prep
                        </button>
                        <button
                          onClick={() => updateOrderStatus(order.id, 'CANCELLED')}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs transition cursor-pointer"
                        >
                          Reject
                        </button>
                      </>
                    )}

                    {order.status === 'PREPARING' && (
                      <div className="w-full flex items-center gap-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'OUT_FOR_DELIVERY')}
                          className="flex-1 py-1.5 rounded-lg bg-blue-500 hover:bg-blue-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <Bike size={14} />
                          <span>Handover to Rider</span>
                        </button>
                        <button
                          onClick={() => {
                            const reason = window.prompt('Enter cancellation reason:', 'Kitchen out of stock');
                            if (reason) updateOrderStatus(order.id, 'CANCELLED', reason);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs transition cursor-pointer"
                          title="Force Cancel Order"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {order.status === 'OUT_FOR_DELIVERY' && (
                      <div className="w-full flex items-center gap-2">
                        <button
                          onClick={() => updateOrderStatus(order.id, 'DELIVERED')}
                          className="flex-1 py-1.5 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                        >
                          <CheckCircle size={14} />
                          <span>Confirm Delivered</span>
                        </button>
                        <button
                          onClick={() => {
                            const reason = window.prompt('Enter cancellation reason:', 'Customer unreachable');
                            if (reason) updateOrderStatus(order.id, 'CANCELLED', reason);
                          }}
                          className="px-2.5 py-1.5 rounded-lg bg-slate-900 hover:bg-rose-500/20 text-rose-400 font-semibold text-xs transition cursor-pointer"
                          title="Force Cancel Order"
                        >
                          Cancel
                        </button>
                      </div>
                    )}

                    {order.status === 'DELIVERED' && (
                      <span className="text-[11px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle size={14} /> Fulfilled successfully
                      </span>
                    )}

                    {order.status === 'CANCELLED' && (
                      <span className="text-[11px] text-rose-400 font-semibold flex items-center gap-1">
                        <XCircle size={14} /> Order Cancelled
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      <Pagination
        currentPage={page}
        totalItems={filteredOrders.length}
        pageSize={pageSize}
        onPageChange={setPage}
        onPageSizeChange={setPageSize}
      />
    </div>
  );
};
