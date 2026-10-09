import createApiClient from "./api.service";

class AuthService {
    constructor(baseUrl = "/api/auth") {
        this.api = createApiClient(baseUrl);
    }

    async login(identifier, password) {
        const response = await this.api.post("/login", { identifier, password });
        if (response.data && response.data.data) {
            localStorage.setItem("user", JSON.stringify(response.data.data));
        }
        return response.data;
    }

    async register(data) {
        return (await this.api.post("/register", data)).data;
    }

    logout() {
        localStorage.removeItem("user");
    }

    getUser() {
        try {
            const data = localStorage.getItem("user");
            return data ? JSON.parse(data) : null;
        } catch (e) {
            return null;
        }
    }

    isLoggedIn() {
        return !!this.getUser();
    }

    isStaffOrAdmin() {
        const user = this.getUser();
        return user && (user.role === "MANAGER" || user.role === "ADMIN");
    }

    isAdmin() {
        const user = this.getUser();
        return user && user.role === "ADMIN";
    }
}

export default new AuthService();
