import { FilePlatformLists } from "@/modules/file-platform/components/file-platform-lists";
import { getFilePlatformStorageContext } from "@/modules/file-platform/lib/get-file-platform-context";

export default async function FilePlatformStoragePage() {
  const { providers } = await getFilePlatformStorageContext();
  return <FilePlatformLists providers={providers} />;
}
