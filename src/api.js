/**
 * Streams chat completions from OpenAI-compatible SSE endpoints.
 * @param {Array} messages - Array of message objects [{role: 'user'|'assistant'|'system', content: '...'}]
 * @param {Object} settings - Config object with { baseUrl, apiKey, model }
 * @param {Function} onChunk - Callback triggered with each new text delta chunk
 * @param {Function} onError - Callback triggered on error
 * @returns {AbortController} - Controller to cancel the request if needed
 */
export function streamChatCompletion(messages, settings, onChunk, onError) {
  const controller = new AbortController();
  const { baseUrl, apiKey, model } = settings;

  // Ensure endpoint URL ends with /chat/completions
  const cleanBase = baseUrl.replace(/\/+$/, '');
  const endpoint = cleanBase.endsWith('/chat/completions')
    ? cleanBase
    : `${cleanBase}/chat/completions`;

  const headers = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey !== 'ollama') {
    headers['Authorization'] = `Bearer ${apiKey}`;
  }

  const payload = {
    model: model || 'llama3.2',
    messages: messages,
    stream: true,
  };

  (async () => {
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText || response.statusText}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder('utf-8');
      let buffer = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop(); // Keep incomplete line in buffer

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith(':')) continue; // Skip keep-alives

          if (trimmed === 'data: [DONE]') {
            return;
          }

          if (trimmed.startsWith('data: ')) {
            const jsonStr = trimmed.slice(6);
            try {
              const data = JSON.parse(jsonStr);
              const contentDelta = data.choices?.[0]?.delta?.content;
              if (contentDelta) {
                onChunk(contentDelta);
              }
            } catch (e) {
              // Ignore invalid JSON chunks
            }
          }
        }
      }
    } catch (err) {
      if (err.name !== 'AbortError') {
        onError(err);
      }
    }
  })();

  return controller;
}
