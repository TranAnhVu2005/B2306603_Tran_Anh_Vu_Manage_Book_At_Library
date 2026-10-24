import createApiClient from "./api.service";

const api = createApiClient("/api/theloai");

export default {
  async getAll() {
    return (await api.get("/", { skipAuth: true })).data;
  },
};
