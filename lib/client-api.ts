async function readResponse(response: Response) {
  const contentType = response.headers.get("content-type") ?? "";

  if (contentType.includes("application/json")) {
    return response.json();
  }

  return response.text();
}

export async function fetchJson<T>(input: string, init?: RequestInit, retries = 3): Promise<T> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout

  try {
    const response = await fetch(input, {
      ...init,
      credentials: "include",
      headers: {
        ...(init?.headers ?? {}),
        Accept: "application/json",
      },
      signal: controller.signal,
    });

    if (!response.ok) {
      const errorPayload = await readResponse(response);
      const message =
        typeof errorPayload === "string"
          ? errorPayload
          : errorPayload?.error || errorPayload?.message || "Erro inesperado.";

      throw new Error(message);
    }

    return response.json();
  } catch (error) {
    clearTimeout(timeoutId);

    // Retry on network errors (but not on abort for timeout)
    if (retries > 0 && error instanceof TypeError && error.message.includes("fetch")) {
      console.warn(`Fetch failed, retrying... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // Wait 1s before retry
      return fetchJson<T>(input, init, retries - 1);
    }

    throw error;
  }
}
