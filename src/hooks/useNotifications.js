import { useState, useCallback, useRef } from "react";

let nextId = 1;

export default function useNotifications() {
  const [notifications, setNotifications] = useState([]);
  const ref = useRef(null);

  const add = useCallback((notif) => {
    const id = nextId++;
    setNotifications((prev) => [{ id, read: false, timestamp: new Date(), ...notif }, ...prev]);
    return id;
  }, []);

  const markRead = useCallback((id) => {
    setNotifications((prev) => prev.map((n) => n.id === id ? { ...n, read: true } : n));
  }, []);

  const markAllRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  }, []);

  const clear = useCallback(() => setNotifications([]), []);

  const unread = notifications.filter((n) => !n.read).length;

  return { notifications, unread, add, markRead, markAllRead, clear, ref };
}
