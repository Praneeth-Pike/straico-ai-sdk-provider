import { createJsonErrorResponseHandler } from '@ai-sdk/provider-utils';
import { z } from 'zod';

const straicoErrorDataSchema = z.object({
  object: z.literal('error'),
  message: z.string(),
  type: z.string(),
  param: z.string().nullable(),
  code: z.string().nullable(),
});

export type MistralErrorData = z.infer<typeof straicoErrorDataSchema>;

export const straicoFailedResponseHandler = createJsonErrorResponseHandler({
  errorSchema: straicoErrorDataSchema,
  errorToMessage: data => data.message,
});