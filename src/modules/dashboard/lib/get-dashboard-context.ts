import { cache } from "react";

import { protectedPage } from "@/modules/platform-guards/guards/page.guards";

export const getDashboardContext = cache(protectedPage);
