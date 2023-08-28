import mongoose from "mongoose"


class Database {
    async connect(URI) {
        try {
            // Подключение к MongoDB с использованием URL базы данных
            await mongoose.connect(URI, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
        } catch (error) {
            throw new Error(error.message);
        }
    };
}


export default new Database()

