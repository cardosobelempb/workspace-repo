import z from "zod";
import { LoginSchema } from "../../infrastructure/http/schemas/login.schema";

export type LoginDto = z.infer<typeof LoginSchema>;
