/**
 * Standard Market Benchmarks for different tech roles.
 * Used when no Job Description is provided to give students a "Market Readiness" score.
 */
export const roleBenchmarks = {
  "frontend developer": [
    "React", "JavaScript", "HTML", "CSS", "TypeScript", 
    "Redux", "Tailwind CSS", "Vite", "Next.js", "Jest"
  ],
  "backend developer": [
    "Node.js", "Express", "MongoDB", "SQL", "PostgreSQL", 
    "Redis", "Docker", "REST API", "Microservices", "Jest"
  ],
  "full stack developer": [
    "React", "Node.js", "JavaScript", "MongoDB", "Express", 
    "REST API", "Git", "Docker", "AWS", "TypeScript"
  ],
  "data scientist": [
    "Python", "R", "SQL", "Pandas", "NumPy", 
    "Scikit-learn", "TensorFlow", "PyTorch", "Data Visualization", "Statistics"
  ],
  "mobile developer": [
    "React Native", "Flutter", "Swift", "Kotlin", "Java", 
    "Firebase", "SQLite", "App Store Deployment", "Mobile UX", "Dart"
  ],
  "devops engineer": [
    "Docker", "Kubernetes", "AWS", "CI/CD", "Jenkins", 
    "Terraform", "Linux", "Nginx", "Monitoring", "Shell Scripting"
  ],
  "qa engineer": [
    "Selenium", "Cypress", "Jest", "Automated Testing", "Unit Testing", 
    "Integration Testing", "Bug Reporting", "Load Testing", "Postman", "CI/CD"
  ]
};

/**
 * Get benchmark skills for a detected role
 * Fallback to Full Stack if role is unknown
 */
export const getBenchmarkForRole = (role) => {
  const normalizedRole = role?.toLowerCase().trim();
  return roleBenchmarks[normalizedRole] || roleBenchmarks["full stack developer"];
};
