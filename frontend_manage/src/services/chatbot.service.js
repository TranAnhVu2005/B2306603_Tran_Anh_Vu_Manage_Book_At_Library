import createApiClient from "./api.service";

class ChatbotService {
    constructor(baseUrl = "/api/chatbot") {
        this.api = createApiClient(baseUrl);
    }

    async ask(message, history = []) {
        return (await this.api.post("/ask", { message, history })).data;
    }
}

export default new ChatbotService();
