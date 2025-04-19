
import { WalletBalance } from "./wallet/WalletBalance";
import { PointConversion } from "./wallet/PointConversion";
import { WalletSettings } from "./wallet/WalletSettings";

export function WalletSection() {
  return (
    <div className="grid gap-6">
      <WalletBalance />
      <PointConversion />
      <WalletSettings />
    </div>
  );
}
