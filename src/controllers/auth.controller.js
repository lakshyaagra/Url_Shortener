import { registerUser, loginUser } from '../services/auth.service.js';

export async function registerController(req, res) {
  const { name, email, password } = req.body;

  const normalizedEmail = email.toLowerCase();

  const user = await registerUser({
    name,
    email: normalizedEmail,
    password,
  });

  return res.status(201).json({
    success: true,
    data: {
      user,
    },
  });
}

export async function loginController(req, res) {
  const { email, password } = req.body;

  const normalizedEmail = email.toLowerCase();

  const result = await loginUser({
    email: normalizedEmail,
    password,
  });

  return res.status(200).json({
    success: true,
    data: result,
  });
}