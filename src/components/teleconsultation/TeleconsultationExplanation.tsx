
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Clock, 
  Calendar, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  Video, 
  ClipboardList,
  FileText,
  Bell
} from 'lucide-react';

const TeleconsultationExplanation: React.FC = () => {
  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>How Teleconsultations Work</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Calendar className="h-5 w-5 mr-2 text-blue-500" />
              Booking a Teleconsultation
            </h3>
            <div className="space-y-2 text-sm pl-7">
              <p className="flex items-start">
                <span className="inline-block bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">1</span>
                <span>View your doctor's availability calendar (green slots are available, red slots are booked)</span>
              </p>
              <p className="flex items-start">
                <span className="inline-block bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">2</span>
                <span>Select a date and time that works for you from the available slots</span>
              </p>
              <p className="flex items-start">
                <span className="inline-block bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">3</span>
                <span>Provide the reason for your consultation and submit your request</span>
              </p>
              <p className="flex items-start">
                <span className="inline-block bg-blue-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">4</span>
                <span>Your doctor will review and confirm your request or suggest an alternative time</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Video className="h-5 w-5 mr-2 text-green-500" />
              During Your Teleconsultation
            </h3>
            <div className="space-y-2 text-sm pl-7">
              <p className="flex items-start">
                <span className="inline-block bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">1</span>
                <span>Join the secure video call up to 5 minutes before your scheduled time</span>
              </p>
              <p className="flex items-start">
                <span className="inline-block bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">2</span>
                <span>Your doctor will assess your health condition during the allocated time</span>
              </p>
              <p className="flex items-start">
                <span className="inline-block bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">3</span>
                <span>The call will automatically end at the scheduled end time</span>
              </p>
              <p className="flex items-start">
                <span className="inline-block bg-green-500 text-white rounded-full w-5 h-5 flex items-center justify-center mr-2 flex-shrink-0 text-xs">4</span>
                <span>Your doctor may issue a prescription which will be sent to your default pharmacy</span>
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <Bell className="h-5 w-5 mr-2 text-purple-500" />
              Reminders & Notifications
            </h3>
            <div className="space-y-2 text-sm pl-7">
              <p className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>Both you and your doctor will receive reminders up to 15 minutes before the appointment</span>
              </p>
              <p className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>You'll be notified when your doctor confirms your appointment</span>
              </p>
              <p className="flex items-start">
                <CheckCircle className="h-4 w-4 mr-2 text-green-500 flex-shrink-0 mt-0.5" />
                <span>You'll receive a notification if your doctor suggests a different time</span>
              </p>
            </div>
          </div>

          <div className="space-y-4">
            <h3 className="text-lg font-semibold flex items-center">
              <XCircle className="h-5 w-5 mr-2 text-red-500" />
              Cancellations
            </h3>
            <div className="space-y-2 text-sm pl-7">
              <p className="flex items-start">
                <ClipboardList className="h-4 w-4 mr-2 text-blue-500 flex-shrink-0 mt-0.5" />
                <span>You can cancel your appointment up to 1 hour before the scheduled time</span>
              </p>
              <p className="flex items-start">
                <AlertTriangle className="h-4 w-4 mr-2 text-amber-500 flex-shrink-0 mt-0.5" />
                <span>Cancellations less than 1 hour before are discouraged but possible</span>
              </p>
              <p className="flex items-start">
                <FileText className="h-4 w-4 mr-2 text-gray-500 flex-shrink-0 mt-0.5" />
                <span>Both you and your doctor will be notified of any cancellations</span>
              </p>
            </div>
          </div>
        </div>

        <div className="bg-blue-50 p-4 rounded-md mt-4">
          <h3 className="text-lg font-semibold text-blue-700 mb-2">Prescriptions</h3>
          <p className="text-sm text-blue-800">
            If your doctor issues a prescription during the teleconsultation, it will be sent to your default pharmacy or the pharmacy you specify. You'll be able to view your prescriptions in the prescriptions section, but neither you nor your doctor can modify a prescription once it has been issued.
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default TeleconsultationExplanation;
