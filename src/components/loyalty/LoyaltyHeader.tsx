
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star, Shield } from "lucide-react";
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
      <CardHeader className="px-8 pb-8">
        <CardTitle className="text-2xl font-bold">Health Journey Program</CardTitle>
      </CardHeader>
      <CardContent className="px-8">
        <div className="grid grid-cols-3 gap-8">
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
          
          <div className="flex items-center justify-center">
            {loyalty.yearsOfSeniority === 0 && (
              <Shield className="h-16 w-16 text-muted-foreground" />
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
