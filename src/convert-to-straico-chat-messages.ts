import type { LanguageModelV1Prompt } from '@ai-sdk/provider'

export type StraicoChatMessage = {
	role: 'system' | 'user' | 'assistant' | 'tool'
	content: string
}
// flatten the text content of the messages array into a single string
export function convertToStraicoChatMessages(
	prompt: LanguageModelV1Prompt,
): string {
	const messages: StraicoChatMessage[] = []
	for (const { role, content } of prompt) {
		switch (role) {
			case 'system': {
				messages.push({
					role: 'system',
					content,
				})
				break
			}

			case 'user': {
				if (content.length === 1 && content[0]?.type === 'text') {
					messages.push({
						role: 'user',
						content: content[0].text,
					})
					break
				}

				const contentParts = content.map((part) => {
					switch (part.type) {
						case 'text':
							return {
								type: 'text' as const,
								text: part.text,
							}
						default: {
							throw new Error(
								`Unsupported content part type: ${part.type}`,
							)
						}
					}
				})
				messages.push({
					role: 'user',
					content: contentParts.map((part) => part.text).join(''),
				})

				break
			}

			case 'assistant': {
				let text = ''

				for (const part of content) {
					switch (part.type) {
						case 'text': {
							text += part.text
							break
						}
						case 'tool-call':
						// TODO: Handle reasoning and redacted-reasoning
						case 'reasoning':
						case 'redacted-reasoning':
							break
						default: {
							console.log('unsupported part', part)
							throw new Error(`Unsupported part: ${part.type}`)
						}
					}
				}

				messages.push({
					role: 'assistant',
					content: text,
				})

				break
			}

			default: {
				// @ts-expect-error
				const _exhaustiveCheck: never = role
				throw new Error(`Unsupported role: ${_exhaustiveCheck}`)
			}
		}
	}

	return JSON.stringify(messages)
}
