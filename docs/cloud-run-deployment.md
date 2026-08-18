# BUSAL OS on Google Cloud Run

Project: `busal2`  
Region: `europe-west2` (London)  
Service: `busal-web`

## First deployment

Install the [Google Cloud CLI](https://cloud.google.com/sdk/docs/install) and run:

```powershell
gcloud auth login
gcloud config set project busal2
gcloud services enable run.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com cloudscheduler.googleapis.com secretmanager.googleapis.com
gcloud run deploy busal-web --source . --region europe-west2 --allow-unauthenticated --port 8080 --memory 1Gi --cpu 1 --min-instances 1 --max-instances 10
```

Do not enter production secrets as source code or command-line arguments. In Cloud Run, add every required value from `cloudrun.env.example` using **Variables & Secrets**. Put sensitive values in Secret Manager and reference them from the service.

After adding variables/secrets, redeploy the service and note its `https://…run.app` URL. Set `NEXT_PUBLIC_APP_URL` to that URL for initial testing. Once your custom domain is connected, update it to `https://www.getbusal.com` and redeploy.

## Every-minute orchestration job

The existing `/api/cron/orchestration-queue?limit=25` endpoint requires `CRON_SECRET`. Create a Cloud Scheduler **HTTP** job with:

- Region: `europe-west2`
- Schedule: `* * * * *`
- Time zone: `Europe/London`
- URL: `https://YOUR_SERVICE_URL/api/cron/orchestration-queue?limit=25`
- Method: `GET`
- Header: `Authorization: Bearer YOUR_CRON_SECRET`

Restrict access to the scheduler job configuration to trusted operators because it contains the authorization header. Verify a run returns HTTP 200 before enabling production traffic.

## External configuration after testing

1. Update Supabase Auth Site URL and Redirect URLs for the Cloud Run/custom domain.
2. Add the domain to Google OAuth authorized redirect URIs.
3. Update Stripe webhook endpoint to `https://YOUR_DOMAIN/api/webhooks/stripe` and keep the matching signing secret in Secret Manager.
4. Point `www.getbusal.com` DNS at Cloud Run only after the temporary URL, auth, and Stripe webhooks have been verified.
