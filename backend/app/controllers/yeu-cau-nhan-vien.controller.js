const MongoDB = require("../utils/mongodb.util");
const ApiError = require("../api-error");
const YeuCauNhanVienService = require("../services/yeu-cau-nhan-vien.service");
const ThongBaoService = require("../services/thongbao.service");

const service = () => new YeuCauNhanVienService(MongoDB.client);
// Keep the JWT document id separate from the employee business code.
const actorFrom = (req) => ({ id: req.user.id, MSNV: req.user.username, name: req.user.name || "" });

exports.submit = async (req, res, next) => {
    try {
        const data = await service().submit(req.body);
        return res.status(201).json({ message: "Đã gửi hồ sơ. Bạn chỉ có thể đăng nhập sau khi Quản trị viên duyệt.", data });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

exports.findAll = async (req, res, next) => {
    try {
        return res.json({ data: await service().findAll() });
    } catch (error) {
        return next(new ApiError(500, "Không thể tải hồ sơ đăng ký nhân viên."));
    }
};

exports.lookupStatus = async (req, res, next) => {
    try {
        const { SoDienThoai, MatKhau } = req.body;
        if (!SoDienThoai || !MatKhau) return next(new ApiError(400, "Vui lòng nhập số điện thoại và mật khẩu đã đăng ký."));
        const result = await service().lookupStatus(SoDienThoai, MatKhau);
        if (!result) return next(new ApiError(401, "Thông tin xác thực không chính xác hoặc không tìm thấy hồ sơ."));
        return res.json({ data: result });
    } catch (error) {
        return next(new ApiError(500, "Không thể tra cứu trạng thái hồ sơ lúc này."));
    }
};

exports.approve = async (req, res, next) => {
    try {
        const staff = await service().approve(req.params.id, actorFrom(req));
        if (!staff) return next(new ApiError(409, "Hồ sơ không còn ở trạng thái chờ duyệt."));
        await new ThongBaoService(MongoDB.client).createSafely({
            recipientCode: staff.MSNV, recipientType: "nhanvien", type: "HO_SO_NHAN_VIEN_DA_DUYET",
            title: "Hồ sơ nhân viên đã được duyệt",
            message: `Tài khoản nhân viên ${staff.MSNV} đã được kích hoạt. Bạn có thể đăng nhập bằng số điện thoại đã đăng ký.`,
            reference: staff.MSNV,
        });
        const { _applicationId, ...data } = staff;
        return res.json({ message: "Đã duyệt hồ sơ và tạo tài khoản thủ thư.", data });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};

exports.reject = async (req, res, next) => {
    try {
        const data = await service().reject(req.params.id, req.body.LyDoTuChoi, actorFrom(req));
        if (!data) return next(new ApiError(409, "Hồ sơ không còn ở trạng thái chờ duyệt."));
        return res.json({ message: "Đã từ chối hồ sơ và ghi nhật ký kiểm toán.", data });
    } catch (error) {
        return next(new ApiError(400, error.message));
    }
};
