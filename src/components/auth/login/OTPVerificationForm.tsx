import { useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useToast } from "@/components/ui/use-toast"
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { useMutation } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { AuthError, User } from '@supabase/supabase-js';
import { useAuth } from '@/hooks/auth/useAuth';

const formSchema = z.object({
  otp: z.string()
    .min(6, { message: "OTP must be at least 6 characters." })
    .max(6, { message: "OTP must be at most 6 characters." }),
});

const OTPVerificationForm = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { updateSession } = useAuth();
  const [role, setRole] = useState<string | null>(null);
  const [fullName, setFullName] = useState<string | null>(null);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      otp: "",
    },
  });

  const { mutate: verifyOTP, isLoading } = useMutation<
    { user: User; session: any },
    AuthError,
    z.infer<typeof formSchema>
  >({
    mutationFn: async (values) => {
      const email = searchParams.get('email');
      if (!email) throw new Error('Email not found in query parameters');

      const { data, error } = await supabase.auth.verifyOtp({
        email,
        token: values.otp,
        type: 'email',
      });

      if (error) {
        console.error('OTP verification error:', error);
        throw error;
      }

      if (!data.session) {
        throw new Error('No session found after OTP verification');
      }

      return { user: data.user!, session: data.session };
    },
    onSuccess: async (data) => {
      const { user, session } = data;
      await createProfileIfNeeded(user);
      await updateSession(session);

      toast({
        title: "Verification successful",
        description: "You have successfully verified your email.",
      });

      navigate('/dashboard');
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Verification failed",
        description: error.message || "Failed to verify OTP.",
      });
    },
  });

  const createProfileIfNeeded = async (user: User) => {
    try {
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.message !== 'No rows found') {
        console.error('Error checking profile existence:', profileError);
        return;
      }

      if (!existingProfile) {
        const profileData = {
          id: user.id,
          role: role || 'patient',
          full_name: fullName || '',
          email: user.email,
          pharmacy_name: null,  // Initialize with null
          pharmacy_logo_url: null,  // Initialize with null
        };

        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (insertError) {
          console.error('Error creating profile:', insertError);
        }
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(verifyOTP)} className="w-full space-y-6">
        <FormField
          control={form.control}
          name="otp"
          render={({ field }) => (
            <FormItem>
              <FormLabel>OTP</FormLabel>
              <FormControl>
                <Input placeholder="Enter OTP" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={isLoading}>
          {isLoading ? "Verifying..." : "Verify OTP"}
        </Button>
      </form>
    </Form>
  );
};

export default OTPVerificationForm;
