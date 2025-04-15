import type { LanguageModelV1FinishReason } from '@ai-sdk/provider'

export function mapStraicoFinishReason(
	finishReason: string | null | undefined,
): LanguageModelV1FinishReason {
	switch (finishReason) {
		case 'stop':
			return 'stop'
		case 'end_turn':
			return 'stop'
		case 'length':
			return 'length'
		case 'max_tokens':
			return 'length'
		case 'model_length':
			return 'length'
		case 'tool_calls':
			return 'tool-calls'
		default:
			return 'unknown'
	}
}
