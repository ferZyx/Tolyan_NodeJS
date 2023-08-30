import Log from "../models/Log.js";

class LogService {
    async getLogsCount() {
        return Log.countDocuments()
    }

    async getLogs(query, from, count){
        return Log.find(query).sort({ timestamp: -1}).skip(from).limit(count);
    }
}

export default new LogService()