
import React from 'react';
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export function BoostsTab() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {/* Top Position Boost */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Top Position Boost</CardTitle>
            <Badge variant="success">Available</Badge>
          </div>
          <CardDescription>
            Boost your visibility by appearing at the top of search results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Duration
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1w">1 Week ($49.99)</SelectItem>
                  <SelectItem value="2w">2 Weeks ($89.99)</SelectItem>
                  <SelectItem value="1m">1 Month ($149.99)</SelectItem>
                  <SelectItem value="2m">2 Months ($279.99)</SelectItem>
                  <SelectItem value="3m">3 Months ($399.99)</SelectItem>
                  <SelectItem value="6m">6 Months ($699.99)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button className="w-full py-2 bg-primary text-white hover:bg-primary/90 rounded-md transition-colors">
              Purchase Top Position Boost
            </button>
          </div>
        </CardContent>
      </Card>

      {/* First Position Boost */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>First Position Boost</CardTitle>
            <Badge variant="success">Available</Badge>
          </div>
          <CardDescription>
            Secure the first position in search results
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">
                Select Duration
              </label>
              <Select>
                <SelectTrigger>
                  <SelectValue placeholder="Choose duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1w">1 Week ($99.99)</SelectItem>
                  <SelectItem value="2w">2 Weeks ($179.99)</SelectItem>
                  <SelectItem value="1m">1 Month ($299.99)</SelectItem>
                  <SelectItem value="2m">2 Months ($549.99)</SelectItem>
                  <SelectItem value="3m">3 Months ($799.99)</SelectItem>
                  <SelectItem value="6m">6 Months ($1399.99)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <button className="w-full py-2 bg-primary text-white hover:bg-primary/90 rounded-md transition-colors">
              Purchase First Position Boost
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
