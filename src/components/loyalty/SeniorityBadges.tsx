
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useLoyaltyStatus } from "@/hooks/loyalty/useLoyaltyStatus";
import { Shield, Clock, Award, Crown, Medal } from "lucide-react";

export function SeniorityBadges() {
  const loyalty = useLoyaltyStatus();
  
  const badges = [
    { 
      name: "New Member", 
      years: 0, 
      icon: <Shield className="h-4 w-4" />, 
      description: "Welcome to the community!",
      points: 0,
      variant: "outline"
    },
    { 
      name: "Loyal Member", 
      years: 2, 
      icon: <Clock className="h-4 w-4" />, 
      description: "2+ years with us. Loyalty rewarded with additional points yearly.",
      points: 200,
      variant: "secondary"
    },
    { 
      name: "Senior Member", 
      years: 3, 
      icon: <Award className="h-4 w-4" />, 
      description: "3+ years of seniority.",
      points: 300,
      variant: "success"
    },
    { 
      name: "Bronze Member", 
      years: 4, 
      icon: <Medal className="h-4 w-4" />, 
      description: "4+ years of seniority.",
      points: 400,
      variant: "destructive"
    },
    { 
      name: "Silver Member", 
      years: 5, 
      icon: <Medal className="h-4 w-4" />, 
      description: "5+ years of seniority.",
      points: 500,
      variant: "outline"
    },
    { 
      name: "Gold Member", 
      years: 6, 
      icon: <Crown className="h-4 w-4" />, 
      description: "6+ years of seniority.",
      points: 600,
      variant: "default"
    },
    { 
      name: "Diamond Member", 
      years: 7, 
      icon: <Crown className="h-4 w-4" />, 
      description: "7+ years of seniority.",
      points: 700,
      variant: "secondary"
    },
    { 
      name: "Platinum Member", 
      years: 8, 
      icon: <Crown className="h-4 w-4" />, 
      description: "8+ years of seniority. Maximum loyalty level.",
      points: 800,
      variant: "default"
    }
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Medal className="h-5 w-5" />
          Seniority Badges
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {badges.map((badge, index) => (
            <div 
              key={index} 
              className={`p-3 border rounded-lg ${loyalty.yearsOfSeniority >= badge.years ? 'bg-muted/30' : 'opacity-50'}`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {badge.icon}
                  <span className="font-medium">{badge.name}</span>
                  <Badge variant={badge.variant as any}>
                    {badge.years}+ years
                  </Badge>
                </div>
                <Badge variant="outline">+{badge.points} points</Badge>
              </div>
              <p className="text-sm text-muted-foreground mt-1">{badge.description}</p>
            </div>
          ))}
          <p className="text-sm text-muted-foreground italic mt-4">
            Starting from 2 years of seniority, members receive bonus loyalty points added to their wallet,
            with additional points for each subsequent year up to 8 years.
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
