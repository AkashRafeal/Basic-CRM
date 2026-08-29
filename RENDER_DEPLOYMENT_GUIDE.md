# Basic CRM - Render.com Backend Deployment Guide

This guide walks you through deploying your **Basic CRM backend** to **Render.com** connected to your live **Supabase PostgreSQL database**.

---

## Step 1: Push Project to GitHub

If you haven't pushed your repository yet, initialize Git and push:

```bash
git init
git add .
git commit -m "Configure Render.com deployment with Supabase PostgreSQL"
git branch -M main
git remote add origin https://github.com/<YOUR_GITHUB_USERNAME>/<YOUR_REPOSITORY_NAME>.git
git push -u origin main
```

---

## Step 2: Deploy on Render.com

1. Go to **[dashboard.render.com](https://dashboard.render.com)** and log in.
2. Click **New +** at the top right $\rightarrow$ select **Blueprint** (or **Web Service**).

### Option A: Using Blueprint (Automated - Recommended)
1. Select **Blueprint**.
2. Connect your GitHub repository.
3. Render will detect `render.yaml` automatically and configure the `basic-crm-backend` service with all environment variables.
4. Click **Apply**.

### Option B: Using Web Service (Manual)
1. Select **Web Service** $\rightarrow$ Connect your repository.
2. Configure the service:
   - **Name**: `basic-crm-backend`
   - **Region**: Any (e.g. Oregon / Singapore / Frankfurt)
   - **Branch**: `main`
   - **Runtime**: `Docker`
   - **Dockerfile Path**: `./Dockerfile`
3. Under **Environment Variables**, add:
   - `SPRING_DATASOURCE_URL`: `jdbc:postgresql://aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres?sslmode=require&prepareThreshold=0`
   - `DATABASE_URL`: `postgresql://postgres.vqoxdxudsoaisqpltxuv:Basic CRM@123@aws-0-ap-northeast-2.pooler.supabase.com:6543/postgres`
   - `SPRING_DATASOURCE_USERNAME`: `postgres.vqoxdxudsoaisqpltxuv`
   - `SPRING_DATASOURCE_PASSWORD`: `Basic CRM@123`
   - `JWT_SECRET`: `9a618c6d4883ef07a9e6d0746973e8e24fae6eb5f15d7426b38c230e71cb0a84d41be297374b3353bc07ea015eb6f5eef1411ee85e13d96dd7ffeed47c38bb5d`
   - `JWT_EXPIRATION_MS`: `86400000`
4. Click **Create Web Service**.

---

## Step 3: Connect Frontend to Render Backend

Once Render finishes deploying, you will get a live URL (e.g. `https://basic-crm-backend.onrender.com`).

Update `frontend/.env`:
```env
VITE_API_BASE_URL=https://basic-crm-backend.onrender.com/api/v1
```
