const ApiError = require("../api-error");

const loginAttempts = new Map();

function securityHeaders(req, res, next) {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
    if (process.env.NODE_ENV === "production") {
        res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains");
    }
    res.setHeader("Content-Security-Policy", "default-src 'none'; frame-ancestors 'none'; base-uri 'none'; form-action 'self'");
    next();
}

function rejectXml(req, res, next) {
    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    if (contentType.includes("xml") || contentType.includes("soap")) {
        return next(new ApiError(415, "API không hỗ trợ nội dung XML."));
    }
    next();
}

function rejectSimpleFormMutations(req, res, next) {
    if (!["POST", "PUT", "PATCH", "DELETE"].includes(req.method)) return next();
    const contentType = String(req.headers["content-type"] || "").toLowerCase();
    if (contentType.startsWith("application/x-www-form-urlencoded") || contentType.startsWith("text/plain")) {
        return next(new ApiError(415, "API yêu cầu JSON hoặc multipart/form-data có xác thực."));
    }
    next();
}

function inspectKeys(value, depth = 0) {
    if (depth > 12) return false;
    if (!value || typeof value !== "object") return true;
    for (const [key, child] of Object.entries(value)) {
        if (key.startsWith("$") || key.includes(".")) return false;
        if (!inspectKeys(child, depth + 1)) return false;
    }
    return true;
}

function rejectMongoOperators(req, res, next) {
    if (Object.keys(req.query || {}).length > 30 || Object.values(req.query || {}).some((value) => typeof value === "string" && value.length > 500)) {
        return next(new ApiError(400, "Tham số truy vấn vượt giới hạn cho phép."));
    }
    if (!inspectKeys(req.body) || !inspectKeys(req.query)) {
        return next(new ApiError(400, "Dữ liệu đầu vào không hợp lệ."));
    }
    next();
}

function authRateLimit({ windowMs = 15 * 60 * 1000, max = 10 } = {}) {
    return (req, res, next) => {
        const key = `${req.ip}:${req.baseUrl}${req.path}`;
        const now = Date.now();
        const current = loginAttempts.get(key);
        if (!current || current.resetAt <= now) {
            loginAttempts.set(key, { count: 1, resetAt: now + windowMs });
            return next();
        }
        current.count += 1;
        if (current.count > max) {
            res.setHeader("Retry-After", String(Math.ceil((current.resetAt - now) / 1000)));
            return next(new ApiError(429, "Quá nhiều yêu cầu đăng nhập. Vui lòng thử lại sau."));
        }
        next();
    };
}

// Mỗi ca trong test_api.js độc lập; không để giới hạn theo IP của ca trước làm nhiễu ca sau.
function resetAuthRateLimitsForTests() {
    loginAttempts.clear();
}

function allowFields(...fields) {
    const allowed = new Set(fields);
    return (req, res, next) => {
        const body = req.body || {};
        const invalidValue = body && typeof body === "object" && Object.entries(body).some(([key, value]) =>
            (typeof value === "string" && value.length > 10000) ||
            value === null || typeof value === "object" ||
            (key === "HinhAnh" && value !== "" && !/^\/uploads\/books\/[A-Za-z0-9._-]+$/.test(value))
        );
        if (!body || typeof body !== "object" || Array.isArray(body) || Object.keys(body).some((key) => !allowed.has(key)) || invalidValue) {
            return next(new ApiError(400, "Request chứa trường không được phép."));
        }
        next();
    };
}

module.exports = { securityHeaders, rejectXml, rejectSimpleFormMutations, rejectMongoOperators, authRateLimit, resetAuthRateLimitsForTests, allowFields };
