import Anthropic from "@anthropic-ai/sdk";
import { EXPLAIN_SYSTEM_PROMPT, type ExplainInput, type ExplainProvider } from "./explain-types";

const MODEL = process.env.ANTHROPIC_MODEL || "claude-sonnet-5";

const TOOL: Anthropic.Tool = {
  name: "explain_score",
  description: "Submit the score explanation.",
  input_schema: {
    type: "object",
    properties: { explanation: { type: "string" } },
    required: ["explanation"],
  },
};

export function createAnthropicExplainProvider(apiKey: string): ExplainProvider {
  const client = new Anthropic({ apiKey });
  return {
    name: "anthropic",
    async explain(input: ExplainInput): Promise<string> {
      const message = await client.messages.create({
        model: MODEL,
        max_tokens: 400,
        system: EXPLAIN_SYSTEM_PROMPT,
        tools: [TOOL],
        tool_choice: { type: "tool", name: "explain_score" },
        messages: [
          {
            role: "user",
            content: `Company: ${input.companyName}\nScore: ${input.score}/100\nFactors:\n${input.factors.map((f) => `- ${f.label} (+${f.points})`).join("\n")}\nOpen roles found: ${input.openRoleTitles.length > 0 ? input.openRoleTitles.join("; ") : "none"}`,
          },
        ],
      });

      const toolUse = message.content.find((b) => b.type === "tool_use");
      if (!toolUse || toolUse.type !== "tool_use") throw new Error("Claude did not return an explain_score tool call.");
      return (toolUse.input as { explanation: string }).explanation;
    },
  };
}
