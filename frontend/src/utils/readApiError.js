/**
 * Parse FastAPI-style error bodies from a fetch Response.
 * @param {Response} res
 * @returns {Promise<string>}
 */
export async function readApiError(res) {
  let msg = `HTTP ${res.status}`;
  try {
    const j = await res.json();
    if (typeof j.detail === 'string') return j.detail;
    if (Array.isArray(j.detail) && j.detail[0]?.msg) return j.detail.map((d) => d.msg).join(' ');
  } catch {
    /* ignore */
  }
  return msg;
}
