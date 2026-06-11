const LOGGER_URL = "https://netcradus-logger.onrender.com";

export async function sendLog(path) {
  try {
    await fetch(`${LOGGER_URL}/log`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        site: window.location.hostname,
        path,
        method: "GET",
        status: 200,
        user_agent: navigator.userAgent,
      }),
    });
  } catch (err) {
    console.error("Logger errors:", err);
  }
}
