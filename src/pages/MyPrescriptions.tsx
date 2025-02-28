
import PatientLayout from "@/components/layout/PatientLayout";

const MyPrescriptions = () => {
  return (
    <PatientLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">My Prescriptions</h1>
        <p className="text-muted-foreground mb-8">View and manage your prescriptions</p>
        
        {/* Placeholder content for prescriptions */}
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-lg">No active prescriptions found</p>
          <p className="text-muted-foreground mt-2">
            Your prescriptions will appear here once you receive them from your doctor
          </p>
        </div>
      </div>
    </PatientLayout>
  );
};

export default MyPrescriptions;
