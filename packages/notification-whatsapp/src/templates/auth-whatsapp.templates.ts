export const AuthWhatsAppTemplates = {
  verificationCode(input: { code: string }): string {
    return `Seu código de verificação é: ${input.code}`;
  },

  resetPasswordCode(input: { code: string }): string {
    return `Use o código ${input.code} para redefinir sua senha.`;
  },

  loginAlert(input: { appName: string }): string {
    return `Detectamos um novo login na sua conta ${input.appName}. Se não foi você, altere sua senha imediatamente.`;
  },
};
