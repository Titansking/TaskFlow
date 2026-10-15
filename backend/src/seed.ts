/**
 * Demo data. Wipes the four collections and repopulates them.
 *
 *   npm run seed
 *
 * Every seeded account uses the password `password123`.
 */
import { connectDB, disconnectDB } from './config';
import { ActivityModel } from './activities/activities.model';
import { ProjectModel } from './projects/projects.model';
import { TaskModel } from './tasks/tasks.model';
import { UserModel } from './users/users.model';
import type { UserRole, UserStatus } from './shared/types';
import { hashPassword } from './users/users.service';

const SEED_PASSWORD = process.env.SEED_PASSWORD ?? 'password123';

/** Same initials rule the API uses, so seeded data matches new signups. */
const initials = (name: string): string =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const seed = async (): Promise<void> => {
  await connectDB();
  console.log('[seed] clearing existing collections...');
  await Promise.all([
    ActivityModel.deleteMany({}),
    TaskModel.deleteMany({}),
    ProjectModel.deleteMany({}),
    UserModel.deleteMany({}),
  ]);

  console.log('[seed] inserting users, projects, tasks and activities...');

  /* --------------------------------- users -------------------------------- */

  const password = await hashPassword(SEED_PASSWORD);

  const users = await UserModel.create(
    ([
      { name: 'Alex Johnson', email: 'alex@taskflow.com', role: 'Admin', status: 'online' },
      { name: 'Sarah Chen', email: 'sarah@taskflow.com', role: 'Project Manager', status: 'online' },
      { name: 'Mike Williams', email: 'mike@taskflow.com', role: 'Team Member', status: 'away' },
      { name: 'Emma Davis', email: 'emma@taskflow.com', role: 'Team Member', status: 'offline' },
      { name: 'James Brown', email: 'james@taskflow.com', role: 'Team Member', status: 'online' },
    ] satisfies { name: string; email: string; role: UserRole; status: UserStatus }[]).map((user) => ({
      ...user,
      password,
      avatar: initials(user.name),
    })),
  );

  const userId = new Map(users.map((user) => [user.email, user._id]));

  /* ------------------------------- projects ------------------------------- */

  const projects = await ProjectModel.create([
    {
      name: 'Website Redesign',
      color: '#3b82f6',
      members: [userId.get('alex@taskflow.com'), userId.get('sarah@taskflow.com')],
    },
    {
      name: 'Mobile App',
      color: '#10b981',
      members: [userId.get('alex@taskflow.com'), userId.get('emma@taskflow.com')],
    },
    {
      name: 'Marketing Campaign',
      color: '#f59e0b',
      members: [
        userId.get('sarah@taskflow.com'),
        userId.get('mike@taskflow.com'),
        userId.get('james@taskflow.com'),
      ],
    },
  ]);

  const projectId = new Map(projects.map((project) => [project.name, project._id]));

  /* --------------------------------- tasks -------------------------------- */

  const tasks = await TaskModel.create([
    {
      title: 'Design homepage mockup',
      description: 'Create high-fidelity mockups for the new homepage',
      status: 'done',
      priority: 'high',
      projectId: projectId.get('Website Redesign'),
      assigneeId: userId.get('sarah@taskflow.com'),
      dueDate: new Date('2026-01-15'),
      tags: ['design', 'urgent'],
    },
    {
      title: 'Implement authentication',
      description: 'Set up JWT authentication with refresh tokens',
      status: 'in-progress',
      priority: 'high',
      projectId: projectId.get('Mobile App'),
      assigneeId: userId.get('alex@taskflow.com'),
      dueDate: new Date('2026-01-22'),
      tags: ['backend', 'security'],
    },
    {
      title: 'Write API documentation',
      description: 'Document all REST API endpoints',
      status: 'todo',
      priority: 'medium',
      projectId: projectId.get('Mobile App'),
      assigneeId: userId.get('emma@taskflow.com'),
      dueDate: new Date('2026-01-25'),
      tags: ['documentation'],
    },
    {
      title: 'Social media graphics',
      description: 'Create graphics for Q1 campaign',
      status: 'in-progress',
      priority: 'medium',
      projectId: projectId.get('Marketing Campaign'),
      assigneeId: userId.get('mike@taskflow.com'),
      dueDate: new Date('2026-01-20'),
      tags: ['design', 'marketing'],
    },
    {
      title: 'Database optimization',
      description: 'Optimize slow queries and add indexes',
      status: 'todo',
      priority: 'low',
      projectId: projectId.get('Mobile App'),
      assigneeId: userId.get('alex@taskflow.com'),
      dueDate: new Date('2026-01-28'),
      tags: ['backend', 'performance'],
    },
    {
      title: 'User testing sessions',
      description: 'Conduct 5 user testing sessions',
      status: 'todo',
      priority: 'high',
      projectId: projectId.get('Website Redesign'),
      assigneeId: userId.get('sarah@taskflow.com'),
      dueDate: new Date('2026-01-18'),
      tags: ['research', 'ux'],
    },
  ]);

  const taskId = new Map(tasks.map((task) => [task.title, task._id]));

  /* ------------------------------ activities ------------------------------ */

  await ActivityModel.create([
    {
      type: 'task_created',
      userId: userId.get('alex@taskflow.com'),
      taskId: taskId.get('Write API documentation'),
      message: "created task 'Write API documentation'",
      createdAt: new Date('2026-01-16T10:30:00'),
    },
    {
      type: 'task_updated',
      userId: userId.get('alex@taskflow.com'),
      taskId: taskId.get('Database optimization'),
      message: "moved task 'Database optimization' to To Do",
      createdAt: new Date('2026-01-16T09:15:00'),
    },
    {
      type: 'comment',
      userId: userId.get('mike@taskflow.com'),
      taskId: taskId.get('Social media graphics'),
      message: "added a comment on 'Social media graphics'",
      createdAt: new Date('2026-01-15T16:45:00'),
    },
    {
      type: 'member_joined',
      userId: userId.get('james@taskflow.com'),
      message: 'joined the team',
      createdAt: new Date('2026-01-15T14:00:00'),
    },
    {
      type: 'task_completed',
      userId: userId.get('james@taskflow.com'),
      taskId: taskId.get('Design homepage mockup'),
      message: "completed task 'Design homepage mockup'",
      createdAt: new Date('2026-01-14T11:20:00'),
    },
  ]);

  console.log(`[seed] done. Every seeded account uses the password "${SEED_PASSWORD}".`);
};

seed()
  .catch((error) => {
    console.error('[seed] failed:', error);
    process.exitCode = 1;
  })
  .finally(() => disconnectDB());