import { useSyncExternalStore } from "react";

const subscribe = (callback) => {
  const el = document.documentElement;
  let lastTheme = el.classList.contains("dark") ? "dark" : "light";
  const observer = new MutationObserver(() => {
    const currentTheme = el.classList.contains("dark") ? "dark" : "light";
    if (currentTheme !== lastTheme) {
      lastTheme = currentTheme;
      callback();
    }
  });
  observer.observe(el, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
};

const getSnapshot = () =>
  document.documentElement.classList.contains("dark") ? "dark" : "light";

const getServerSnapshot = () => "dark";

export default function useTheme() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
