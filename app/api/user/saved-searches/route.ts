import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';
import { getTokenFromRequest, getUserFromToken } from '@/lib/auth';

/**
 * @swagger
 * /api/user/saved-searches:
 *   get:
 *     summary: Get user's saved searches
 *     description: Retrieve all saved searches for the authenticated user
 *     tags: [Saved Searches]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of saved searches
 *       401:
 *         description: Unauthorized
 */
export async function GET(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const savedSearches = await prisma.savedSearch.findMany({
      where: {
        userId: payload.userId,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    return NextResponse.json({ savedSearches });
  } catch (error) {
    console.error('Error fetching saved searches:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/user/saved-searches:
 *   post:
 *     summary: Create a new saved search
 *     description: Save a search query with optional filters
 *     tags: [Saved Searches]
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
 *               query:
 *                 type: string
 *               filters:
 *                 type: object
 *               notifyNew:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Saved search created successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
export async function POST(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { name, query, filters = {}, notifyNew = false } = await request.json();

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }

    if (!query || typeof query !== 'string') {
      return NextResponse.json(
        { error: 'Search query is required' },
        { status: 400 }
      );
    }

    if (name.trim().length > 100) {
      return NextResponse.json(
        { error: 'Name must be 100 characters or less' },
        { status: 400 }
      );
    }

    // Check for duplicate names for this user
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        userId: payload.userId,
        name: name.trim(),
      },
    });

    if (existingSearch) {
      return NextResponse.json(
        { error: 'A saved search with this name already exists' },
        { status: 400 }
      );
    }

    // Limit saved searches per user
    const count = await prisma.savedSearch.count({
      where: { userId: payload.userId },
    });

    if (count >= 20) {
      return NextResponse.json(
        { error: 'Maximum number of saved searches (20) reached. Please delete some to add more.' },
        { status: 400 }
      );
    }

    const savedSearch = await prisma.savedSearch.create({
      data: {
        userId: payload.userId,
        name: name.trim(),
        query: query.trim(),
        filters,
        notifyNew,
      },
    });

    return NextResponse.json({
      savedSearch,
      message: 'Search saved successfully',
    });
  } catch (error) {
    console.error('Error creating saved search:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/user/saved-searches:
 *   delete:
 *     summary: Delete a saved search
 *     description: Delete a saved search by ID
 *     tags: [Saved Searches]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Saved search ID
 *     responses:
 *       200:
 *         description: Saved search deleted successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Saved search not found
 */
export async function DELETE(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Saved search ID is required' },
        { status: 400 }
      );
    }

    // Check if saved search exists and belongs to user
    const savedSearch = await prisma.savedSearch.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
    });

    if (!savedSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    await prisma.savedSearch.delete({
      where: { id },
    });

    return NextResponse.json({
      success: true,
      message: 'Saved search deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting saved search:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/user/saved-searches:
 *   patch:
 *     summary: Update a saved search
 *     description: Update an existing saved search
 *     tags: [Saved Searches]
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
 *               name:
 *                 type: string
 *               query:
 *                 type: string
 *               filters:
 *                 type: object
 *               notifyNew:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Saved search updated successfully
 *       401:
 *         description: Unauthorized
 *       404:
 *         description: Saved search not found
 */
export async function PATCH(request: Request) {
  try {
    const token = getTokenFromRequest(request);
    const payload = getUserFromToken(token);

    if (!payload) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { id, name, query, filters, notifyNew } = await request.json();

    if (!id) {
      return NextResponse.json(
        { error: 'Saved search ID is required' },
        { status: 400 }
      );
    }

    // Check if saved search exists and belongs to user
    const existingSearch = await prisma.savedSearch.findFirst({
      where: {
        id,
        userId: payload.userId,
      },
    });

    if (!existingSearch) {
      return NextResponse.json(
        { error: 'Saved search not found' },
        { status: 404 }
      );
    }

    const updateData: {
      name?: string;
      query?: string;
      filters?: object;
      notifyNew?: boolean;
    } = {};

    if (name !== undefined) {
      if (typeof name !== 'string' || name.trim().length === 0) {
        return NextResponse.json(
          { error: 'Name cannot be empty' },
          { status: 400 }
        );
      }
      if (name.trim().length > 100) {
        return NextResponse.json(
          { error: 'Name must be 100 characters or less' },
          { status: 400 }
        );
      }

      // Check for duplicate names (excluding current search)
      const duplicateName = await prisma.savedSearch.findFirst({
        where: {
          userId: payload.userId,
          name: name.trim(),
          id: { not: id },
        },
      });

      if (duplicateName) {
        return NextResponse.json(
          { error: 'A saved search with this name already exists' },
          { status: 400 }
        );
      }

      updateData.name = name.trim();
    }

    if (query !== undefined) {
      if (typeof query !== 'string') {
        return NextResponse.json(
          { error: 'Invalid query format' },
          { status: 400 }
        );
      }
      updateData.query = query.trim();
    }

    if (filters !== undefined) {
      updateData.filters = filters;
    }

    if (notifyNew !== undefined) {
      updateData.notifyNew = Boolean(notifyNew);
    }

    const savedSearch = await prisma.savedSearch.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      savedSearch,
      message: 'Saved search updated successfully',
    });
  } catch (error) {
    console.error('Error updating saved search:', error);
    return NextResponse.json(
      { error: 'An error occurred' },
      { status: 500 }
    );
  }
}
