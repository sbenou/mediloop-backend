
import React from "react";

export const ActivityEmptyState: React.FC = () => {
  return (
    <div className="text-center py-8 text-muted-foreground text-sm">
      No activities to display. Try clicking the "Load Activities Data" button at the bottom right.
    </div>
  );
};
