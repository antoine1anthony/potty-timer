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
      isActive: false,
      startTime: Date.now(),
      remainingTime: timer.duration,
      isNotificationMode: false,
    });

    return Response.json({
      success: true,
      timer: updatedTimer,
      message: 'Timer reset successfully',
    });
  } catch (error) {
    console.error(`PUT /api/timers/${id}/reset error:`, error);
    return Response.json(
      {
        success: false,
        error: 'Failed to reset timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
