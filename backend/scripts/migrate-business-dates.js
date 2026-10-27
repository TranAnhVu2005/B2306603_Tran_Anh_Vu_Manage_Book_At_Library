const config = require("../app/config");
const MongoDB = require("../app/utils/mongodb.util");
const { dateFromCalendarKey } = require("../app/utils/date.util");

const DATE_FIELDS = {
    docgia: ["NgaySinh"],
    theodoimuonsach: ["NgayDangKy", "NgayDuyet", "HanNhan", "NgayMuon", "NgayHenTra", "NgayGiaHan", "NgayTra"],
};
const applyChanges = process.argv.includes("--apply");

async function migrate() {
    const client = await MongoDB.connect(config.db.uri, config.db.name);
    const db = client.db(config.db.name);
    const operations = [];
    const totals = {};
    const invalid = [];

    for (const [collectionName, fields] of Object.entries(DATE_FIELDS)) {
        const collection = db.collection(collectionName);
        totals[collectionName] = {};
        const projection = Object.fromEntries(["_id", ...fields].map((field) => [field, 1]));
        for await (const document of collection.find({}, { projection })) {
            const set = {};
            for (const field of fields) {
                const value = document[field];
                if (typeof value !== "string") continue;
                try {
                    set[field] = value.trim() ? dateFromCalendarKey(value) : null;
                    totals[collectionName][field] = (totals[collectionName][field] || 0) + 1;
                } catch {
                    invalid.push(`${collectionName}.${field} document=${document._id}`);
                }
            }
            if (Object.keys(set).length) operations.push({ collectionName, updateOne: { filter: { _id: document._id }, update: { $set: set } } });
        }
    }

    if (invalid.length) throw new Error(`Có giá trị ngày không hợp lệ; chưa ghi dữ liệu: ${invalid.join(", ")}`);
    console.log(JSON.stringify({ mode: applyChanges ? "apply" : "dry-run", conversions: totals }, null, 2));
    if (!applyChanges) {
        console.log("Chưa thay đổi dữ liệu. Chạy lại với --apply để ghi chuyển đổi.");
        return;
    }

    let convertedDocuments = 0;
    const grouped = new Map();
    for (const operation of operations) {
        if (!grouped.has(operation.collectionName)) grouped.set(operation.collectionName, []);
        grouped.get(operation.collectionName).push(operation.updateOne);
    }
    for (const [collectionName, updates] of grouped) {
        const result = await db.collection(collectionName).bulkWrite(updates.map((updateOne) => ({ updateOne })), { ordered: true });
        convertedDocuments += result.modifiedCount;
    }
    console.log(`Đã cập nhật ${convertedDocuments} document; các trường null và BSON Date hiện hữu được giữ nguyên.`);
}

migrate().catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
}).finally(async () => {
    if (MongoDB.client) await MongoDB.client.close();
});
