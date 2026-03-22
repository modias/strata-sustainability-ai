export const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "http://127.0.0.1:8000";

/** Bundled demo data + simulated streaming. Set `VITE_USE_MOCK_DATA=false` in `.env.local` to use the live backend. */
export const USE_MOCK_DATA = import.meta.env.VITE_USE_MOCK_DATA !== "false";
