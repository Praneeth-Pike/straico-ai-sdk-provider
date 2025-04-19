import type {
	LanguageModelV1,
	LanguageModelV1CallWarning,
} from '@ai-sdk/provider'
import {
	type FetchFunction,
	combineHeaders,
	createJsonResponseHandler,
	postJsonToApi,
} from '@ai-sdk/provider-utils'
import { convertToStraicoChatMessages } from './convert-to-straico-chat-messages'
import type {
	StraicoChatModelId,
	StraicoChatSettings,
} from './straico-chat-settings'
import { mapStraicoFinishReason } from './map-straico-finish-reason'
import { straicoFailedResponseHandler } from './straico-error'
import { straicoChatResponseSchema } from './straico-source-schema'
import { getResponseMetadata } from './get-response-metadata'
import type { StraicoRequest } from './straico-types'
import { getFileUrls } from './get-file-urls'

type StraicoChatConfig = {
	provider: string
	baseURL: string
	headers: () => Record<string, string | undefined>
	fetch?: FetchFunction
	generateId?: () => string
}

export class StraicoChatLanguageModel implements LanguageModelV1 {
	readonly specificationVersion = 'v1'
	readonly defaultObjectGenerationMode = 'json'
	readonly supportsImageUrls = false
	readonly supportsStructuredOutputs = false

	readonly modelId: StraicoChatModelId
	readonly settings: StraicoChatSettings

	private readonly config: StraicoChatConfig

	constructor(
		modelId: StraicoChatModelId,
		settings: StraicoChatSettings,
		config: StraicoChatConfig,
	) {
		this.modelId = modelId
		this.settings = settings
		this.config = config
	}

	get provider(): string {
		return this.config.provider
	}

	supportsUrl(url: URL): boolean {
		return url.protocol === 'https:'
	}

	private getArgs({
		mode,
		prompt,
		temperature,
		maxTokens,
	}: Parameters<LanguageModelV1['doGenerate']>[0]) {
		const type = mode.type

		const warnings: LanguageModelV1CallWarning[] = []

		const baseArgs = {
			// Model ID array for multi-model support (but we'll use single model)
			models: [this.modelId],

			// Convert prompt to single message string
			message: convertToStraicoChatMessages(prompt),
			file_urls:
				getFileUrls(prompt).length > 0
					? getFileUrls(prompt)
					: undefined,
			temperature: temperature ?? undefined,
			max_tokens: maxTokens ?? undefined,

			inputFormat: 'prompt',
			// Response format
			response_format: { type: 'json_object' },
		}

		switch (type) {
			case 'regular': {
				return {
					args: baseArgs,
					warnings,
				}
			}

			case 'object-json': {
				return {
					args: {
						...baseArgs,
						response_format: { type: 'json_object' },
					},
					warnings,
				}
			}

			default: {
				const _exhaustiveCheck: unknown = type
				throw new Error(`Unsupported type: ${_exhaustiveCheck}`)
			}
		}
	}

	async doGenerate(
		options: Parameters<LanguageModelV1['doGenerate']>[0],
	): Promise<Awaited<ReturnType<LanguageModelV1['doGenerate']>>> {
		const { args, warnings } = this.getArgs(options)

		// construct the request body for straico
		const requestBody: StraicoRequest = {
			models: [args.models[0]],
			message: args.message,
			file_urls: args.file_urls ?? undefined,
			temperature: args.temperature ?? undefined,
			max_tokens: args.max_tokens ?? undefined,
		}

		const {
			responseHeaders,
			value: response,
			rawValue: rawResponse,
		} = await postJsonToApi({
			url: `${this.config.baseURL}/prompt/completion`,
			headers: combineHeaders(
				this.config.headers(),
				options.headers || {},
			),
			body: requestBody,
			failedResponseHandler: straicoFailedResponseHandler,
			successfulResponseHandler: createJsonResponseHandler(
				straicoChatResponseSchema,
			),
			abortSignal: options.abortSignal,
			fetch: this.config.fetch,
		})

		const { message: rawPrompt, ...rawSettings } = args

		// Get completion for our specific model ID
		const straicoResponse = response.data?.completions[this.modelId]
		const choice = straicoResponse?.completion?.choices?.[0]

		return {
			text: choice?.message?.content,
			finishReason: mapStraicoFinishReason(choice?.finish_reason),
			usage: {
				promptTokens: straicoResponse?.words?.input,
				completionTokens: straicoResponse?.words?.output,
			},
			rawCall: { rawPrompt, rawSettings },
			rawResponse: {
				headers: responseHeaders,
				body: rawResponse,
			},
			request: { body: JSON.stringify(args) },
			response: getResponseMetadata(choice?.message),
			warnings,
		}
	}

	// doStream
	async doStream(
		options: Parameters<LanguageModelV1['doStream']>[0],
	): Promise<Awaited<ReturnType<LanguageModelV1['doStream']>>> {
		// Simulate streaming by chunking the full response
		const controller = options.abortSignal
			? { signal: options.abortSignal, onCancel: () => {} }
			: { signal: new AbortController().signal, onCancel: () => {} }

		// First get the full response using doGenerate
		const fullResponse = await this.doGenerate({
			...options,
			headers: options.headers || {},
		})
		const fullText = fullResponse.text || ''

		// Create a ReadableStream to emit chunks
		const stream = new ReadableStream({
			async start(streamController) {
				// Function to check if stream should be cancelled
				function isCancelled() {
					return controller.signal.aborted
				}

				// Character-based chunk size (preserves all whitespace and markdown formatting)
				const chunkSize = 10

				// Simulate streaming with small delays
				for (let i = 0; i < fullText.length; i += chunkSize) {
					if (isCancelled()) break

					// Get current chunk of characters (preserves newlines and all formatting)
					const textDelta = fullText.slice(i, i + chunkSize)

					// Emit text chunk using standard format
					streamController.enqueue({
						type: 'text-delta',
						textDelta,
						finishReason:
							i + chunkSize >= fullText.length
								? fullResponse.finishReason
								: undefined,
					})

					// Simulate network delay
					await new Promise((resolve) => setTimeout(resolve, 100))
				}

				streamController.close()
			},
		})

		return {
			stream,
			rawCall: fullResponse.rawCall,
			rawResponse: fullResponse.rawResponse,
			request: fullResponse.request,
			warnings: fullResponse.warnings || [],
		}
	}
}
