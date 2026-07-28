import { FilePlatformLists } from "@/modules/file-platform/components/file-platform-lists";
import { getFilePlatformFoldersContext } from "@/modules/file-platform/lib/get-file-platform-context";

export default async function FilePlatformFoldersPage() {
  const { folders } = await getFilePlatformFoldersContext();
  return <FilePlatformLists folders={folders} />;
}
