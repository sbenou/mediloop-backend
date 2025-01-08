import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ProductUploader } from "@/components/product/ProductUploader";

export const ProductManagementCard = () => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Product Management</CardTitle>
      </CardHeader>
      <CardContent>
        <ProductUploader />
      </CardContent>
    </Card>
  );
};