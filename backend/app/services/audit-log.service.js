const auditFields = {
    _id: 1,
    Action: 1,
    EntityType: 1,
    EntityId: 1,
    MaSach: 1,
    TenSach: 1,
    MaDocGia: 1,
    TenDocGia: 1,
    MSNV: 1,
    TenNhanVien: 1,
    ActorType: 1,
    ActorId: 1,
    ActorName: 1,
    Details: 1,
    OccurredAt: 1,
};

class AuditLogService {
    constructor(client) {
        this.db = client.db();
        this.Logs = this.db.collection("auditlogs");
    }

    async record(event) {
        const actorType = event.actorType || "system";
        const actorId = String(event.actorId || "system");
        let actorName = String(event.actorName || "");

        if (!actorName && actorType === "staff") {
            const actor = await this.db.collection("nhanvien").findOne({ MSNV: actorId }, { projection: { HoTenNV: 1 } });
            actorName = actor?.HoTenNV || actorId;
        } else if (!actorName && actorType === "reader") {
            const actor = await this.db.collection("docgia").findOne({ MaDocGia: actorId }, { projection: { HoLot: 1, Ten: 1 } });
            actorName = [actor?.HoLot, actor?.Ten].filter(Boolean).join(" ") || actorId;
        }

        const entry = {
            Action: String(event.action),
            EntityType: String(event.entityType),
            EntityId: String(event.entityId || ""),
            ActorType: actorType,
            ActorId: actorId,
            ActorName: actorName || actorId,
            OccurredAt: new Date(),
        };

        for (const key of ["MaSach", "TenSach", "MaDocGia", "TenDocGia", "MSNV", "TenNhanVien", "Details"]) {
            if (event[key] !== undefined && event[key] !== null) entry[key] = event[key];
        }
        if (actorType === "staff") {
            entry.MSNV = entry.MSNV || actorId;
            entry.TenNhanVien = entry.TenNhanVien || actorName || actorId;
        }

        await this.Logs.insertOne(entry);
        return entry;
    }

    async find(filters = {}) {
        const query = {};
        for (const field of ["Action", "EntityType", "MaSach", "MaDocGia", "MSNV"]) {
            if (filters[field]) query[field] = String(filters[field]).trim();
        }
        if (filters.from || filters.to) {
            query.OccurredAt = {};
            if (filters.from) query.OccurredAt.$gte = new Date(filters.from);
            if (filters.to) {
                const upperBound = new Date(filters.to);
                if (/^\d{4}-\d{2}-\d{2}$/.test(String(filters.to))) upperBound.setDate(upperBound.getDate() + 1);
                query.OccurredAt.$lt = upperBound;
            }
        }
        const limit = Math.min(Math.max(Number.parseInt(filters.limit, 10) || 100, 1), 300);
        const skip = Math.min(Math.max(Number.parseInt(filters.skip, 10) || 0, 0), 100000);
        const cursor = this.Logs.find(query, { projection: auditFields })
            .sort({ OccurredAt: -1, _id: -1 }).skip(skip).limit(limit);
        const [items, total] = await Promise.all([cursor.toArray(), this.Logs.countDocuments(query)]);
        return { items, total, limit, skip };
    }
}

module.exports = AuditLogService;
