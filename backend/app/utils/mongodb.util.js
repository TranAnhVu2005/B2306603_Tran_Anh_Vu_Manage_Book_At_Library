const { MongoClient } = require("mongodb");
class MongoDB {
    static connect = async (uri, dbName) => {
        if (this.client) return this.client;
        if (!uri) throw new Error("MONGODB_URI chưa được cấu hình.");
        this.client = await MongoClient.connect(uri, dbName ? { dbName } : {});
        return this.client;
    }
}

module.exports = MongoDB;
