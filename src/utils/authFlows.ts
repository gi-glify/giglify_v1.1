export function getEmailRedirectUrl(origin: string, path: string) {
  return new URL(path, origin).toString();
}

export function getAuthCallbackPath(search: string, hash: string) {
  const params = new URLSearchParams(search);
  if (params.get('reset') === '1') return '/auth?reset=1';

  const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
  if (hashParams.get('type') === 'recovery') return '/auth?reset=1';
  if (hashParams.get('type') === 'signup' && hashParams.has('access_token')) return '/dashboard';
  return null;
}

export function normalizeMcqAnswer(answer: string) {
  return answer.trim().toUpperCase();
}
