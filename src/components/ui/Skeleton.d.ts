interface SkeletonProps {
    className?: string;
}
/** Base shimmer block — compose these into page-specific skeletons. */
export declare function Skeleton({ className }: SkeletonProps): import("react").JSX.Element;
export declare function CardSkeleton(): import("react").JSX.Element;
export declare function TaskListSkeleton({ count }: {
    count?: number;
}): import("react").JSX.Element;
export declare function StatCardSkeleton(): import("react").JSX.Element;
/** Generic full-page skeleton for pages that don't have a bespoke one yet. */
export declare function PageSkeleton(): import("react").JSX.Element;
export {};
//# sourceMappingURL=Skeleton.d.ts.map