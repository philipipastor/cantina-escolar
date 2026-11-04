export class AppError extends Error {
  constructor(
    message: string,
    public statusCode = 400,
    // Identifica o erro para a tela reagir a ele, como pedir confirmação de uma compra repetida.
    public code?: string,
    public details?: unknown,
  ) {
    super(message)
  }
}
