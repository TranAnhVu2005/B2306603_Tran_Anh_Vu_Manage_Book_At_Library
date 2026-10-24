const THE_LOAI_MAC_DINH = [
    ["TL-0001", "Giáo trình và tài liệu học tập"],
    ["TL-0002", "Công nghệ thông tin"],
    ["TL-0003", "Khoa học tự nhiên và Toán học"],
    ["TL-0004", "Kỹ thuật và Công nghệ"],
    ["TL-0005", "Kinh tế và Quản trị"],
    ["TL-0006", "Luật và Chính trị"],
    ["TL-0007", "Ngoại ngữ"],
    ["TL-0008", "Giáo dục và Tâm lý"],
    ["TL-0009", "Nông nghiệp và Môi trường"],
    ["TL-0010", "Y học và Sức khỏe"],
    ["TL-0011", "Văn học Việt Nam"],
    ["TL-0012", "Văn học thiếu nhi"],
    ["TL-0013", "Lịch sử và Văn hóa"],
    ["TL-0014", "Triết học và Tôn giáo"],
    ["TL-0015", "Kỹ năng và Phát triển bản thân"],
    ["TL-0016", "Từ điển và Tài liệu tra cứu"],
    ["TL-0017", "Khác"],
];

const publicFields = { _id: 1, MaTheLoai: 1, TenTheLoai: 1, MoTa: 1 };

class TheLoaiService {
    constructor(client) {
        this.TheLoai = client.db().collection("theloai");
    }

    async ensureDefaults() {
        await Promise.all(THE_LOAI_MAC_DINH.map(([MaTheLoai, TenTheLoai]) =>
            this.TheLoai.updateOne(
                { MaTheLoai },
                { $setOnInsert: { MaTheLoai, TenTheLoai, MoTa: "", CreatedAt: new Date() } },
                { upsert: true }
            )
        ));
    }

    async findAll() {
        return this.TheLoai.find({}, { projection: publicFields }).sort({ MaTheLoai: 1 }).toArray();
    }
}

TheLoaiService.THE_LOAI_MAC_DINH = THE_LOAI_MAC_DINH;
module.exports = TheLoaiService;
