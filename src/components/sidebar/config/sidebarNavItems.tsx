
import { 
  Home, User, ShoppingBag, Settings, Calendar, 
  Pill, Users, Store, Heart, CreditCard, Video, HeartPulse, MapPin,
  Share, FileSignature, Briefcase // Added FileSignature for stamps and Briefcase for workplace
} from "lucide-react";

export const platformMenuItems = [
  {
    label: 'Dashboard',
    icon: <Home className="w-5 h-5 mr-3" />,
    path: '/dashboard'
  },
  {
    label: 'Referral',
    icon: <Share className="w-5 h-5 mr-3" />,
    path: '/referral'
  }
];

export const adminMenuItems = [
  {
    label: 'Settings',
    icon: <Settings className="w-5 h-5 mr-3" />,
    path: '/settings'
  }
];

export const ordersSubItems = [
  {
    label: 'Orders',
    icon: <ShoppingBag className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=orders&ordersTab=orders',
  },
  {
    label: 'Payments',
    icon: <CreditCard className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=orders&ordersTab=payments',
  }
];

export const profileSubItems = [
  {
    label: 'Personal Details',
    icon: <User className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=profile&profileTab=personal',
  },
  {
    label: 'Addresses',
    icon: <MapPin className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=profile&profileTab=addresses',
  },
  {
    label: 'Next of Kin',
    icon: <Users className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=profile&profileTab=nextofkin',
  },
  {
    label: 'Stamp & Signature',
    icon: <FileSignature className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=profile&profileTab=stamp',
  },
  {
    label: 'Workplace',
    icon: <Briefcase className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=profile&profileTab=workplace',
  },
  {
    label: 'Default Pharmacy',
    icon: <Store className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=profile&profileTab=pharmacy',
  },
  {
    label: 'My Doctor',
    icon: <Heart className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=profile&profileTab=doctor',
  }
];

export const consultationsSubItems = [
  {
    label: 'Teleconsultations',
    icon: <Video className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=teleconsultations',
  },
  {
    label: 'Appointments',
    icon: <Calendar className="w-4 h-4 mr-3" />,
    path: '/dashboard?view=appointments',
  }
];
