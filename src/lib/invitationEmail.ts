import { supabaseAdmin } from "@/lib/supabase";
import { buildInviteUrl } from "@/lib/invitations";
import { sendMail } from "@/lib/email";

export async function sendInvitationEmail(
  token: string,
  email: string,
  teamId: string,
  role: string,
) {
  const { data: team, error: teamError } = await supabaseAdmin
    .from("teams")
    .select("name, description")
    .eq("id", teamId)
    .single();

  if (teamError || !team) {
    throw new Error(`Failed to fetch team details: ${teamError?.message}`);
  }

  const inviteUrl = buildInviteUrl(token);
  const subject = `You're invited to join ${team.name} on Uplora`;
  const text = [
    `You've been invited to join the team "${team.name}" on Uplora!`,
    "",
    `Role: ${role}`,
    `Team: ${team.name}`,
    team.description ? `Description: ${team.description}` : "",
    "",
    `Click the link below to accept the invitation:`,
    inviteUrl,
    "",
    `This invitation expires in 7 days.`,
    "",
    `Best regards,`,
    `The Uplora Team`,
  ].join("\n");

  const escapeHtml = (s: string) =>
    s
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  const html = `<pre>${escapeHtml(text)}</pre>`;

  return sendMail({ to: email, subject, text, html });
}
