import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import prisma from '@/lib/prisma'

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || 'dev-secret-key-change-in-production'
)

async function verifyAuth(req: NextRequest) {
  const cookieStore = await cookies()
  const token = cookieStore.get('auth_token')?.value

  if (!token) {
    return null
  }

  try {
    const { payload } = await jwtVerify(token, JWT_SECRET)
    return payload as { userId: string; email: string; role: string }
  } catch {
    return null
  }
}

/**
 * @swagger
 * /api/saved-searches:
 *   get:
 *     tags: [SavedSearches]
 *     summary: Get user's saved searches
 *     description: Get all saved searches for the authenticated user
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Saved searches retrieved successfully
 *       401:
 *         description: Unauthorized
 */
export async function GET(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: { userId: user.userId },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({
      searches: savedSearches.map(search => ({
        id: search.id,
        name: search.name,
        query: search.query,
        filters: search.filters,
        isActive: search.isActive,
        createdAt: search.createdAt,
        updatedAt: search.updatedAt,
      })),
    })
  } catch (error) {
    console.error('Error fetching saved searches:', error)
    return NextResponse.json(
      { error: 'Failed to fetch saved searches' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/saved-searches:
 *   post:
 *     tags: [SavedSearches]
 *     summary: Create a saved search
 *     description: Save a search query with filters for later use
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - query
 *             properties:
 *               name:
 *                 type: string
 *                 description: Name for the saved search
 *               query:
 *                 type: string
 *                 description: Search query string
 *               filters:
 *                 type: object
 *                 description: Optional filters (category, price range, rating, etc.)
 *     responses:
 *       200:
 *         description: Search saved successfully
 *       400:
 *         description: Invalid request
 *       401:
 *         description: Unauthorized
 */
export async function POST(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { name, query, filters } = body

    if (!name || !query) {
      return NextResponse.json(
        { error: 'Name and query are required' },
        { status: 400 }
      )
    }

    // Limit number of saved searches per user
    const MAX_SAVED_SEARCHES_PER_USER = 20
    const existingCount = await prisma.savedSearch.count({
      where: { userId: user.userId },
    })

    if (existingCount >= MAX_SAVED_SEARCHES_PER_USER) {
      return NextResponse.json(
        { error: `Maximum number of saved searches (${MAX_SAVED_SEARCHES_PER_USER}) reached. Please delete some to save new ones.` },
        { status: 400 }
      )
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: user.userId,
        name,
        query,
        filters: filters || {},
      },
    })

    return NextResponse.json({
      id: savedSearch.id,
      name: savedSearch.name,
      query: savedSearch.query,
      filters: savedSearch.filters,
      message: 'Search saved successfully',
    })
  } catch (error) {
    console.error('Error creating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to save search' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/saved-searches:
 *   put:
 *     tags: [SavedSearches]
 *     summary: Update a saved search
 *     description: Update an existing saved search
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id
 *             properties:
 *               id:
 *                 type: string
 *                 format: uuid
 *               name:
 *                 type: string
 *               query:
 *                 type: string
 *               filters:
 *                 type: object
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Saved search updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Saved search not found
 */
export async function PUT(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await req.json()
    const { id, name, query, filters, isActive } = body

    if (!id) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      )
    }

    // Verify the search belongs to the user
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        id,
        userId: user.userId,
      },
    })

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    const updatedSearch = await prisma.savedSearch.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(query && { query }),
        ...(filters !== undefined && { filters }),
        ...(isActive !== undefined && { isActive }),
      },
    })

    return NextResponse.json({
      id: updatedSearch.id,
      name: updatedSearch.name,
      query: updatedSearch.query,
      filters: updatedSearch.filters,
      isActive: updatedSearch.isActive,
      message: 'Saved search updated successfully',
    })
  } catch (error) {
    console.error('Error updating saved search:', error)
    return NextResponse.json(
      { error: 'Failed to update saved search' },
      { status: 500 }
    )
  }
}

/**
 * @swagger
 * /api/saved-searches:
 *   delete:
 *     tags: [SavedSearches]
 *     summary: Delete a saved search
 *     description: Delete a saved search by ID
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *           format: uuid
 *     responses:
 *       200:
 *         description: Saved search deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Saved search not found
 */
export async function DELETE(req: NextRequest) {
  try {
    const user = await verifyAuth(req)
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const searchId = searchParams.get('id')

    if (!searchId) {
      return NextResponse.json(
        { error: 'Search ID is required' },
        { status: 400 }
      )
    }

    // Verify the search belongs to the user
    const search = await prisma.savedSearch.findFirst({
      where: {
        id: searchId,
        userId: user.userId,
      },
    })

    if (!search) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      )
    }

    await prisma.savedSearch.delete({
      where: { id: searchId },
    })

    return NextResponse.json({ message: 'Saved search deleted successfully' })
  } catch (error) {
    console.error('Error deleting saved search:', error)
    return NextResponse.json(
      { error: 'Failed to delete saved search' },
      { status: 500 }
    )
  }
}
