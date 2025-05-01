
import { Home, Award, User, Store, Users, FileText, ShoppingBag, CreditCard, HeartPulse, Bell, Settings, BarChart, Heart, Share } from "lucide-react";

export function getMenuItemsByRole(role: string, isPharmacist: boolean) {
  if (role === 'user' || role === 'patient') {
    return [
      { icon: Home, label: 'Dashboard', path: '/dashboard' },
      { icon: Award, label: 'Account', path: '/account' },
      { icon: User, label: 'Profile', path: '/dashboard?view=profile&profileTab=personal' },
      { icon: ShoppingBag, label: 'Orders', path: '/dashboard?view=orders&ordersTab=orders' },
      { icon: CreditCard, label: 'Payments', path: '/dashboard?view=orders&ordersTab=payments' },
      { icon: FileText, label: 'Prescriptions', path: '/dashboard?view=prescriptions' },
      { icon: HeartPulse, label: 'Consultations', path: '/dashboard?view=teleconsultations' },
      { icon: Bell, label: 'Notifications', path: '/activities' },
      { icon: Share, label: 'Referral', path: '/referral' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    ];
  }
  if (role === 'doctor') {
    return [
      { icon: Home, label: 'Dashboard', path: '/doctor/dashboard' },
      { icon: Award, label: 'Account', path: '/account' },
      { icon: User, label: 'Profile', path: '/dashboard?view=profile&profileTab=personal' },
      { icon: Store, label: 'Doctor Profile', path: '/doctor/profile' }, 
      { icon: Users, label: 'Patients', path: '/dashboard?view=patients' },
      { icon: ShoppingBag, label: 'Orders', path: '/dashboard?view=orders&ordersTab=orders' },
      { icon: FileText, label: 'Prescriptions', path: '/dashboard?view=prescriptions' },
      { icon: HeartPulse, label: 'Consultations', path: '/dashboard?view=teleconsultations' },
      { icon: Bell, label: 'Notifications', path: '/activities' },
      { icon: Share, label: 'Referral', path: '/referral' },
      { icon: Settings, label: 'Settings', path: '/settings' },
      { icon: CreditCard, label: 'Billing', path: '/billing-details' }
    ];
  }
  if (isPharmacist || role === 'pharmacist') {
    return [
      { icon: Home, label: 'Dashboard', path: '/pharmacy/dashboard?section=dashboard' },
      { icon: Award, label: 'Account', path: '/account' },
      { icon: User, label: 'Profile', path: '/pharmacy/dashboard?section=profile&profileTab=personal' },
      { icon: Store, label: 'Pharmacy Profile', path: '/pharmacy/profile' },
      { icon: ShoppingBag, label: 'Orders', path: '/pharmacy/dashboard?section=orders' },
      { icon: Users, label: 'Patients', path: '/pharmacy/dashboard?section=patients' },
      { icon: FileText, label: 'Prescriptions', path: '/pharmacy/dashboard?section=prescriptions' },
      { icon: Bell, label: 'Notifications', path: '/activities' },
      { icon: Share, label: 'Referral', path: '/referral' },
      { icon: BarChart, label: 'Analytics', path: '/pharmacy/dashboard?section=analytics' },
      { icon: Settings, label: 'Settings', path: '/settings' },
      { icon: CreditCard, label: 'Billing', path: '/billing-details' }
    ];
  }
  if (role === 'superadmin') {
    return [
      { icon: Home, label: 'Dashboard', path: '/superadmin/dashboard' },
      { icon: Award, label: 'Account', path: '/account' },
      { icon: Users, label: 'Users', path: '/superadmin/users' },
      { icon: Store, label: 'Pharmacies', path: '/superadmin/pharmacies' },
      { icon: HeartPulse, label: 'Doctors', path: '/superadmin/doctors' },
      { icon: ShoppingBag, label: 'Products', path: '/superadmin/products' },
      { icon: Bell, label: 'Notifications', path: '/activities' },
      { icon: Share, label: 'Referral', path: '/referral' },
      { icon: Settings, label: 'Settings', path: '/superadmin/settings' }
    ];
  }
  // Fallback
  return [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Award, label: 'Account', path: '/account' },
    { icon: User, label: 'Profile', path: '/settings?tab=profile' },
    { icon: Bell, label: 'Notifications', path: '/activities' },
    { icon: Share, label: 'Referral', path: '/referral' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];
}
