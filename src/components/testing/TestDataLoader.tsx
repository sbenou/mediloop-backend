
import { useEffect } from "react";
import { supabase } from "@/lib/supabase";

interface TestDataLoaderProps {
  children?: React.ReactNode;
}

/**
 * Component that loads test data when the app is initialized
 * Useful for development and demo environments
 */
const TestDataLoader: React.FC<TestDataLoaderProps> = ({ children }) => {
  useEffect(() => {
    const loadTestData = async () => {
      try {
        // Check if our specific doctor already exists
        const { data: existingDoctor, error: checkError } = await supabase
          .from('profiles')
          .select('id, email')
          .eq('email', 'ridam57@yahoo.fr')
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.error("Error checking for doctor:", checkError);
        }

        // If the doctor doesn't exist, create them
        if (!existingDoctor) {
          const { data: newDoctor, error: createError } = await supabase
            .from('profiles')
            .insert([
              {
                full_name: 'Dr. Alexandre Martin',
                email: 'ridam57@yahoo.fr',
                role: 'doctor',
                city: 'Luxembourg',
                license_number: 'LUX349287',
                avatar_url: 'https://randomuser.me/api/portraits/men/33.jpg'
              }
            ])
            .select();

          if (createError) {
            console.error("Error creating test doctor:", createError);
          } else {
            console.log("Test doctor created successfully:", newDoctor);
          }
        } else {
          console.log("Test doctor already exists:", existingDoctor);
        }
      } catch (error) {
        console.error("Error in TestDataLoader:", error);
      }
    };

    // Only run in development mode
    if (process.env.NODE_ENV === 'development') {
      loadTestData();
    }
  }, []);

  return <>{children}</>;
};

export default TestDataLoader;
