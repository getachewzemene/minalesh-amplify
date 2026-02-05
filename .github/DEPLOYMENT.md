# GitHub Actions Deployment for Demo

This repository is configured with GitHub Actions workflows to build, test, and deploy the Minalesh application for demo purposes.

## Available Workflows

### 1. Build and Test (`build-test.yml`)

**Purpose:** Continuous Integration workflow that builds and tests the application on every push and pull request.

**Triggers:**
- Push to `main` or `develop` branches
- Pull requests to `main` or `develop` branches
- Manual trigger via workflow dispatch

**What it does:**
- Runs ESLint to check code quality
- Runs unit and integration tests
- Builds the Next.js application
- Uploads build artifacts (available for 7 days)

**Usage:**
This workflow runs automatically on pushes and PRs. No configuration needed!

You can also run it manually:
1. Go to the "Actions" tab in GitHub
2. Select "Build and Test" workflow
3. Click "Run workflow"

---

### 2. Deploy Demo to Vercel (`deploy-demo.yml`)

**Purpose:** Automatically deploy the application to Vercel for live demo purposes.

**Triggers:**
- Push to `main` branch (production deployment)
- Pull requests to `main` branch (preview deployment)
- Manual trigger via workflow dispatch

**What it does:**
- Builds the Next.js application
- Deploys to Vercel (preview or production based on context)
- Comments on PRs with preview URL
- Provides deployment summary

**Setup Required:**

To enable Vercel deployment, you need to configure the following secret:

1. **Create a Vercel account** (if you don't have one):
   - Visit https://vercel.com and sign up

2. **Create a Vercel token**:
   - Go to https://vercel.com/account/tokens
   - Create a new token with appropriate permissions
   - Copy the token

3. **Add token to GitHub secrets**:
   - Go to your repository on GitHub
   - Navigate to Settings → Secrets and variables → Actions
   - Click "New repository secret"
   - Name: `VERCEL_TOKEN`
   - Value: Paste your Vercel token
   - Click "Add secret"

4. **Link your repository to Vercel** (if not already linked):
   - Go to Vercel dashboard
   - Import your GitHub repository
   - Complete the project setup
   - The workflow will use this connection for deployments

**Without Configuration:**

If `VERCEL_TOKEN` is not configured, the workflow will skip deployment and show a helpful warning message with setup instructions.

---

## Demo Access

Once deployed to Vercel, your demo will be available at:

- **Production:** Your Vercel production URL (e.g., `https://minalesh-amplify.vercel.app`)
- **Preview:** Unique URLs for each PR (automatically commented on the PR)

---

## Build Artifacts

Every successful build creates artifacts that can be downloaded:

1. Go to the "Actions" tab
2. Click on a completed workflow run
3. Scroll down to "Artifacts"
4. Download `build-output` to get the built application files

---

## Manual Deployment

You can trigger deployments manually:

1. Go to the "Actions" tab
2. Select "Deploy Demo to Vercel" workflow
3. Click "Run workflow"
4. Select the branch to deploy
5. Click "Run workflow" button

---

## Troubleshooting

### Build Fails

- Check the workflow logs for specific error messages
- Ensure all required dependencies are in `package.json`
- Make sure TypeScript has no type errors

### Deployment Fails

- Verify `VERCEL_TOKEN` is correctly configured
- Check that your Vercel project is properly linked
- Review Vercel dashboard for any project-specific issues

### Tests Fail

- Run tests locally: `npm test`
- Fix any failing tests before pushing
- Check if environment variables are needed for tests

---

## Additional Information

For more advanced CI/CD configuration examples, check:
- `.github/workflows-examples/ci-cd.yml.example` - Full CI/CD pipeline with staging and production
- `.github/workflows-examples/background-workers.yml.example` - Automated background job execution

---

## Support

For issues or questions:
1. Check the workflow logs in the Actions tab
2. Review this documentation
3. Check Vercel documentation: https://vercel.com/docs
4. Review Next.js deployment docs: https://nextjs.org/docs/deployment
