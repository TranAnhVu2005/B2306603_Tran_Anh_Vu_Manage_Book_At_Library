const crypto = require("crypto");
const MongoDB = require("./mongodb.util");

const tokenHash = (token) => crypto.createHash("sha256").update(token).digest("hex");

async function isRevoked(token) {
    return Boolean(await MongoDB.client.db().collection("jwt_revocations").findOne({ tokenHash: tokenHash(token) }));
}

async function revoke(token, expiresAt) {
    if (!expiresAt || expiresAt * 1000 <= Date.now()) return;
    await MongoDB.client.db().collection("jwt_revocations").updateOne(
        { tokenHash: tokenHash(token) },
        { $set: { tokenHash: tokenHash(token), expiresAt: new Date(expiresAt * 1000) } },
        { upsert: true },
    );
}

module.exports = { isRevoked, revoke };
