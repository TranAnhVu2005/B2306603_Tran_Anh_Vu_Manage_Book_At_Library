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
    const manageAppUrl = import.meta.env.VITE_MANAGE_APP_URL || "http://localhost:3002";
    if (authService.isStaffOrAdmin()) {
        if (import.meta.env.DEV || import.meta.env.VITE_MANAGE_APP_URL) {
            window.location.assign(`${manageAppUrl.replace(/\/$/, "")}/login`);
            return false;
        }
        return to.name === "login" ? true : { name: "login", query: { managePortalRequired: "1" } };
    }

    const requiredRole = to.meta.role;
    if (!requiredRole) return true;

    if (!authService.isLoggedIn()) {
        return { name: "login", query: { redirect: to.fullPath } };
    }

    if (requiredRole === "reader" && !authService.isReader()) {
        return { name: "home" };
    }

    return true;
});

export default router;
