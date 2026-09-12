const STORAGE_PREFIX = 'giglify:payment-draft:';
const VIEW_KEY = 'giglify:payment-view';
const STEPS = new Set(['details', 'provider', 'payment', 'result']);
function getStorage(storage) {
    if (storage)
        return storage;
    if (typeof window === 'undefined')
        return null;
    return window.localStorage;
}
function key(flow) {
    return `${STORAGE_PREFIX}${flow}`;
}
function sanitize(value, flow) {
    if (!value || typeof value !== 'object')
        return null;
    const input = value;
    const step = typeof input.step === 'string' && STEPS.has(input.step)
        ? input.step
        : 'details';
    const draft = { flow, step };
    if (typeof input.tier === 'string' && (input.tier === 'pro' || input.tier === 'elite'))
        draft.tier = input.tier;
    if (typeof input.provider === 'string' && ['mpesa', 'paystack', 'paypal'].includes(input.provider))
        draft.provider = input.provider;
    for (const field of ['accountLabel', 'email', 'phone']) {
        if (typeof input[field] === 'string')
            draft[field] = input[field].slice(0, 160);
    }
    return draft;
}
export function readPaymentDraft(flow, storage) {
    const target = getStorage(storage);
    if (!target)
        return null;
    const raw = target.getItem(key(flow));
    if (!raw)
        return null;
    try {
        const draft = sanitize(JSON.parse(raw), flow);
        if (!draft)
            target.removeItem(key(flow));
        return draft;
    }
    catch {
        target.removeItem(key(flow));
        return null;
    }
}
export function writePaymentDraft(flow, draft, storage) {
    const target = getStorage(storage);
    if (!target)
        return;
    const safe = sanitize(draft, flow);
    if (safe)
        target.setItem(key(flow), JSON.stringify(safe));
}
export function clearPaymentDraft(flow, storage) {
    getStorage(storage)?.removeItem(key(flow));
}
export function parsePaymentIntent(search, state) {
    const query = new URLSearchParams(search).get('view');
    const stateView = state && typeof state === 'object' && 'view' in state ? state.view : undefined;
    const value = query || stateView;
    return value === 'packages' || value === 'verification' ? value : 'auto';
}
export function readPaymentViewPreference(storage) {
    const value = getStorage(storage)?.getItem(VIEW_KEY);
    return value === 'packages' || value === 'verification' ? value : 'auto';
}
export function writePaymentViewPreference(view, storage) {
    getStorage(storage)?.setItem(VIEW_KEY, view);
}
//# sourceMappingURL=paymentDraft.js.map