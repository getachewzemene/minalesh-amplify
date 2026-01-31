# Quick Start Guide: GitHub Actions Demo Deployment

This guide will help you get your demo deployment up and running in less than 5 minutes!

## Option 1: Automatic Build (No Setup Required)

Every time you push code or create a pull request, GitHub Actions will automatically:
- ✅ Lint your code
- ✅ Run tests
- ✅ Build the application
- ✅ Upload build artifacts

**That's it! No configuration needed.**

You can view the build status and download artifacts from the "Actions" tab in GitHub.

---

## Option 2: Auto-Deploy to Vercel (5-Minute Setup)

Want automatic deployments to a live URL? Follow these simple steps:

### Step 1: Get Your Vercel Token (2 minutes)

1. Go to [https://vercel.com](https://vercel.com) and sign in (or create a free account)
2. Click your avatar → Settings → Tokens
3. Click "Create Token"
4. Name it "GitHub Actions" and click "Create"
5. Copy the token (you'll need it in the next step)

### Step 2: Add Token to GitHub (1 minute)

1. Go to your GitHub repository
2. Click Settings → Secrets and variables → Actions
3. Click "New repository secret"
4. Name: `VERCEL_TOKEN`
5. Value: Paste your token from Step 1
6. Click "Add secret"

### Step 3: Link Vercel Project (2 minutes)

1. Go to [Vercel Dashboard](https://vercel.com/dashboard)
2. Click "Add New..." → Project
3. Import your GitHub repository
4. Configure environment variables (see below)
5. Click "Deploy"

**Environment Variables for Vercel:**
```
DATABASE_URL=<your-database-url>
NEXTAUTH_URL=<your-vercel-url>
NEXTAUTH_SECRET=<random-secret-string>
JWT_SECRET=<random-secret-string>
```

### Step 4: Done! 🎉

That's it! Now:
- ✅ Every push to `main` deploys to production
- ✅ Every PR gets a unique preview URL
- ✅ Preview URLs are automatically commented on PRs
- ✅ Build status shows on GitHub

---

## Manual Deployment

Want to deploy manually?

1. Go to "Actions" tab
2. Click "Deploy Demo to Vercel"
3. Click "Run workflow"
4. Select your branch
5. Click "Run workflow" button

Your deployment will start immediately!

---

## Troubleshooting

### Build Fails

**Problem:** The build workflow is failing

**Solution:**
1. Check the workflow logs in the "Actions" tab
2. Look for the specific error message
3. Fix the error in your code
4. Push the fix - the workflow will run again automatically

### Deployment Fails

**Problem:** Vercel deployment is failing

**Solutions:**
- Verify `VERCEL_TOKEN` is correctly set in repository secrets
- Check that your Vercel project is linked to the GitHub repository
- Review environment variables in Vercel dashboard
- Check Vercel logs for specific errors

### No Deployment Happening

**Problem:** Code pushed but no deployment

**Solutions:**
- Verify you pushed to the `main` branch (deployments only trigger on main)
- Check if `VERCEL_TOKEN` secret is set
- Go to Actions tab and check if workflow ran
- Look for error messages in the workflow logs

---

## Getting Help

- 📚 [Full Deployment Documentation](DEPLOYMENT.md)
- 📚 [Main README](../README.md)
- 🔧 [Workflow Files](.github/workflows/)
- 📖 [Vercel Documentation](https://vercel.com/docs)
- 📖 [GitHub Actions Documentation](https://docs.github.com/en/actions)

---

## What's Next?

Once your demo is deployed:
1. ✅ Share the URL with stakeholders
2. ✅ Monitor deployments in the Actions tab
3. ✅ Review preview deployments for PRs
4. ✅ Configure custom domain in Vercel (optional)
5. ✅ Set up monitoring and alerts (optional)

**Happy deploying! 🚀**
