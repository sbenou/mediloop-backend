import { useNavigate } from 'react-router-dom';

interface FilterDescriptionProps {
  description: string;
  categoryId: string;
  subcategoryId: string;
  type: 'medication' | 'parapharmacy';
  onFilterChange: (filters: { type?: string; category?: string; subcategory?: string }) => void;
}

export const FilterDescription = ({
  description,
  categoryId,
  subcategoryId,
  type,
  onFilterChange
}: FilterDescriptionProps) => {
  const navigate = useNavigate();

  const handleDescriptionClick = (e: React.MouseEvent) => {
    e.preventDefault();
    console.log('Description clicked:', { type, categoryId, subcategoryId });
    onFilterChange({ type, category: categoryId, subcategory: subcategoryId });
    navigate('/products');
  };

  return (
    <a
      href="#"
      onClick={handleDescriptionClick}
      className="text-xs text-muted-foreground hover:text-primary block cursor-pointer"
    >
      {description}
    </a>
  );
};