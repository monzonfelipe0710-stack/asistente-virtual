import { useSyncExternalStore } from "react";

const subscribe = (callback) => {
  const el = document.documentElement;
  const observer = new MutationObserver(callback);
  observer.observe(el, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};

const getSnapshot = () =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const getServerSnapshot = () => "light";

export default function useTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
