import { database } from '../../../services/database';

export async function GET(
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

    return Response.json({
      success: true,
      timer,
    });
  } catch (error) {
    console.error(`GET /api/timers/${id} error:`, error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function PUT(
  request: Request,
  { id }: { id: string },
): Promise<Response> {
  try {
    const url = new URL(request.url);
    const action = url.pathname.split('/').pop();

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

    switch (action) {
      case 'start':
        updatedTimer = await database.updateTimer(id, {
          isActive: true,
          startTime: Date.now(),
          isNotificationMode: false,
        });
        break;

      case 'pause':
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
        break;

      case 'reset':
        updatedTimer = await database.updateTimer(id, {
          isActive: false,
          startTime: Date.now(),
          remainingTime: timer.duration,
          isNotificationMode: false,
        });
        break;

      case 'duration':
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

        updatedTimer = await database.updateTimer(id, {
          duration,
          remainingTime: timer.isActive ? duration : duration,
          startTime: timer.isActive ? Date.now() : timer.startTime,
        });
        break;

      default:
        // Generic update for other fields
        const updateBody = await request.json();
        updatedTimer = await database.updateTimer(id, updateBody);
        break;
    }

    return Response.json({
      success: true,
      timer: updatedTimer,
      message: `Timer ${action || 'updated'} successfully`,
    });
  } catch (error) {
    console.error(`PUT /api/timers/${id} error:`, error);
    return Response.json(
      {
        success: false,
        error: 'Failed to update timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function DELETE(
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

    await database.deleteTimer(id);

    return Response.json({
      success: true,
      message: 'Timer deleted successfully',
    });
  } catch (error) {
    console.error(`DELETE /api/timers/${id} error:`, error);
    return Response.json(
      {
        success: false,
        error: 'Failed to delete timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
