import type { RequirementInput } from "@event-manager/shared";

export type SavedRequirement = {
  id: string;
  category: RequirementInput["category"];
  createdAt: string;
};
export class SubmissionError extends Error {
  constructor(
    message: string,
    public fields: { field: string; message: string }[] = [],
  ) {
    super(message);
  }
}

export async function postRequirement(
  payload: RequirementInput,
  key: string,
): Promise<SavedRequirement> {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:4000";
  let response: Response;
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/requirements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(payload),
      signal: AbortSignal.timeout(20000),
    });
  } catch {
    throw new SubmissionError(
      "We couldn't reach the server. Your details are still here — check your connection and try again.",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok)
    throw new SubmissionError(
      data?.message || "Something went wrong. Please try again.",
      data?.errors || [],
    );
  if (!data?.requirement?.id)
    throw new SubmissionError(
      "We couldn't confirm your submission. Please try again.",
    );
  return data.requirement;
}
