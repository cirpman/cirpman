const WORKER_URL = "https://r2-upload-worker.cirpmanhome.workers.dev/";

export const worker = {
  async post(endpoint: string, data: any): Promise<Response> {
    const url = `${WORKER_URL}${endpoint.startsWith('/') ? endpoint.substring(1) : endpoint}`;
    const token = localStorage.getItem('auth_token');

    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(token ? { "Authorization": `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Worker request to ${url} failed: ${response.status} ${response.statusText} - ${errorText}`);
    }

    return response;
  },
};
