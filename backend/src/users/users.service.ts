/**
 * User and authentication rules — the business logic behind accounts.
 *
 * This is the only file in the feature that touches the database, hashes a
 * password or signs a token. Routes read validated input and call one of these.
 */
import bcrypt from 'bcryptjs';
import { generateToken } from '../shared/auth';
import { AppError } from '../shared/errors';
import type { AuthDto, PageDto, UserDto, UserRole } from '../shared/types';
import { listOptions, paginate } from '../shared/http';
import { UserModel, type User } from './users.model';
import type {
  CreateUserBody,
  LoginBody,
  PaginationQuery,
  RegisterBody,
  UpdateProfileBody,
  UpdateUserBody,
} from './users.schema';

const BCRYPT_ROUNDS = 10;

/** Hashed passwords never leave this file. The seed script uses this too. */
export const hashPassword = (plain: string): Promise<string> =>
  bcrypt.hash(plain, BCRYPT_ROUNDS);

/* ------------------------------- DTO mapping ------------------------------ */

/**
 * Turns a Mongo document into the JSON the API returns: ids become strings and
 * the password hash is dropped. Every response in this feature goes through
 * here, so a hash can never leak.
 */
const toDto = (doc: object): UserDto => {
  const raw = ('toObject' in doc && typeof (doc as { toObject?: () => object }).toObject === 'function'
    ? (doc as { toObject: () => Record<string, unknown> }).toObject()
    : doc) as Record<string, unknown>;

  return {
    _id: String(raw._id),
    name: raw.name as string,
    email: raw.email as string,
    role: raw.role as UserRole,
    avatar: raw.avatar as string,
    status: raw.status as UserDto['status'],
    createdAt: raw.createdAt as Date,
    updatedAt: raw.updatedAt as Date,
  };
};

/** "Alex Johnson" -> "AJ",  "Bob" -> "B",  "" -> "U" */
const initials = (value: string): string => {
  const parts = value.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return 'U';
  return parts.map((part) => part[0]).join('').slice(0, 2).toUpperCase();
};

/* --------------------------------- reads ---------------------------------- */

export const listUsers = async (query: PaginationQuery): Promise<PageDto<UserDto>> => {
  const page = await paginate<User>(UserModel, {}, listOptions(query));
  return { ...page, items: page.items.map((doc) => toDto(doc as object)) };
};

export const findUserById = async (id: string): Promise<UserDto> => {
  const user = await UserModel.findById(id).select('-password').lean().exec();
  if (!user) throw AppError.notFound('User not found');
  return toDto(user);
};

const emailTaken = async (email: string, exceptId?: string): Promise<boolean> => {
  const existing = await UserModel.findOne({
    email,
    ...(exceptId ? { _id: { $ne: exceptId } } : {}),
  })
    .select('_id')
    .lean()
    .exec();

  return existing !== null;
};

/* --------------------------------- writes --------------------------------- */

export const createUser = async (
  body: CreateUserBody,
  defaults: { role?: UserRole; status?: UserDto['status'] } = {},
): Promise<UserDto> => {
  if (await emailTaken(body.email)) {
    throw AppError.conflict('A user with this email already exists');
  }

  const user = await UserModel.create({
    name: body.name,
    email: body.email,
    // Passwords are always hashed here, never by the caller.
    password: await hashPassword(body.password),
    role: defaults.role ?? 'Team Member',
    // Derived from the name so it can never go stale.
    avatar: initials(body.name),
    status: defaults.status ?? 'offline',
  });

  return toDto(user);
};

/**
 * Updates the signed-in user's own profile. Renaming regenerates the avatar
 * initials so the two never drift apart.
 */
export const updateOwnProfile = async (userId: string, body: UpdateProfileBody): Promise<UserDto> => {
  if (body.email && (await emailTaken(body.email, userId))) {
    throw AppError.conflict('A user with this email already exists');
  }

  const update: Record<string, unknown> = { ...body };
  if (body.name && !body.avatar) update.avatar = initials(body.name);

  const user = await UserModel.findByIdAndUpdate(userId, update, {
    new: true,
    runValidators: true,
  })
    .select('-password')
    .exec();

  if (!user) throw AppError.notFound('User not found');
  return toDto(user);
};

/** Admin only: change another user's role and/or presence. */
export const updateUser = async (id: string, body: UpdateUserBody): Promise<UserDto> => {
  const user = await UserModel.findByIdAndUpdate(id, body, { new: true, runValidators: true })
    .select('-password')
    .exec();

  if (!user) throw AppError.notFound('User not found');
  return toDto(user);
};

export const deleteUser = async (id: string): Promise<void> => {
  const user = await UserModel.findByIdAndDelete(id).exec();
  if (!user) throw AppError.notFound('User not found');
};

/* ---------------------------------- auth ---------------------------------- */

/** Self-registration: always creates a Team Member and signs them straight in. */
export const register = async (body: RegisterBody): Promise<AuthDto> => {
  const user = await createUser(body, { role: 'Team Member', status: 'online' });
  return { user, token: generateToken(user._id, user.email, user.role) };
};

export const login = async (body: LoginBody): Promise<AuthDto> => {
  const user = await UserModel.findOne({ email: body.email }).select('+password').exec();

  // Always run a comparison, even for an unknown email, so "no such user" and
  // "wrong password" take the same amount of time to answer.
  const matches = await bcrypt.compare(
    body.password,
    user?.password ?? '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
  );

  if (!user || !matches) throw AppError.unauthorized('Invalid email or password');

  const dto = toDto(user);
  return { user: dto, token: generateToken(dto._id, dto.email, dto.role) };
};