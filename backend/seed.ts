import dotenv from 'dotenv';
import connectDB from './config/database';
import User from './models/User';
import Project from './models/Project';
import Task from './models/Task';
import Activity from './models/Activity';
import bcrypt from 'bcryptjs'; // Import bcrypt to hash passwords

dotenv.config();

// Main seed function to populate the database with initial mock data
const seedData = async () => {
  try {
    // 1. Establish connection to the database
    await connectDB();
    
    // 2. Clear out any existing data to start fresh
    console.log('Clearing existing data...');
    await User.deleteMany({});
    await Project.deleteMany({});
    await Task.deleteMany({});
    await Activity.deleteMany({});
    
    // 3. Create a secure default password for all seeded users
    console.log('Hashing default password for seeded users...');
    const salt = await bcrypt.genSalt(10);
    const defaultPassword = await bcrypt.hash('password123', salt);
    
    console.log('Seeding Users...');
    const users = await User.create([
      { name: "Alex Johnson", email: "alex@taskflow.com", role: "Admin", avatar: "AJ", status: "online", password: defaultPassword },
      { name: "Sarah Chen", email: "sarah@taskflow.com", role: "Project Manager", avatar: "SC", status: "online", password: defaultPassword },
      { name: "Mike Williams", email: "mike@taskflow.com", role: "Team Member", avatar: "MW", status: "away", password: defaultPassword },
      { name: "Emma Davis", email: "emma@taskflow.com", role: "Team Member", avatar: "ED", status: "offline", password: defaultPassword },
      { name: "James Brown", email: "james@taskflow.com", role: "Team Member", avatar: "JB", status: "online", password: defaultPassword },
    ]);
    
    const userMap = new Map(users.map(u => [u.email, u._id]));
    const getUserId = (email: string) => userMap.get(email);

    console.log('Seeding Projects...');
    const projects = await Project.create([
      { name: "Website Redesign", color: "#3b82f6", members: [getUserId("alex@taskflow.com"), getUserId("sarah@taskflow.com"), getUserId("mike@taskflow.com")] },
      { name: "Mobile App", color: "#10b981", members: [getUserId("alex@taskflow.com"), getUserId("emma@taskflow.com")] },
      { name: "Marketing Campaign", color: "#f59e0b", members: [getUserId("sarah@taskflow.com"), getUserId("mike@taskflow.com"), getUserId("james@taskflow.com")] },
    ]);
    
    const projectMap = new Map(projects.map(p => [p.name, p._id]));
    const getProjectId = (name: string) => projectMap.get(name);

    console.log('Seeding Tasks...');
    await Task.create([
      { title: "Design homepage mockup", description: "Create high-fidelity mockups for the new homepage", status: "done", priority: "high", projectId: getProjectId("Website Redesign"), assigneeId: getUserId("sarah@taskflow.com"), dueDate: new Date("2026-01-15"), tags: ["design", "urgent"] },
      { title: "Implement authentication", description: "Set up JWT authentication with refresh tokens", status: "in-progress", priority: "high", projectId: getProjectId("Mobile App"), assigneeId: getUserId("alex@taskflow.com"), dueDate: new Date("2026-01-22"), tags: ["backend", "security"] },
      { title: "Write API documentation", description: "Document all REST API endpoints", status: "todo", priority: "medium", projectId: getProjectId("Mobile App"), assigneeId: getUserId("emma@taskflow.com"), dueDate: new Date("2026-01-25"), tags: ["documentation"] },
      { title: "Social media graphics", description: "Create graphics for Q1 campaign", status: "in-progress", priority: "medium", projectId: getProjectId("Marketing Campaign"), assigneeId: getUserId("mike@taskflow.com"), dueDate: new Date("2026-01-20"), tags: ["design", "marketing"] },
      { title: "Database optimization", description: "Optimize slow queries and add indexes", status: "todo", priority: "low", projectId: getProjectId("Mobile App"), assigneeId: getUserId("alex@taskflow.com"), dueDate: new Date("2026-01-28"), tags: ["backend", "performance"] },
      { title: "User testing sessions", description: "Conduct 5 user testing sessions", status: "todo", priority: "high", projectId: getProjectId("Website Redesign"), assigneeId: getUserId("sarah@taskflow.com"), dueDate: new Date("2026-01-18"), tags: ["research", "ux"] },
      { title: "Email newsletter template", description: "Design responsive email template", status: "done", priority: "medium", projectId: getProjectId("Marketing Campaign"), assigneeId: getUserId("james@taskflow.com"), dueDate: new Date("2026-01-14"), tags: ["design", "email"] },
      { title: "Bug fixes for checkout", description: "Fix reported bugs in checkout flow", status: "in-progress", priority: "high", projectId: getProjectId("Website Redesign"), assigneeId: getUserId("emma@taskflow.com"), dueDate: new Date("2026-01-19"), tags: ["bug", "frontend"] },
    ]);

    // Need to fetch tasks again to get IDs for activities if needed, but for now we'll just skip referencing specific task IDs in activities or pick random ones from the created array if necessary.
    // The previous mocked activities had task IDs, let's try to map them if possible or just create generic ones.
    
    console.log('Seeding Activities...');
    await Activity.create([
      { type: "task_created", userId: getUserId("alex@taskflow.com"), message: "created task 'Bug fixes for checkout'", timestamp: new Date("2026-01-16T10:30:00") },
      { type: "task_updated", userId: getUserId("alex@taskflow.com"), message: "moved task to In Progress", timestamp: new Date("2026-01-16T09:15:00") },
      { type: "comment", userId: getUserId("mike@taskflow.com"), message: "added a comment on 'Social media graphics'", timestamp: new Date("2026-01-15T16:45:00") },
      { type: "member_joined", userId: getUserId("james@taskflow.com"), message: "joined the team", timestamp: new Date("2026-01-15T14:00:00") },
      { type: "task_completed", userId: getUserId("james@taskflow.com"), message: "completed task 'Email newsletter template'", timestamp: new Date("2026-01-14T11:20:00") },
    ]);

    console.log('Database seeded successfully!');
    process.exit(0);
  } catch (error) {
    console.error('Error seeding database:', error);
    process.exit(1);
  }
};

seedData();
