// Shared fetch helper for the admin console.
//
// Two behaviours the raw fetch calls did not have:
//  1. A 401 is raised as a distinct SessionExpiredError. Previously an expired
//     token just produced an empty table, so the screen looked like "no data"
//     and there was no way back to a login form.
//  2. The response body is parsed defensively — an HTML error page from a proxy
//     would otherwise throw on .json() and mask the real status.

export class SessionExpiredError extends Error {
  constructor(message = 'Your admin session has expired. Please log in again.') {
    super(message);
    this.name = 'SessionExpiredError';
  }
}

export const adminFetch = async (path, { token, body, ...options } = {}) => {
  const headers = {
    ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
    ...(options.headers || {})
  };

  const res = await fetch(path, {
    ...options,
    headers,
    ...(body !== undefined ? { body: JSON.stringify(body) } : {})
  });

  if (res.status === 401) {
    throw new SessionExpiredError();
  }

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.message || `Request failed (${res.status})`);
  }
  return data;
};

// Convenience for admin screens: clear the session and return to the login form
// whenever the token turns out to be dead.
export const resolveAdminError = (err, logout, navigate) => {
  if (err instanceof SessionExpiredError || err?.name === 'SessionExpiredError') {
    logout();
    navigate('/admin/login', { replace: true });
    return null;
  }
  return err?.message || 'Something went wrong. Please try again.';
};