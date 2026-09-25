import "server-only";
import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import type { CandidateProfile } from "@/lib/types";

const profilePath: string = path.join(process.cwd(), "data", "profile.json");
const exampleProfilePath: string = path.join(process.cwd(), "data", "profile.example.json");
const selectedProfilePath: string = existsSync(profilePath) ? profilePath : exampleProfilePath;

export const candidateProfile: CandidateProfile = JSON.parse(readFileSync(selectedProfilePath, "utf8")) as CandidateProfile;
