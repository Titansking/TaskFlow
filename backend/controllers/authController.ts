import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response';

// This function handles registering a brand new user.
export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // 1. Validation: Make sure all required fields are filled out.
    if (!name || !email || !password) {
      return res.status(400).json(errorResponse('Please provide name, email, and password', 400));
    }

    // 2. Check if a user is already registered with this email address.
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(errorResponse('User already exists', 400));
    }

    // 3. Hash the password to keep it secure in the database.
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Generate user initials for their default avatar image safely.
    // Example: "Alex Johnson" -> "AJ". "Bob" -> "B". Empty name -> "U".
    const nameParts = name.trim().split(/\s+/).filter(Boolean);
    const initials = nameParts.length > 0
      ? nameParts.map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
      : 'U';
    
    // 5. Save the new user to the database.
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: initials,
      role: 'Team Member', // Default role for self-registered users
      status: 'online'      // Mark user online immediately
    });

    // 6. Generate a secure session token including the user ID, email, and role.
    const token = generateToken(
      (user._id as unknown) as string,
      user.email,
      user.role
    );

    // 7. Prepare the user details to return (do NOT include the password).
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.status
    };

    // 8. Return the token and user details to the client.
    return res.status(201).json(successResponse({ user: userResponse, token }, 'Registration successful', 201));
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json(errorResponse('Error registering user'));
  }
};

// This function handles authenticating an existing user.
export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // 1. Validation: Make sure email and password are provided.
    if (!email || !password) {
      return res.status(400).json(errorResponse('Please provide email and password', 400));
    }

    // 2. Find the user with this email address.
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json(unauthorizedResponse('Invalid credentials'));
    }

    // 3. Verify that the password matches the hashed password in the database.
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json(unauthorizedResponse('Invalid credentials'));
    }

    // 4. Generate a session token that includes user ID, email, and role.
    const token = generateToken(
      (user._id as unknown) as string,
      user.email,
      user.role || 'Team Member'
    );

    // 5. Prepare the user details to return (excluding password).
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'Team Member',
      avatar: user.avatar,
      status: user.status || 'online'
    };

    // 6. Return successful login data.
    return res.status(200).json(successResponse({ user: userResponse, token }, 'Login successful'));
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(errorResponse('Error logging in'));
  }
};
