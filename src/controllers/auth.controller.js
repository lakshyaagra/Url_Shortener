import { registerUser,loginUser } from '../services/auth.service.js';

export async function registerController(req, res) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Name, email and password are required',
      });
    }

    if (password.length < 7) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 7 characters long',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const user = await registerUser({
      name: name.trim(),
      email: normalizedEmail,
      password,
    });

    return res.status(201).json({
      success: true,
      data: {
        user,
      },
    });
  } catch (error) {
    if (error.code === 'EMAIL_ALREADY_EXISTS') {
      return res.status(409).json({
        success: false,
        message: 'Email is already registered',
      });
    }

    console.error('Failed to register user:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to register user',
    });
  }
}

export async function loginController(req, res) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required',
      });
    }

    const normalizedEmail = email.trim().toLowerCase();

    const result = await loginUser({
      email: normalizedEmail,
      password,
    });

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    if (error.code === 'INVALID_CREDENTIALS') {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password',
      });
    }

    console.error('Failed to login user:', error);

    return res.status(500).json({
      success: false,
      message: 'Failed to login',
    });
  }
}