import React from 'react';
import { useNavigate } from 'react-router-dom';
import CitySearch from '@/components/CitySearch';
import PharmacyCard from '@/components/PharmacyCard';
import FileUpload from '@/components/FileUpload';
import { Button } from '@/components/ui/button';
import { toast } from '@/components/ui/use-toast';
import { LogOut, User, FilePlus } from 'lucide-react';

// Mock data for demonstration
const MOCK_PHARMACIES = [
  {
    id: 1,
    name: "HealthCare Pharmacy",
    address: "123 Medical Center Dr",
    distance: "0.5 miles",
    hours: "Open until 9 PM",
    phone: "(555) 123-4567"
  },
  {
    id: 2,
    name: "City Drugs",
    address: "456 Health Ave",
    distance: "0.8 miles",
    hours: "Open until 10 PM",
    phone: "(555) 234-5678"
  },
  {
    id: 3,
    name: "Community Pharmacy",
    address: "789 Wellness Blvd",
    distance: "1.2 miles",
    hours: "Open until 8 PM",
    phone: "(555) 345-6789"
  }
];

const Index = () => {
  const navigate = useNavigate();
  const [selectedPharmacy, setSelectedPharmacy] = React.useState<number | null>(null);
  const [prescription, setPrescription] = React.useState<File | null>(null);

  // Mock user data (replace with actual auth state later)
  const mockUser = {
    name: "John Doe",
    email: "john@example.com"
  };

  const handleLogout = () => {
    // Add actual logout logic later
    navigate('/login');
    toast({
      title: "Logged out",
      description: "You have been successfully logged out.",
    });
  };

  const handleSearch = (city: string) => {
    toast({
      title: "Searching pharmacies",
      description: `Finding pharmacies in ${city}...`,
    });
  };

  const handlePharmacySelect = (id: number) => {
    setSelectedPharmacy(id);
    toast({
      title: "Pharmacy selected",
      description: "Please upload your prescription to continue.",
    });
  };

  const handleFileSelect = (file: File) => {
    setPrescription(file);
    toast({
      title: "Prescription uploaded",
      description: "Your prescription has been successfully uploaded.",
    });
  };

  const handleSubmit = () => {
    if (!selectedPharmacy || !prescription) {
      toast({
        title: "Missing information",
        description: "Please select a pharmacy and upload your prescription.",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Order submitted",
      description: "Your order has been successfully submitted. We'll contact you soon.",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <User className="h-6 w-6 text-primary" />
              <span className="font-medium text-gray-900">{mockUser.name}</span>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={() => navigate('/create-prescription')}
                className="flex items-center space-x-2"
              >
                <FilePlus className="h-4 w-4" />
                <span>Create Prescription</span>
              </Button>
              <Button
                variant="ghost"
                onClick={handleLogout}
                className="flex items-center space-x-2"
              >
                <LogOut className="h-4 w-4" />
                <span>Logout</span>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12 animate-fade-in">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Find Nearby Pharmacies
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Search for pharmacies in your area and upload your prescription for delivery
          </p>
        </div>

        <div className="mb-12 animate-slide-up">
          <CitySearch onSearch={handleSearch} />
        </div>

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3 mb-12">
          {MOCK_PHARMACIES.map((pharmacy) => (
            <PharmacyCard
              key={pharmacy.id}
              {...pharmacy}
              onSelect={() => handlePharmacySelect(pharmacy.id)}
            />
          ))}
        </div>

        {selectedPharmacy && (
          <div className="max-w-2xl mx-auto animate-slide-up">
            <h2 className="text-2xl font-semibold mb-6">Upload Prescription</h2>
            <FileUpload onFileSelect={handleFileSelect} />
            
            <Button
              onClick={handleSubmit}
              className="w-full mt-8 h-12 text-lg bg-primary hover:bg-primary/90 text-white transition-colors duration-200"
              disabled={!prescription}
            >
              Submit Order
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Index;
