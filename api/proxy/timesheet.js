const API_KEY = "G2JylRhOWQ8Xa0Z5OmCI7W9DfLXJCYPA";

const TIMESHEET_ENDPOINT =
  "https://defaultd508624fa0b74fd3951105b18ca027.84.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/d419424dcb78497fa8988d5a8e465792/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=DW34F2ORKLfJ7Vi_J2r7GX5Eg32vkbYgD23G-1VlG8U";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

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
    console.error("Timesheet proxy error:", err);
    res.status(502).json({ error: "Failed to reach timesheet endpoint" });
  }
}
