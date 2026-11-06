-- Users created before onboarding existed skip the welcome flow.
UPDATE "User" SET "onboardingCompleted" = true;
