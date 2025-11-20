# 🚀 Deploying DocuCV

This guide will help you deploy **DocuCV** to the web so you can share it with the world.

## 📦 Option 1: Render (Recommended)

Render is the easiest way to deploy Node.js applications. It handles the backend server and static files automatically.

### Steps:

1.  **Push your code to GitHub**
    *   Create a new repository on GitHub called `docucv`.
    *   Run these commands in your terminal:
        ```bash
        git init
        git add .
        git commit -m "Initial commit"
        git branch -M main
        git remote add origin https://github.com/YOUR_USERNAME/docucv.git
        git push -u origin main
        ```

2.  **Create a Web Service on Render**
    *   Go to [dashboard.render.com](https://dashboard.render.com/).
    *   Click **New +** -> **Web Service**.
    *   Connect your GitHub account and select the `docucv` repository.

3.  **Configure Settings**
    *   **Name**: `docucv-app` (or anything you like)
    *   **Region**: Select the one closest to you.
    *   **Branch**: `main`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`

4.  **Add Environment Variables**
    *   Scroll down to the **Environment Variables** section.
    *   Add the following keys (copy them from your `.env` file):
        *   `SUPABASE_URL`: `your_supabase_url`
        *   `SUPABASE_KEY`: `your_supabase_key`

5.  **Deploy**
    *   Click **Create Web Service**.
    *   Render will start building your app. It might take a few minutes.
    *   Once done, you'll get a URL like `https://docucv-app.onrender.com`.

---

## 📦 Option 2: Vercel (Alternative)

Vercel is great for frontend apps, but since we have a custom Node.js backend for PDF generation, we need to configure it as a Serverless Function.

> **⚠️ WARNING**: Vercel Serverless Functions have a 10-second timeout on the free tier. PDF generation might take longer than that, causing errors. **Render is recommended.**

### Steps:

1.  **Create `vercel.json`**
    *   Create a file named `vercel.json` in the root directory with this content:
        ```json
        {
          "version": 2,
          "builds": [
            {
              "src": "server.js",
              "use": "@vercel/node"
            },
            {
              "src": "index.html",
              "use": "@vercel/static"
            },
             {
              "src": "app.html",
              "use": "@vercel/static"
            },
             {
              "src": "login.html",
              "use": "@vercel/static"
            },
             {
              "src": "pricing.html",
              "use": "@vercel/static"
            },
            {
              "src": "public/**/*",
              "use": "@vercel/static"
            }
          ],
          "routes": [
            {
              "src": "/api/(.*)",
              "dest": "/server.js"
            },
            {
              "src": "/(.*)",
              "dest": "/$1"
            }
          ]
        }
        ```

2.  **Deploy with Vercel CLI**
    *   Install Vercel CLI: `npm i -g vercel`
    *   Run `vercel` in your terminal.
    *   Follow the prompts to link your project.
    *   Add environment variables in the Vercel Dashboard under **Settings > Environment Variables**.

---

## 🔑 Important: Supabase URL

Once deployed, remember to update your **Supabase Authentication Settings**:

1.  Go to **Supabase Dashboard > Authentication > URL Configuration**.
2.  Add your new deployment URL (e.g., `https://docucv-app.onrender.com`) to the **Site URL** and **Redirect URLs**.
3.  This ensures that email confirmation links and OAuth redirects work correctly.
