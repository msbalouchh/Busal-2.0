import { ControlCenterOperatorDirectory } from "@/modules/control-center/operators/components/control-center-operator-directory";
import { getControlCenterOperatorsContext } from "@/modules/control-center/operators/lib/get-control-center-operators-context";

export const dynamic = "force-dynamic";

interface ControlCenterOperatorsPageProps {
  searchParams: Promise<{
    search?: string;
    role?: string;
    status?: string;
    department?: string;
    mfaEnabled?: string;
    sortBy?: string;
    sortDirection?: string;
    page?: string;
  }>;
}

export default async function ControlCenterOperatorsPage({
  searchParams,
}: ControlCenterOperatorsPageProps) {
  const params = await searchParams;
  const { directory, permissions } = await getControlCenterOperatorsContext({
    search: params.search,
    role: params.role as never,
    status: params.status as never,
    department: params.department,
    mfaEnabled:
      params.mfaEnabled === "true" ? true : params.mfaEnabled === "false" ? false : null,
    sortBy: params.sortBy as never,
    sortDirection: params.sortDirection as never,
    page: params.page ? Number(params.page) : 1,
  });

  return (
    <ControlCenterOperatorDirectory initialDirectory={directory} permissions={permissions} />
  );
}
