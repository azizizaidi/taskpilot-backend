import bcrypt from "bcrypt";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const password = "password123";

async function main() {
  const hashedPassword = await bcrypt.hash(password, 10);

  await prisma.activityLog.deleteMany();
  await prisma.taskComment.deleteMany();
  await prisma.task.deleteMany();
  await prisma.projectMember.deleteMany();
  await prisma.project.deleteMany();
  await prisma.user.deleteMany();

  const admin = await prisma.user.create({
    data: {
      name: "Admin User",
      email: "admin@taskpilot.com",
      password: hashedPassword,
      role: "ADMIN",
      avatar: "https://ui-avatars.com/api/?name=Admin+User"
    }
  });

  const member = await prisma.user.create({
    data: {
      name: "Member User",
      email: "member@taskpilot.com",
      password: hashedPassword,
      role: "MEMBER",
      avatar: "https://ui-avatars.com/api/?name=Member+User"
    }
  });

  const designer = await prisma.user.create({
    data: {
      name: "Sara Designer",
      email: "sara@taskpilot.com",
      password: hashedPassword,
      role: "MEMBER",
      avatar: "https://ui-avatars.com/api/?name=Sara+Designer"
    }
  });

  const websiteProject = await prisma.project.create({
    data: {
      title: "Company Website Redesign",
      description: "Refresh the public website with a cleaner layout and faster pages.",
      status: "ACTIVE",
      priority: "HIGH",
      ownerId: admin.id,
      startDate: new Date("2026-05-01"),
      dueDate: new Date("2026-05-20"),
      members: {
        create: [
          {
            userId: admin.id,
            roleInProject: "MANAGER"
          },
          {
            userId: member.id,
            roleInProject: "DEVELOPER"
          },
          {
            userId: designer.id,
            roleInProject: "DEVELOPER"
          }
        ]
      }
    }
  });

  const mobileProject = await prisma.project.create({
    data: {
      title: "Mobile App Planning",
      description: "Prepare early requirements and task breakdown for the mobile app.",
      status: "PLANNING",
      priority: "MEDIUM",
      ownerId: admin.id,
      startDate: new Date("2026-05-10"),
      dueDate: new Date("2026-06-10"),
      members: {
        create: [
          {
            userId: admin.id,
            roleInProject: "MANAGER"
          },
          {
            userId: member.id,
            roleInProject: "VIEWER"
          }
        ]
      }
    }
  });

  const homepageTask = await prisma.task.create({
    data: {
      projectId: websiteProject.id,
      assignedToId: designer.id,
      createdById: admin.id,
      title: "Design homepage layout",
      description: "Create a responsive homepage layout for desktop and mobile.",
      status: "IN_PROGRESS",
      priority: "HIGH",
      dueDate: new Date("2026-05-09")
    }
  });

  const apiTask = await prisma.task.create({
    data: {
      projectId: websiteProject.id,
      assignedToId: member.id,
      createdById: admin.id,
      title: "Build project API endpoints",
      description: "Prepare REST endpoints for project listing and project detail.",
      status: "TODO",
      priority: "MEDIUM",
      dueDate: new Date("2026-05-12")
    }
  });

  const planningTask = await prisma.task.create({
    data: {
      projectId: mobileProject.id,
      assignedToId: member.id,
      createdById: admin.id,
      title: "Write feature requirements",
      description: "List the core mobile app features and acceptance criteria.",
      status: "REVIEW",
      priority: "MEDIUM",
      dueDate: new Date("2026-05-18")
    }
  });

  await prisma.taskComment.createMany({
    data: [
      {
        taskId: homepageTask.id,
        userId: designer.id,
        comment: "Initial wireframe is ready for review."
      },
      {
        taskId: apiTask.id,
        userId: member.id,
        comment: "I will start with the project list endpoint."
      },
      {
        taskId: planningTask.id,
        userId: admin.id,
        comment: "Please keep the requirements short and demo-friendly."
      }
    ]
  });

  await prisma.activityLog.createMany({
    data: [
      {
        userId: admin.id,
        projectId: websiteProject.id,
        action: "PROJECT_CREATED",
        description: "Admin User created Company Website Redesign."
      },
      {
        userId: admin.id,
        projectId: mobileProject.id,
        action: "PROJECT_CREATED",
        description: "Admin User created Mobile App Planning."
      },
      {
        userId: designer.id,
        projectId: websiteProject.id,
        taskId: homepageTask.id,
        action: "COMMENT_CREATED",
        description: "Sara Designer commented on Design homepage layout."
      }
    ]
  });

  console.log("Seed completed successfully.");
  console.log("Demo accounts:");
  console.log("Admin: admin@taskpilot.com / password123");
  console.log("Member: member@taskpilot.com / password123");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
