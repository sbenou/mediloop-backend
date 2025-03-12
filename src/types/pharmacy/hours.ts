
export interface DayHours {
  open: boolean;
  openTime: string;
  closeTime: string;
}

export interface WeekHours {
  monday: DayHours;
  tuesday: DayHours;
  wednesday: DayHours;
  thursday: DayHours;
  friday: DayHours;
  saturday: DayHours;
  sunday: DayHours;
}

export const defaultHours: WeekHours = {
  monday: { open: true, openTime: '09:00', closeTime: '18:00' },
  tuesday: { open: true, openTime: '09:00', closeTime: '18:00' },
  wednesday: { open: true, openTime: '09:00', closeTime: '18:00' },
  thursday: { open: true, openTime: '09:00', closeTime: '18:00' },
  friday: { open: true, openTime: '09:00', closeTime: '18:00' },
  saturday: { open: true, openTime: '09:00', closeTime: '13:00' },
  sunday: { open: false, openTime: '09:00', closeTime: '18:00' },
};
