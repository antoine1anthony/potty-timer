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

    const updatedTimer = await database.updateTimer(id, {
      isActive: true,
      startTime: Date.now(),
      isNotificationMode: false,
    });

    return Response.json({
      success: true,
      timer: updatedTimer,
      message: 'Timer started successfully',
    });
  } catch (error) {
    console.error(`PUT /api/timers/${id}/start error:`, error);
    return Response.json(
      {
        success: false,
        error: 'Failed to start timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
