// src/stores/auth.ts
import { defineStore } from "pinia";
import { http } from "../api/http";

type Role = "user" | "admin";
type Me = { id: number; email: string; role: Role; created_at?: string };

export const useAuthStore = defineStore("auth", {
  state: () => ({
    token: localStorage.getItem("token") || "", // ✅ 刷新後仍可讀到
    me: null as Me | null,
  }),

  getters: {
    isLoggedIn: (s) => !!(s.token || localStorage.getItem("token")),
    isAdmin: (s) => s.me?.role === "admin",
  },

  actions: {
    async login(email: string, password: string) {
      // ✅ 1) 先清掉舊狀態，避免 role 殘留
      this.me = null;
      this.token = "";

      const res = await http.post("/auth/login", { email, password });
      const token = res.data?.token;
      if (!token) throw new Error("Login success but token missing");

      // ✅ 2) token 存 localStorage + store
      this.token = token;
      localStorage.setItem("token", token);

      // ✅ 3) 立刻抓 me，讓 role/guard/UI 立刻一致
      await this.fetchMe();
    },

    async fetchMe() {
      const res = await http.get("/users/me");

      // ✅ 防呆：有時回 { user: {...} }，有時直接 {...}
      const me = (res.data?.user ?? res.data) as Me;

      this.me = me;
      return me;
    },

    async updateMe(payload: Partial<Pick<Me, "email">> & { password?: string }) {
      await http.patch("/users/me", payload);
      return this.fetchMe();
    },

    logout() {
      this.token = "";
      this.me = null;
      localStorage.removeItem("token");
      // ✅ 不存 localStorage.me 的話就不用清；如果你有存才清
      localStorage.removeItem("me");
    },
  },
});
