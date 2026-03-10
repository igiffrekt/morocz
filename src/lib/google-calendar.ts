import { google } from "googleapis";

const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID ?? "";
const TIMEZONE = "Europe/Budapest";

function getCalendarClient() {
  const auth = new google.auth.JWT({
    email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
    key: (process.env.GOOGLE_SERVICE_ACCOUNT_PRIVATE_KEY ?? "").replace(/\\n/g, "\n"),
    scopes: ["https://www.googleapis.com/auth/calendar"],
  });
  return google.calendar({ version: "v3", auth });
}

export interface CalendarEventInput {
  summary: string;
  description: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  durationMinutes: number;
}

export async function createCalendarEvent(input: CalendarEventInput): Promise<string | null> {
  try {
    const calendar = getCalendarClient();
    const [h, m] = input.startTime.split(":").map(Number);
    const start = new Date(`${input.date}T${input.startTime}:00`);
    const end = new Date(start.getTime() + input.durationMinutes * 60_000);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;

    const res = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: input.summary,
        description: input.description,
        start: { dateTime: fmt(start), timeZone: TIMEZONE },
        end: { dateTime: fmt(end), timeZone: TIMEZONE },
      },
    });

    return res.data.id ?? null;
  } catch (err) {
    console.error("[google-calendar] createCalendarEvent error:", err);
    return null;
  }
}

export async function deleteCalendarEvent(eventId: string): Promise<void> {
  try {
    const calendar = getCalendarClient();
    await calendar.events.delete({ calendarId: CALENDAR_ID, eventId });
  } catch (err) {
    console.error("[google-calendar] deleteCalendarEvent error:", err);
  }
}

export async function updateCalendarEvent(
  eventId: string,
  input: CalendarEventInput,
): Promise<void> {
  try {
    const calendar = getCalendarClient();
    const start = new Date(`${input.date}T${input.startTime}:00`);
    const end = new Date(start.getTime() + input.durationMinutes * 60_000);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}T${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}:00`;

    await calendar.events.update({
      calendarId: CALENDAR_ID,
      eventId,
      requestBody: {
        summary: input.summary,
        description: input.description,
        start: { dateTime: fmt(start), timeZone: TIMEZONE },
        end: { dateTime: fmt(end), timeZone: TIMEZONE },
      },
    });
  } catch (err) {
    console.error("[google-calendar] updateCalendarEvent error:", err);
  }
}
