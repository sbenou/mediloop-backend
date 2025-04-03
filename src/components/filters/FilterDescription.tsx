
import { useNavigate } from 'react-router-dom';
import { Badge } from "@/components/ui/badge";

interface FilterDescriptionProps {
  description: string;
  categoryId: string;
  subcategoryId: string;
  type: 'medication' | 'parapharmacy';
  count: number;
  onFilterChange: (filters: { type?: string; category?: string; subcategory?: string; description?: string }) => void;
}

export const FilterDescription = ({
  description,
  categoryId,
  subcategoryId,
  type,
  count,
  onFilterChange
}: FilterDescriptionProps) => {
  const navigate = useNavigate();

  const handleDescriptionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Description clicked:', { type, categoryId, subcategoryId, description });
    onFilterChange({ type, category: categoryId, subcategory: subcategoryId, description });
    navigate('/products');
  };

  return (
    <a
      href="#"
      onClick={handleDescriptionClick}
      className="flex items-center justify-between w-full text-xs text-muted-foreground hover:text-primary cursor-pointer py-1"
    >
      <span className="truncate mr-2">{description}</span>
      <Badge 
        variant="secondary" 
        className="text-xs text-muted-foreground ml-auto w-5 text-center flex items-center justify-center h-4 flex-shrink-0"
      >
        {count}
      </Badge>
    </a>
  );
};
