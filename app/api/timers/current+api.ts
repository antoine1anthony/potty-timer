import { database } from '../../../services/database';

export async function GET(request: Request): Promise<Response> {
  try {
    const timer = await database.getCurrentTimer();

    if (!timer) {
      return Response.json(
        {
          success: false,
          error: 'No timer found',
        },
        { status: 404 },
      );
    }

    // Calculate current remaining time if timer is active
    if (timer.isActive) {
      const now = Date.now();
      const elapsed = Math.floor((now - timer.startTime) / 1000);
      const remaining = Math.max(0, timer.duration - elapsed);

      // Update the timer with current remaining time
      const updatedTimer = {
        ...timer,
        remainingTime: remaining,
      };

      // If timer has expired, mark it as inactive and trigger notification mode
      if (remaining <= 0 && !timer.isNotificationMode) {
        await database.updateTimer(timer.id, {
          isActive: false,
          remainingTime: 0,
          isNotificationMode: true,
        });

        return Response.json({
          success: true,
          timer: {
            ...updatedTimer,
            isActive: false,
            remainingTime: 0,
            isNotificationMode: true,
          },
        });
      }

      return Response.json({
        success: true,
        timer: updatedTimer,
      });
    }

    return Response.json({
      success: true,
      timer,
    });
  } catch (error) {
    console.error('GET /api/timers/current error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch current timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
