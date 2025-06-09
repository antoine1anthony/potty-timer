import { database } from '../../services/database';

export async function GET(request: Request): Promise<Response> {
  try {
    const timers = await database.getAllTimers();

    return Response.json({
      success: true,
      timers,
      count: timers.length,
    });
  } catch (error) {
    console.error('GET /api/timers error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to fetch timers',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}

export async function POST(request: Request): Promise<Response> {
  try {
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

    const now = Date.now();
    const newTimer = await database.createTimer({
      duration,
      startTime: now,
      isActive: false,
      remainingTime: duration,
      isNotificationMode: false,
    });

    return Response.json({
      success: true,
      timer: newTimer,
      message: 'Timer created successfully',
    });
  } catch (error) {
    console.error('POST /api/timers error:', error);
    return Response.json(
      {
        success: false,
        error: 'Failed to create timer',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 },
    );
  }
}
