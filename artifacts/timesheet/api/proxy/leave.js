const API_KEY = "G2JylRhOWQ8Xa0Z5OmCI7W9DfLXJCYPA";

const LEAVE_ENDPOINT =
  "https://defaultd508624fa0b74fd3951105b18ca027.84.environment.api.powerplatform.com:443/powerautomate/automations/direct/workflows/e6b3ef6685da42d49073363642d020eb/triggers/manual/paths/invoke?api-version=1&sp=%2Ftriggers%2Fmanual%2Frun&sv=1.0&sig=FjKe83SFE8Jg6ZM2EVMad4qMEtGzvu4nmhgGLGJ9x_0";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

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
    console.error("Leave proxy error:", err);
    res.status(502).json({ error: "Failed to reach leave endpoint" });
  }
}
