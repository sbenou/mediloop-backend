
import { NextOfKin } from "../types";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Edit, Trash2, Phone, MapPin, User } from "lucide-react";

interface NextOfKinListProps {
  contacts: NextOfKin[];
  onEdit: (contact: NextOfKin) => void;
  onDelete: (id: string) => void;
}

export const NextOfKinList = ({ contacts, onEdit, onDelete }: NextOfKinListProps) => {
  // Helper function to get relation display text
  const getRelationText = (relation: string): string => {
    const relationMap: Record<string, string> = {
      parent: "Parent",
      child: "Child",
      spouse: "Spouse",
      sibling: "Sibling",
      friend: "Friend",
      other: "Other",
    };
    return relationMap[relation] || relation;
  };

  return (
    <div className="space-y-4">
      {contacts.map((contact) => (
        <Card key={contact.id} className="overflow-hidden">
          <CardContent className="p-0">
            <div className="flex flex-col md:flex-row">
              <div className="flex-1 p-4">
                <div className="flex justify-between">
                  <h3 className="text-lg font-semibold">{contact.full_name}</h3>
                  <span className="text-xs bg-primary/10 text-primary px-2 py-1 rounded-full">
                    {getRelationText(contact.relation)}
                  </span>
                </div>
                
                <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                  <div className="flex items-center">
                    <Phone className="h-4 w-4 mr-2" />
                    <span>{contact.phone_number}</span>
                  </div>
                  
                  <div className="flex items-center">
                    <MapPin className="h-4 w-4 mr-2" />
                    <span>
                      {contact.street}, {contact.city}, {contact.postal_code}, {contact.country}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="bg-muted p-4 flex md:flex-col justify-end gap-2">
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onEdit(contact)}
                  className="h-8 md:w-full"
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit
                </Button>
                <Button 
                  variant="ghost" 
                  size="sm" 
                  onClick={() => onDelete(contact.id)}
                  className="h-8 md:w-full text-destructive hover:text-destructive"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
