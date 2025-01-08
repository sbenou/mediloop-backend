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
  return (
    <a
      href="#"
      onClick={(e) => {
        e.preventDefault();
        onFilterChange({ type, category: categoryId, subcategory: subcategoryId });
      }}
      className="text-xs text-muted-foreground hover:text-primary block"
    >
      {description}
    </a>
  );
};