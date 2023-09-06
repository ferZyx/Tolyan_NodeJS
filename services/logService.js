import Log from "../models/Log.js";

class LogService {
    async getLogsCount(query) {
        try {
            return Log.countDocuments(query)
        } catch (e) {
            throw new Error("Ошибка при получении количества логов: " + e.stack)
        }
    }

    async getLogs(query, from, count) {
        try {
            return Log.find(query).sort({timestamp: -1}).skip(from).limit(count)
        } catch (e) {
            throw new Error("Ошибка при получении логов: " + e.stack)
        }
    }
}

export default new LogService()