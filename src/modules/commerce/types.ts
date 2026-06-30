import type { z } from "zod";
import type * as schemas from "./schema";

export type Channel = z.infer<typeof schemas.channelSchema>;

export type { Cell, Row, ListConfig, ScreenConfig } from "@/lib/screen-types";
