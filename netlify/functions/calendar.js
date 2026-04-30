const { google } = require("googleapis");

exports.handler = async (event) => {
  try {
    const credentials = JSON.parse(process.env.GOOGLE_CREDENTIALS);

    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ["https://www.googleapis.com/auth/calendar"],
    });

    const calendar = google.calendar({ version: "v3", auth });

    const calendarId = process.env.CALENDAR_ID;

    const body = JSON.parse(event.body || "{}");

    // -------------------------
    // 1. ВЗИМАМЕ ЗАЕТИТЕ ЧАСОВЕ
    // -------------------------
    if (body.action === "getBusy") {
      const now = new Date();
      const future = new Date();
      future.setDate(now.getDate() + 14);

      const res = await calendar.events.list({
        calendarId,
        timeMin: now.toISOString(),
        timeMax: future.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      const busy = res.data.items.map(e => ({
        start: e.start.dateTime,
        end: e.end.dateTime,
      }));

      return {
        statusCode: 200,
        body: JSON.stringify(busy),
      };
    }

    // -------------------------
    // 2. СЪЗДАВАНЕ НА СРЕЩА
    // -------------------------
    if (body.action === "create") {
      const { name, email, slot, type } = body;

      const start = new Date(slot);
      const end = new Date(start.getTime() + 60 * 60 * 1000);

      let eventData = {
        summary: `Консултация – ${name}`,
        description: `Тип: ${type}\nEmail: ${email}`,
        start: { dateTime: start.toISOString() },
        end: { dateTime: end.toISOString() },
        attendees: [{ email }],
      };

      // онлайн → добавяме Google Meet
      if (type === "online") {
        eventData.conferenceData = {
          createRequest: {
            requestId: Math.random().toString(36),
            conferenceSolutionKey: { type: "hangoutsMeet" },
          },
        };
      }

      // присъствено → адрес
      if (type === "offline") {
        eventData.location = "София (адрес по избор)";
      }

      const res = await calendar.events.insert({
        calendarId,
        resource: eventData,
        conferenceDataVersion: 1,
      });

      return {
        statusCode: 200,
        body: JSON.stringify(res.data),
      };
    }

    return {
      statusCode: 400,
      body: "Invalid request",
    };

  } catch (err) {
    return {
      statusCode: 500,
      body: err.toString(),
    };
  }
};
if (body.action === "book") {
  await calendar.events.insert({
    calendarId,
    resource: {
      summary: `${body.name} (${body.type})`,
      description: body.email,
      start: { dateTime: body.start },
      end: { dateTime: body.end }
    }
  });

  return {
    statusCode: 200,
    body: JSON.stringify({ success: true })
  };
}
