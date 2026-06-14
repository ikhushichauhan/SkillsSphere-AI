import assert from "node:assert/strict";
import test from "node:test";
import { updatePreferencesSchema, updateProfileSchema } from "../users.validation.js";

test("updateProfileSchema accepts bare company website domains", () => {
  const result = updateProfileSchema.safeParse({
    name: "Recruiter User",
    companyWebsite: "example.com",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.companyWebsite, "example.com");
});

test("updateProfileSchema accepts www company website domains", () => {
  const result = updateProfileSchema.safeParse({
    name: "Recruiter User",
    companyWebsite: "www.example.com",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.companyWebsite, "www.example.com");
});

test("updateProfileSchema accepts full https company website URLs", () => {
  const result = updateProfileSchema.safeParse({
    name: "Recruiter User",
    companyWebsite: "https://example.com",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.companyWebsite, "https://example.com");
});

test("updateProfileSchema rejects invalid company website strings", () => {
  const result = updateProfileSchema.safeParse({
    name: "Recruiter User",
    companyWebsite: "not a website",
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "companyWebsite");
  assert.equal(result.error.issues[0].message, "Invalid URL");
});

test("updateProfileSchema keeps empty company website values valid for clearing profile data", () => {
  const result = updateProfileSchema.safeParse({
    name: "Recruiter User",
    companyWebsite: "",
  });

  assert.equal(result.success, true);
  assert.equal(result.data.companyWebsite, "");
});

test("updatePreferencesSchema accepts valid nested preference payloads", () => {
  const result = updatePreferencesSchema.safeParse({
    notifications: {
      emailNotifications: false,
      inAppNotifications: true,
      interviewReminders: true,
      jobUpdates: false,
      resumeAnalysis: true,
      systemAlerts: true,
    },
    emailFrequency: "daily",
    privacy: {
      profileVisibility: "private",
      showResumeToRecruiters: false,
      showInterviewHistory: true,
      allowPersonalizedRecommendations: false,
    },
  });

  assert.equal(result.success, true);
  assert.equal(result.data.privacy.profileVisibility, "private");
  assert.equal(result.data.privacy.showResumeToRecruiters, false);
  assert.equal(result.data.privacy.allowPersonalizedRecommendations, false);
});

test("updatePreferencesSchema rejects invalid profile visibility values", () => {
  const result = updatePreferencesSchema.safeParse({
    privacy: {
      profileVisibility: "everyone",
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "privacy.profileVisibility");
});

test("updatePreferencesSchema rejects invalid privacy value types", () => {
  const result = updatePreferencesSchema.safeParse({
    privacy: {
      showResumeToRecruiters: "yes",
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "privacy.showResumeToRecruiters");
});

test("updatePreferencesSchema rejects unknown privacy fields", () => {
  const result = updatePreferencesSchema.safeParse({
    privacy: {
      profileVisibility: "public",
      shareEmailWithRecruiters: true,
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "privacy");
  assert.match(result.error.issues[0].message, /unrecognized key/i);
});

test("updatePreferencesSchema rejects unknown notification fields", () => {
  const result = updatePreferencesSchema.safeParse({
    notifications: {
      jobUpdates: true,
      smsNotifications: true,
    },
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "notifications");
  assert.match(result.error.issues[0].message, /unrecognized key/i);
});

test("updatePreferencesSchema rejects unknown top-level preference fields", () => {
  const result = updatePreferencesSchema.safeParse({
    emailFrequency: "weekly",
    theme: "dark",
  });

  assert.equal(result.success, false);
  assert.equal(result.error.issues[0].path.join("."), "");
  assert.match(result.error.issues[0].message, /unrecognized key/i);
});
