import { createJsonErrorResponseHandler } from '@ai-sdk/provider-utils'
import { z } from 'zod'

const straicoErrorDataSchema = z.object({
	error: z.object({
		overall_price: z.object({
			input: z.number(),
			output: z.number(),
			total: z.number(),
		}),
		overall_words: z.object({
			input: z.number(),
			output: z.number(),
			total: z.number(),
		}),
		completions: z.record(
			z.string(),
			z.object({
				completion: z.object({ error: z.string() }),
				price: z.object({
					input: z.number(),
					output: z.number(),
					total: z.number(),
				}),
				words: z.object({
					input: z.number(),
					output: z.number(),
					total: z.number(),
				}),
			}),
		),
	}),
	success: z.boolean(),
})

export type StraicoErrorData = z.infer<typeof straicoErrorDataSchema>

export const straicoFailedResponseHandler = createJsonErrorResponseHandler({
	errorSchema: straicoErrorDataSchema,
	errorToMessage: (data) => {
		const error = data.error.completions[0]
		return error.completion.error
	},
})
