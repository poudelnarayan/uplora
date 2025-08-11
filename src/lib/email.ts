import nodemailer from "nodemailer";

interface SendEmailArgs {
  to: string;
  subject: string;
  html?: string;
  text?: string;
}

function getMailerConfig() {
  const {
    SMTP_HOST,
    SMTP_PORT,
    SMTP_USER,
    SMTP_PASS,
    SMTP_FROM,
    EMAIL_SERVER,
    EMAIL_FROM,
    SMTP_URL,
  } = process.env as Record<string, string | undefined>;

  // Prefer URL-style config if provided (NextAuth/commonly used)
  const url = EMAIL_SERVER || SMTP_URL;
  if (url) {
    try {
      const parsed = new URL(url);
      const host = parsed.hostname;
      const port = Number(parsed.port || (parsed.protocol === "smtps:" ? 465 : 587));
      const secure = parsed.protocol === "smtps:" || port === 465;
      const user = decodeURIComponent(parsed.username || "");
      const pass = decodeURIComponent(parsed.password || "");
      const from = EMAIL_FROM || SMTP_FROM;
      if (host && port && user && pass && from) {
        return { host, port, secure, user, pass, from };
      }
    } catch {
      // ignore parse errors and fall back to discrete vars
    }
  }

  // Fallback to discrete SMTP_* vars
  if (SMTP_HOST && SMTP_PORT && SMTP_USER && SMTP_PASS && (SMTP_FROM || EMAIL_FROM)) {
    return {
      host: SMTP_HOST,
      port: Number(SMTP_PORT),
      secure: Number(SMTP_PORT) === 465,
      user: SMTP_USER,
      pass: SMTP_PASS,
      from: SMTP_FROM || (EMAIL_FROM as string),
    };
  }

  return null;
}

export async function sendEmail({ to, subject, html, text }: SendEmailArgs): Promise<void> {
  const cfg = getMailerConfig();

  if (!cfg) {
    console.log("[email] SMTP not configured. Logging email instead.");
    console.log({ to, subject, html, text });
    return;
  }

  const transporter = nodemailer.createTransport({
    host: cfg.host,
    port: cfg.port,
    secure: cfg.secure,
    auth: { user: cfg.user, pass: cfg.pass },
  });

  await transporter.sendMail({ from: cfg.from, to, subject, html, text });
}
