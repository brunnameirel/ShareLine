import { describe, it, expect } from 'vitest';
import { readApiError } from './readApiError';

function mockResponse(status, body, ok = false) {
  return {
    status,
    ok,
    json: async () => body,
  };
}

describe('readApiError', () => {
  it('returns string detail from FastAPI HTTPException', async () => {
    const res = mockResponse(400, { detail: 'That message could not be sent.' });
    expect(await readApiError(res)).toBe('That message could not be sent.');
  });

  it('joins validation error array', async () => {
    const res = mockResponse(422, {
      detail: [{ msg: 'field required', type: 'missing' }],
    });
    expect(await readApiError(res)).toBe('field required');
  });

  it('falls back to HTTP status when body is not JSON', async () => {
    const res = {
      status: 500,
      json: async () => {
        throw new SyntaxError('not json');
      },
    };
    expect(await readApiError(res)).toBe('HTTP 500');
  });
});
