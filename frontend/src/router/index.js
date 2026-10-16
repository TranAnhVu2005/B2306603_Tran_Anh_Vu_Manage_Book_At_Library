import { createWebHistory, createRouter } from "vue-router";
import HomeView from "@/views/HomeView.vue";
import authService from "@/services/auth.service";

const routes = [
    {
        path: "/",
        name: "home",
        component: HomeView,
    },
    {
        path: "/books",
        name: "books",
        component: HomeView,
    },
    {
        path: "/books/:id",
        name: "book.detail",
        component: () => import("@/views/BookDetail.vue"),
        props: true,
    },
    {
        path: "/login",
        name: "login",
        component: () => import("@/views/LoginView.vue"),
    },
    {
        path: "/register",
        name: "register",
        component: () => import("@/views/RegisterView.vue"),
    },
    {
        path: "/profile",
        name: "profile",
        component: () => import("@/views/ProfileView.vue"),
        meta: { role: "reader" },
    },
    {
        path: "/manager/borrows",
        name: "manager.borrows",
        component: () => import("@/views/ManagerBorrows.vue"),
        meta: { role: "staff" },
    },
    {
        path: "/manager/books",
        name: "manager.books",
        component: () => import("@/views/ManagerBooks.vue"),
        meta: { role: "staff" },
    },
    {
        path: "/manager/publishers",
        name: "manager.publishers",
        component: () => import("@/views/ManagerPublishers.vue"),
        meta: { role: "staff" },
    },
    {
        path: "/admin/users",
        name: "admin.users",
        component: () => import("@/views/AdminUsers.vue"),
        meta: { role: "admin" },
    },
    {
        path: "/:pathMatch(.*)*",
        name: "notfound",
        component: () => import("@/views/NotFound.vue"),
    },
];

const router = createRouter({
    history: createWebHistory(import.meta.env.BASE_URL),
    routes,
    scrollBehavior() {
        return { top: 0 };
    }
});

router.beforeEach((to) => {
    const requiredRole = to.meta.role;
    if (!requiredRole) return true;

    if (!authService.isLoggedIn()) {
        return { name: "login", query: { redirect: to.fullPath } };
    }

    if (requiredRole === "reader" && !authService.isReader()) {
        return { name: "manager.borrows" };
    }
    if (requiredRole === "staff" && !authService.isStaffOrAdmin()) {
        return { name: "home" };
    }
    if (requiredRole === "admin" && !authService.isAdmin()) {
        return { name: "home" };
    }

    return true;
});

export default router;