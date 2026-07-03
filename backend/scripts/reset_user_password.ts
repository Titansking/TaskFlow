import dotenv from 'dotenv';
import connectDB from '../config/database';
import User from '../models/User';
import bcrypt from 'bcryptjs';

dotenv.config();

// To run this script: npx ts-node scripts/reset_user_password.ts <user_email> <new_password>
const args = process.argv.slice(2);

if (args.length < 2) {
  console.log('Usage: npx ts-node scripts/reset_user_password.ts <email> <new_password>');
  console.log('Example: npx ts-node scripts/reset_user_password.ts sarah@taskflow.com mynewpassword123');
  process.exit(1);
}

const email = args[0];
const newPassword = args[1];

const resetPassword = async () => {
  try {
    await connectDB();
    
    const user = await User.findOne({ email });
    if (!user) {
      console.error(`❌ Error: User with email "${email}" not found.`);
      process.exit(1);
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    user.password = hashedPassword;
    await user.save();

    console.log(`\n✅ Success: Password for user "${user.name}" (${email}) has been updated!`);
    console.log(`🔐 New hashed password saved in database: ${hashedPassword}`);
    process.exit(0);
  } catch (error) {
    console.error('❌ Error resetting password:', error);
    process.exit(1);
  }
};

resetPassword();
