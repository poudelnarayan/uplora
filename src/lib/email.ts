import nodemailer from "nodemailer";

const defaultHost = process.env.SMTP_HOST!;
const defaultPort = Number(process.env.SMTP_PORT || 465);
const defaultSecure = String(process.env.SMTP_SECURE || "true") === "true";
const enableDebug = String(process.env.SMTP_DEBUG || "false") === "true";
const connectionTimeoutMs = Number(process.env.SMTP_CONNECTION_TIMEOUT || 15000);
const socketTimeoutMs = Number(process.env.SMTP_SOCKET_TIMEOUT || 20000);
const dnsTimeoutMs = Number(process.env.SMTP_DNS_TIMEOUT || 5000);

function createTransporter(host: string, port: number, secure: boolean) {
  return nodemailer.createTransport({
    host,
    port,
    secure,
    auth: {
      user: process.env.SMTP_USER!,
      pass: process.env.SMTP_PASS!,
    },
    connectionTimeout: connectionTimeoutMs,
    socketTimeout: socketTimeoutMs,
    dnsTimeout: dnsTimeoutMs,
    logger: enableDebug,
    debug: enableDebug,
    tls: {
      servername: host,
      rejectUnauthorized: false, // Add this for better compatibility
    },
  });
}

export async function sendMail(opts: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}) {
  // Fail fast with a clear error when SMTP isn't configured (common cause of "no invite email").
  if (!process.env.SMTP_HOST || !process.env.SMTP_USER || !process.env.SMTP_PASS) {
    throw new Error("SMTP is not configured. Set SMTP_HOST, SMTP_USER, and SMTP_PASS (and optionally SMTP_FROM).");
  }

  // Ensure header From aligns with authenticated SMTP user to satisfy DMARC/SPF
  const smtpUser = process.env.SMTP_USER!;
  const configuredFrom = process.env.SMTP_FROM;

  const extractDomain = (addr?: string) => {
    if (!addr) return undefined;
    const match = addr.match(/<([^>]+)>/); // handle "Name <email@domain>"
    const email = (match ? match[1] : addr).trim();
    const at = email.lastIndexOf("@");
    return at > -1 ? email.slice(at + 1).toLowerCase() : undefined;
  };

  const fromDomain = extractDomain(configuredFrom);
  const userDomain = extractDomain(smtpUser);

  // If configured FROM domain matches SMTP user domain, use it; otherwise force alignment
  const from = fromDomain && userDomain && fromDomain === userDomain
    ? configuredFrom!
    : `Uplora <${smtpUser}>`;

  // Attempt with configured settings first
  let lastError: unknown = null;
  for (const attempt of [
    { host: defaultHost, port: defaultPort, secure: defaultSecure },
    // Fallback: try STARTTLS on 587 if implicit TLS:465 fails
    { host: defaultHost, port: 587, secure: false },
  ]) {
    try {
      const transporter = createTransporter(attempt.host, attempt.port, attempt.secure);
      const info = await transporter.sendMail({
        from,
        to: opts.to,
        subject: opts.subject,
        text: opts.text,
        html: opts.html,
        // Preserve reply-to preference; if not set and FROM was forced to SMTP user,
        // use configuredFrom as reply-to so recipients can reply to a friendly address
        replyTo: opts.replyTo || (from !== (configuredFrom || `Uplora <${smtpUser}>`) ? configuredFrom : undefined),
        headers: {
          'X-Priority': '1',
          'X-MSMail-Priority': 'High',
          'Importance': 'high',
          'X-Mailer': 'Uplora/1.0',
          'List-Unsubscribe': `<mailto:${process.env.SMTP_USER}?subject=unsubscribe>`,
        },
        priority: 'high',
      });
      return info;
    } catch (err) {
      lastError = err;
      // Try next attempt
    }
  }

  throw lastError instanceof Error ? lastError : new Error("SMTP send failed");
}

// Backwards compatibility with existing imports
export async function sendEmail(opts: {
  to: string | string[];
  subject: string;
  text?: string;
  html?: string;
  replyTo?: string;
}) {
  return sendMail(opts);
}
