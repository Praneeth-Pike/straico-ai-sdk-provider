import type { LanguageModelV1Prompt } from '@ai-sdk/provider'
import { convertUint8ArrayToBase64 } from '@ai-sdk/provider-utils'

// function to iterate through the messages array and extract the file urls
export const getFileUrls = (prompt: LanguageModelV1Prompt) => {
	const fileUrls: string[] = []
	for (const message of prompt) {
		if (message.role === 'user') {
			for (const part of message.content) {
				// check if the part is of type url
				if (part.type === 'image') {
					const imageUrl =
						part.image instanceof URL
							? part.image.toString()
							: `data:${part.mimeType ?? 'image/png'};base64,${convertUint8ArrayToBase64(part.image)}`
					fileUrls.push(imageUrl)
				}
				// check if the part is of type file
				if (part.type === 'file') {
					const fileUrl =
						part.data instanceof URL
							? part.data.toString()
							: part.data
					fileUrls.push(fileUrl)
				}
			}
		}
	}
	return fileUrls
}
