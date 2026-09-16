type ContactPayload = { name?: string; email?: string; subject?: string; message?: string; company?: string };

const clean = (value: unknown, max: number) => String(value ?? "").trim().slice(0, max);

export async function POST(request: Request) {
  let payload: ContactPayload;
  try { payload = await request.json() as ContactPayload; } catch { return Response.json({ error: "Invalid request." }, { status: 400 }); }
  if (payload.company) return Response.json({ ok: true });
  const name = clean(payload.name, 80);
  const email = clean(payload.email, 160);
  const subject = clean(payload.subject, 140) || "Portfolio enquiry";
  const message = clean(payload.message, 5000);
  if (name.length < 2 || !/^\S+@\S+\.\S+$/.test(email) || message.length < 10) return Response.json({ error: "Please provide a valid name, email, and message." }, { status: 400 });

  const apiKey = process.env.RESEND_API_KEY;
  const to = process.env.CONTACT_TO_EMAIL || "adarshkhare269@gmail.com";
  const from = process.env.RESEND_FROM_EMAIL || "Codefolio <onboarding@resend.dev>";
  if (!apiKey) return Response.json({ error: "Contact email is not configured yet." }, { status: 503 });

  const response = await fetch("https://api.resend.com/emails", { method: "POST", headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" }, body: JSON.stringify({ from, to: [to], reply_to: email, subject: `[Portfolio] ${subject}`, text: `Name: ${name}\nEmail: ${email}\n\n${message}` }) });
  if (!response.ok) return Response.json({ error: "The message could not be sent. Please try again." }, { status: 502 });
  return Response.json({ ok: true });
}
