import {
    generateId,
    loadApiKey,
    withoutTrailingSlash,
  } from '@ai-sdk/provider-utils';
import { StraicoChatLanguageModel } from './src/straico-chat-language-model';
import type { StraicoChatModelId, StraicoChatSettings } from './src/straico-chat-settings';

// Define the StraicoProvider interface
export interface StraicoProvider {
  (
    modelId: StraicoChatModelId,
    settings?: StraicoChatSettings,
  ): StraicoChatLanguageModel;

  // Explicit method for chat models (can add others like embedding later if needed)
  chat(
    modelId: StraicoChatModelId,
    settings?: StraicoChatSettings,
  ): StraicoChatLanguageModel;
}

// Define settings applicable to the provider itself
export interface StraicoProviderSettings {
  /**
   * Base URL for the Straico API.
   * @default 'https://api.straico.com/v1'
   */
  baseURL?: string;

  /**
   * Straico API Key.
   * Defaults to the `STRAICO_API_KEY` environment variable.
   */
  apiKey?: string;

  /**
   * Custom headers to include in API requests.
   * Should be a function that returns the headers object.
   */
  headers?: () => Record<string, string>;

  /**
   * Optional function to generate unique IDs for requests.
   */
  generateId?: () => string;
}

/**
 * Factory function to create a Straico provider instance.
 */
export function createStraicoProvider(
  options: StraicoProviderSettings = {},
): StraicoProvider {
  const createModel = (
    modelId: StraicoChatModelId,
    settings: StraicoChatSettings = {},
  ): StraicoChatLanguageModel => {
    // Validate modelId if necessary (e.g., check against a list of known models)
    // ...

    return new StraicoChatLanguageModel(modelId, settings, {
      provider: 'straico.chat',
      baseURL:
        withoutTrailingSlash(options.baseURL) ?? 'https://api.straico.com/v1',
      headers: options.headers ?? (() => {
          const apiKey = loadApiKey({
            apiKey: options.apiKey,
            environmentVariableName: 'STRAICO_API_KEY',
            description: 'Straico',
          });
          return {
            Authorization: `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
          };
      }),
      generateId: options.generateId ?? generateId,
    });
  };

  // The main provider function
  const provider = function (
    modelId: StraicoChatModelId,
    settings?: StraicoChatSettings,
  ) {
    if (new.target) {
      throw new Error(
        'The Straico model factory function cannot be called with the new keyword.',
      );
    }
    return createModel(modelId, settings);
  };

  // Assign the chat method
  provider.chat = createModel;

  return provider as StraicoProvider;
}

/**
 * Default Straico provider instance.
 */
export const straico = createStraicoProvider(); 