const ChatbotService = require("../services/chatbot.service");
const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");

exports.ask = async (req, res, next) => {
    try {
        const body = req.body;
        if (!body || typeof body !== "object" || Array.isArray(body)) {
            return next(new ApiError(400, "Dữ liệu yêu cầu không hợp lệ."));
        }
        const allowedKeys = new Set(["message", "history"]);
        if (Object.keys(body).some((key) => !allowedKeys.has(key))) {
            return next(new ApiError(400, "Request chứa trường không được phép."));
        }
        if (typeof body.message !== "string" || !body.message.trim()) {
            return next(new ApiError(400, "Vui lòng nhập nội dung câu hỏi cho trợ lý thư viện."));
        }
        if (body.history !== undefined && !Array.isArray(body.history)) {
            return next(new ApiError(400, "Lịch sử hội thoại (history) phải là một mảng hợp lệ."));
        }

        const service = new ChatbotService(MongoDB.client);
        const result = await service.ask(
            { message: body.message, history: body.history || [] },
            req.user || null
        );
        return res.json({
            message: "Trợ lý thư viện đã phản hồi.",
            data: result,
        });
    } catch (error) {
        return next(new ApiError(error.statusCode || 400, error.message));
    }
};
