
import { Home, Award, User, Store, Users, FileText, ShoppingBag, CreditCard, HeartPulse, Bell, Settings, BarChart, Heart } from "lucide-react";

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
      { icon: Settings, label: 'Settings', path: '/settings' }
    ];
  }
  if (role === 'doctor') {
    return [
      { icon: Home, label: 'Dashboard', path: '/dashboard?section=dashboard' },
      { icon: Award, label: 'Account', path: '/account' },
      { icon: User, label: 'Profile', path: '/dashboard?section=profile&profileTab=personal' },
      { icon: Store, label: 'Doctor Profile', path: '/doctor/profile' },
      { icon: Users, label: 'Patients', path: '/dashboard?section=patients' },
      { icon: ShoppingBag, label: 'Orders', path: '/dashboard?section=orders&ordersTab=orders' },
      { icon: FileText, label: 'Prescriptions', path: '/dashboard?section=prescriptions' },
      { icon: HeartPulse, label: 'Consultations', path: '/dashboard?section=teleconsultations' },
      { icon: Bell, label: 'Notifications', path: '/activities' },
      { icon: Settings, label: 'Settings', path: '/settings' }
    ];
  }
  if (isPharmacist) {
    return [
      { icon: Home, label: 'Dashboard', path: '/dashboard?view=pharmacy&section=dashboard' },
      { icon: Award, label: 'Account', path: '/account' },
      { icon: User, label: 'Profile', path: '/dashboard?view=profile&profileTab=personal' },
      { icon: Store, label: 'Pharmacy Profile', path: '/pharmacy/profile' },
      { icon: ShoppingBag, label: 'Orders', path: '/dashboard?view=pharmacy&section=orders' },
      { icon: Users, label: 'Patients', path: '/dashboard?view=pharmacy&section=patients' },
      { icon: FileText, label: 'Prescriptions', path: '/dashboard?view=pharmacy&section=prescriptions' },
      { icon: Bell, label: 'Notifications', path: '/activities' },
      { icon: BarChart, label: 'Analytics', path: '/dashboard?view=pharmacy&section=analytics' },
      { icon: Settings, label: 'Settings', path: '/settings' }
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
      { icon: Settings, label: 'Settings', path: '/superadmin/settings' }
    ];
  }
  // Fallback
  return [
    { icon: Home, label: 'Dashboard', path: '/dashboard' },
    { icon: Award, label: 'Account', path: '/account' },
    { icon: User, label: 'Profile', path: '/settings?tab=profile' },
    { icon: Bell, label: 'Notifications', path: '/activities' },
    { icon: Settings, label: 'Settings', path: '/settings' }
  ];
}
