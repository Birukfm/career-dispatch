import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getJob, updateJobStatus } from "@/lib/database";
import type { Job, JobStatus } from "@/lib/types";

export const runtime = "nodejs";

const requestSchema: z.ZodObject<{ status: z.ZodEnum<{
  new: "new";
  shortlisted: "shortlisted";
  drafted: "drafted";
  sent: "sent";
  replied: "replied";
  archived: "archived";
}> }> = z.object({
  status: z.enum(["new", "shortlisted", "drafted", "sent", "replied", "archived"]),
});

interface RouteContext {
  params: Promise<{ job_id: string }>;
}

export async function PATCH(request: NextRequest, context: RouteContext): Promise<NextResponse<Job | { error: string }>> {
  const { job_id: jobId }: { job_id: string } = await context.params;
  const result: ReturnType<typeof requestSchema.safeParse> = requestSchema.safeParse(await request.json());
  if (!result.success) {
    return NextResponse.json({ error: "Invalid job status." }, { status: 400 });
  }
  const job: Job | null = getJob(jobId);
  if (!job) {
    return NextResponse.json({ error: "Job not found." }, { status: 404 });
  }
  updateJobStatus(jobId, result.data.status);
  return NextResponse.json({ ...job, status: result.data.status });
}
