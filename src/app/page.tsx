import { TypedDataSigner } from "@/components/signing/TypedDataSigner";
import { TransactionExecutor } from "@/components/transaction/TransactionExecutor";
import { WalletSummary } from "@/components/wallet/WalletSummary";

export default function Home() {
  return (
    <main className="page">
      <WalletSummary />
      <div className="lab-grid">
        <TransactionExecutor />
        <TypedDataSigner />
      </div>
    </main>
  );
}
