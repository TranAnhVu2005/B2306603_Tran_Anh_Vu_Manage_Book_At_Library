const { ObjectId } = require("mongodb");

/** Convert legacy notification recipient ObjectIds to business codes once, without deleting notifications. */
async function migrateLegacyNotificationRecipients(db) {
    const notifications = db.collection("thongbao");
    let migrated = 0;
    let unresolved = 0;
    const cursor = notifications.find({ NguoiNhanId: { $exists: true } });

    for await (const notification of cursor) {
        const collectionName = notification.LoaiNguoiNhan === "docgia"
            ? "docgia"
            : notification.LoaiNguoiNhan === "nhanvien"
                ? "nhanvien"
                : null;
        const rawId = notification.NguoiNhanId;
        const objectId = rawId instanceof ObjectId
            ? rawId
            : ObjectId.isValid(String(rawId || ""))
                ? new ObjectId(String(rawId))
                : null;

        if (!collectionName || !objectId) {
            unresolved++;
            continue;
        }

        const codeField = collectionName === "docgia" ? "MaDocGia" : "MSNV";
        const recipient = await db.collection(collectionName).findOne(
            { _id: objectId },
            { projection: { [codeField]: 1 } }
        );
        const code = recipient?.[codeField];
        if (!code) {
            unresolved++;
            continue;
        }

        const result = await notifications.updateOne(
            { _id: notification._id, NguoiNhanId: rawId },
            { $set: { MaNguoiNhan: String(code) }, $unset: { NguoiNhanId: "" } }
        );
        if (result.modifiedCount) migrated++;
    }

    return { migrated, unresolved };
}

module.exports = { migrateLegacyNotificationRecipients };
