import cron from "node-cron";
import UserActivityService from "../services/userActivityService.js";
import UserRegistrationStatService from "../services/userRegistrationStatService.js";

export async function setupUserDailyStatisticsLogging(){
    cron.schedule('59 23 * * *', async () => {
        await UserActivityService.dailyUserActivityLogging()
        await UserRegistrationStatService.dailyRegisteredUserCountLogging()
    });
}
