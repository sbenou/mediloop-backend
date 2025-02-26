
import { Calendar } from "@/components/ui/calendar";
import PatientLayout from "@/components/layout/PatientLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useState } from "react";

const Teleconsultations = () => {
  const [date, setDate] = useState<Date | undefined>(new Date());
  
  return (
    <PatientLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Teleconsultations</h1>
        <p className="text-muted-foreground">
          Book and manage your upcoming teleconsultations with your doctor.
        </p>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Select Date</CardTitle>
              <CardDescription>
                Choose a date for your teleconsultation
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                className="rounded-md border shadow"
              />
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Upcoming Teleconsultations</CardTitle>
              <CardDescription>
                Your scheduled teleconsultations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center p-8 text-muted-foreground">
                You have no upcoming teleconsultations.
                Select a date on the calendar to book a new appointment.
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PatientLayout>
  );
};

export default Teleconsultations;
