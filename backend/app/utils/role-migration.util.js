/**
 * Migrate legacy role labels to the canonical application roles:
 * USER, STAFF, ADMIN.
 *
 * This migration only changes role fields. Loan history, account status,
 * passwords, identifiers, and audit history remain untouched.
 */
async function migrateLegacyRoles(db) {
    const now = new Date();
    const [staffResult, readerResult] = await Promise.all([
        db.collection("nhanvien").updateMany(
            { ChucVu: { $in: ["THUTHU", "MANAGER"] } },
            { $set: { ChucVu: "STAFF", UpdatedAt: now } }
        ),
        db.collection("docgia").updateMany(
            { VaiTro: { $in: ["THUTHU", "MANAGER", "STAFF"] } },
            { $set: { VaiTro: "USER", UpdatedAt: now } }
        ),
    ]);

    return {
        staff: staffResult.modifiedCount,
        readers: readerResult.modifiedCount,
    };
}

module.exports = { migrateLegacyRoles };
