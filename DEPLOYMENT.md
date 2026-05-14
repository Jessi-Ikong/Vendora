# Deployment Guide - Vendora

## Render.com Deployment

### Step 1: Create PostgreSQL Database on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"PostgreSQL"**
3. Fill in the details:
   - **Name:** vendora-db (or your choice)
   - **Database:** vendora
   - **User:** (auto-generated)
   - **Region:** Choose closest to your location
   - **PostgreSQL Version:** 15 (or latest)
4. Click **"Create Database"**
5. ⚠️ **IMPORTANT:** Copy the **Internal Database URL** (it starts with `postgresql://`)
   - Do NOT use the External URL for the Node.js service

### Step 2: Create Web Service on Render

1. Go to https://dashboard.render.com
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository (Jessi-Ikong/Vendora)
4. Fill in the details:
   - **Name:** vendora (or your choice)
   - **Environment:** Node
   - **Build Command:** `npm install`
   - **Start Command:** `node backend/server.js`
   - **Region:** Same as database
5. Click **"Create Web Service"**

### Step 3: Configure Environment Variables

In the Render Dashboard, go to your Web Service → **Settings** → **Environment**

Add these variables:

```
NODE_ENV=production
PORT=3000
DATABASE_URL=[PASTE_INTERNAL_DATABASE_URL_HERE]
CORS_ORIGIN=https://your-deployed-url.onrender.com
JWT_SECRET=your_super_secret_jwt_key_change_this_in_production
JWT_EXPIRES_IN=7d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
PAYSTACK_SECRET_KEY=your_paystack_secret_key
PAYSTACK_PUBLIC_KEY=your_paystack_public_key
EMAIL_HOST=smtp-relay.brevo.com
EMAIL_PORT=465
EMAIL_USER=your_email_user
EMAIL_PASS=your_email_pass
FRONTEND_URL=https://your-frontend-url.com
```

### Step 4: Run Database Migrations (if needed)

Once deployed, you may need to run the SQL schema. SSH into Render or use a PostgreSQL client to run:

```sql
-- Run the contents of backend/database/schema.sql
```

### Step 5: Verify Deployment

- Check the Render logs to ensure no errors
- Visit `https://your-app.onrender.com/` (should show welcome message)
- Test login at your frontend URL

---

## Local Development

For local development, the app uses individual DB environment variables from `.env`:

```
DB_HOST=localhost
DB_PORT=5432
DB_NAME=vendora
DB_USER=postgres
DB_PASSWORD=your_password
```

---

## Common Issues

### ❌ "self-signed certificate in certificate chain"

**Fix:** Make sure `NODE_ENV=production` is set on Render. The app automatically enables SSL with `rejectUnauthorized: false` in production.

### ❌ "Cannot find module..."

**Fix:** Ensure `npm install` ran successfully. Check Render build logs.

### ❌ "Invalid JWT token"

**Fix:** Make sure `JWT_SECRET` is the same on Render as in your local `.env` (or regenerate tokens after deploying).

### ❌ Frontend can't reach API

**Fix:** Update `CORS_ORIGIN` to your actual frontend URL and ensure `FRONTEND_URL` is set correctly.

---

## Security Checklist Before Deployment

✅ Change `JWT_SECRET` to a strong random value  
✅ Use strong passwords for all services  
✅ Never commit `.env` with secrets to GitHub  
✅ Set `NODE_ENV=production` on Render  
✅ Enable HTTPS (Render does this automatically)  
✅ Keep sensitive keys in environment variables only  
✅ Review CORS_ORIGIN for production domain

---

## Monitoring

In Render Dashboard:

- View **Logs** for real-time errors
- Check **Metrics** for CPU/Memory usage
- Set up **Email Alerts** for deployment failures

---

## Questions?

Refer to:

- [Render PostgreSQL Docs](https://render.com/docs/postgres)
- [Render Node.js Docs](https://render.com/docs/deploy-node)
- [pg SSL Documentation](https://node-postgres.com/apis/client#constructor)
