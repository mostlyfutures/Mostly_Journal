# Suggested Commands for MostlyJournal Development

## Initial Setup Commands
```bash
# Create Next.js project with TypeScript
npx create-next-app@latest my-journal-app --ts --eslint --tailwind --src-dir --app --import-alias "@/*"

# Navigate to project directory
cd my-journal-app

# Install required dependencies
npm install @privy-io/react-auth @siwe/viem viem @tableland/sdk @tanstack/react-query zustand

# Create directory structure
mkdir -p src/{lib,components,hooks,services}
```

## Development Commands
```bash
# Start development server
npm run dev

# Build for production
npm run build

# Start production server
npm start

# Run linting
npm run lint

# Fix linting issues
npm run lint -- --fix
```

## Git Commands for Version Control
```bash
# Initialize git repository
git init

# Add all files
git add .

# Commit changes (use after each development step)
git commit -m "Step X complete"

# Push to remote repository
git push origin main
```

## Testing and Quality Commands
```bash
# Run type checking
npx tsc --noEmit

# Format with Prettier (if configured)
npx prettier --write .

# Check for unused dependencies
npx depcheck
```

## Deployment Commands
```bash
# Deploy to Vercel
npx vercel --prod

# Login to Vercel (first time)
npx vercel login
```

## System Utilities (macOS)
```bash
# List directory contents
ls -la

# Find files
find . -name "*.ts" -type f

# Search in files
grep -r "searchterm" src/

# View file contents
cat filename.txt

# Edit files
code filename.txt

# Process management
ps aux | grep node
kill -9 <pid>
```