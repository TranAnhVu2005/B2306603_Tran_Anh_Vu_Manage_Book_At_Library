import { createWebHistory, createRouter } from "vue-router";
import HomeView from "@/views/HomeView.vue";

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
    },
    {
        path: "/manager/borrows",
        name: "manager.borrows",
        component: () => import("@/views/ManagerBorrows.vue"),
    },
    {
        path: "/manager/books",
        name: "manager.books",
        component: () => import("@/views/ManagerBooks.vue"),
    },
    {
        path: "/manager/publishers",
        name: "manager.publishers",
        component: () => import("@/views/ManagerPublishers.vue"),
    },
    {
        path: "/admin/users",
        name: "admin.users",
        component: () => import("@/views/AdminUsers.vue"),
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

export default router;