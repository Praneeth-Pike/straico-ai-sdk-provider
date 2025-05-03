import type { LanguageModelV1Prompt } from '@ai-sdk/provider'
// function to iterate through the messages array and extract the file urls
export const getFileUrls = async (
	prompt: LanguageModelV1Prompt,
	headers: Record<string, string>,
	generateId: () => string,
): Promise<string[]> => {
	const fileUrls: string[] = []
	for (const message of prompt) {
		if (message.role === 'user') {
			for (const part of message.content) {
				// Handle image upload
				if (part.type === 'image') {
					const imageUrl =
						part.image instanceof URL
							? part.image.toString()
							: await uploadFile({
									data: part.image,
									mimeType: part.mimeType ?? 'image/png',
									headers,
									generateId,
								})
					fileUrls.push(imageUrl)
				}

				// Handle file upload
				if (part.type === 'file') {
					const fileUrl =
						part.data instanceof URL
							? part.data.toString()
							: await uploadFile({
									data: new Uint8Array(
										Buffer.from(part.data, 'base64'),
									),
									mimeType: 'application/octet-stream',
									headers,
									generateId,
								})
					fileUrls.push(fileUrl)
				}
			}
		}
	}
	return fileUrls
}

async function uploadFile({
	data,
	mimeType,

	headers,
	generateId,
}: {
	data: Uint8Array
	mimeType: string
	headers: Record<string, string>
	generateId: () => string
}): Promise<string> {
	const formData = new FormData()
	const extension = mimeType.split('/')[1] || 'bin'
	const filename = `${generateId()}.${extension}`

	const file = new File([data], filename, { type: mimeType })

	formData.append('file', file)

	const response = await fetch('https://api.straico.com/v0/file/upload', {
		method: 'POST',
		headers: {
			...headers,
			Authorization: headers.Authorization,
		},
		body: formData,
	})

	if (!response.ok) {
		throw new Error(`File upload failed: ${response.statusText}`)
	}

	const result = await response.json()
	return result.data.url
}
