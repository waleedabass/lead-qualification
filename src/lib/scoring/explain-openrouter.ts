import { EXPLAIN_SYSTEM_PROMPT, type ExplainInput, type ExplainProvider } from "./explain-types";

const BASE_URL = "https://openrouter.ai/api/v1/chat/completions";
const MODEL = process.env.OPENROUTER_MODEL || "openai/gpt-oss-20b:free";
const RETRYABLE_STATUS = new Set([429, 500, 502, 503, 504]);
const RETRY_DELAYS_MS = [2000, 8000, 20000];

const TOOL = {
  type: "function" as const,
  function: {
    name: "explain_score",
    description: "Submit the score explanation.",
    parameters: {
      type: "object",
      properties: { explanation: { type: "string" } },
      required: ["explanation"],
    },
  },
};

interface ChatCompletionResponse {
  choices?: { message?: { tool_calls?: { function: { arguments: string } }[] } }[];
}

export function createOpenRouterExplainProvider(apiKey: string): ExplainProvider {
  return {
    name: "openrouter",
    async explain(input: ExplainInput): Promise<string> {
      const body = JSON.stringify({
        model: MODEL,
        messages: [
          { role: "system", content: EXPLAIN_SYSTEM_PROMPT },
          {
            role: "user",
            content: `Company: ${input.companyName}\nScore: ${input.score}/100\nFactors:\n${input.factors.map((f) => `- ${f.label} (+${f.points})`).join("\n")}\nOpen roles found: ${input.openRoleTitles.length > 0 ? input.openRoleTitles.join("; ") : "none"}`,
          },
        ],
        tools: [TOOL],
        tool_choice: { type: "function", function: { name: "explain_score" } },
      });

      let lastError: Error = new Error("unreachable");
      for (let attempt = 0; attempt <= RETRY_DELAYS_MS.length; attempt++) {
        const res = await fetch(BASE_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://pixelaisolutions.com",
            "X-Title": "Pixel AI Solutions Lead Qualification",
          },
          body,
        });
        if (res.ok) {
          const data = (await res.json()) as ChatCompletionResponse;
          const call = data.choices?.[0]?.message?.tool_calls?.[0];
          if (!call) throw new Error("OpenRouter did not return an explain_score tool call.");
          return (JSON.parse(call.function.arguments) as { explanation: string }).explanation;
        }
        lastError = new Error(`OpenRouter chat completion failed: ${res.status} ${await res.text()}`);
        if (!RETRYABLE_STATUS.has(res.status) || attempt === RETRY_DELAYS_MS.length) throw lastError;
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt]));
      }
      throw lastError;
    },
  };
}
