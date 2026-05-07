exports.handler = async (event) => {
  try {
    const body = JSON.parse(event.body || "{}");

    const calendarId = process.env.CALENDAR_ID;
    const apiKey = process.env.GOOGLE_API_KEY;

    // =========================
    // GET BUSY (четене)
    // =========================
    if (body.action === "getBusy") {
      const now = new Date().toISOString();
      const future = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

      const url = `https://www.googleapis.com/calendar/v3/calendars/${calendarId}/events?key=${apiKey}&timeMin=${now}&timeMax=${future}&singleEvents=true&orderBy=startTime`;

      const res = await fetch(url);
      const data = await res.json();

      const busy = (data.items || []).map(e => ({
        start: e.start.dateTime,
        end: e.end.dateTime
      }));

      return {
        statusCode: 200,
        body: JSON.stringify(busy)
      };
    }

    return {
      statusCode: 400,
      body: "Invalid request"
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: err.toString()
    };
  }
};
