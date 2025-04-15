export function getResponseMetadata({
    model,
    created,
    role,
    content,
  }: {
    model?: string | undefined | null;
    created?: number | undefined | null;
    role?: string | undefined | null;
    content?: string | undefined | null;
  }) {
    return {
      modelId: model ?? undefined,
      timestamp: created != null ? new Date(created * 1000) : undefined,
      role: role ?? undefined,
      content: content ?? undefined,
    };
  }