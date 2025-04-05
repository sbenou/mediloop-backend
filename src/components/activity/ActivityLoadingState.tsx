
import React from "react";
import { Skeleton } from "@/components/ui/skeleton";

export const ActivityLoadingState: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Activity Feed</h2>
      <div className="space-y-4">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="space-y-2">
            <Skeleton className="h-4 w-24" />
            <div className="space-y-2">
              {Array.from({ length: 2 }).map((_, j) => (
                <Skeleton key={j} className="h-20 w-full rounded-md" />
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
