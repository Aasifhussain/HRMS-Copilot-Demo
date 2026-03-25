import { Router, type IRouter } from "express";

const router: IRouter = Router();

const API_KEY = "G2JylRhOWQ8Xa0Z5OmCI7W9DfLXJCYPA";

const TIMESHEET_ENDPOINT =
  "https://defaultd508624fa0b74fd3951105b18ca027.84.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d419424dcb78497fa8988d5a8e465792/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DW34F2ORKLfJ7Vi_J2r7GX5Eg32vkbYgD23G-1VlG8U";

const LEAVE_ENDPOINT =
  "https://defaultd508624fa0b74fd3951105b18ca027.84.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/e6b3ef6685da42d49073363642d020eb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FjKe83SFE8Jg6ZM2EVMad4qMEtGzvu4nmhgGLGJ9x_0";

router.post("/proxy/timesheet", async (req, res) => {
  try {
    const response = await fetch(TIMESHEET_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    res.status(response.status).send(text || "{}");
  } catch (err) {
    req.log.error({ err }, "Timesheet proxy error");
    res.status(502).json({ error: "Failed to reach timesheet endpoint" });
  }
});

router.post("/proxy/leave", async (req, res) => {
  try {
    const response = await fetch(LEAVE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": API_KEY,
      },
      body: JSON.stringify(req.body),
    });

    const text = await response.text();
    res.status(response.status).send(text || "{}");
  } catch (err) {
    req.log.error({ err }, "Leave proxy error");
    res.status(502).json({ error: "Failed to reach leave endpoint" });
  }
});

export default router;
