import { Request, Response, NextFunction } from 'express'

export class AppError extends Error {
  public statusCode: number
  public isOperational: boolean

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message)
    this.statusCode = statusCode
    this.isOperational = isOperational
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message,
      statusCode: err.statusCode,
    })
  }

  console.error('Unhandled error:', err)

  return res.status(500).json({
    error: 'Internal server error',
    statusCode: 500,
  })
}
