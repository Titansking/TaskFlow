/**
 * Resets one user's password from the terminal, for when someone is locked out
 * and there is no mail delivery configured.
 *
 *   npm run reset-password -- <email> <new-password>
 */
import { connectDB, disconnectDB } from '../config';
import { UserModel } from '../users/users.model';
import { hashPassword } from '../users/users.service';

const [email, newPassword] = process.argv.slice(2);

if (!email || !newPassword) {
  console.error('Usage: npm run reset-password -- <email> <new-password>');
  console.error('Example: npm run reset-password -- sarah@taskflow.com newpass123');
  process.exit(1);
}

const resetPassword = async (): Promise<void> => {
  await connectDB();

  const user = await UserModel.findOne({ email }).select('+password').exec();
  if (!user) throw new Error(`No user found with email "${email}"`);

  user.password = await hashPassword(newPassword);
  await user.save();

  console.log(`Password updated for ${user.name} <${email}>`);
};

resetPassword()
  .catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());