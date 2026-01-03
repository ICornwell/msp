import { default as express } from "express";
import { default as asyncify } from "express-asyncify";
const router = asyncify(express.Router());
router.get("/test", (_req, res) => {
    res.status(200).json({
        status: "ok"
    });
});
export default router;
//# sourceMappingURL=routes.js.map