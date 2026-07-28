import { RevenueExpensesList } from "@/modules/revops/components/revops-lists";
import { getRevopsExpensesContext } from "@/modules/revops/lib/get-revops-context";

export default async function RevopsExpensesPage() {
  const { expenses } = await getRevopsExpensesContext();

  return <RevenueExpensesList expenses={expenses} />;
}
