import type { LanguageModelV1Prompt } from '@ai-sdk/provider'

// flatten the text content of the messages array into a single string
export function convertToStraicoChatMessages(
	prompt: LanguageModelV1Prompt,
): string {
	let straicoPrompt = ''
	if (prompt.length === 0) {
		return straicoPrompt
	}

	for (let i = 0; i < prompt.length; i++) {
		const { role, content } = prompt[i]

		switch (role) {
			case 'system': {
				straicoPrompt += `<system>${content}</system>`
				break
			}

			case 'user': {
				const userMessage = content
					.map((part) => {
						switch (part.type) {
							case 'text': {
								return part.text
							}
							default: {
								return ''
							}
						}
					})
					.join('')
				straicoPrompt += `<user>${userMessage}</user>`
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
						default: {
							return ''
						}
					}
				}

				straicoPrompt += `<assistant>${text}</assistant>`

				break
			}
			default: {
				return ''
			}
		}
	}

	return straicoPrompt
}
