import type { EmailBody } from './send';

const escapeHtml = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');

const layout = (heading: string, bodyHtml: string, url: string, cta: string): string => `
<div style="font-family:ui-sans-serif,system-ui,sans-serif;background:#020617;padding:32px;color:#e2e8f0">
  <div style="max-width:560px;margin:0 auto;background:#0f172a;border:1px solid rgba(255,255,255,0.08);border-radius:24px;padding:32px">
    <h1 style="margin:0 0 16px;font-size:20px;color:#ffffff">${escapeHtml(heading)}</h1>
    ${bodyHtml}
    <a href="${escapeHtml(url)}" style="display:inline-block;margin-top:24px;background:#2563eb;color:#ffffff;text-decoration:none;padding:12px 20px;border-radius:12px;font-weight:600">${escapeHtml(cta)}</a>
  </div>
</div>`;

export function renderAssignmentDueEmail(input: {
  studentName: string;
  assignmentTitle: string;
  courseCode: string;
  dueDate: string;
  url: string;
}): EmailBody {
  const due = new Date(input.dueDate).toUTCString();
  const subject = `${input.courseCode}: "${input.assignmentTitle}" is due soon`;
  const html = layout(
    subject,
    `<p style="margin:0;color:#cbd5f5;line-height:1.6">Hi ${escapeHtml(input.studentName)}, your assignment
     <strong style="color:#ffffff">${escapeHtml(input.assignmentTitle)}</strong> for
     ${escapeHtml(input.courseCode)} is due ${escapeHtml(due)}.</p>`,
    input.url,
    'Open assignment',
  );
  const text = `Hi ${input.studentName}, "${input.assignmentTitle}" (${input.courseCode}) is due ${due}. ${input.url}`;
  return { subject, html, text };
}

export function renderGradePostedEmail(input: {
  studentName: string;
  assignmentTitle: string;
  score: number;
  totalPoints: number;
  url: string;
}): EmailBody {
  const subject = `Your grade for "${input.assignmentTitle}" is available`;
  const html = layout(
    subject,
    `<p style="margin:0;color:#cbd5f5;line-height:1.6">Hi ${escapeHtml(input.studentName)}, you scored
     <strong style="color:#ffffff">${input.score}</strong> out of ${input.totalPoints}.</p>`,
    input.url,
    'View feedback',
  );
  const text = `Hi ${input.studentName}, you scored ${input.score}/${input.totalPoints} on "${input.assignmentTitle}". ${input.url}`;
  return { subject, html, text };
}

export function renderAnnouncementEmail(input: {
  recipientName: string;
  courseCode: string;
  title: string;
  body: string;
  url: string;
}): EmailBody {
  const subject = `${input.courseCode}: ${input.title}`;
  const html = layout(
    subject,
    `<p style="margin:0;color:#cbd5f5;line-height:1.6;white-space:pre-wrap">${escapeHtml(input.body)}</p>`,
    input.url,
    'Open announcement',
  );
  const text = `${input.courseCode} — ${input.title}\n\n${input.body}\n\n${input.url}`;
  return { subject, html, text };
}

export function renderSubmissionReceivedEmail(input: {
  lecturerName: string;
  studentName: string;
  assignmentTitle: string;
  url: string;
}): EmailBody {
  const subject = `New submission: ${input.assignmentTitle}`;
  const html = layout(
    subject,
    `<p style="margin:0;color:#cbd5f5;line-height:1.6">Hi ${escapeHtml(input.lecturerName)},
     ${escapeHtml(input.studentName)} submitted work for
     <strong style="color:#ffffff">${escapeHtml(input.assignmentTitle)}</strong>.</p>`,
    input.url,
    'Grade submission',
  );
  const text = `${input.studentName} submitted work for "${input.assignmentTitle}". ${input.url}`;
  return { subject, html, text };
}
