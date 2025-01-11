interface DefaultAddressProps {
  address?: {
    street: string;
    city: string;
    postal_code: string;
    country: string;
  };
}

export const DefaultAddress = ({ address }: DefaultAddressProps) => {
  return (
    <div className="space-y-2">
      {address ? (
        <>
          <p className="text-lg">{address.street}</p>
          <p className="text-lg">
            {address.city}, {address.postal_code}
          </p>
          <p className="text-lg">{address.country}</p>
          <p className="text-sm text-gray-500 mt-2">
            To update your address, please use the Addresses tab.
          </p>
        </>
      ) : (
        <p className="text-red-500">Please add at least one address in the Addresses tab</p>
      )}
    </div>
  );
};