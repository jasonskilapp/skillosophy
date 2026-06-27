import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.EMAIL_SMTP_HOST,
  port: Number(process.env.EMAIL_SMTP_PORT ?? 465),
  secure: true,
  auth: {
    user: process.env.EMAIL_SMTP_USER,
    pass: process.env.EMAIL_SMTP_PASS,
  },
});

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.skillosophyapp.com";
const FROM = `Skillosophy <${process.env.EMAIL_SMTP_USER}>`;

export async function sendTeamInviteEmail({
  toName,
  toEmail,
  token,
  orgName,
  role,
}: {
  toName: string;
  toEmail: string;
  token: string;
  orgName: string;
  role: string;
}) {
  const joinUrl = `${SITE_URL}/join/${token}`;
  const roleLabel = role === "org_admin" ? "Admin" : "Team Member";

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `You've been invited to join ${orgName} on Skillosophy`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a2231;">
        <h2 style="margin:0 0 8px;font-size:22px;">You're invited to ${orgName}</h2>
        <p style="margin:0 0 24px;color:#687387;">Hi ${toName}, you've been invited to join <strong>${orgName}</strong> as a <strong>${roleLabel}</strong> on Skillosophy.</p>
        <a href="${joinUrl}" style="display:inline-block;background:#1f9d76;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Accept Invitation
        </a>
        <p style="margin:24px 0 0;font-size:13px;color:#687387;">
          Or copy this link into your browser:<br/>
          <a href="${joinUrl}" style="color:#1f9d76;">${joinUrl}</a>
        </p>
        <p style="margin:16px 0 0;font-size:12px;color:#9aa5b4;">This invitation expires in 14 days.</p>
      </div>
    `,
  });
}

export async function sendCandidateInviteEmail({
  toEmail,
  token,
  orgName,
}: {
  toEmail: string;
  token: string;
  orgName: string;
}) {
  const joinUrl = `${SITE_URL}/invite/${token}`;

  await transporter.sendMail({
    from: FROM,
    to: toEmail,
    subject: `Upload your resume for your ${orgName} appointment`,
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:520px;margin:0 auto;padding:32px 24px;color:#1a2231;">
        <h2 style="margin:0 0 8px;font-size:22px;">Your appointment is coming up</h2>
        <p style="margin:0 0 24px;color:#687387;">Please upload your resume before your appointment with <strong>${orgName}</strong> so your advisor can prepare a personalized profile for you.</p>
        <a href="${joinUrl}" style="display:inline-block;background:#1f9d76;color:#fff;text-decoration:none;padding:12px 28px;border-radius:8px;font-weight:600;font-size:15px;">
          Upload My Resume
        </a>
        <p style="margin:24px 0 0;font-size:13px;color:#687387;">
          Or copy this link into your browser:<br/>
          <a href="${joinUrl}" style="color:#1f9d76;">${joinUrl}</a>
        </p>
        <p style="margin:16px 0 0;font-size:12px;color:#9aa5b4;">This link expires in 7 days.</p>
      </div>
    `,
  });
}
