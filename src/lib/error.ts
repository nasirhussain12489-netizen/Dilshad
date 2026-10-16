export function normalizeFetchError(error: unknown, fallback: string): string {
  if (error instanceof Error) {
    const message = (error.message || '').trim();

    if (
      !message ||
      message === 'Failed to fetch' ||
      message.toLowerCase().includes('failed to fetch') ||
      message.toLowerCase().includes('networkerror') ||
      message.toLowerCase().includes('load failed') ||
      message.toLowerCase().includes('fetch failed')
    ) {
      return 'The server is not responding. Please check the connection and try again.';
    }

    return message;
  }

  if (typeof error === 'string' && error.trim()) {
    return error.trim();
  }

  return fallback;
}
