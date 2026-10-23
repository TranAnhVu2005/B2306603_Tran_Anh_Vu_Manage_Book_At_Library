import createApiClient from "./api.service";

const api = createApiClient("/api/audit-logs");

export default {
  async getAll(params = {}) {
    return (await api.get("/", { params })).data;
  },
};
