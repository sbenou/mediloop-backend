
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

export function SeniorityBadges() {
  const badges = [
    { name: "New Member", years: "0-1", color: "default" },
    { name: "Loyal Member", years: "2-3", color: "blue" },
    { name: "Senior Member", years: "3-4", color: "green" },
    { name: "Bronze Member", years: "4-5", color: "orange" },
    { name: "Silver Member", years: "5-6", color: "gray" },
    { name: "Gold Member", years: "6-7", color: "amber" },
    { name: "Diamond Member", years: "7-8", color: "cyan" },
    { name: "Platinum Member", years: "8+", color: "purple" },
  ];

  const getBadgeVariant = (color: string) => {
    switch(color) {
      case 'blue': return 'secondary';
      case 'green': return 'success';
      case 'orange': return 'destructive';
      case 'gray': return 'outline';
      case 'amber': return 'default';
      case 'cyan': return 'secondary';
      case 'purple': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Seniority Badges</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {badges.map((badge, index) => (
            <div key={index} className="flex flex-col items-center space-y-2 p-3 border rounded-lg">
              <Badge variant={getBadgeVariant(badge.color) as any} className="px-2 py-1">
                {badge.name}
              </Badge>
              <span className="text-sm text-muted-foreground">{badge.years} years</span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
