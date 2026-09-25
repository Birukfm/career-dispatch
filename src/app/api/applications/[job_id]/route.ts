import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getJob, saveOutreach, updateJobStatus } from "@/lib/database";
import { sendApplication, type SendResult } from "@/lib/mailer";
import { createApplicationPackage, type ApplicationPackage } from "@/lib/templates";
import type { Job } from "@/lib/types";

export const runtime = "nodejs";

const sendSchema = z.object({
  recipientEmail: z.email(),
  hasReviewed: z.literal(true),
});

interface RouteContext {
  params: Promise<{ job_id: string }>;
}

export async function GET(_request: NextRequest, context: RouteContext): Promise<NextResponse<ApplicationPackage | { error: string }>> {
  const { job_id: jobId }: { job_id: string } = await context.params;
  const job: Job | null = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  return NextResponse.json(createApplicationPackage(job));
}

export async function POST(request: NextRequest, context: RouteContext): Promise<NextResponse<SendResult | { error: string }>> {
  try {
    const { job_id: jobId }: { job_id: string } = await context.params;
    const parsed = sendSchema.safeParse(await request.json());
    if (!parsed.success) {
      return NextResponse.json({ error: "Review confirmation and a valid recipient email are required." }, { status: 400 });
    }
    const job: Job | null = getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: "Job not found." }, { status: 404 });
    }
    if (!job.contactEmail || parsed.data.recipientEmail.toLowerCase() !== job.contactEmail.toLowerCase()) {
      return NextResponse.json({ error: "Sending is limited to the recruiting email publicly listed in the job post." }, { status: 400 });
    }
    const application: ApplicationPackage = createApplicationPackage(job);
    const result: SendResult = await sendApplication(parsed.data.recipientEmail, application);
    saveOutreach({
      jobId,
      recipientEmail: parsed.data.recipientEmail,
      subject: application.subject,
      sentAt: result.sentAt,
      status: "sent",
      providerMessageId: result.messageId,
    });
    updateJobStatus(jobId, "sent");
    return NextResponse.json(result);
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : "Unable to send application.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
