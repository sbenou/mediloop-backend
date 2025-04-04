
import React from "react";

export const ActivityLoadingState: React.FC = () => {
  return (
    <div className="h-full flex flex-col">
      <h2 className="text-xl font-semibold mb-4">Activity Feed</h2>
      <div className="flex-1 flex items-center justify-center">
        <div className="animate-pulse text-muted-foreground">Loading activities...</div>
      </div>
    </div>
  );
};
