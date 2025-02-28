
import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import PharmacistLayout from "@/components/layout/PharmacistLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ShoppingCart, Check } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { toast } from "@/components/ui/use-toast";

interface Prescription {
  id: string;
  patient_id: string;
  doctor_id: string;
  medication_name: string;
  dosage: string;
  frequency: string;
  duration: string;
  notes: string;
  created_at: string;
  updated_at: string;
  patient_name?: string;
  doctor_name?: string;
}

const PrescriptionDetail = () => {
  const { id } = useParams<{ id: string }>();
  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [addedToCart, setAddedToCart] = useState(false);

  useEffect(() => {
    const fetchPrescriptionData = async () => {
      if (!id) return;

      setLoading(true);
      try {
        const { data, error } = await supabase
          .from('prescriptions')
          .select(`
            *,
            patient:patient_id (full_name),
            doctor:doctor_id (full_name)
          `)
          .eq('id', id)
          .single();

        if (error) throw error;
        
        setPrescription({
          ...data,
          patient_name: data.patient?.full_name,
          doctor_name: data.doctor?.full_name,
        });
      } catch (error) {
        console.error('Error fetching prescription data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPrescriptionData();
  }, [id]);

  const handleAddToCart = () => {
    // In a real implementation, this would add the medication to the patient's cart
    setAddedToCart(true);
    toast({
      title: "Added to Cart",
      description: "Medication has been added to patient's cart.",
    });
    
    // In a real implementation, you might send a notification to the patient
    setTimeout(() => {
      toast({
        title: "Notification Sent",
        description: "The patient has been notified that their prescription is ready for pickup.",
      });
    }, 1000);
  };

  const handleShareCart = () => {
    // In a real implementation, this would share the cart with the patient
    toast({
      title: "Cart Shared",
      description: "The cart has been shared with the patient.",
    });
  };

  if (loading) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-full">
          <p>Loading prescription information...</p>
        </div>
      </PharmacistLayout>
    );
  }

  if (!prescription) {
    return (
      <PharmacistLayout>
        <div className="flex items-center justify-center h-full">
          <p>Prescription not found.</p>
        </div>
      </PharmacistLayout>
    );
  }

  return (
    <PharmacistLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Prescription Details</h1>
            <p className="text-muted-foreground">
              Prescription for {prescription.patient_name}
            </p>
          </div>
          <div className="flex items-center space-x-2">
            <Button
              variant={addedToCart ? "outline" : "default"}
              onClick={handleAddToCart}
              disabled={addedToCart}
            >
              {addedToCart ? (
                <>
                  <Check className="h-4 w-4 mr-1" /> Added to Cart
                </>
              ) : (
                <>
                  <ShoppingCart className="h-4 w-4 mr-1" /> Add to Cart
                </>
              )}
            </Button>
            {addedToCart && (
              <Button onClick={handleShareCart}>
                Share Cart with Patient
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card>
            <CardHeader>
              <CardTitle>Prescription Information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Doctor</p>
                <p className="font-medium">{prescription.doctor_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Patient</p>
                <p className="font-medium">{prescription.patient_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date Prescribed</p>
                <p>{new Date(prescription.created_at).toLocaleDateString()}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Last Updated</p>
                <p>{new Date(prescription.updated_at).toLocaleDateString()}</p>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Medication Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Medication</p>
                <p className="font-medium">{prescription.medication_name}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Dosage</p>
                <p>{prescription.dosage}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Frequency</p>
                <p>{prescription.frequency}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Duration</p>
                <p>{prescription.duration}</p>
              </div>
              {prescription.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p>{prescription.notes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </PharmacistLayout>
  );
};

export default PrescriptionDetail;
