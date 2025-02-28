
import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Share, ShoppingCart, Check } from "lucide-react";
import Header from "@/components/layout/Header";

// Mock data - would be replaced with real data from database
const mockPrescription = {
  id: "1",
  patient: {
    id: "p1",
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "123-456-7890"
  },
  doctor: {
    id: "d1",
    name: "Dr. Smith",
    specialty: "General Practitioner"
  },
  date: "2023-06-15",
  status: "active",
  medications: [
    { id: "m1", name: "Amoxicillin", dosage: "500mg", frequency: "3x daily", duration: "7 days", inCart: false },
    { id: "m2", name: "Ibuprofen", dosage: "400mg", frequency: "as needed", duration: "7 days", inCart: false }
  ],
  notes: "Take with food. Complete the full course of antibiotics."
};

const PrescriptionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [prescription, setPrescription] = useState(mockPrescription);
  const [allInCart, setAllInCart] = useState(false);

  // In a real app, fetch the prescription data based on the ID
  
  const handleAddToCart = (medicationId: string) => {
    setPrescription(prev => {
      const updatedMedications = prev.medications.map(med => 
        med.id === medicationId ? { ...med, inCart: true } : med
      );
      
      const allAdded = updatedMedications.every(med => med.inCart);
      setAllInCart(allAdded);
      
      return { ...prev, medications: updatedMedications };
    });
  };
  
  const handleShareCart = () => {
    // In a real app, this would send a notification to the patient
    alert("Cart has been shared with the patient");
  };

  return (
    <div>
      <Header />
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <Button 
              variant="outline" 
              onClick={() => navigate('/pharmacy/prescriptions')}
              className="gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back to Prescriptions
            </Button>
            
            {allInCart && (
              <Button 
                onClick={handleShareCart}
                className="gap-2"
              >
                <Share className="h-4 w-4" />
                Share Cart with Patient
              </Button>
            )}
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="md:col-span-2">
              <CardHeader>
                <CardTitle>Prescription #{prescription.id}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="font-semibold text-sm text-muted-foreground mb-2">Medications</h3>
                  <div className="space-y-4">
                    {prescription.medications.map((medication) => (
                      <div key={medication.id} className="flex items-center justify-between p-4 border rounded-md">
                        <div>
                          <p className="font-medium">{medication.name}</p>
                          <p className="text-sm text-muted-foreground">
                            {medication.dosage} - {medication.frequency} - {medication.duration}
                          </p>
                        </div>
                        <Button
                          className="gap-2"
                          variant={medication.inCart ? "outline" : "default"}
                          onClick={() => handleAddToCart(medication.id)}
                          disabled={medication.inCart}
                        >
                          {medication.inCart ? (
                            <>
                              <Check className="h-4 w-4" />
                              Added
                            </>
                          ) : (
                            <>
                              <ShoppingCart className="h-4 w-4" />
                              Add to Cart
                            </>
                          )}
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
                
                {prescription.notes && (
                  <div>
                    <h3 className="font-semibold text-sm text-muted-foreground mb-2">Notes</h3>
                    <p>{prescription.notes}</p>
                  </div>
                )}
              </CardContent>
            </Card>
            
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{prescription.patient.name}</p>
                  <p className="text-sm text-muted-foreground">{prescription.patient.email}</p>
                  <p className="text-sm text-muted-foreground">{prescription.patient.phone}</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader>
                  <CardTitle>Doctor Information</CardTitle>
                </CardHeader>
                <CardContent className="space-y-2">
                  <p className="font-medium">{prescription.doctor.name}</p>
                  <p className="text-sm text-muted-foreground">{prescription.doctor.specialty}</p>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PrescriptionDetail;
