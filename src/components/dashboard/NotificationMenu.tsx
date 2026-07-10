"use client";

import { Bell, CheckCheck, Inbox, Loader2 } from "lucide-react";
import { useState } from "react";

type DashboardNotification = {
  id: string;
  title: string;
  message: string;
  read: boolean;
  type: string;
  createdAt: string;
};

type NotificationsResponse = {
  success: boolean;
  data?: { notifications: DashboardNotification[] };
  error?: string;
};

export function NotificationMenu() {
  const [open, setOpen] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const [loading, setLoading] = useState(false);
  const [markingRead, setMarkingRead] = useState(false);
  const [notifications, setNotifications] = useState<DashboardNotification[]>([]);
  const [error, setError] = useState("");

  const unreadCount = notifications.filter((item) => !item.read).length;

  const loadNotifications = async (force = false) => {
    if ((!force && loaded) || loading) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/notifications", { cache: "no-store" });
      const payload = await response.json() as NotificationsResponse;
      if (!response.ok || !payload.success) throw new Error(payload.error || "تعذر تحميل الإشعارات");
      setNotifications(payload.data?.notifications || []);
      setLoaded(true);
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "تعذر تحميل الإشعارات");
    } finally {
      setLoading(false);
    }
  };

  const toggleMenu = () => {
    const nextOpen = !open;
    setOpen(nextOpen);
    if (nextOpen) void loadNotifications(true);
  };

  const markAllAsRead = async () => {
    if (!unreadCount || markingRead) return;
    setMarkingRead(true);
    try {
      const response = await fetch("/api/notifications", { method: "PATCH" });
      if (!response.ok) throw new Error("تعذر تحديث الإشعارات");
      setNotifications((items) => items.map((item) => ({ ...item, read: true })));
    } catch (markError) {
      setError(markError instanceof Error ? markError.message : "تعذر تحديث الإشعارات");
    } finally {
      setMarkingRead(false);
    }
  };

  return (
    <div className="relative">
      <button
        type="button"
        onClick={toggleMenu}
        aria-label="فتح الإشعارات"
        aria-expanded={open}
        className="relative grid size-11 place-items-center rounded-xl border border-white/10 bg-white/5 text-zinc-300 transition hover:border-amber-400/30 hover:bg-white/10 hover:text-white"
      >
        <Bell size={19} />
        {unreadCount > 0 && (
          <span className="absolute -left-1 -top-1 grid min-w-5 place-items-center rounded-full border-2 border-zinc-950 bg-amber-400 px-1 text-[10px] font-black leading-4 text-zinc-950">
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <>
          <button type="button" className="fixed inset-0 z-30 cursor-default" onClick={() => setOpen(false)} aria-label="إغلاق الإشعارات" />
          <section className="absolute left-0 top-14 z-40 w-[min(360px,calc(100vw-2rem))] overflow-hidden rounded-2xl border border-white/10 bg-zinc-950 shadow-2xl shadow-black/50" aria-label="قائمة الإشعارات">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3.5">
              <div>
                <h3 className="text-sm font-black text-white">الإشعارات</h3>
                <p className="mt-0.5 text-[11px] text-zinc-500">{unreadCount ? `${unreadCount} غير مقروء` : "أنت مطّلع على كل جديد"}</p>
              </div>
              {unreadCount > 0 && (
                <button type="button" onClick={() => void markAllAsRead()} disabled={markingRead} className="flex items-center gap-1.5 rounded-lg bg-amber-400/10 px-2.5 py-1.5 text-[11px] font-bold text-amber-300 transition hover:bg-amber-400/15 disabled:opacity-50">
                  {markingRead ? <Loader2 size={13} className="animate-spin" /> : <CheckCheck size={13} />}
                  قراءة الكل
                </button>
              )}
            </div>

            <div className="dashboard-scrollbar max-h-[380px] overflow-y-auto p-2">
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-12 text-sm text-zinc-500"><Loader2 size={18} className="animate-spin" /> جاري التحميل...</div>
              ) : error ? (
                <div className="px-4 py-10 text-center text-sm text-red-400">
                  <p>{error}</p>
                  <button type="button" onClick={() => void loadNotifications(true)} className="mt-3 font-bold text-amber-300">إعادة المحاولة</button>
                </div>
              ) : notifications.length ? (
                notifications.map((notification) => (
                  <article key={notification.id} className={`mb-1 rounded-xl border p-3.5 ${notification.read ? "border-transparent bg-white/[0.025]" : "border-amber-400/15 bg-amber-400/[0.07]"}`}>
                    <div className="flex items-start gap-3">
                      <span className={`mt-1 size-2 shrink-0 rounded-full ${notification.read ? "bg-zinc-700" : "bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.5)]"}`} />
                      <div className="min-w-0 flex-1">
                        <h4 className="text-sm font-bold text-zinc-100">{notification.title}</h4>
                        <p className="mt-1 text-xs leading-5 text-zinc-400">{notification.message}</p>
                        <time className="mt-2 block text-[10px] text-zinc-600">{new Date(notification.createdAt).toLocaleString("ar-EG", { dateStyle: "medium", timeStyle: "short" })}</time>
                      </div>
                    </div>
                  </article>
                ))
              ) : (
                <div className="flex flex-col items-center px-4 py-12 text-center">
                  <span className="grid size-12 place-items-center rounded-2xl bg-white/5 text-zinc-600"><Inbox size={22} /></span>
                  <p className="mt-3 text-sm font-bold text-zinc-300">لا توجد إشعارات حاليًا</p>
                  <p className="mt-1 text-xs text-zinc-600">ستظهر تحديثات الطلبات والتسويات هنا.</p>
                </div>
              )}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
