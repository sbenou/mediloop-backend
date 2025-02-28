
import PatientLayout from "@/components/layout/PatientLayout";

const Teleconsultations = () => {
  return (
    <PatientLayout>
      <div>
        <h1 className="text-3xl font-bold mb-6">Teleconsultations</h1>
        <p className="text-muted-foreground mb-8">Schedule and manage your video consultations with doctors</p>
        
        {/* Placeholder content for teleconsultations */}
        <div className="bg-gray-100 rounded-lg p-8 text-center">
          <p className="text-lg">No scheduled teleconsultations</p>
          <p className="text-muted-foreground mt-2">
            Your upcoming teleconsultations will appear here once scheduled
          </p>
        </div>
      </div>
    </PatientLayout>
  );
};

export default Teleconsultations;
