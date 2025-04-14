/**
 * Represents the available Straico chat model IDs.
 * These should match the identifiers used in the Straico API 'models' array.
 * Example: 'anthropic/claude-3-haiku:beta', 'openai/gpt-3.5-turbo-0125'
 */
export type StraicoChatModelId =
  | (string & NonNullable<unknown>) // Allow custom strings for flexibility
  | 'anthropic/claude-3-haiku:beta' // Add known models here
  | 'openai/gpt-3.5-turbo-0125';

/**
 * Defines the settings specific to Straico chat completion calls.
 * Note: Straico's `/v1/prompt/completion` endpoint seems to have limited
 * parameterization compared to standard chat completion APIs.
 */
export interface StraicoChatSettings {
  /**
   * An array of file URLs to be processed along with the prompt.
   * Corresponds to the `file_urls` field in the Straico API request.
   */
  fileUrls?: string[];

  /**
   * An array of YouTube video URLs to be processed along with the prompt.
   * Corresponds to the `youtube_urls` field in the Straico API request.
   */
  youtubeUrls?: string[];

  // Note: Standard settings like temperature, maxTokens, topP, etc.,
  // are omitted as they don't appear in the provided Straico API example.
  // If Straico supports them via this or another endpoint, they can be added.
} 