import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Star } from "lucide-react";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";
import { Badge } from "@/components/ui/badge";
import { Shield } from "lucide-react";

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
      <CardHeader className="pb-8">
        <CardTitle className="text-2xl font-bold">Health Journey Program</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 px-8">
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
          
          <div className="flex flex-col items-center justify-center">
            {loyalty.yearsOfSeniority === 0 ? (
              <Shield className="h-12 w-12 text-muted-foreground" />
            ) : (
              <span className="text-xs">{loyalty.badge}</span>
            )}
            <span className="text-sm text-muted-foreground mt-2">
              {loyalty.yearsOfSeniority} {loyalty.yearsOfSeniority === 1 ? 'year' : 'years'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
