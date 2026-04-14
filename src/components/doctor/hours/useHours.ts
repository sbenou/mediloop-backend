
import { useState, useEffect, Dispatch, SetStateAction } from "react";
import { parseHoursText, stringifyWeekHours, formatHoursDisplay } from "@/utils/pharmacy/hoursFormatters";
import { WeekHours } from "@/types/pharmacy/hours";
import { toast } from "@/components/ui/use-toast";
import { updateDoctorWorkspaceApi } from "@/services/professionalWorkspaceApi";

export const useHours = (
  initialHours: string | null,
  doctorId: string,
  setIsEditing?: Dispatch<SetStateAction<boolean>>,
  onSaved?: () => void,
) => {
  const [hoursText, setHoursText] = useState(initialHours || "");
  const [weekHours, setWeekHours] = useState<WeekHours | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (initialHours) {
      setHoursText(initialHours);
      try {
        const parsed = parseHoursText(initialHours);
        if (parsed) {
          setWeekHours(parsed);
        }
      } catch {
        console.log("Hours are in free text format");
      }
    }
  }, [initialHours]);

  const formattedHours = formatHoursDisplay(hoursText);

  const isStructuredFormat = weekHours !== null;

  const handleSaveText = async () => {
    if (!doctorId) return;
    setIsSaving(true);
    try {
      await updateDoctorWorkspaceApi({ hours: hoursText });

      toast({
        title: "Hours updated",
        description: "Doctor hours have been saved successfully.",
      });

      if (setIsEditing) {
        setIsEditing(false);
      }
      onSaved?.();
    } catch (error) {
      console.error("Error saving hours:", error);
      toast({
        title: "Error",
        description: "Failed to save hours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleSaveStructured = async () => {
    if (!weekHours) return;

    setIsSaving(true);
    try {
      const hoursString = stringifyWeekHours(weekHours);

      await updateDoctorWorkspaceApi({ hours: hoursString });

      setHoursText(hoursString);

      toast({
        title: "Hours updated",
        description: "Doctor hours have been saved successfully.",
      });

      if (setIsEditing) {
        setIsEditing(false);
      }
      onSaved?.();
    } catch (error) {
      console.error("Error saving hours:", error);
      toast({
        title: "Error",
        description: "Failed to save hours. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return {
    hoursText,
    setHoursText,
    weekHours,
    setWeekHours,
    formattedHours,
    isSaving,
    isStructuredFormat,
    handleSaveText,
    handleSaveStructured,
  };
};
