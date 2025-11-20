# 🚀 Deployment Guide

Here is how to host your **RoverAI** application for free.

## 1. Push to GitHub
First, you need to get your code onto GitHub.

1.  **Initialize Git** (if you haven't already):
    Open your terminal in the project folder and run:
    ```bash
    git init
    git add .
    git commit -m "Initial commit - RoverAI Launch"
    ```

2.  **Create a Repository**:
    *   Go to [GitHub.com](https://github.com) and create a new repository (e.g., `rover-ai`).
    *   **Do not** initialize with README/gitignore (we already have them).

3.  **Push Code**:
    Copy the commands GitHub gives you (under "…or push an existing repository from the command line") and run them:
    ```bash
    git remote add origin https://github.com/YOUR_USERNAME/rover-ai.git
    git branch -M main
    git push -u origin main
    ```

---

## 2. Host on Render (Recommended)
Render is the best option because it can host your **Node.js backend** and **Frontend** together easily.

1.  **Create Account**: Go to [dashboard.render.com](https://dashboard.render.com/) and log in with GitHub.
2.  **New Web Service**: Click **"New +"** -> **"Web Service"**.
3.  **Connect Repo**: Select your `rover-ai` repository.
4.  **Configure Settings**:
    *   **Name**: `rover-ai` (or whatever you want)
    *   **Region**: Closest to you (e.g., Singapore or Oregon)
    *   **Branch**: `main`
    *   **Runtime**: `Node`
    *   **Build Command**: `npm install`
    *   **Start Command**: `node server.js`
    *   **Plan**: Free
5.  **Environment Variables** (Scroll down to "Advanced"):
    Add the keys from your `.env` file here so the server can access them.
    *   `SUPABASE_URL`: `https://bemxgkzdfqqwlxfsawlm.supabase.co`
    *   `SUPABASE_KEY`: *(Paste your long Anon Key here)*
6.  **Deploy**: Click **"Create Web Service"**.

Render will build your app. Once it says "Live", your app is online! (e.g., `https://rover-ai.onrender.com`).

---

## 3. Host on Vercel (Alternative)
Vercel is great, but the **Free Tier has a 10-second timeout** for serverless functions. Since generating a PDF with AI might take >10 seconds, **Render is safer**.

If you still want to try Vercel:

1.  **Create `vercel.json`**:
    Create a file named `vercel.json` in your project root with this content:
    ```json
    {
      "version": 2,
      "builds": [
        {
          "src": "server.js",
          "use": "@vercel/node"
        },
        {
          "src": "public/**",
          "use": "@vercel/static"
        }
      ],
      "routes": [
        {
          "src": "/(.*)",
          "dest": "/server.js"
        }
      ]
    }
    ```

2.  **Deploy**:
    *   Go to [vercel.com](https://vercel.com) -> "Add New..." -> "Project".
    *   Import your GitHub repo.
    *   Add your **Environment Variables** (`SUPABASE_URL`, `SUPABASE_KEY`).
    *   Click **Deploy**.

**Warning**: If the PDF generation takes too long, Vercel will show a "504 Gateway Timeout" error. Use Render if this happens.
