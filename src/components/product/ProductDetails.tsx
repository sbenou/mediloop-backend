
interface Product {
  id: string;
  name: string;
  type: 'medication' | 'parapharmacy';
  requires_prescription: boolean;
  description?: string;
}

interface ProductDetailsProps {
  product: Product;
}

export const ProductDetails = ({ product }: ProductDetailsProps) => {
  return (
    <div className="pt-4 border-t w-full">
      <h2 className="text-lg font-semibold mb-2">Details</h2>
      <ul className="space-y-2">
        <li className="flex">
          <span className="text-gray-500 w-32 flex-shrink-0">Type:</span>
          <span className="capitalize">{product.type}</span>
        </li>
        <li className="flex">
          <span className="text-gray-500 w-32 flex-shrink-0">Prescription Required:</span>
          <span>{product.requires_prescription ? 'Yes' : 'No'}</span>
        </li>
        {product.description && (
          <li className="flex flex-col mt-4">
            <span className="text-gray-500 mb-1">Description:</span>
            <p className="text-gray-700">{product.description}</p>
          </li>
        )}
      </ul>
    </div>
  );
};
