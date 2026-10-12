import React from 'react';
import {
  TrendingUp,
  ShoppingBag,
  Bike,
  Clock,
  ArrowUpRight,
  ChevronRight,
  Store,
  AlertCircle,
  CloudRain,
  ShieldAlert,
  CheckCircle2,
  DollarSign,
} from 'lucide-react';
import { useApp } from '../context/AppContext';
import { formatPaise } from '../utils/formatters';
import { Link } from 'react-router-dom';

export const Dashboard = () => {
  const { stats, orders, remoteConfig, toggleRainSurge, toggleMaintenanceMode } = useApp();

  const pendingOrders = orders.filter((o) => o.status === 'PENDING');
  const liveOrders = orders.filter((o) => o.status !== 'DELIVERED' && o.status !== 'CANCELLED');

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Top Banner if Maintenance or Rain Surge */}
      {remoteConfig.isMaintenanceMode && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/30 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <ShieldAlert className="text-rose-400 shrink-0" size={24} />
            <div>
              <h3 className="font-bold text-rose-300 text-sm">Consumer Apps Under Maintenance</h3>
              <p className="text-xs text-rose-300/80">
                Checkout and ordering are blocked on all iOS & Android apps. Message shown:{' '}
                <span className="italic">"{remoteConfig.maintenanceMessage}"</span>
              </p>
            </div>
          </div>
          <button
            onClick={toggleMaintenanceMode}
            className="px-4 py-1.5 rounded-xl bg-rose-500 hover:bg-rose-600 text-white font-semibold text-xs transition"
          >
            Turn Off Maintenance
          </button>
        </div>
      )}

      {/* Welcome & Headline */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight">Ops Command Center</h2>
          <p className="text-xs text-slate-400">
            Real-time food delivery & quick commerce analytics and control tower.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <Link
            to="/orders"
            className="px-4 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white text-xs font-semibold shadow-lg shadow-orange-500/20 flex items-center gap-2 transition"
          >
            <ShoppingBag size={15} />
            <span>View Active Orders ({liveOrders.length})</span>
          </Link>
          <Link
            to="/remote-config"
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition"
          >
            Config Settings
          </Link>
        </div>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Today's GMV */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Today's GMV</span>
            <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
              <DollarSign size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {formatPaise(stats.todayGmv)}
            </span>
            <span className="text-xs text-emerald-400 font-semibold flex items-center">
              <TrendingUp size={12} className="mr-0.5" />
              {stats.gmvGrowth}
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">vs ₹41,340 yesterday</p>
        </div>

        {/* Total Orders Today */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Orders Processed</span>
            <div className="w-8 h-8 rounded-xl bg-orange-500/10 text-orange-400 flex items-center justify-center">
              <ShoppingBag size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats.totalOrdersToday}
            </span>
            <span className="text-xs text-orange-400 font-semibold">
              {pendingOrders.length} pending
            </span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Avg fulfillment time: 24 mins</p>
        </div>

        {/* Active Riders */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Fleet On Road</span>
            <div className="w-8 h-8 rounded-xl bg-blue-500/10 text-blue-400 flex items-center justify-center">
              <Bike size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span className="text-2xl font-bold text-white tracking-tight">
              {stats.activeRiders} Riders
            </span>
            <span className="text-xs text-blue-400 font-semibold">92% active</span>
          </div>
          <p className="text-[11px] text-slate-500 mt-1">Noida & Gurugram clusters</p>
        </div>

        {/* Dynamic Pricing Engine Card */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 backdrop-blur relative overflow-hidden group hover:border-slate-700 transition">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-400">Rain & Surge Engine</span>
            <div
              className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                remoteConfig.rainSurgeActive
                  ? 'bg-amber-500/20 text-amber-300'
                  : 'bg-slate-800 text-slate-400'
              }`}
            >
              <CloudRain size={16} />
            </div>
          </div>
          <div className="mt-3 flex items-baseline gap-2">
            <span
              className={`text-xl font-bold tracking-tight ${
                remoteConfig.rainSurgeActive ? 'text-amber-300' : 'text-slate-300'
              }`}
            >
              {remoteConfig.rainSurgeActive ? `Surge ₹${remoteConfig.rainSurgeFee}` : 'Standard Slabs'}
            </span>
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="text-[11px] text-slate-500">
              {remoteConfig.rainSurgeActive ? 'Compensating delivery partners' : 'Normal weather conditions'}
            </span>
            <button
              onClick={toggleRainSurge}
              className="text-[10px] font-bold text-orange-400 hover:underline"
            >
              Toggle
            </button>
          </div>
        </div>
      </div>

      {/* Main Grid: Live Orders Feed & Operational Slabs */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Live Orders Stream */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">Live Order Stream</h3>
              <p className="text-xs text-slate-400">Orders placed across web & mobile in real-time</p>
            </div>
            <Link
              to="/orders"
              className="text-xs font-semibold text-orange-400 hover:text-orange-300 flex items-center gap-1"
            >
              <span>Manage All</span>
              <ChevronRight size={14} />
            </Link>
          </div>

          <div className="space-y-3">
            {orders.length === 0 ? (
              <div className="p-8 text-center rounded-xl bg-slate-950/40 border border-slate-800 space-y-1">
                <p className="text-xs font-semibold text-slate-300">No orders in database yet</p>
                <p className="text-[11px] text-slate-500">
                  New orders placed via the mobile app will be streamed and displayed here in real time.
                </p>
              </div>
            ) : (
              orders.slice(0, 4).map((order) => (
                <div
                  key={order.id}
                  className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:border-slate-700 transition"
                >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-orange-400">{order.id}</span>
                    <span className="text-xs font-semibold text-slate-200">{order.customerName}</span>
                    <span className="text-[11px] text-slate-500">• {order.placedAt}</span>
                  </div>
                  <p className="text-xs text-slate-300">
                    {order.restaurantName} —{' '}
                    <span className="text-slate-400">
                      {order.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}
                    </span>
                  </p>
                  <p className="text-[11px] text-slate-500">
                    Rider: <span className="text-slate-300">{order.riderName}</span> | Payment:{' '}
                    <span className="text-slate-300">{order.paymentMethod}</span>
                  </p>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0">
                  <div className="text-right">
                    <p className="font-bold text-white text-sm">{formatPaise(order.totalAmount)}</p>
                    <span
                      className={`inline-block px-2 py-0.5 rounded-md text-[10px] font-bold ${
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
              </div>
            ))
          )}
        </div>
        </div>

        {/* Right Col: Quick Controls & App Remote Config Status */}
        <div className="p-5 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div>
            <h3 className="font-bold text-white text-base">Client App Controls</h3>
            <p className="text-xs text-slate-400">Server-driven parameters synced to mobile app</p>
          </div>

          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">Force Update (Min Version)</p>
                <p className="text-[11px] text-slate-400">
                  Target: v{remoteConfig.minSupportedVersion}
                </p>
              </div>
              <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                v{remoteConfig.latestVersion}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">Base Delivery Fee</p>
                <p className="text-[11px] text-slate-400">
                  Up to {remoteConfig.baseDeliveryDistanceKm} km
                </p>
              </div>
              <span className="text-xs font-bold text-orange-400">
                ₹{remoteConfig.baseDeliveryFee}
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">Extra Distance Fee</p>
                <p className="text-[11px] text-slate-400">Per km above base</p>
              </div>
              <span className="text-xs font-bold text-slate-200">
                ₹{remoteConfig.extraFeePerKm}/km
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 flex items-center justify-between">
              <div>
                <p className="text-xs font-semibold text-slate-200">Night Surcharge</p>
                <p className="text-[11px] text-slate-400">11:00 PM – 06:00 AM</p>
              </div>
              <span className="text-xs font-bold text-slate-200">
                ₹{remoteConfig.nightDeliveryFee}
              </span>
            </div>
          </div>

          <div className="pt-2">
            <Link
              to="/remote-config"
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition border border-slate-700"
            >
              <span>Edit Delivery Slabs & Flags</span>
              <ChevronRight size={14} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};
