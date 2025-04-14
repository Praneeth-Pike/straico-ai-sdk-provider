export type StraicoPrompt = Array<StraicoMessage>;

export type StraicoMessage =
  | StraicoSystemMessage
  | StraicoUserMessage
  | StraicoAssistantMessage
  | StraicoToolMessage;

export interface StraicoSystemMessage {
  role: 'system';
  content: string;
}

export interface StraicoUserMessage {
  role: 'user';
  content: Array<StraicoUserMessageContent>;
}

export type StraicoUserMessageContent =
  | { type: 'text'; text: string }
  | { type: 'image_url'; image_url: string }
  | { type: 'document_url'; document_url: string };

export interface StraicoAssistantMessage {
  role: 'assistant';
  content: string;
  prefix?: boolean;
  tool_calls?: Array<{
    id: string;
    type: 'function';
    function: { name: string; arguments: string };
  }>;
}

export interface StraicoToolMessage {
  role: 'tool';
  name: string;
  content: string;
  tool_call_id: string;
}