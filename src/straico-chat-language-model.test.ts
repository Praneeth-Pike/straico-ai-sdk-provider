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
				completions: {
					'gpt-4': {
						completion: {
							choices: [
								{
									message: { content: 'Test response' },
									finish_reason: 'stop',
								},
							],
						},
						words: { input: 10, output: 5 },
					},
				},
			},
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

	test('doStream should throw unsupported error', async () => {
		await expect(model.doStream({} as any)).rejects.toThrow(
			'Streaming is not supported for Straico',
		)
	})
})
