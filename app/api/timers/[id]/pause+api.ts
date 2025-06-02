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

    let updatedTimer;
    if (timer.isActive) {
      const now = Date.now();
      const elapsed = Math.floor((now - timer.startTime) / 1000);
      const remaining = Math.max(0, timer.duration - elapsed);

      updatedTimer = await database.updateTimer(id, {
        isActive: false,
        remainingTime: remaining,
      });
    } else {
      updatedTimer = timer;
    }

    return Response.json({
      success: true,
      timer: updatedTimer,
      message: 'Timer paused successfully',
    });
  } catch (error) {
    console.error(`PUT /api/timers/${id}/pause error:`, error);
    return Response.json(
      {
        success: false,
        error: 'Failed to pause timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
