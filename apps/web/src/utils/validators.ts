export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  isValid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  if (password.length < 6) {
    errors.push('Senha deve ter pelo menos 6 caracteres');
  }

  if (password.length > 50) {
    errors.push('Senha deve ter no máximo 50 caracteres');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

export interface LoginFormData {
  email: string;
  password: string;
}

export const validateLoginForm = (data: LoginFormData): {
  isValid: boolean;
  errors: Record<string, string>;
} => {
  const errors: Record<string, string> = {};

  if (!data.email.trim()) {
    errors.email = 'Email é obrigatório';
  } else if (!validateEmail(data.email)) {
    errors.email = 'Email inválido';
  }

  if (!data.password.trim()) {
    errors.password = 'Senha é obrigatória';
  } else {
    const passwordValidation = validatePassword(data.password);
    if (!passwordValidation.isValid) {
      errors.password = passwordValidation.errors[0];
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
  };
};
