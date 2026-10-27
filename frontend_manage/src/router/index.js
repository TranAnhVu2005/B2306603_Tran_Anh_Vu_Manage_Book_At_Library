import { createRouter, createWebHistory } from "vue-router";
import authService from "@/services/auth.service";
import StaffApplicationStatus from "@/views/StaffApplicationStatus.vue";

const routes = [
  { path: "/", redirect: "/login" },
  // Tra cứu danh mục/chi tiết là công khai; thao tác nghiệp vụ vẫn được bảo vệ riêng ở API.
  { path: "/catalog", name: "manager.catalog", component: () => import("@/views/ManagerCatalog.vue") },
  { path: "/catalog/books/:id", name: "manager.catalog.book", component: () => import("@/views/ManagerBookDetail.vue") },
  { path: "/login", name: "login", component: () => import("@/views/StaffLoginView.vue") },
  { path: "/staff-register", name: "staff-register", component: () => import("@/views/StaffRegisterView.vue") },
  { path: "/staff-application-status", name: "staff-application-status", component: StaffApplicationStatus },
  { path: "/profile", name: "profile", component: () => import("@/views/ProfileView.vue"), meta: { role: "staff" } },
  { path: "/manager/borrows", name: "manager.borrows", component: () => import("@/views/ManagerBorrows.vue"), meta: { role: "staff" } },
  { path: "/manager/books", name: "manager.books", component: () => import("@/views/ManagerBooks.vue"), meta: { role: "staff" } },
  { path: "/manager/publishers", name: "manager.publishers", component: () => import("@/views/ManagerPublishers.vue"), meta: { role: "staff" } },
  { path: "/admin/users", name: "admin.users", component: () => import("@/views/AdminUsers.vue"), meta: { role: "admin" } },
  { path: "/admin/staff-applications", name: "admin.staff-applications", component: () => import("@/views/AdminStaffApplications.vue"), meta: { role: "admin" } },
  { path: "/admin/audit-logs", name: "admin.audit-logs", component: () => import("@/views/AdminAuditLogs.vue"), meta: { role: "admin" } },
  { path: "/:pathMatch(.*)*", name: "notfound", component: () => import("@/views/NotFound.vue") },
];

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes,
  scrollBehavior: () => ({ top: 0 }),
});

router.beforeEach((to) => {
  if (to.path === "/login") {
    if (!authService.isStaffOrAdmin()) return true;
    const requested = typeof to.query.redirect === "string" ? to.query.redirect : "";
    if (/^\/(manager\/|admin\/|profile(?:\?|$)|catalog(?:\/|\?|$))/.test(requested) && !requested.startsWith("//")) {
      return requested;
    }
    return authService.isAdmin() ? { name: "admin.users" } : { name: "manager.borrows" };
  }
  if (!to.meta.role) return true;

  if (!authService.isLoggedIn()) {
    return { name: "login", query: { redirect: to.fullPath } };
  }

  if (!authService.isStaffOrAdmin()) {
    return { name: "login", query: { redirect: to.fullPath } };
  }
  if (to.meta.role === "admin" && !authService.isAdmin()) return { name: "manager.borrows" };
  return true;
});

export default router;
