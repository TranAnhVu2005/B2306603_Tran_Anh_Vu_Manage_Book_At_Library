import { createRouter, createWebHistory } from "vue-router";
import authService from "@/services/auth.service";

const routes = [
  { path: "/", redirect: "/manager/borrows" },
  { path: "/login", name: "login", component: () => import("@/views/StaffLoginView.vue") },
  { path: "/profile", name: "profile", component: () => import("@/views/ProfileView.vue"), meta: { role: "staff" } },
  { path: "/manager/borrows", name: "manager.borrows", component: () => import("@/views/ManagerBorrows.vue"), meta: { role: "staff" } },
  { path: "/manager/books", name: "manager.books", component: () => import("@/views/ManagerBooks.vue"), meta: { role: "staff" } },
  { path: "/manager/publishers", name: "manager.publishers", component: () => import("@/views/ManagerPublishers.vue"), meta: { role: "staff" } },
  { path: "/admin/users", name: "admin.users", component: () => import("@/views/AdminUsers.vue"), meta: { role: "admin" } },
  { path: "/:pathMatch(.*)*", name: "notfound", component: () => import("@/views/NotFound.vue") },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  if (to.path === "/login") return true;
  if (!to.meta.role) return true;

  if (!authService.isLoggedIn()) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (!authService.isStaffOrAdmin()) return { name: "login" };
  if (to.meta.role === "admin" && !authService.isAdmin()) return { name: "manager.borrows" };
  return true;
});

export default router;
