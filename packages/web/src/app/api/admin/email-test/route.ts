import { NextRequest, NextResponse } from "next/server";
import { sendEmail } from "@/lib/email";
import { withApi, z } from "@/lib/api/withApi";

const emailTestSchema = z.object({
  to: z.string().email(),
  subject: z.string(),
  html: z.string(),
  text: z.string().optional(),
});

export const POST = withApi({
  auth: "admin",
  bodySchema: emailTestSchema,
}, async ({ body }) => {
  const { to, subject, html, text } = body;

  console.log('Testing Brevo email sending...');
  console.log('To:', to);
  console.log('Subject:', subject);

  const result = await sendEmail({
    to,
    subject,
    html,
    text
  });

  if (result.success) {
    console.log('Email sent successfully:', result.messageId);
    return {
      message: 'Test email sent successfully',
      messageId: result.messageId
    };
  } else {
    console.error('Email sending failed:', result.error);
    throw new Error(result.error || 'Failed to send email');
  }
});
