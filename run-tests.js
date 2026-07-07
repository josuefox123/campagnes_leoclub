const { execSync } = require('child_process');

try {
  const output = execSync('npx playwright test --headed=false', { encoding: 'utf-8' });
  console.log(output);
} catch (e) {
  console.log(e.stdout);
  console.error(e.stderr);
}
