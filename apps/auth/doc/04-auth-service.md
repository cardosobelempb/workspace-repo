# 04 — Auth Service

## Responsabilidade

Cuidar de identidade, autenticação, sessão, senha, e-mail e OTP opcional.

## Escopo

Este serviço responde à pergunta:

```txt
Quem é o usuário?
```

## Módulos

```txt
modules/auth
modules/users
modules/user-profiles
modules/sessions
```

## Use cases obrigatórios

```txt
RegisterUseCase
LoginUseCase
LogoutUseCase
MeUseCase
RefreshSessionUseCase
CreateSessionUseCase
RevokeSessionUseCase
```

## Use cases opcionais

```txt
ForgotPasswordUseCase
ResetPasswordUseCase
VerifyEmailUseCase
ResendVerificationEmailUseCase
RequestOtpUseCase
ValidateOtpUseCase
```

## Controllers

```txt
POST /auth/register
POST /auth/login
POST /auth/logout
GET  /auth/me
POST /auth/refresh
POST /auth/forgot-password
POST /auth/reset-password
POST /auth/verify-email
POST /auth/request-otp
POST /auth/validate-otp
```

## Register profissional

O registro deve criar:

```txt
User
UserProfile básico
Session opcional
```

Campos mínimos:

```txt
firstName
lastName
email
password
```

## Transação

A transação deve ficar no use case.

```txt
RegisterUseCase
  ↓ transaction
UserRepository.create(user, tx)
UserProfileRepository.create(profile, tx)
SessionRepository.create(session, tx)
```

## O que não colocar aqui

- Regras de pagamento.
- Regras de hotspot.
- Permissões de negócio.
- Lógica de voucher.

## Próximo passo

Depois do Auth Service, implemente Session + Redis.
