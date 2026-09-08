export function getEmailRedirectUrl(origin, path) {
    return new URL(path, origin).toString();
}
export function getAuthCallbackPath(search, hash) {
    const params = new URLSearchParams(search);
    if (params.get('reset') === '1')
        return '/auth?reset=1';
    const hashParams = new URLSearchParams(hash.replace(/^#/, ''));
    if (hashParams.get('type') === 'recovery')
        return '/auth?reset=1';
    if (hashParams.get('type') === 'signup' && hashParams.has('access_token'))
        return '/dashboard';
    return null;
}
export function normalizeMcqAnswer(answer) {
    return answer.trim().toUpperCase();
}
//# sourceMappingURL=authFlows.js.map