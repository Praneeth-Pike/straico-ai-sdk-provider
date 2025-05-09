import { describe, expect, test, vi } from 'vitest'
import { StraicoChatLanguageModel } from './straico-chat-language-model'
import type { StraicoChatSettings } from './straico-chat-settings'

const mockConfig = {
	provider: 'test',
	baseURL: 'http://test',
	headers: () => ({}),
	fetch: vi.fn().mockResolvedValue(new Response()),
}

describe('StraicoChatLanguageModel', () => {
	const model = new StraicoChatLanguageModel(
		'gpt-4',
		{} as StraicoChatSettings,
		mockConfig,
	)

	test('should implement LanguageModelV1 interface', () => {
		expect(model).toHaveProperty('specificationVersion', 'v1')
		expect(model).toHaveProperty('defaultObjectGenerationMode', 'json')
		expect(model).toHaveProperty('supportsImageUrls', false)
	})

	test('doGenerate should make API call with correct structure', async () => {
		const mockResponse = {
			data: {
				overall_price: {
					input: 0.0001,
					output: 0.0002,
					total: 0.0003,
				},
				overall_words: {
					input: 10,
					output: 5,
					total: 15,
				},
				completions: {
					'gpt-4': {
						completion: {
							id: 'test-id',
							model: 'gpt-4',
							object: 'chat.completion',
							created: 1234567890,
							choices: [
								{
									index: 0,
									message: {
										role: 'assistant',
										content: 'Test response',
									},
									finish_reason: 'stop',
								},
							],
							usage: {
								prompt_tokens: 10,
								completion_tokens: 5,
								total_tokens: 15,
							},
							system_fingerprint: null,
						},
						price: {
							input: 0.0001,
							output: 0.0002,
							total: 0.0003,
						},
						words: {
							input: 10,
							output: 5,
							total: 15,
						},
					},
				},
			},
			success: true,
		}

		mockConfig.fetch.mockResolvedValueOnce(
			new Response(JSON.stringify(mockResponse), { status: 200 }),
		)

		const result = await model.doGenerate({
			mode: { type: 'regular' },
			prompt: [],
			temperature: 0.7,
			maxTokens: 100,
			inputFormat: 'prompt',
		})

		expect(mockConfig.fetch).toHaveBeenCalled()
		expect(result.text).toBe('Test response')
		expect(result.finishReason).toBe('stop')
		expect(result.usage).toEqual({
			promptTokens: 10,
			completionTokens: 5,
		})
	})

	test('doStream should simulate streaming with chunked responses', async () => {
		// Mock doGenerate to return a predefined response
		vi.spyOn(model, 'doGenerate').mockResolvedValue({
			text: 'This is a test response for streaming',
			finishReason: 'stop',
			usage: {
				promptTokens: 10,
				completionTokens: 7,
			},
			rawCall: { rawPrompt: {}, rawSettings: {} },
			rawResponse: {},
			request: {},
			response: {},
			warnings: [],
		})

		// Call doStream
		const result = await model.doStream({
			mode: { type: 'regular' },
			prompt: [],
			inputFormat: 'prompt',
		})

		// Verify stream exists
		expect(result.stream).toBeDefined()

		// Collect chunks from the stream
		const reader = result.stream.getReader()
		const chunks: { textDelta: string }[] = []

		let done = false
		while (!done) {
			const { value, done: isDone } = await reader.read()
			if (isDone) {
				done = true
			} else if (value && 'textDelta' in value) {
				chunks.push(value)
			}
		}

		// Verify chunks were received
		expect(chunks.length).toBeGreaterThan(0)

		// Verify full text when joined
		const fullText = chunks.map((chunk) => chunk.textDelta).join('')
		expect(fullText).toBe('This is a test response for streaming')
	})
})
