import { database } from '../../../../services/database';

export async function PUT(
  request: Request,
  { id }: { id: string },
): Promise<Response> {
  try {
    const timer = await database.getTimer(id);
    if (!timer) {
      return Response.json(
        {
          success: false,
          error: 'Timer not found',
        },
        { status: 404 },
      );
    }

    const body = await request.json();
    const { duration } = body;

    if (!duration || typeof duration !== 'number' || duration <= 0) {
      return Response.json(
        {
          success: false,
          error: 'Invalid duration. Must be a positive number.',
        },
        { status: 400 },
      );
    }

    const updatedTimer = await database.updateTimer(id, {
      duration,
      remainingTime: timer.isActive ? duration : duration,
      startTime: timer.isActive ? Date.now() : timer.startTime,
    });

    return Response.json({
      success: true,
      timer: updatedTimer,
      message: 'Timer duration updated successfully',
    });
  } catch (error) {
    console.error(`PUT /api/timers/${id}/duration error:`, error);
    return Response.json(
      {
        success: false,
        error: 'Failed to update timer duration',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
