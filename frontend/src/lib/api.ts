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
  const baseUrl =
    process.env.NEXT_PUBLIC_API_URL ||
    "https://event-manager-1-tfn4.onrender.com";
  let response: Response;
  let data;
  const signal = AbortSignal.timeout(90000);
  try {
    response = await fetch(`${baseUrl.replace(/\/$/, "")}/api/requirements`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "Idempotency-Key": key },
      body: JSON.stringify(payload),
      signal,
    });
    data = await response.json().catch((error: unknown) => {
      if (signal.aborted) throw error;
      return null;
    });
  } catch {
    if (signal.aborted) {
      throw new SubmissionError(
        "The server is taking longer than usual to respond. Your details are still here — please try posting again.",
      );
    }
    throw new SubmissionError(
      "We couldn't reach the server. Your details are still here — check your connection and try again.",
    );
  }
  if (!response.ok)
    throw new SubmissionError(
      data?.message ||
        "The server is temporarily unavailable. Your details are still here — please try again shortly.",
      data?.errors || [],
    );
  if (!data?.requirement?.id)
    throw new SubmissionError(
      "We couldn't confirm your submission. Please try again.",
    );
  return data.requirement;
}
