import { default as express } from "express";
import { serviceManager } from "msp_common";
import { GetUserProfileDataActivity } from "../services/getUserProfileData.js";
const router = express.Router();
// Create service manager and register activities
const services = serviceManager();
services.use(GetUserProfileDataActivity);
router.get("/health", (_req, res) => {
    res.status(200).json({
        status: "ok",
        service: "actorwork"
    });
});
router.put('/service/run', async (req, res) => {
    const request = req.body;
    if (!request?.namespace || !request?.activityName || !request?.version) {
        res.status(400).json({
            success: false,
            message: 'Invalid service request: namespace, activityName and version are required.'
        });
        return;
    }
    try {
        const result = await services.runAllMatches(request.namespace, request.activityName, request.version, request.payload);
        res.status(200).json(result);
    }
    catch (error) {
        res.status(500).json({
            success: false,
            message: 'Service execution failed.',
            error: error?.message ?? String(error),
        });
    }
});
export default router;
//# sourceMappingURL=routes.js.map