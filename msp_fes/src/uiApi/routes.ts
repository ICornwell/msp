import { default as express } from "express";
import { default as asyncify } from "express-asyncify";
import { serviceManager } from "msp_common";
import {discoveryActivitySet } from './activities/discovery.js';
const router = asyncify(express.Router());

router.post("/:namespace/:activityName", async (req, res) => {
  const sm = serviceManager()
  sm.use(discoveryActivitySet);

  const result = await sm.runAllMatches(req.params.namespace, req.params.activityName, "1.0.0", req.query)

  res.json({
    status: "ok",
    serviceResult: result
  }).status(200);
});

export default router;