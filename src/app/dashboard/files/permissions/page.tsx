import { FilePlatformLists } from "@/modules/file-platform/components/file-platform-lists";
import { getFilePlatformPermissionsContext } from "@/modules/file-platform/lib/get-file-platform-context";

export default async function FilePlatformPermissionsPage() {
  const { permissions } = await getFilePlatformPermissionsContext();
  return <FilePlatformLists permissions={permissions} />;
}
