
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, Star, BadgeCheck, BadgeAlert, BadgePlus } from "lucide-react";
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

  // Map badge colors to appropriate Lucide icons
  const getBadgeIcon = (badgeColor: string) => {
    switch(badgeColor) {
      case 'purple': return BadgeCheck;
      case 'cyan': return BadgeAlert;
      case 'amber': return BadgePlus;
      case 'gray': return BadgeCheck;
      case 'orange': return BadgeAlert;
      case 'green': return BadgeCheck;
      case 'blue': return BadgePlus;
      default: return BadgeCheck;
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-2xl font-bold">Health Journey Program</CardTitle>
        <Award className="h-6 w-6 text-muted-foreground" />
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm text-muted-foreground">Seniority Badge</p>
              {React.createElement(getBadgeIcon(loyalty.badgeColor), { 
                className: "h-6 w-6 text-primary ml-2" 
              })}
            </div>
            <div className="flex justify-start items-center h-full">
              <Badge 
                variant={getBadgeVariant(loyalty.badgeColor) as any} 
                className="text-sm px-2 py-1"
              >
                {loyalty.badge}
              </Badge>
            </div>
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Seniority</p>
            <span className="text-2xl font-bold">
              {loyalty.yearsOfSeniority} {loyalty.yearsOfSeniority === 1 ? 'year' : 'years'}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
