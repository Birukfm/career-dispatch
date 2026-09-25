import { NextRequest, NextResponse } from "next/server";
import { analyzeResume, type ResumeAnalysis } from "@/lib/resume_analyzer";

export const runtime = "nodejs";

const maximumFileSizeBytes: number = 5 * 1024 * 1024;

export async function POST(request: NextRequest): Promise<NextResponse<ResumeAnalysis | { error: string }>> {
  try {
    const formData: FormData = await request.formData();
    const resume: FormDataEntryValue | null = formData.get("resume");
    if (!(resume instanceof File)) {
      return NextResponse.json({ error: "Select a resume to continue." }, { status: 400 });
    }
    if (resume.size > maximumFileSizeBytes) {
      return NextResponse.json({ error: "The resume must be smaller than 5 MB." }, { status: 400 });
    }
    return NextResponse.json(await analyzeResume(resume));
  } catch (error: unknown) {
    const message: string = error instanceof Error ? error.message : "Unable to analyze this resume.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
