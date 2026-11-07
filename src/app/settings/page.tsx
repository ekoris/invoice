import { getCompanyProfile, getBankAccounts } from "@/lib/actions";
import SettingsManager from "@/components/SettingsManager";
import { BankAccountData } from "@/lib/types";

export default async function SettingsPage() {
  const [profile, bankAccounts] = await Promise.all([
    getCompanyProfile(),
    getBankAccounts(),
  ]);

  return (
    <SettingsManager
      initialProfile={profile}
      initialBankAccounts={bankAccounts as BankAccountData[]}
    />
  );
}
