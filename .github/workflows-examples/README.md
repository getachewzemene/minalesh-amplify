# GitHub Actions Workflow Examples

This directory contains example GitHub Actions workflows for the Minalesh application.

## Background Workers Workflow

The `background-workers.yml.example` file contains a GitHub Actions workflow that runs the background workers on a schedule.

### Setup Instructions

1. **Copy the example file to the workflows directory:**
   ```bash
   cp .github/workflows-examples/background-workers.yml.example .github/workflows/background-workers.yml
   ```

2. **Add required secrets to your GitHub repository:**
   - Go to Settings → Secrets and variables → Actions
   - Add the following secrets:
     - `CRON_SECRET` - Your cron authentication secret (same as in your .env)
     - `APP_URL` - Your production application URL (e.g., `https://minalesh.vercel.app`)

3. **Enable GitHub Actions:**
   - Go to Actions tab in your repository
   - Enable workflows if they're disabled

4. **Test the workflow:**
   - Go to Actions tab
   - Select "Background Workers"
   - Click "Run workflow" to manually trigger it
   - Check the logs to verify it's working

### Schedule

The workflow runs on the following schedule:
- Email queue processing: Every 2 minutes
- Webhook retry: Every 10 minutes
- Inventory cleanup: Every 5 minutes

### Monitoring

- Check the Actions tab to see workflow runs
- Each run shows the curl response from the API endpoint
- Failed runs will appear in red and can trigger notifications

### Notes

- GitHub Actions cron schedules use UTC timezone
- Schedules may have a delay of up to 15 minutes during high load
- For more precise timing, consider using Vercel Cron or a dedicated cron service
- The `-f` flag in curl makes it fail on HTTP errors, which will mark the job as failed

### Alternative: Vercel Cron

If you're deploying to Vercel, it's recommended to use Vercel Cron instead:
1. Copy `vercel.json.example` to `vercel.json`
2. Deploy to Vercel
3. Cron jobs will run automatically

See `docs/BACKGROUND_WORKERS.md` for more deployment options.
