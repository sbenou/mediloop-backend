
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Star, Clock } from "lucide-react";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";
import { Badge } from "@/components/ui/badge";

export function LoyaltyHeader() {
  const loyalty = useLoyaltyStatus();
  
  const getLevelColor = (level: string) => {
    switch(level) {
      case 'seedling':
        return 'text-green-500';
      case 'blossom':
        return 'text-purple-500';
      case 'wellness':
        return 'text-blue-500';
      default:
        return 'text-gray-500';
    }
  };

  const getBadgeVariant = (badgeColor: string) => {
    switch(badgeColor) {
      case 'purple': return 'default';
      case 'cyan': return 'secondary';
      case 'amber': return 'default';
      case 'gray': return 'outline';
      case 'orange': return 'destructive';
      case 'green': return 'success';
      case 'blue': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Health Journey Program</CardTitle>
        <Award className="h-6 w-6 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Total Points</p>
            <p className="text-2xl font-bold flex items-center gap-2">
              {loyalty.totalPoints} <Star className="h-5 w-5 text-yellow-500" />
            </p>
          </div>
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Current Level</p>
            <p className={`text-2xl font-bold ${getLevelColor(loyalty.currentLevel)}`}>
              {loyalty.currentLevel.charAt(0).toUpperCase() + loyalty.currentLevel.slice(1)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <p className="text-sm text-muted-foreground">Seniority Badge</p>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={getBadgeVariant(loyalty.badgeColor)}>
                {loyalty.badge}
              </Badge>
              <span className="text-sm text-muted-foreground">
                {loyalty.yearsOfSeniority} {loyalty.yearsOfSeniority === 1 ? 'year' : 'years'}
              </span>
            </div>
            {loyalty.nextBadgeYears !== null && (
              <p className="text-xs text-muted-foreground">
                Next badge in {loyalty.nextBadgeYears} {loyalty.nextBadgeYears === 1 ? 'year' : 'years'}
              </p>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
