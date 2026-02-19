/**
 * llm-client.mjs
 *
 * Multi-provider LLM abstraction. Routes to the correct SDK based on
 * LLM_PROVIDER, using environment variables for credentials and model config.
 *
 * Supported providers:
 *   openai      → openai npm package (api.openai.com)
 *   openrouter  → openai npm package (openrouter.ai/api/v1)
 *   ollama      → openai npm package (localhost:11434/v1, no key required)
 *   anthropic   → @anthropic-ai/sdk
 *   gemini      → @google/genai
 */

/** Default base URLs per provider. */
const DEFAULT_BASE_URLS = {
  openrouter: "https://openrouter.ai/api/v1",
  ollama: "http://localhost:11434/v1",
};

/**
 * Read provider configuration from environment at call-time.
 * @param {NodeJS.ProcessEnv} env
 */
function getLLMConfig(env = process.env) {
  return {
    provider: (env.LLM_PROVIDER || "openai").toLowerCase(),
    apiKey: env.LLM_API_KEY || "",
    model: env.LLM_MODEL || "gpt-4o",
    baseUrl: env.LLM_BASE_URL || "",
  };
}

/**
 * Validate and return OpenAI-compatible response text.
 * @param {any} completion
 */
export function extractOpenAIContent(completion) {
  const content = completion?.choices?.[0]?.message?.content;
  if (typeof content !== "string" || content.trim() === "") {
    throw new Error("LLM returned empty response (openai-compatible)");
  }
  return content;
}

/**
 * Validate and return Anthropic response text.
 * @param {any} message
 */
export function extractAnthropicContent(message) {
  const textBlock = message?.content?.find?.(
    (block) => typeof block?.text === "string" && block.text.trim() !== ""
  );
  if (!textBlock) {
    throw new Error("LLM returned empty response (anthropic)");
  }
  return textBlock.text;
}

/**
 * Validate and return Gemini response text.
 * @param {any} response
 */
export async function extractGeminiContent(response) {
  const text =
    typeof response?.text === "function"
      ? await response.text()
      : response?.text;
  if (typeof text !== "string" || text.trim() === "") {
    throw new Error("LLM returned empty response (gemini)");
  }
  return text;
}

/**
 * Send a chat completion request to the configured LLM provider.
 *
 * @param {string} systemPrompt
 * @param {string} userMessage
 * @returns {Promise<string>} Raw text response from the LLM
 */
export async function callLLM(systemPrompt, userMessage) {
  const config = getLLMConfig();

  switch (config.provider) {
    case "openai":
    case "openrouter":
    case "ollama":
      return callOpenAICompat(systemPrompt, userMessage, config);
    case "anthropic":
      return callAnthropic(systemPrompt, userMessage, config);
    case "gemini":
      return callGemini(systemPrompt, userMessage, config);
    default:
      throw new Error(
        `Unknown LLM_PROVIDER: "${config.provider}". ` +
          `Valid values: openai, anthropic, gemini, openrouter, ollama`
      );
  }
}

/** OpenAI-compatible: handles openai, openrouter, and ollama. */
async function callOpenAICompat(systemPrompt, userMessage, config) {
  const { default: OpenAI } = await import("openai");

  const baseURL =
    config.baseUrl || DEFAULT_BASE_URLS[config.provider] || undefined;

  const client = new OpenAI({
    apiKey: config.apiKey || "ollama", // ollama ignores the key but the SDK requires a non-empty string
    ...(baseURL ? { baseURL } : {}),
  });

  const completion = await client.chat.completions.create({
    model: config.model,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userMessage },
    ],
  });

  return extractOpenAIContent(completion);
}

/** Anthropic Claude via @anthropic-ai/sdk. */
async function callAnthropic(systemPrompt, userMessage, config) {
  const { default: Anthropic } = await import("@anthropic-ai/sdk");

  const client = new Anthropic({ apiKey: config.apiKey });

  const message = await client.messages.create({
    model: config.model,
    max_tokens: 4096,
    system: systemPrompt,
    messages: [{ role: "user", content: userMessage }],
  });

  return extractAnthropicContent(message);
}

/** Google Gemini via @google/genai. */
async function callGemini(systemPrompt, userMessage, config) {
  const { GoogleGenAI } = await import("@google/genai");

  const ai = new GoogleGenAI({ apiKey: config.apiKey });

  const response = await ai.models.generateContent({
    model: config.model,
    contents: userMessage,
    config: { systemInstruction: systemPrompt },
  });

  return extractGeminiContent(response);
}
