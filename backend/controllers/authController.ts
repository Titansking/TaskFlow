import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import User from '../models/User';
import { generateToken } from '../utils/jwt';
import { successResponse, errorResponse, unauthorizedResponse } from '../utils/response';

export const register = async (req: Request, res: Response) => {
  try {
    const { name, email, password } = req.body;

    // Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json(errorResponse('User already exists', 400));
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create user with default avatar and random role/status for now
    // In a real app, these defaults would be cleaner
    const initials = name.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase();
    
    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      avatar: initials,
      role: 'Team Member',
      status: 'online'
    });

    // Generate token
    // Generate token
    const token = generateToken(
      (user._id as unknown) as string,
      user.email
    );

    // Return user without password
    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role,
      avatar: user.avatar,
      status: user.status
    };

    return res.status(201).json(successResponse({ user: userResponse, token }, 'Registration successful', 201));
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json(errorResponse('Error registering user'));
  }
};

export const login = async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json(unauthorizedResponse('Invalid credentials'));
    }

    // Check password
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json(unauthorizedResponse('Invalid credentials'));
    }

    // Generate token
    const token = generateToken(
      (user._id as unknown) as string,
      user.email
    );

    const userResponse = {
      _id: user._id,
      name: user.name,
      email: user.email,
      role: user.role || 'Team Member',
      avatar: user.avatar,
      status: user.status || 'online'
    };

    return res.status(200).json(successResponse({ user: userResponse, token }, 'Login successful'));
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json(errorResponse('Error logging in'));
  }
};
