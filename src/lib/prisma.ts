import { PrismaClient } from '@prisma/client'

const prismaClientSingleton = () => {
  return new PrismaClient()
}

declare global {
  var prismaGlobal: undefined | ReturnType<typeof prismaClientSingleton>
}

/**
 * Get the Prisma client instance.
 * Uses lazy initialization to avoid errors during build time when DATABASE_URL is not set.
 * The client is cached in globalThis to ensure a single instance across all imports.
 */
function getPrismaClient(): PrismaClient {
  // Check if DATABASE_URL is set
  if (!process.env.DATABASE_URL) {
    throw new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please set it in your .env file or environment variables.'
    )
  }

  if (globalThis.prismaGlobal) {
    return globalThis.prismaGlobal
  }

  const client = prismaClientSingleton()
  globalThis.prismaGlobal = client

  return client
}

// Export a proxy that lazily initializes the Prisma client on first access
const prisma = new Proxy({} as PrismaClient, {
  get(_, prop) {
    const client = getPrismaClient()
    const value = client[prop as keyof PrismaClient]
    // If it's a function, bind it to the client
    if (typeof value === 'function') {
      return value.bind(client)
    }
    return value
  }
})

export default prisma
