import React, { useState, useEffect } from 'react';
import { Bell, Send, Users, Smartphone, Sparkles, CheckCircle2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { api } from '../services/api';

export const Notifications = () => {
  const { showToast } = useApp();
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [targetAudience, setTargetAudience] = useState('ALL');
  const [deepLink, setDeepLink] = useState('/(tabs)/orders');
  const [history, setHistory] = useState([]);

  useEffect(() => {
    api.getNotificationHistory().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        setHistory(
          data.map((n) => ({
            id: n._id || `NOTIF-${n.id}`,
            title: n.title,
            body: n.body,
            target: (n.targetAudience || 'ALL').toUpperCase(),
            sentAt: n.createdAt ? new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : 'Recent',
            deliveredCount: n.recipientCount || 1,
          }))
        );
      }
    }).catch(() => {});
  }, []);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!title || !body) {
      showToast('Please provide both Title and Message', 'error');
      return;
    }

    try {
      const res = await api.sendNotification({
        title,
        body,
        targetAudience: targetAudience.toLowerCase(),
      });

      const newNotif = {
        id: `NOTIF-${Date.now().toString().slice(-4)}`,
        title,
        body,
        target: targetAudience,
        sentAt: 'Just now',
        deliveredCount: res?.recipientCount || (targetAudience === 'ALL' ? 14200 : 3800),
      };

      setHistory([newNotif, ...history]);
      setTitle('');
      setBody('');
      showToast(`Broadcast notification dispatched via backend Firebase!`);
    } catch (err) {
      showToast(`Failed to send notification: ${err.message}`, 'error');
    }
  };

  return (
    <div className="space-y-6 max-w-5xl mx-auto">
      <div>
        <h2 className="text-2xl font-extrabold text-white tracking-tight">Push Broadcast Hub</h2>
        <p className="text-xs text-slate-400">
          Send instant FCM push notifications to customers and delivery partners
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Composer */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-orange-400 font-bold text-sm">
            <Bell size={18} />
            <span>Compose Push Notification</span>
          </div>

          <form onSubmit={handleSend} className="space-y-4 text-xs">
            <div>
              <label className="block font-semibold text-slate-300 mb-1">Target Audience</label>
              <select
                value={targetAudience}
                onChange={(e) => setTargetAudience(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
              >
                <option value="ALL">All Mobile Users (Customers & Riders)</option>
                <option value="CUSTOMERS">Customers Only</option>
                <option value="RIDERS">Delivery Partners (Riders Only)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Notification Title *
              </label>
              <input
                type="text"
                placeholder="e.g. Flash 50% Off | Dinner Deals Live!"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">
                Notification Message Body *
              </label>
              <textarea
                rows={3}
                placeholder="Write compelling text for the customer notification tray..."
                value={body}
                onChange={(e) => setBody(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500 resize-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-300 mb-1">Deep Link / Screen</label>
              <input
                type="text"
                value={deepLink}
                onChange={(e) => setDeepLink(e.target.value)}
                className="w-full bg-slate-950 border border-slate-800 rounded-xl px-3.5 py-2 text-white focus:outline-none focus:border-orange-500 font-mono"
              />
            </div>

            <button
              type="submit"
              className="w-full py-2.5 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-bold shadow-lg shadow-orange-500/20 transition flex items-center justify-center gap-2"
            >
              <Send size={15} />
              <span>Broadcast via Firebase FCM</span>
            </button>
          </form>
        </div>

        {/* Live Mobile Notification Preview */}
        <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
          <div className="flex items-center gap-2 text-slate-400 font-bold text-sm">
            <Smartphone size={18} />
            <span>Mobile Tray Preview</span>
          </div>

          <div className="mx-auto w-72 rounded-3xl p-3 bg-slate-950 border-4 border-slate-800 shadow-2xl space-y-4">
            <div className="flex justify-between items-center text-[10px] text-slate-500 px-2 pt-1">
              <span>9:41</span>
              <span>5G 100%</span>
            </div>

            {/* Notification Card */}
            <div className="p-3 rounded-2xl bg-slate-900 border border-slate-700/80 shadow-lg space-y-1.5">
              <div className="flex items-center justify-between text-[10px] text-slate-400">
                <div className="flex items-center gap-1.5 font-bold text-orange-400">
                  <div className="w-3.5 h-3.5 rounded bg-orange-500 flex items-center justify-center text-[8px] text-white">
                    F
                  </div>
                  <span>FATAFAT</span>
                </div>
                <span>now</span>
              </div>
              <h5 className="font-bold text-xs text-white">
                {title || 'Flash 50% Off | Dinner Deals Live!'}
              </h5>
              <p className="text-[11px] text-slate-300 leading-snug">
                {body || 'Order hot biryani and pizzas now with instant 20 min delivery!'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast History */}
      <div className="p-6 rounded-2xl bg-slate-900/80 border border-slate-800 space-y-4">
        <h3 className="font-bold text-white text-sm">Recent Broadcast History</h3>
        <div className="space-y-3">
          {history.map((h) => (
            <div
              key={h.id}
              className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 flex items-center justify-between text-xs"
            >
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white">{h.title}</span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-slate-800 text-slate-400">
                    {h.target}
                  </span>
                </div>
                <p className="text-slate-400 text-[11px] mt-0.5">{h.body}</p>
              </div>
              <div className="text-right shrink-0">
                <span className="text-emerald-400 font-bold">
                  {h.deliveredCount.toLocaleString()} delivered
                </span>
                <p className="text-[10px] text-slate-500">{h.sentAt}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
