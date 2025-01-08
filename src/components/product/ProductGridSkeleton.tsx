import { Card, CardContent, CardHeader } from "@/components/ui/card";

export const ProductGridSkeleton = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="animate-pulse">
          <CardHeader className="h-40 bg-muted" />
          <CardContent className="space-y-2">
            <div className="h-4 bg-muted rounded w-3/4" />
            <div className="h-4 bg-muted rounded w-1/4" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
};