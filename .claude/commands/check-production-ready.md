# Check Production Ready

Verify that production deployment is complete and ready for testing.

## What it does

Checks Google Cloud Build status to ensure:
- No active builds are running
- Latest deployment has completed successfully
- Production URL is responding
- No pending deployments in queue

## When to use

Use this command before running `/test-production` to ensure:
- Deployment pipeline has finished
- All services are fully deployed
- No builds are in progress
- Safe to run comprehensive tests

## What it checks

1. **Cloud Build Status** - Verify no active builds
2. **Deployment Status** - Check latest deployment completed
3. **Service Health** - Ping production URL
4. **Build History** - Review recent build results

## Implementation

When invoked, run these checks:

```bash
# Check Cloud Build status
gcloud builds list --limit=5 --format="table(id,status,createTime.date())"

# Check Cloud Run service status
gcloud run services describe taks-pilot --region=europe-west1 --format="value(status.url,status.conditions[0].status)"

# Ping production URL
curl -s -o /dev/null -w "%{http_code}" https://takspilot-728214876651.europe-west1.run.app/
```

## Success criteria

- ✅ No builds with status "WORKING" or "QUEUED"
- ✅ Latest build status is "SUCCESS"
- ✅ Cloud Run service is "True" (ready)
- ✅ Production URL returns 200 status code

## Example output

```
BUILD_ID                                    STATUS     CREATE_TIME
f8a9c3d2-1234-5678-90ab-cdef12345678       SUCCESS    2025-01-27
e7b8c2d1-1234-5678-90ab-cdef12345677       SUCCESS    2025-01-27

Service URL: https://takspilot-728214876651.europe-west1.run.app
Service Ready: True

Production URL Status: 200

✅ Production is ready for testing! Run /test-production to begin comprehensive QA.
```

## If not ready

If builds are still running:
```
⏳ Build in progress: f8a9c3d2-1234-5678-90ab-cdef12345678
Status: WORKING
Started: 2025-01-27T10:15:00

Please wait for build to complete before testing.
Check again in a few minutes with /check-production-ready
```