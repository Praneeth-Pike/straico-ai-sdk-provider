import { describe, expect, test } from 'vitest'
import type { LanguageModelV1Prompt } from '@ai-sdk/provider'
import { convertToStraicoChatMessages } from './convert-to-straico-chat-messages'

describe('convertToStraicoChatMessages', () => {
	test('should handle empty prompt', () => {
		const result = convertToStraicoChatMessages([])
		expect(result).toBe('')
	})

	test('should convert system message', () => {
		const prompt: LanguageModelV1Prompt = [
			{
				role: 'system',
				content: 'System instruction',
			},
		]
		expect(convertToStraicoChatMessages(prompt)).toBe(
			'<system>System instruction</system>',
		)
	})

	test('should convert user message with text', () => {
		const prompt: LanguageModelV1Prompt = [
			{
				role: 'user',
				content: [{ type: 'text', text: 'Hello' }],
			},
		]
		expect(convertToStraicoChatMessages(prompt)).toBe('<user>Hello</user>')
	})

	test('should ignore non-text user content', () => {
		const prompt: LanguageModelV1Prompt = [
			{
				role: 'user',
				content: [
					{ type: 'text', text: 'Hello' },
					{ type: 'image', image: new Uint8Array() },
				],
			},
		]
		expect(convertToStraicoChatMessages(prompt)).toBe('<user>Hello</user>')
	})

	test('should convert assistant message', () => {
		const prompt: LanguageModelV1Prompt = [
			{
				role: 'assistant',
				content: [{ type: 'text', text: 'Hi there!' }],
			},
		]
		expect(convertToStraicoChatMessages(prompt)).toBe(
			'<assistant>Hi there!</assistant>',
		)
	})
})
