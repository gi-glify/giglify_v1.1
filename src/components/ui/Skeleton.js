import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
/** Base shimmer block — compose these into page-specific skeletons. */
export function Skeleton({ className = '' }) {
    return _jsx("div", { className: `skeleton ${className}` });
}
export function CardSkeleton() {
    return (_jsxs("div", { className: "card space-y-3", children: [_jsxs("div", { className: "flex items-center gap-2", children: [_jsx(Skeleton, { className: "h-4 w-1/3" }), _jsx(Skeleton, { className: "h-4 w-16 rounded-full" })] }), _jsx(Skeleton, { className: "h-3 w-full" }), _jsx(Skeleton, { className: "h-3 w-4/5" }), _jsxs("div", { className: "flex justify-between items-center pt-2", children: [_jsx(Skeleton, { className: "h-3 w-20" }), _jsx(Skeleton, { className: "h-8 w-20 rounded-lg" })] })] }));
}
export function TaskListSkeleton({ count = 4 }) {
    return (_jsx("div", { className: "grid gap-4", children: Array.from({ length: count }).map((_, i) => (_jsx(CardSkeleton, {}, i))) }));
}
export function StatCardSkeleton() {
    return (_jsxs("div", { className: "card space-y-3", children: [_jsx(Skeleton, { className: "h-3 w-24" }), _jsx(Skeleton, { className: "h-8 w-16" }), _jsx(Skeleton, { className: "h-3 w-10" })] }));
}
/** Generic full-page skeleton for pages that don't have a bespoke one yet. */
export function PageSkeleton() {
    return (_jsxs("div", { className: "container py-8 space-y-8", children: [_jsx(Skeleton, { className: "h-8 w-64" }), _jsxs("div", { className: "grid grid-cols-1 md:grid-cols-3 gap-6", children: [_jsx(StatCardSkeleton, {}), _jsx(StatCardSkeleton, {}), _jsx(StatCardSkeleton, {})] }), _jsx(TaskListSkeleton, { count: 3 })] }));
}
//# sourceMappingURL=Skeleton.js.map