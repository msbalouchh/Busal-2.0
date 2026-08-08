import { ControlCenterSecurityHub } from "@/modules/control-center/security/components/control-center-security-hub";
import { getControlCenterSecurityContext } from "@/modules/control-center/security/lib/get-control-center-security-context";

export const dynamic = "force-dynamic";

interface ControlCenterSecurityPageProps {
  searchParams: Promise<{
    search?: string;
    operatorOnly?: string;
    page?: string;
  }>;
}

export default async function ControlCenterSecurityPage({
  searchParams,
}: ControlCenterSecurityPageProps) {
  const params = await searchParams;
  const bundle = await getControlCenterSecurityContext({
    search: params.search,
    operatorOnly: params.operatorOnly === "true",
    page: params.page ? Number(params.page) : 1,
  });

  return <ControlCenterSecurityHub initialBundle={bundle} />;
}
