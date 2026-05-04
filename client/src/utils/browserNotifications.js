function canUseBrowserNotifications() {
  return typeof window !== "undefined" && "Notification" in window;
}

let permissionInitBound = false;

export function getBrowserNotificationPermission() {
  if (!canUseBrowserNotifications()) return "unsupported";
  return window.Notification.permission;
}

export async function requestBrowserNotificationPermission() {
  if (!canUseBrowserNotifications()) return "unsupported";
  return window.Notification.requestPermission();
}

export function initializeBrowserNotificationPermission() {
  if (!canUseBrowserNotifications() || permissionInitBound) return;

  permissionInitBound = true;
  const askOnce = async () => {
    if (window.Notification.permission === "default") {
      try {
        await window.Notification.requestPermission();
      } catch {}
    }

    window.removeEventListener("pointerdown", askOnce);
    window.removeEventListener("keydown", askOnce);
    window.removeEventListener("touchstart", askOnce);
  };

  window.addEventListener("pointerdown", askOnce, { passive: true });
  window.addEventListener("keydown", askOnce, { passive: true });
  window.addEventListener("touchstart", askOnce, { passive: true });
}

export function showBrowserNotification({ title, body, tag, onClick }) {
  if (!canUseBrowserNotifications() || window.Notification.permission !== "granted") {
    return null;
  }

  try {
    const notification = new window.Notification(title, {
      body,
      tag,
      icon: "/favicon.png",
      badge: "/favicon.png",
    });

    if (typeof onClick === "function") {
      notification.onclick = (event) => {
        event.preventDefault();
        onClick();
        notification.close();
      };
    }

    return notification;
  } catch (error) {
    return null;
  }
}
