import { z } from "zod"


export const straicoSourceRequestSchema =z.object({
  models: z.array(z.string()),
  message: z.string(),
  file_urls: z.array(z.string()),
  youtube_urls: z.array(z.string())
})

export type StraicoSourceRequest = z.infer<typeof straicoSourceRequestSchema>;

// Define a reusable schema for the completion details of a single model
const completionDetailSchema = z.object({
  completion: z.object({
    id: z.string(),
    model: z.string(),
    object: z.string(),
    created: z.number(),
    choices: z.array(
      z.object({
        index: z.number(),
        message: z.object({ role: z.string(), content: z.string() }),
        finish_reason: z.string().nullable().optional(), // Make finish_reason optional/nullable to handle potential variations
        logprobs: z.null().optional() // Make logprobs optional as it's null for openai
      })
    ),
    usage: z.object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
      total_tokens: z.number()
    }),
    system_fingerprint: z.string().nullable().optional() // Make system_fingerprint optional/nullable
  }),
  price: z.object({
    input: z.number(),
    output: z.number(),
    total: z.number()
  }),
  words: z.object({
    input: z.number(),
    output: z.number(),
    total: z.number()
  })
});

export const straicoChatResponseSchema = z.object({
  data: z.object({
    overall_price: z.object({
      input: z.number(),
      output: z.number(),
      total: z.number()
    }),
    overall_words: z.object({
      input: z.number(),
      output: z.number(),
      total: z.number()
    }),
    // Use z.record for dynamic keys (model names) mapping to the completionDetailSchema
    completions: z.record(z.string(), completionDetailSchema)
  }),
  success: z.boolean()
})

export type StraicoSourceResponse = z.infer<typeof straicoChatResponseSchema>;

export const straicoChatChunkSchema = z.object({
  id: z.string().nullish(),
  created: z.number().nullish(),
  model: z.string().nullish(),
  choices: z.array(
    z.object({
      delta: z.object({
        role: z.enum(['assistant']).optional(),
        content: z.string(),
        tool_calls: z
          .array(
            z.object({
              id: z.string(),
              function: z.object({ name: z.string(), arguments: z.string() }),
            }),
          )
          .nullish(),
      }),
      finish_reason: z.string().nullish(),
      index: z.number(),
    }),
  ),
  usage: z
    .object({
      prompt_tokens: z.number(),
      completion_tokens: z.number(),
    })
    .nullish(),
});