
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
      <ul className="space-y-3">
        <li className="flex">
          <span className="text-gray-500 w-32 flex-shrink-0">Type:</span>
          <span className="capitalize">{product.type}</span>
        </li>
        <li className="flex">
          <span className="text-gray-500 w-32 flex-shrink-0">Prescription Required:</span>
          <span>{product.requires_prescription ? 'Yes' : 'No'}</span>
        </li>
        {product.description && (
          <li className="mt-6"> {/* Changed from mt-4 to mt-6 for more spacing */}
            <span className="text-gray-500 block mb-2">Description:</span> {/* Added block and mb-2 */}
            <p className="text-gray-700">{product.description}</p>
          </li>
        )}
      </ul>
    </div>
  );
};
