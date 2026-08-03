import { createContext } from "react";

import type { MenuContextValue } from "@/modules/menu/types/menu";

export const MenuContext = createContext<MenuContextValue | null>(null);
