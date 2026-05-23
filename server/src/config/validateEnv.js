const requiredVars = [
  { name: "JWT_SECRET", description: "Secret key for signing JWT tokens" },
];

export const validateEnv = () => {
  const missing = [];

  for (const v of requiredVars) {
    const hasPrimary = Boolean(process.env[v.name]);
    const hasAlt = v.altName && Boolean(process.env[v.altName]);
    if (!hasPrimary && !hasAlt) {
      missing.push(`${v.name}${v.altName ? ` (or ${v.altName})` : ""}: ${v.description}`);
    }
  }

  if (missing.length > 0) {
    console.error("FATAL: Missing required environment variables:");
    for (const m of missing) {
      console.error(`  - ${m}`);
    }
    console.error("\nCreate server/.env and set the above variables.");
    process.exit(1);
  }
};

export default validateEnv;