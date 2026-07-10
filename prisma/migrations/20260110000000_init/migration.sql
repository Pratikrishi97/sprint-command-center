-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateTable
CREATE TABLE "Sprint" (
    "id" TEXT NOT NULL,
    "number" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "startDate" TEXT NOT NULL,
    "endDate" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'active',
    "goals" TEXT NOT NULL DEFAULT '[]',
    "objectives" TEXT NOT NULL DEFAULT '[]',
    "retrospective" TEXT NOT NULL DEFAULT '',
    "lessonsLearned" TEXT NOT NULL DEFAULT '[]',
    "actionItems" TEXT NOT NULL DEFAULT '[]',
    "risks" TEXT NOT NULL DEFAULT '[]',
    "achievements" TEXT NOT NULL DEFAULT '[]',
    "documents" TEXT NOT NULL DEFAULT '[]',
    "capacity" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Sprint_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Employee" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'Engineer',
    "team" TEXT NOT NULL DEFAULT 'Core',
    "color" TEXT NOT NULL DEFAULT 'emerald',
    "avatarUrl" TEXT,
    "managerId" TEXT,
    "capacity" DOUBLE PRECISION NOT NULL DEFAULT 40,
    "availability" DOUBLE PRECISION NOT NULL DEFAULT 100,
    "timezone" TEXT NOT NULL DEFAULT 'Asia/Calcutta',
    "skills" TEXT NOT NULL DEFAULT '[]',
    "workingDays" TEXT NOT NULL DEFAULT '[1,2,3,4,5]',
    "leaves" TEXT NOT NULL DEFAULT '[]',
    "projects" TEXT NOT NULL DEFAULT '[]',
    "status" TEXT NOT NULL DEFAULT 'active',
    "joinedAt" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Employee_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Task" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "priority" TEXT NOT NULL DEFAULT 'medium',
    "severity" TEXT NOT NULL DEFAULT 'normal',
    "category" TEXT NOT NULL DEFAULT 'feature',
    "project" TEXT NOT NULL DEFAULT 'Core',
    "epic" TEXT NOT NULL DEFAULT '',
    "story" TEXT NOT NULL DEFAULT '',
    "sprintId" TEXT,
    "ownerId" TEXT,
    "startDate" TEXT NOT NULL DEFAULT '',
    "endDate" TEXT NOT NULL DEFAULT '',
    "expectedCompletion" TEXT NOT NULL DEFAULT '',
    "actualCompletion" TEXT NOT NULL DEFAULT '',
    "dependencies" TEXT NOT NULL DEFAULT '[]',
    "riskLevel" TEXT NOT NULL DEFAULT 'low',
    "businessImpact" TEXT NOT NULL DEFAULT 'medium',
    "status" TEXT NOT NULL DEFAULT 'not_started',
    "tags" TEXT NOT NULL DEFAULT '[]',
    "remarks" TEXT NOT NULL DEFAULT '',
    "links" TEXT NOT NULL DEFAULT '[]',
    "estimate" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "progress" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Task_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DailyUpdate" (
    "id" TEXT NOT NULL,
    "taskId" TEXT,
    "employeeId" TEXT NOT NULL,
    "sprintId" TEXT,
    "date" TEXT NOT NULL,
    "todayProgress" TEXT NOT NULL DEFAULT '',
    "yesterdayProgress" TEXT NOT NULL DEFAULT '',
    "tomorrowPlan" TEXT NOT NULL DEFAULT '',
    "percentage" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "hoursWorked" DOUBLE PRECISION NOT NULL DEFAULT 0,
    "blockers" TEXT NOT NULL DEFAULT '',
    "risks" TEXT NOT NULL DEFAULT '',
    "managerNotes" TEXT NOT NULL DEFAULT '',
    "dependencies" TEXT NOT NULL DEFAULT '',
    "expectedFinish" TEXT NOT NULL DEFAULT '',
    "confidence" TEXT NOT NULL DEFAULT 'medium',
    "mood" TEXT NOT NULL DEFAULT 'neutral',
    "accomplishments" TEXT NOT NULL DEFAULT '',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "DailyUpdate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Note" (
    "id" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'general',
    "sprintId" TEXT,
    "employeeId" TEXT,
    "taskId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Note_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Sprint_number_key" ON "Sprint"("number");

-- CreateIndex
CREATE UNIQUE INDEX "Employee_email_key" ON "Employee"("email");

-- AddForeignKey
ALTER TABLE "Employee" ADD CONSTRAINT "Employee_managerId_fkey" FOREIGN KEY ("managerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Task" ADD CONSTRAINT "Task_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyUpdate" ADD CONSTRAINT "DailyUpdate_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyUpdate" ADD CONSTRAINT "DailyUpdate_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DailyUpdate" ADD CONSTRAINT "DailyUpdate_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_sprintId_fkey" FOREIGN KEY ("sprintId") REFERENCES "Sprint"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_employeeId_fkey" FOREIGN KEY ("employeeId") REFERENCES "Employee"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task"("id") ON DELETE SET NULL ON UPDATE CASCADE;

