declare module 'aos' {
  interface AosOptions {
    duration?: number;
    once?: boolean;
    easing?: string;
    offset?: number;
    [key: string]: unknown;
  }
  const AOS: {
    init: (options?: AosOptions) => void;
    refresh: () => void;
    refreshHard: () => void;
  };
  export default AOS;
}
