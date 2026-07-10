import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined
}

export const hasDatabase =
  !!process.env.DATABASE_URL &&
  !process.env.DATABASE_URL.includes('dummy:dummy@localhost')

export const db =
  globalForPrisma.prisma ??
  (hasDatabase
    ? new PrismaClient({
        log: process.env.NODE_ENV === 'production' ? ['error', 'warn'] : ['query'],
      })
    : (null as unknown as PrismaClient))

if (process.env.NODE_ENV !== 'production' && hasDatabase) {
  globalForPrisma.prisma = db
}

export const DB_NOT_CONFIGURED_ERROR = {
  error: 'database_not_configured',
  message:
    'DATABASE_URL is not set. Create a PostgreSQL database (e.g. on Neon) and add the connection string as the DATABASE_URL environment variable in your Netlify site settings, then redeploy.',
  docs: 'https://pris.ly/d/postgresql-url',
}

export function withDb<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<Response>
): (...args: TArgs) => Promise<Response> {
  return async (...args: TArgs) => {
    if (!hasDatabase) {
      return Response.json(DB_NOT_CONFIGURED_ERROR, { status: 503 })
    }
    try {
      return await handler(...args)
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err)
      const isConnectionError =
        message.includes('P1001') ||
        message.includes("Can't reach database server") ||
        message.includes('Timed out') ||
        message.includes('Connection refused')
      return Response.json(
        {
          error: isConnectionError ? 'database_unreachable' : 'internal_error',
          message: isConnectionError
            ? `Cannot reach the database. Check that DATABASE_URL is correct and the database is online. (${message})`
            : message,
        },
        { status: isConnectionError ? 503 : 500 }
      )
    }
  }
}
