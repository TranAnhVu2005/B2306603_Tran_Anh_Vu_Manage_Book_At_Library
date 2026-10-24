import createApiClient from "./api.service";

const api = createApiClient("/api/thongbao");

export default {
  async getMine() {
    return (await api.get("/", { params: { limit: 10 } })).data;
  },
  async markRead(id) {
    return (await api.put(`/${id}/read`)).data;
  },
  async markAllRead() {
    return (await api.put("/read-all")).data;
  },
};
