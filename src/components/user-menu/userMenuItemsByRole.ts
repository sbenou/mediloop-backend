
import { 
  Settings, 
  User, 
  CreditCard, 
  Medal, 
  Activity, 
  Building, 
  FileText,
  Home
} from "lucide-react";

interface MenuItem {
  label: string;
  icon: any;
  path: string;
}

// Common menu items for all roles
const commonItems: MenuItem[] = [
  {
    label: "Dashboard",
    icon: Home,
    path: "/dashboard"
  },
  {
    label: "Account",
    icon: Settings,
    path: "/account"
  },
  {
    label: "Billing",
    icon: CreditCard,
    path: "/billing-details"
  },
  {
    label: "Notifications",
    icon: Activity,
    path: "/notifications",
  }
];

// Patient specific menu items
const patientItems: MenuItem[] = [
  {
    label: "Upgrade",
    icon: Medal,
    path: "/upgrade"
  }
];

// Doctor specific menu items
const doctorItems: MenuItem[] = [
  {
    label: "Doctor Profile",
    icon: User,
    path: "/doctor/profile"
  },
  {
    label: "Upgrade",
    icon: Medal,
    path: "/upgrade"
  }
];

// Pharmacist specific menu items (Dashboard is already in commonItems)
const pharmacistItems: MenuItem[] = [
  {
    label: "Pharmacy Profile",
    icon: User,
    path: "/pharmacy/profile"
  },
  {
    label: "Upgrade",
    icon: Medal,
    path: "/upgrade"
  }
];

// Admin specific menu items
const adminItems: MenuItem[] = [
  {
    label: "Admin Dashboard",
    icon: Building,
    path: "/admin/dashboard"
  }
];

// Get menu items based on user role
export const getMenuItemsByRole = (role?: string | null, isPharmacist?: boolean): MenuItem[] => {
  const isPharm = isPharmacist || role === "pharmacist";
  const items = commonItems.map((item) => {
    if (item.label === "Notifications") {
      if (isPharm) {
        return {
          ...item,
          path: "/dashboard?view=pharmacy&section=notifications",
        };
      }
      if (role === "doctor") {
        return { ...item, path: "/dashboard?section=notifications" };
      }
    }
    return item;
  });
  
  // Then, add role-specific items
  if (isPharm) {
    items.push(...pharmacistItems);
  } else if (role === "doctor") {
    items.push(...doctorItems);
  } else if (role === "superadmin") {
    items.push(...adminItems);
  } else if (role === "patient" || role === "user") {
    items.push(...patientItems);
  }
  
  return items;
};
