export class AppError extends Error {
  constructor(
    message: string,
    public readonly code: string,
    public readonly statusCode: number = 500,
  ) {
    super(message);
    this.name = 'AppError';
  }
}

export class AuthError extends AppError {
  constructor(message: string) {
    super(message, 'AUTH_ERROR', 401);
    this.name = 'AuthError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource: string) {
    super(`${resource} não encontrado.`, 'NOT_FOUND', 404);
    this.name = 'NotFoundError';
  }
}

export class ValidationError extends AppError {
  constructor(message: string) {
    super(message, 'VALIDATION_ERROR', 400);
    this.name = 'ValidationError';
  }
}

export function parseSupabaseError(error: unknown): AppError {
  if (error instanceof AppError) return error;

  if (typeof error === 'object' && error !== null && 'message' in error) {
    const msg = String((error as { message: unknown }).message);

    if (msg.includes('Invalid login credentials')) {
      return new AuthError('E-mail ou senha incorretos.');
    }
    if (msg.includes('Email not confirmed')) {
      return new AuthError('Confirme seu e-mail antes de entrar.');
    }
    if (msg.includes('User already registered')) {
      return new AuthError('Este e-mail já está cadastrado.');
    }
    if (msg.includes('JWT')) {
      return new AuthError('Sessão expirada. Faça login novamente.');
    }

    return new AppError(msg, 'SUPABASE_ERROR');
  }

  return new AppError('Erro inesperado. Tente novamente.', 'UNKNOWN_ERROR');
}
