import { TokenDto } from "@/modules/auth/application/dto/token.dto";
import { WhereFilter } from "@repo/database";

export type TokenWhere = WhereFilter<TokenDto>;
