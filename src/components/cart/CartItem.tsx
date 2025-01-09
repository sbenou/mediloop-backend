import { Button } from "@/components/ui/button";
import { Minus, Plus, Trash2 } from "lucide-react";

interface CartItemProps {
  id: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string;
  onUpdateQuantity: (id: string, quantity: number) => void;
  onRemove: (id: string) => void;
}

export const CartItem = ({
  id,
  name,
  price,
  quantity,
  image_url,
  onUpdateQuantity,
  onRemove,
}: CartItemProps) => {
  return (
    <div className="flex items-center gap-4 py-4">
      {image_url && (
        <img
          src={image_url}
          alt={name}
          className="h-16 w-16 object-cover rounded"
        />
      )}
      <div className="flex-1">
        <h4 className="font-medium">{name}</h4>
        <p className="text-sm text-muted-foreground">${price}</p>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant="outline"
          size="icon"
          onClick={() => onUpdateQuantity(id, quantity - 1)}
        >
          <Minus className="h-4 w-4" />
        </Button>
        <span className="w-8 text-center">{quantity}</span>
        <Button
          variant="outline"
          size="icon"
          onClick={() => onUpdateQuantity(id, quantity + 1)}
        >
          <Plus className="h-4 w-4" />
        </Button>
        <Button
          variant="outline"
          size="icon"
          className="ml-2"
          onClick={() => onRemove(id)}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
};