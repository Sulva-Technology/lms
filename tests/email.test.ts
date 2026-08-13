import { describe, it, expect, afterEach } from 'vitest';
import { sendEmail, __setEmailSenderForTests, isEmailConfigured, type EmailMessage } from '@/lib/email/send';
import {
  renderGradePostedEmail,
  renderAssignmentDueEmail,
  renderAnnouncementEmail,
  renderSubmissionReceivedEmail,
} from '@/lib/email/templates';

afterEach(() => __setEmailSenderForTests(null));

describe('email templates', () => {
  it('renders a grade notification with score and link', () => {
    const message = renderGradePostedEmail({
      studentName: 'Ada',
      assignmentTitle: 'Essay 1',
      score: 88,
      totalPoints: 100,
      url: 'https://lms.test/student/assignments/a1',
    });

    expect(message.subject).toContain('Essay 1');
    expect(message.html).toContain('88');
    expect(message.html).toContain('https://lms.test/student/assignments/a1');
    expect(message.text).toContain('88/100');
  });

  it('escapes user-supplied content in the html body', () => {
    const message = renderAssignmentDueEmail({
      studentName: '<script>alert(1)</script>',
      assignmentTitle: 'Lab',
      courseCode: 'CS101',
      dueDate: '2026-09-01T10:00:00.000Z',
      url: 'https://lms.test/a',
    });

    expect(message.html).not.toContain('<script>');
    expect(message.html).toContain('&lt;script&gt;');
  });

  it('escapes announcement bodies', () => {
    const message = renderAnnouncementEmail({
      recipientName: 'Ada',
      courseCode: 'CS101',
      title: 'Midterm',
      body: '<img src=x onerror=alert(1)>',
      url: 'https://lms.test/a',
    });

    expect(message.html).not.toContain('<img');
    expect(message.text).toContain('CS101');
  });

  it('names both parties in a submission notification', () => {
    const message = renderSubmissionReceivedEmail({
      lecturerName: 'Dr Grace',
      studentName: 'Ada',
      assignmentTitle: 'Essay 1',
      url: 'https://lms.test/lecturer/assignments/a1/submissions',
    });

    expect(message.html).toContain('Dr Grace');
    expect(message.html).toContain('Ada');
    expect(message.subject).toContain('Essay 1');
  });
});

describe('sendEmail', () => {
  it('delegates to the injected sender', async () => {
    const sent: EmailMessage[] = [];
    __setEmailSenderForTests({
      async send(message) {
        sent.push(message);
      },
    });

    await sendEmail({ to: 'a@b.test', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' });

    expect(sent).toHaveLength(1);
    expect(sent[0].to).toBe('a@b.test');
  });

  it('never throws when the sender fails', async () => {
    __setEmailSenderForTests({
      async send() {
        throw new Error('provider down');
      },
    });

    await expect(
      sendEmail({ to: 'a@b.test', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' }),
    ).resolves.toBeUndefined();
  });

  it('reports configuration state', () => {
    __setEmailSenderForTests({ async send() {} });
    expect(isEmailConfigured()).toBe(true);
  });

  it('is a no-op when no provider is configured', async () => {
    __setEmailSenderForTests(null);
    await expect(
      sendEmail({ to: 'a@b.test', subject: 'Hi', html: '<p>Hi</p>', text: 'Hi' }),
    ).resolves.toBeUndefined();
  });
});
