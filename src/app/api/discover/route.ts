import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { saveJobs } from "@/lib/database";
import { discoverJobs } from "@/lib/job_sources";
import type { Job } from "@/lib/types";

export const runtime = "nodejs";

interface DiscoveryResponse {
  discovered: number;
  saved: number;
}

const discoverySchema = z.object({
  keywords: z.array(z.string().min(2).max(80)).max(40).default([]),
});

export async function POST(request: NextRequest): Promise<NextResponse<DiscoveryResponse | { error: string }>> {
  try {
    const bodyText: string = await request.text();
    const body: unknown = bodyText ? JSON.parse(bodyText) : {};
    const parsed: ReturnType<typeof discoverySchema.safeParse> = discoverySchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid discovery filters." }, { status: 400 });
    }
    const jobs: Job[] = await discoverJobs(parsed.data.keywords);
    const saved: number = saveJobs(jobs);
    return NextResponse.json({ discovered: jobs.length, saved });
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : "Job discovery failed.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
