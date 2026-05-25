export enum Role {
  OWNER = "OWNER",
  ADMIN = "ADMIN",
  MANAGER = "MANAGER",
  FINANCE = "FINANCE",
  SUPPORT = "SUPPORT",
  OPERATOR = "OPERATOR",
  AFFILIATE = "AFFILIATE",
  MEMBER = "MEMBER",
  CUSTOMER = "CUSTOMER",
}
/**
### Descrição das roles
| Role | Descrição |
|---|---|
| OWNER | Dono do tenant. Tem acesso total. |
| ADMIN | Administra usuários, configurações e módulos. |
| MANAGER | Gerencia operação, mas sem controle total. |
| FINANCE | Acessa pagamentos, cobranças e planos. |
| SUPPORT | Acessa suporte e leitura de usuários. |
| OPERATOR | Opera módulos como hotspot, vouchers e atendimento. |
| AFFILIATE | Acessa recursos de afiliado/parceiro. |
| MEMBER | Usuário interno comum. |
| CUSTOMER | Cliente final com acesso limitado. |
 */
