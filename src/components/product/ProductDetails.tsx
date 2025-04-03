
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
      <h2 className="text-lg font-semibold mb-4">Details</h2>
      <dl className="space-y-3">
        <div className="flex">
          <dt className="text-gray-500 w-40 flex-shrink-0">Type:</dt>
          <dd className="capitalize">{product.type}</dd>
        </div>
        <div className="flex">
          <dt className="text-gray-500 w-40 flex-shrink-0">Prescription Required:</dt>
          <dd>{product.requires_prescription ? 'Yes' : 'No'}</dd>
        </div>
        {product.description && (
          <div className="mt-6">
            <dt className="text-gray-500 mb-2">Description:</dt>
            <dd className="text-gray-700">{product.description}</dd>
          </div>
        )}
      </dl>
    </div>
  );
};
