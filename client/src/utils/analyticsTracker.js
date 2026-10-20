import { API_BASE_URL } from "../services/apiConfig";

// Generate or retrieve persistent anonymous visitor ID
const getVisitorId = () => {
  let id = localStorage.getItem("tf_visitor_id");
  if (!id) {
    id = "v_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    localStorage.setItem("tf_visitor_id", id);
  }
  return id;
};

// Generate or retrieve session ID (expires when browser session ends)
const getSessionId = () => {
  let id = sessionStorage.getItem("tf_session_id");
  if (!id) {
    id = "s_" + Math.random().toString(36).substring(2, 15) + Date.now().toString(36);
    sessionStorage.setItem("tf_session_id", id);
  }
  return id;
};

let lastTrackedPath = "";
let lastTrackedTime = 0;

// Track pageview
export const trackPageView = async (path) => {
  const cleanPath = (path || window.location.pathname).split("?")[0];
  const now = Date.now();

  // Deduplicate rapid identical pageviews within 1.5 seconds (React StrictMode / rapid renders)
  if (cleanPath === lastTrackedPath && now - lastTrackedTime < 1500) {
    return;
  }

  lastTrackedPath = cleanPath;
  lastTrackedTime = now;

  try {
    const payload = {
      type: "pageview",
      name: "page_view",
      path: cleanPath,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
      referrer: document.referrer || "",
    };

    // First-party tracking
    fetch(`${API_BASE_URL}/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {
      // Analytics failures must never interrupt user experience
    });

    // Optional Google Analytics 4 tracking if configured
    if (typeof window.gtag === "function" && import.meta.env.VITE_GA_MEASUREMENT_ID) {
      window.gtag("event", "page_view", {
        page_path: cleanPath,
      });
    }
  } catch {
    // Ignore analytics errors
  }
};

// Track specific application event (e.g. signup_completed, task_created)
export const trackEvent = async (eventName, details = {}) => {
  try {
    const safePayload = {
      type: "event",
      name: eventName,
      path: window.location.pathname,
      visitorId: getVisitorId(),
      sessionId: getSessionId(),
    };

    fetch(`${API_BASE_URL}/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(safePayload),
    }).catch(() => {});

    if (typeof window.gtag === "function" && import.meta.env.VITE_GA_MEASUREMENT_ID) {
      window.gtag("event", eventName, details);
    }
  } catch {
    // Ignore analytics errors
  }
};
