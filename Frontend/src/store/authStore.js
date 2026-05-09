import { create } from "zustand";
import { persist } from "zustand/middleware";
import api from "../lib/axios.js";
import { queryClient } from "../lib/queryClient.js";

export const useAuthStore = create(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      adminToken: null,
      adminUser: null,

      // ── User auth ─────────────────────────────────────────────────────────
      setToken: (token) => set({ token }),
      setUser: (user) => set({ user }),

      login: async (email, password) => {
        const data = await api.post("/auth/login", { email, password });
        if (data.role === "admin") {
          set({ adminToken: data.token, adminUser: data.user });
          localStorage.setItem("adminToken", data.token);
        } else {
          set({ token: data.token, user: data.user });
          localStorage.setItem("authToken", data.token);
        }
        return data;
      },

      logout: () => {
        set({ token: null, user: null });
        localStorage.removeItem("authToken");
        queryClient.clear();
      },

      // ── Admin auth ────────────────────────────────────────────────────────
      setAdminToken: (adminToken) => set({ adminToken }),
      setAdminUser: (adminUser) => set({ adminUser }),

      adminLogout: () => {
        set({ adminToken: null, adminUser: null });
        localStorage.removeItem("adminToken");
        localStorage.removeItem("adminUser");
        queryClient.clear();
      },

      // ── Helpers ───────────────────────────────────────────────────────────
      isAuthenticated: () => !!(get().token || get().adminToken),
      isAdmin: () => !!get().adminToken,
    }),
    {
      name: "auth-storage",
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        adminToken: state.adminToken,
        adminUser: state.adminUser,
      }),
    },
  ),
);
