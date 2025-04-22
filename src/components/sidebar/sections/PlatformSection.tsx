
import { useAuth } from "@/hooks/auth/useAuth";
import { NavLink, useLocation } from "react-router-dom";
import { Heart, MessageSquare, Calendar, Activity, Gift, UserRound, ShoppingCart } from "lucide-react";
import { cn } from "@/lib/utils";

export function PlatformSection() {
  const { userRole } = useAuth();
  const location = useLocation();

  // Define platform section links based on user role
  const getNavItems = () => {
    const commonItems = [
      {
        title: "Account",
        href: "/account",
        icon: UserRound,
      }
    ];

    const patientItems = [
      {
        title: "Prescriptions",
        href: "/prescriptions",
        icon: Heart,
      },
      {
        title: "Orders",
        href: "/orders",
        icon: ShoppingCart,
      },
      {
        title: "Teleconsultations",
        href: "/teleconsultations",
        icon: MessageSquare,
      },
      {
        title: "Appointments",
        href: "/appointments",
        icon: Calendar,
      },
      {
        title: "Activity",
        href: "/activity",
        icon: Activity,
      },
      {
        title: "Referral",
        href: "/referral",
        icon: Gift,
      }
    ];

    const doctorItems = [
      {
        title: "Patients",
        href: "/patients",
        icon: UserRound,
      },
      {
        title: "Teleconsultations",
        href: "/teleconsultations",
        icon: MessageSquare,
      },
      {
        title: "Appointments",
        href: "/appointments",
        icon: Calendar,
      },
      {
        title: "Prescriptions",
        href: "/prescriptions",
        icon: Heart,
      },
      {
        title: "Activity",
        href: "/activity",
        icon: Activity,
      },
      {
        title: "Referral",
        href: "/referral",
        icon: Gift,
      }
    ];

    const pharmacistItems = [
      {
        title: "Orders",
        href: "/pharmacy/orders",
        icon: ShoppingCart,
      },
      {
        title: "Patients",
        href: "/pharmacy/patients",
        icon: UserRound,
      },
      {
        title: "Prescriptions",
        href: "/pharmacy/prescriptions",
        icon: Heart,
      },
      {
        title: "Activity",
        href: "/activity",
        icon: Activity,
      },
      {
        title: "Referral",
        href: "/referral",
        icon: Gift,
      }
    ];

    // Return appropriate items based on user role
    switch (userRole) {
      case "doctor":
        return [...doctorItems, ...commonItems];
      case "pharmacist":
        return [...pharmacistItems, ...commonItems];
      case "patient":
      default:
        return [...patientItems, ...commonItems];
    }
  };

  const navItems = getNavItems();

  return (
    <nav className="space-y-1 px-2">
      {navItems.map((item) => (
        <NavLink
          key={item.href}
          to={item.href}
          className={({ isActive }) =>
            cn(
              "flex items-center gap-3 rounded-lg px-3 py-2 text-sm transition-colors",
              isActive
                ? "bg-primary text-primary-foreground"
                : "text-muted-foreground hover:bg-secondary hover:text-secondary-foreground"
            )
          }
        >
          {item.icon && <item.icon className="h-4 w-4" />}
          <span>{item.title}</span>
        </NavLink>
      ))}
    </nav>
  );
}
