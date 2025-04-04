
import React, { useState, useEffect } from "react";
import { Calendar, Users, ArrowLeft, ArrowRight } from "lucide-react";
import { addDays, format, startOfWeek, isSameDay } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import WeekNavigation from "@/components/teleconsultation/calendar/WeekNavigation";
import { useAvailabilityCalendar } from "@/components/teleconsultation/hooks/useAvailabilityCalendar";
import { useAuth } from "@/hooks/auth/useAuth";
import { Teleconsultation } from "@/types/supabase";
import DoctorAvailabilityCalendar from "@/components/teleconsultation/DoctorAvailabilityCalendar";

const DoctorAppointmentsView = () => {
  const { profile } = useAuth();
  const doctorId = profile?.id;
  const [activeTab, setActiveTab] = useState<string>("calendar");

  const {
    currentWeek,
    weekDays,
    teleconsultations,
    previousWeek,
    nextWeek,
    resetToCurrentWeek,
    isLoading,
    refreshTeleconsultations,
  } = useAvailabilityCalendar(doctorId);

  // Fetch appointments initially and whenever the date range changes
  useEffect(() => {
    if (doctorId) {
      refreshTeleconsultations();
    }
  }, [doctorId, currentWeek, refreshTeleconsultations]);

  // Filter to show only in-person appointments
  const inPersonAppointments = teleconsultations.filter(appointment => {
    // Check if appointment has in-person metadata
    if (appointment.meta?.is_in_person || appointment.meta?.appointment_type === 'in-person') {
      return true;
    }
    
    // Fallback to checking the reason field
    const reason = appointment.reason?.toLowerCase() || '';
    return reason.includes('in-person') || reason.includes('in person');
  });

  // Helper to check if a day has appointments
  const getDayAppointments = (day: Date) => {
    return inPersonAppointments.filter(appointment => 
      isSameDay(new Date(appointment.start_time), day)
    );
  };

  // Group appointments by day for the list view
  const appointmentsByDay = weekDays.reduce((acc, day) => {
    const dayAppointments = getDayAppointments(day);
    if (dayAppointments.length > 0) {
      acc[format(day, 'yyyy-MM-dd')] = {
        date: day,
        appointments: dayAppointments
      };
    }
    return acc;
  }, {} as Record<string, { date: Date, appointments: Teleconsultation[] }>);

  // Render appointment item 
  const renderAppointmentItem = (appointment: Teleconsultation) => {
    const startTime = new Date(appointment.start_time);
    const endTime = new Date(appointment.end_time);
    const patientName = appointment.patient?.full_name || 'Unknown Patient';
    
    return (
      <div key={appointment.id} className="mb-4 p-4 border rounded-lg bg-white shadow-sm">
        <div className="flex justify-between items-start mb-2">
          <div>
            <h4 className="font-medium">{patientName}</h4>
            <p className="text-sm text-muted-foreground">
              {format(startTime, 'h:mm a')} - {format(endTime, 'h:mm a')}
            </p>
          </div>
          <Badge variant={appointment.status === 'confirmed' ? 'default' : 'outline'}>
            {appointment.status || 'Scheduled'}
          </Badge>
        </div>
        {appointment.reason && (
          <p className="text-sm mt-2 line-clamp-2">{appointment.reason}</p>
        )}
        <div className="mt-3 flex space-x-2">
          <Button size="sm" variant="outline">Reschedule</Button>
          {appointment.status === 'confirmed' && (
            <Button size="sm">Check In</Button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">In-Person Appointments</h2>
          <p className="text-muted-foreground">
            Manage your upcoming in-clinic patient appointments and schedule.
          </p>
        </div>
        <div className="mt-4 md:mt-0">
          <Button>+ New In-Person Appointment</Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="calendar">
            <Calendar className="mr-2 h-4 w-4" />
            Calendar View
          </TabsTrigger>
          <TabsTrigger value="list">
            <Users className="mr-2 h-4 w-4" />
            List View
          </TabsTrigger>
          <TabsTrigger value="availability">
            Availability Settings
          </TabsTrigger>
        </TabsList>

        <TabsContent value="calendar" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-center">
                <CardTitle>Weekly Calendar</CardTitle>
                <WeekNavigation 
                  currentWeek={currentWeek}
                  onPreviousWeek={previousWeek}
                  onNextWeek={nextWeek}
                  onCurrentWeek={resetToCurrentWeek}
                />
              </div>
              <CardDescription>
                {format(weekDays[0], 'MMMM d, yyyy')} - {format(weekDays[6], 'MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                  <p>Loading appointments...</p>
                </div>
              ) : (
                <div className="grid grid-cols-7 min-h-[400px] border rounded-lg">
                  {weekDays.map((day, dayIndex) => (
                    <div key={dayIndex} className="min-h-[400px] border-r last:border-r-0 p-2">
                      <div className="text-center p-2 sticky top-0 bg-background">
                        <p className="font-medium">{format(day, 'EEE')}</p>
                        <p className="text-sm">{format(day, 'MMM d')}</p>
                      </div>
                      <div className="space-y-1">
                        {getDayAppointments(day).map((appointment) => (
                          <div 
                            key={appointment.id}
                            className="bg-primary/10 text-xs p-2 rounded border border-primary/20 mb-1 cursor-pointer hover:bg-primary/20 transition-colors"
                          >
                            <p className="font-semibold truncate">{appointment.patient?.full_name || 'Unknown Patient'}</p>
                            <p>{format(new Date(appointment.start_time), 'h:mm a')}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="list" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>In-Person Appointments List</CardTitle>
                <WeekNavigation 
                  currentWeek={currentWeek}
                  onPreviousWeek={previousWeek}
                  onNextWeek={nextWeek}
                  onCurrentWeek={resetToCurrentWeek}
                />
              </div>
              <CardDescription>
                {format(weekDays[0], 'MMMM d, yyyy')} - {format(weekDays[6], 'MMMM d, yyyy')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="min-h-[400px] flex items-center justify-center">
                  <p>Loading appointments...</p>
                </div>
              ) : Object.keys(appointmentsByDay).length > 0 ? (
                Object.entries(appointmentsByDay).map(([dateStr, dayData]) => (
                  <div key={dateStr} className="mb-6">
                    <h3 className="text-lg font-medium mb-3">
                      {format(dayData.date, 'EEEE, MMMM d')}
                    </h3>
                    <div className="space-y-3">
                      {dayData.appointments.map(renderAppointmentItem)}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="w-12 h-12 mx-auto text-muted-foreground" />
                  <h3 className="mt-4 text-lg font-medium">No in-person appointments scheduled</h3>
                  <p className="text-muted-foreground mt-2">
                    You don't have any in-person appointments scheduled for this week.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle>In-Person Availability Settings</CardTitle>
              <CardDescription>
                Set your weekly availability for in-person appointments at your clinic
              </CardDescription>
            </CardHeader>
            <CardContent>
              <DoctorAvailabilityCalendar 
                doctorId={profile?.id || ''} 
                isManagementMode={true}
                appointmentType="in-person"
              />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default DoctorAppointmentsView;
