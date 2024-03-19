import { z } from "zod";

export const FaucetSchema = z.object({
  body: z.object({ address: z.string() }),
});
