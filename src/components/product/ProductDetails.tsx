
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
    <div className="pt-4 border-t">
      <h2 className="text-lg font-semibold mb-2">Details</h2>
      <ul className="space-y-2">
        <li className="flex">
          <span className="text-gray-500 w-40">Type:</span>
          <span className="capitalize">{product.type}</span>
        </li>
        <li className="flex">
          <span className="text-gray-500 w-40">Prescription Required:</span>
          <span>{product.requires_prescription ? 'Yes' : 'No'}</span>
        </li>
        {product.description && (
          <li className="flex mt-4">
            <span className="text-gray-500 w-40">Description:</span>
            <span className="text-gray-700">{product.description}</span>
          </li>
        )}
      </ul>
    </div>
  );
};
