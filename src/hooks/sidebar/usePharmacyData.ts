
import { useState, useEffect } from 'react';
import { supabase } from "@/lib/supabase";
import { UserProfile } from '@/types/user';

export const usePharmacyData = (profile: UserProfile | null, userRole: string) => {
  const [pharmacyName, setPharmacyName] = useState<string | null>(null);
  
  // Fetch pharmacy name if user is a pharmacist
  useEffect(() => {
    const fetchPharmacyData = async () => {
      if (userRole === 'pharmacist' && profile?.id) {
        try {
          // First check if pharmacy name is already in the profile
          if (profile.pharmacy_name) {
            setPharmacyName(profile.pharmacy_name);
            return;
          }
          
          // If not, get the pharmacy_id from user_pharmacies
          const { data: pharmacyRelation, error: relationError } = await supabase
            .from('user_pharmacies')
            .select('pharmacy_id')
            .eq('user_id', profile.id)
            .single();

          if (relationError || !pharmacyRelation?.pharmacy_id) {
            console.error('Error fetching pharmacy relation:', relationError);
            return;
          }

          // Then get the pharmacy name
          const { data: pharmacy, error: pharmacyError } = await supabase
            .from('pharmacies')
            .select('name')
            .eq('id', pharmacyRelation.pharmacy_id)
            .single();

          if (pharmacyError || !pharmacy) {
            console.error('Error fetching pharmacy:', pharmacyError);
            return;
          }

          setPharmacyName(pharmacy.name);
          
          // Update the user profile with the pharmacy name for future use
          await supabase
            .from('profiles')
            .update({ pharmacy_name: pharmacy.name })
            .eq('id', profile.id);
            
          // Also check and fetch pharmacy logo if it's not already set
          if (!profile.pharmacy_logo_url) {
            const { data: metadata } = await supabase
              .from('pharmacy_metadata')
              .select('logo_url')
              .eq('pharmacy_id', pharmacyRelation.pharmacy_id)
              .maybeSingle();
              
            if (metadata?.logo_url) {
              // Update user profile with the pharmacy logo
              await supabase
                .from('profiles')
                .update({ pharmacy_logo_url: metadata.logo_url })
                .eq('id', profile.id);
            } else {
              // Check pharmacy storage folder for images
              try {
                const { data: storageFiles, error: storageError } = await supabase.storage
                  .from('pharmacy-images')
                  .list(`pharmacies/${pharmacyRelation.pharmacy_id}`);
                  
                if (!storageError && storageFiles && storageFiles.length > 0) {
                  // Find first image file
                  const imageFile = storageFiles.find(file => 
                    file.name.endsWith('.jpg') || 
                    file.name.endsWith('.jpeg') || 
                    file.name.endsWith('.png') || 
                    file.name.endsWith('.gif')
                  );
                  
                  if (imageFile) {
                    const { data: { publicUrl } } = supabase.storage
                      .from('pharmacy-images')
                      .getPublicUrl(`pharmacies/${pharmacyRelation.pharmacy_id}/${imageFile.name}`);
                      
                    // Update user profile with the logo
                    await supabase
                      .from('profiles')
                      .update({ pharmacy_logo_url: publicUrl })
                      .eq('id', profile.id);
                      
                    // Also update metadata
                    await supabase
                      .from('pharmacy_metadata')
                      .upsert({ 
                        pharmacy_id: pharmacyRelation.pharmacy_id, 
                        logo_url: publicUrl 
                      });
                  }
                }
              } catch (storageError) {
                console.error('Error checking pharmacy storage:', storageError);
              }
            }
          }
        } catch (error) {
          console.error('Error fetching pharmacy data:', error);
        }
      }
    };

    fetchPharmacyData();
  }, [profile?.id, userRole, profile?.pharmacy_name]);

  return { pharmacyName };
};
