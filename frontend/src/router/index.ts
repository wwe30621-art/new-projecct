import { createRouter, createWebHistory } from "vue-router";
import LoginView from "../views/LoginView.vue";
import MeView from "../views/MeView.vue";
import AdminView from "../views/AdminView.vue";
import ForbiddenView from "../views/ForbiddenView.vue";

import { useAuthStore } from "../stores/auth";

const routes = [
  // ✅ 首頁：依狀態導到對的地方
  {
    path: "/",
    name: "home",
    redirect: () => {
      const token = localStorage.getItem("token");
      if (!token) return "/login";
      // 有 token 但還不知道角色 → 先去 /me，guard 會處理角色跳轉
      return "/me";
    },
  },

  {
    path: "/login",
    name: "login",
    component: LoginView,
  },

  {
    path: "/me",
    name: "me",
    component: MeView,
    meta: { requiresAuth: true },
  },

  {
    path: "/admin",
    name: "admin",
    component: AdminView,
    meta: { requiresAuth: true, requiresRole: "admin" },
  },

  {
    path: "/forbidden",
    name: "forbidden",
    component: ForbiddenView,
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});

router.beforeEach(async (to) => {
  const auth = useAuthStore();
  const token = localStorage.getItem("token");
  const isLoggedIn = !!token;

  // 1) 需要登入但沒 token → /login
  if (to.meta.requiresAuth && !isLoggedIn) {
    return { path: "/login" };
  }

  // 2) 已登入還去 /login → 依角色導向
  if (to.path === "/login" && isLoggedIn) {
    try {
      if (!auth.me) await auth.fetchMe();
      return { path: auth.me?.role === "admin" ? "/admin" : "/me" };
    } catch {
      auth.logout();
      return { path: "/login" };
    }
  }

  // 3) RBAC：需要角色
  const requiresRole = to.meta.requiresRole as string | undefined;
  if (requiresRole) {
    try {
      if (!auth.me) await auth.fetchMe();

      if (auth.me?.role !== requiresRole) {
        return { path: "/forbidden" };
      }
    } catch {
      auth.logout();
      return { path: "/login" };
    }
  }

  return true;
});

export default router;
