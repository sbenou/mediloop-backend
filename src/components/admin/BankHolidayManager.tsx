
import React, { useState, useEffect } from "react";
import { useAuth } from "@/hooks/auth/useAuth";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Loader2, Plus, Trash2, Calendar } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import { format } from "date-fns";
import { toast } from "@/components/ui/use-toast";
import {
  createAdminBankHoliday,
  deleteAdminBankHoliday,
  fetchAdminBankHolidays,
} from "@/services/adminApi";
import { BankHoliday, SupportedCountry } from "@/types/domain";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";

const BankHolidayManager = () => {
  const { profile } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const [holidays, setHolidays] = useState<BankHoliday[]>([]);
  const [selectedCountry, setSelectedCountry] = useState<SupportedCountry>("Luxembourg");
  const [holidayName, setHolidayName] = useState("");
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(new Date());
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch holidays for the selected country
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const data = await fetchAdminBankHolidays(selectedCountry);
        setHolidays(data);
      } catch (error) {
        console.error("Error fetching bank holidays:", error);
        toast({
          variant: "destructive",
          title: "Failed to fetch bank holidays",
          description:
            error instanceof Error
              ? error.message
              : "There was an error loading bank holidays. Please try again.",
        });
      } finally {
        setIsLoading(false);
      }
    };

    load();
  }, [selectedCountry]);

  const handleAddHoliday = async () => {
    if (!holidayName.trim() || !selectedDate) {
      toast({
        variant: "destructive",
        title: "Missing information",
        description: "Please provide both a name and date for the holiday"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const formattedDate = format(selectedDate, 'yyyy-MM-dd');
      const row = await createAdminBankHoliday({
        country: selectedCountry,
        holiday_name: holidayName.trim(),
        holiday_date: formattedDate,
      });

      setHolidays([...holidays, row].sort((a, b) =>
        a.holiday_date.localeCompare(b.holiday_date)
      ));

      toast({
        title: "Holiday added",
        description: `${holidayName} has been added to the calendar`
      });

      setHolidayName("");
      setSelectedDate(new Date());
    } catch (error: unknown) {
      console.error('Error adding bank holiday:', error);
      toast({
        variant: "destructive",
        title: "Failed to add holiday",
        description: error instanceof Error ? error.message : "There was an error adding the holiday. Please try again."
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeleteHoliday = async (id: string) => {
    try {
      await deleteAdminBankHoliday(id);
      setHolidays(holidays.filter(holiday => holiday.id !== id));

      toast({
        title: "Holiday deleted",
        description: "The holiday has been removed from the calendar"
      });
    } catch (error) {
      console.error('Error deleting bank holiday:', error);
      toast({
        variant: "destructive",
        title: "Failed to delete holiday",
        description: error instanceof Error ? error.message : "There was an error deleting the holiday. Please try again."
      });
    }
  };

  if (profile?.role !== 'superadmin') {
    return (
      <Card className="shadow-md">
        <CardHeader>
          <CardTitle>Access Restricted</CardTitle>
          <CardDescription>
            Only superadmins can manage bank holidays.
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle>Bank Holiday Management</CardTitle>
        <CardDescription>
          Manage bank holidays for different countries. These holidays will be marked in the calendars across the platform.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <Label htmlFor="country">Country</Label>
                <Select
                  value={selectedCountry}
                  onValueChange={(value) => setSelectedCountry(value as SupportedCountry)}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select a country" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Luxembourg">Luxembourg</SelectItem>
                    <SelectItem value="France">France</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label htmlFor="holidayName">Holiday Name</Label>
                <Input
                  id="holidayName"
                  value={holidayName}
                  onChange={(e) => setHolidayName(e.target.value)}
                  placeholder="e.g. New Year's Day"
                />
              </div>
              
              <div>
                <Label htmlFor="holidayDate">Date</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                      id="holidayDate"
                    >
                      <Calendar className="mr-2 h-4 w-4" />
                      {selectedDate ? format(selectedDate, 'PPP') : <span>Pick a date</span>}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <CalendarComponent
                      mode="single"
                      selected={selectedDate}
                      onSelect={setSelectedDate}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              
              <Button 
                onClick={handleAddHoliday} 
                disabled={isSubmitting}
                className="w-full"
              >
                {isSubmitting ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : (
                  <Plus className="mr-2 h-4 w-4" />
                )}
                Add Holiday
              </Button>
            </div>
            
            <div className="space-y-4">
              <h3 className="font-medium">Existing Holidays for {selectedCountry}</h3>
              
              {isLoading ? (
                <div className="flex items-center justify-center p-4">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : holidays.length === 0 ? (
                <div className="text-center p-4 border rounded-md bg-muted">
                  No bank holidays defined for {selectedCountry}
                </div>
              ) : (
                <div className="border rounded-md overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Date
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Name
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                          Actions
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {holidays.map(holiday => (
                        <tr key={holiday.id}>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {new Date(holiday.holiday_date).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm">
                            {holiday.holiday_name}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                            <Button
                              variant="ghost"
                              size="icon"
                              onClick={() => handleDeleteHoliday(holiday.id)}
                              title="Delete holiday"
                            >
                              <Trash2 className="h-4 w-4 text-red-500" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default BankHolidayManager;
