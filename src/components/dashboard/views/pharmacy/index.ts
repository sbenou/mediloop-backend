
import DashboardStats from './DashboardStats';
import PatientsSection from './PatientsSection';

// Export individual views
export { default as HomeView } from '../HomeView';
export { default as InventoryView } from './InventoryView';
export { default as OrdersView } from '../OrdersView';
export { default as PharmacyProfileView } from './PharmacyProfileView';
export { default as PharmacySettingsView } from './PharmacySettingsView';
export { default as PharmacyStaffView } from './PharmacyStaffView';
export { default as PrescriptionsView } from '../PrescriptionsView';

// Export additional pharmacy-specific components
export { DashboardStats, PatientsSection };
