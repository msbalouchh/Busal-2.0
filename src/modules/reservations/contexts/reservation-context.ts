import { createContext } from "react";

import type { ReservationContextValue } from "@/modules/reservations/types/reservations";

export const ReservationContext = createContext<ReservationContextValue | null>(null);
