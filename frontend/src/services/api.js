const BASE_URL = (
  import.meta.env.VITE_API_URL || "http://127.0.0.1:8081"
).replace(/\/+$/, "");

async function request(endpoint, options = {}) {
  const token = localStorage.getItem("plantcare_token");
  const headers = new Headers(options.headers || {});

  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  const isFormData =
    typeof FormData !== "undefined" && options.body instanceof FormData;

  if (options.body !== undefined && !isFormData) {
    if (!headers.has("Content-Type")) {
      headers.set("Content-Type", "application/json");
    }
  }

  headers.set("Accept", "application/json");

  let response;

  try {
    response = await fetch(`${BASE_URL}${endpoint}`, {
      ...options,
      headers,
    });
  } catch (cause) {
    const error = new Error(
      `Cannot connect to PlantCare API at ${BASE_URL}. ` +
        "Check the API URL, backend availability, and CORS configuration."
    );
    error.cause = cause;
    error.status = 0;
    throw error;
  }

  if (response.status === 204) {
    return null;
  }

  const contentType = response.headers.get("content-type") || "";
  let data;

  if (contentType.includes("application/json")) {
    data = await response.json().catch(() => null);
  } else {
    data = await response.text().catch(() => "");
  }

  if (!response.ok) {
    let errorMessage = "An error occurred";

    if (typeof data === "string" && data.trim()) {
      errorMessage = data;
    } else if (typeof data?.detail === "string") {
      errorMessage = data.detail;
    } else if (Array.isArray(data?.detail)) {
      errorMessage = data.detail
        .map((item) => item.msg || JSON.stringify(item))
        .join(", ");
    } else if (typeof data?.detail?.error === "string") {
      errorMessage = data.detail.error;
    } else if (typeof data?.message === "string") {
      errorMessage = data.message;
    }

    const error = new Error(errorMessage);
    error.status = response.status;
    error.data = data;
    throw error;
  }

  return data;
}

export const api = {
  // Authentication
  register: (payload) =>
    request("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  login: (payload) =>
    request("/api/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getProfile: () => request("/api/auth/me"),

  updatePreferences: (payload) =>
    request("/api/auth/preferences", {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  // Plants
  getPlants: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/plants${query ? `?${query}` : ""}`);
  },

  createPlant: (payload) =>
    request("/api/plants", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getPlant: (id) => request(`/api/plants/${id}`),

  updatePlant: (id, payload) =>
    request(`/api/plants/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deletePlant: (id) =>
    request(`/api/plants/${id}`, {
      method: "DELETE",
    }),

  uploadPlantImage: (id, file) => {
    const formData = new FormData();
    formData.append("file", file);

    return request(`/api/plants/${id}/upload-image`, {
      method: "POST",
      body: formData,
    });
  },

  // Tasks
  getTasks: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/tasks${query ? `?${query}` : ""}`);
  },

  createTask: (payload) =>
    request("/api/tasks", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  completeTask: (id, payload = {}) =>
    request(`/api/tasks/${id}/complete`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  updateTask: (id, payload) =>
    request(`/api/tasks/${id}`, {
      method: "PUT",
      body: JSON.stringify(payload),
    }),

  deleteTask: (id) =>
    request(`/api/tasks/${id}`, {
      method: "DELETE",
    }),

  // AI Plant Doctor
  diagnosePlant: (formData) =>
    request("/api/doctor/diagnose", {
      method: "POST",
      body: formData,
    }),

  saveAssessment: (payload) =>
    request("/api/doctor/save-assessment", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  uploadLeafPhoto: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return request("/api/doctor/upload-leaf-photo", {
      method: "POST",
      body: formData,
    });
  },

  getAssessmentHistory: (params = {}) => {
    const query = new URLSearchParams(params).toString();
    return request(`/api/doctor/history${query ? `?${query}` : ""}`);
  },

  getAssessmentDetail: (id) =>
    request(`/api/doctor/history/${id}`),

  // AI Gardening Assistant
  getChatSessions: () =>
    request("/api/assistant/sessions"),

  getSessionDetail: (sessionId) =>
    request(`/api/assistant/sessions/${sessionId}`),

  chatWithAssistant: (payload) =>
    request("/api/assistant/chat", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  deleteChatSession: (sessionId) =>
    request(`/api/assistant/sessions/${sessionId}`, {
      method: "DELETE",
    }),

  // Smart Garden Planner
  generateGardenPlan: (payload) =>
    request("/api/planner/generate", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  saveGardenPlan: (payload) =>
    request("/api/planner/save", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getGardenPlans: () =>
    request("/api/planner/plans"),

  getGardenPlan: (id) =>
    request(`/api/planner/plans/${id}`),

  deleteGardenPlan: (id) =>
    request(`/api/planner/plans/${id}`, {
      method: "DELETE",
    }),

  // Touch Grass Challenge
  getMissions: () =>
    request("/api/challenge/missions"),

  completeMission: (missionId, payload) =>
    request(`/api/challenge/missions/${missionId}/complete`, {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  logOutdoorActivity: (payload) =>
    request("/api/challenge/log-activity", {
      method: "POST",
      body: JSON.stringify(payload),
    }),

  getChallengeSummary: () =>
    request("/api/challenge/summary"),

  uploadChallengeEvidence: (file) => {
    const formData = new FormData();
    formData.append("file", file);

    return request("/api/challenge/upload-evidence", {
      method: "POST",
      body: formData,
    });
  },

  // Analytics
  getDashboardStats: () =>
    request("/api/analytics/dashboard"),

  getAnalyticsOverview: () =>
    request("/api/analytics/overview"),

  // System
  getAiStatus: () =>
    request("/api/system/ai-status"),

  getHealth: () =>
    request("/api/system/health"),
};
