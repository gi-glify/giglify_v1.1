import type { PaymentProviderId } from '../components/ui/PaymentProviderTabs';
import type { PaidPackageTier } from './packageCheckout';

export type PaymentDraftFlow = 'package' | 'verification';
export type PaymentDraftStep = 'details' | 'provider' | 'payment' | 'result';
export type PaymentIntent = 'packages' | 'verification' | 'auto';

export type PaymentDraft = {
  flow: PaymentDraftFlow;
  tier?: PaidPackageTier;
  provider?: PaymentProviderId;
  accountLabel?: string;
  email?: string;
  phone?: string;
  step: PaymentDraftStep;
};

type StorageLike = Pick<Storage, 'getItem' | 'setItem' | 'removeItem'>;

const STORAGE_PREFIX = 'giglify:payment-draft:';
const VIEW_KEY = 'giglify:payment-view';
const STEPS = new Set<PaymentDraftStep>(['details', 'provider', 'payment', 'result']);

function getStorage(storage?: StorageLike): StorageLike | null {
  if (storage) return storage;
  if (typeof window === 'undefined') return null;
  return window.localStorage;
}

function key(flow: PaymentDraftFlow) {
  return `${STORAGE_PREFIX}${flow}`;
}

function sanitize(value: unknown, flow: PaymentDraftFlow): PaymentDraft | null {
  if (!value || typeof value !== 'object') return null;
  const input = value as Record<string, unknown>;
  const step = typeof input.step === 'string' && STEPS.has(input.step as PaymentDraftStep)
    ? input.step as PaymentDraftStep
    : 'details';
  const draft: PaymentDraft = { flow, step };
  if (typeof input.tier === 'string' && (input.tier === 'pro' || input.tier === 'elite')) draft.tier = input.tier;
  if (typeof input.provider === 'string' && ['mpesa', 'paystack', 'paypal'].includes(input.provider)) draft.provider = input.provider as PaymentProviderId;
  for (const field of ['accountLabel', 'email', 'phone'] as const) {
    if (typeof input[field] === 'string') draft[field] = input[field].slice(0, 160);
  }
  return draft;
}

export function readPaymentDraft(flow: PaymentDraftFlow, storage?: StorageLike): PaymentDraft | null {
  const target = getStorage(storage);
  if (!target) return null;
  const raw = target.getItem(key(flow));
  if (!raw) return null;
  try {
    const draft = sanitize(JSON.parse(raw), flow);
    if (!draft) target.removeItem(key(flow));
    return draft;
  } catch {
    target.removeItem(key(flow));
    return null;
  }
}

export function writePaymentDraft(flow: PaymentDraftFlow, draft: PaymentDraft, storage?: StorageLike) {
  const target = getStorage(storage);
  if (!target) return;
  const safe = sanitize(draft, flow);
  if (safe) target.setItem(key(flow), JSON.stringify(safe));
}

export function clearPaymentDraft(flow: PaymentDraftFlow, storage?: StorageLike) {
  getStorage(storage)?.removeItem(key(flow));
}

export function parsePaymentIntent(search: string, state: unknown): PaymentIntent {
  const query = new URLSearchParams(search).get('view');
  const stateView = state && typeof state === 'object' && 'view' in state ? (state as { view?: unknown }).view : undefined;
  const value = query || stateView;
  return value === 'packages' || value === 'verification' ? value : 'auto';
}

export function readPaymentViewPreference(storage?: StorageLike): PaymentIntent {
  const value = getStorage(storage)?.getItem(VIEW_KEY);
  return value === 'packages' || value === 'verification' ? value : 'auto';
}

export function writePaymentViewPreference(view: Exclude<PaymentIntent, 'auto'>, storage?: StorageLike) {
  getStorage(storage)?.setItem(VIEW_KEY, view);
}
