export interface StraicoPrompt {
  models: string[];
  message: string;
  file_urls?: string[];
  youtube_urls?: string[];
  temperature?: number;
  max_tokens?: number;
}

export type StraicoRequest = {
  models: string[];
  message: string;
  file_urls?: string[];
  youtube_urls?: string[];
  temperature?: number;
  max_tokens?: number;
}