import { HTTPException } from 'hono/http-exception';

interface AppContext {
  env: {
    STREAMTAPE_API_LOGIN: string;
    STREAMTAPE_API_KEY: string;
  };
}

const BASE_URL = 'https://api.streamtape.com';

export async function makeStreamtapeRequest<T>(
  c: AppContext,
  endpoint: string,
  params: Record<string, string> = {}
): Promise<T> {
  const allParams = new URLSearchParams({
    login: c.env.STREAMTAPE_API_LOGIN,
    key: c.env.STREAMTAPE_API_KEY,
    ...params,
  });

  const url = `${BASE_URL}${endpoint}?${allParams.toString()}`;
  const response = await fetch(url);

  if (!response.ok) {
    throw new HTTPException(502, { message: 'Streamtape API is unreachable or returned a network error.' });
  }

  const data = await response.json<{ status: number; msg: string; result: T }>();

  if (data.status !== 200) {
    const errorMap: Record<number, number> = {
      400: 400, 403: 403, 404: 404, 451: 451, 509: 503,
    };
    const httpStatus = errorMap[data.status] || 500;
    throw new HTTPException(httpStatus as any, { message: data.msg });
  }

  return data.result;
}