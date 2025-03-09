
import React, { useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useNavigate } from 'react-router-dom';
import { useSearchParams } from 'react-router-dom';
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
import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from '@/lib/supabase';
import { AuthRole } from '@/types/auth';
import { useMutation } from '@tanstack/react-query';
import { Icons } from '@/components/ui/icons';

const formSchema = z.object({
  email: z.string().email({ message: "Please enter a valid email address." }),
  password: z.string().min(8, { message: "Password must be at least 8 characters." }),
  confirmPassword: z.string().min(8, { message: "Password must be at least 8 characters." }),
  fullName: z.string().min(2, { message: "Full name must be at least 2 characters." }),
  role: z.enum([AuthRole.PATIENT, AuthRole.DOCTOR, AuthRole.PHARMACIST], {
    required_error: "Please select a role.",
  }),
});

const PasswordFields = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      fullName: "",
      role: AuthRole.PATIENT,
    },
  });

  const mutation = useMutation(
    async (values: z.infer<typeof formSchema>) => {
      setIsLoading(true);
      const { email, password, fullName, role } = values;

      if (password !== values.confirmPassword) {
        throw new Error("Passwords do not match");
      }

      const { data: authData, error: authError } = await supabase.auth.signUp({
        email: email,
        password: password,
        options: {
          data: {
            full_name: fullName,
            role: role,
          },
        },
      });

      if (authError) {
        console.error("Authentication error:", authError);
        throw new Error(authError.message || "Authentication failed");
      }

      if (!authData.user) {
        throw new Error("User not found after signup");
      }

      await createProfileIfNeeded(authData.user);

      return authData;
    },
    {
      onSuccess: (data) => {
        setIsLoading(false);
        toast({
          title: "Registration Successful",
          description: "You have successfully registered. Please check your email to verify your account.",
        });
        navigate(`/auth/verify-otp?type=email&email=${data.user?.email}`);
      },
      onError: (error: any) => {
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Registration Failed",
          description: error.message || "An error occurred during registration.",
        });
      },
    }
  );

  const onSubmit = (values: z.infer<typeof formSchema>) => {
    mutation.mutate(values);
  };

  const createProfileIfNeeded = async (user: any) => {
    try {
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();

      if (profileError && profileError.code !== 'PGRST116') {
        console.error("Error checking profile:", profileError);
        throw new Error("Failed to check existing profile");
      }

      const fullName = searchParams.get('name');
      const role = searchParams.get('role');

      const profileData = {
        id: user.id,
        role: role || 'patient',
        full_name: fullName || '',
        email: user.email,
        pharmacy_name: null,  // Initialize with null
        pharmacy_logo_url: null,  // Initialize with null
      };

      if (!existingProfile) {
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([profileData]);

        if (insertError) {
          console.error("Error creating profile:", insertError);
          throw new Error("Failed to create profile");
        } else {
          console.log("Profile created successfully");
        }
      } else {
        console.log("Profile already exists, skipping creation");
      }
    } catch (error) {
      console.error('Error creating profile:', error);
    }
  };

  return (
    <Card className="w-[550px] shadow-lg">
      <CardHeader className="space-y-1">
        <CardTitle className="text-2xl">Create an account</CardTitle>
        <CardDescription>
          Enter your email, password, and other details to create an account
        </CardDescription>
      </CardHeader>
      <CardContent className="grid gap-4">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your email" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Password</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="Enter your password" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Confirm Password</FormLabel>
                  <FormControl>
                    <Input
                      type="password"
                      placeholder="Confirm your password"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="fullName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Full Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter your full name" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={form.control}
              name="role"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Role</FormLabel>
                  <Select onValueChange={field.onChange} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a role" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value={AuthRole.PATIENT}>Patient</SelectItem>
                      <SelectItem value={AuthRole.DOCTOR}>Doctor</SelectItem>
                      <SelectItem value={AuthRole.PHARMACIST}>Pharmacist</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            <Button disabled={isLoading}>
              {isLoading && (
                <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
              )}
              Create Account
            </Button>
          </form>
        </Form>
        <div className="relative mt-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-background px-2 text-muted-foreground">
              Or continue with
            </span>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-6">
          <Button variant="outline" disabled>
            <Icons.gitHub className="mr-2 h-4 w-4" />
            Github
          </Button>
          <Button variant="outline" disabled>
            <Icons.google className="mr-2 h-4 w-4" />
            Google
          </Button>
        </div>
      </CardContent>
      <div className="px-6 py-4">
        <Label>
          Already have an account?
          <Link to="/auth/login" className="text-primary font-semibold ml-1">
            Login
          </Link>
        </Label>
      </div>
    </Card>
  );
};

export default PasswordFields;
