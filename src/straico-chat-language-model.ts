import {
	UnsupportedFunctionalityError,
	type LanguageModelV1,
	type LanguageModelV1CallWarning,
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
			file_urls: getFileUrls(prompt),
			youtube_urls: [],
			temperature,
			max_tokens: maxTokens,

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
			file_urls: args.file_urls,
			youtube_urls: args.youtube_urls,
			temperature: args.temperature,
			max_tokens: args.max_tokens,
		}

		const {
			responseHeaders,
			value: response,
			rawValue: rawResponse,
		} = await postJsonToApi({
			url: `${this.config.baseURL}/prompt/completion`,
			headers: combineHeaders(this.config.headers(), options.headers),
			body: JSON.stringify(requestBody),
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
		_options: Parameters<LanguageModelV1['doStream']>[0],
	): Promise<Awaited<ReturnType<LanguageModelV1['doStream']>>> {
		throw new UnsupportedFunctionalityError({
			functionality: 'streaming',
			message: 'Streaming is not supported for Straico',
		})
	}
}
