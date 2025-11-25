import { getUserByUsername } from '../../../server/mongo';

export async function POST(request) {
  try {
    const { username, password } = await request.json();
    
    if (!username || !password) {
      return Response.json(
        { error: 'Username and password are required' },
        { status: 400 }
      );
    }

    // Get user from database with proper field mapping
    const user = await getUserByUsername(username);
    
    if (!user) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Check password (handles both pwd and password fields)
    const userPassword = user.pwd || user.password || '';
    if (userPassword !== password) {
      return Response.json(
        { error: 'Invalid credentials' },
        { status: 401 }
      );
    }

    // Return user data with proper field mapping
    const userData = {
      ...user,
      username: user.id || user.username,
      password: userPassword // Include for frontend compatibility
    };

    return Response.json({ 
      success: true, 
      user: userData 
    });
    
  } catch (error) {
    console.error('Authentication error:', error);
    return Response.json(
      { error: 'Authentication failed' },
      { status: 500 }
    );
  }
}