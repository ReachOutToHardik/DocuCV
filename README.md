# 🚀 RoverAI - The Future of Resume Building

RoverAI is a premium, AI-powered SaaS application that helps users craft "Industry Level" resumes in seconds. It uses **Google Gemini 2.5** to rewrite messy brain dumps into ATS-optimized bullet points and compiles them into professional LaTeX PDFs.

![RoverAI Banner](https://via.placeholder.com/1200x600/0b0c15/6366f1?text=RoverAI+Dashboard)

## ✨ Features

*   **🧠 AI Brain (Gemini 2.5)**: Automatically rewrites experience using the **STAR Method** and quantifies results.
*   **🎨 Nebula Pro UI**: A stunning, glassmorphism-based dark mode interface built with **Tailwind CSS** and **Alpine.js**.
*   **📄 Real LaTeX Rendering**: Generates high-quality, typographically perfect PDFs that beat ATS bots.
*   **🛡️ Supabase Auth**: Secure user authentication (Sign Up, Login, Reset Password).
*   **☁️ Cloud Storage**: Saves user profiles and generated resumes to Supabase Database.
*   **🔍 ATS Scanner**: Built-in tool to compare resumes against job descriptions and get a match score.

---

## 🛠️ Tech Stack

*   **Frontend**: HTML5, Tailwind CSS, Alpine.js (No build step required for UI).
*   **Backend**: Node.js, Express.
*   **AI**: Google Gemini API (`@google/generative-ai`).
*   **Database & Auth**: Supabase.
*   **PDF Engine**: Remote LaTeX Compiler.

---

## 🚀 Quick Start

1.  **Clone the repo**
    ```bash
    git clone https://github.com/yourusername/rover-ai.git
    cd rover-ai
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment**
    Create a `.env` file in the root directory:
    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_anon_key
    ```

4.  **Run the Server**
    ```bash
    node server.js
    ```
    Visit `http://localhost:3000` in your browser.

---

## ⚡ Supabase Configuration

To make the app work, you need to set up your Supabase project.

### 1. Database Schema
Run this SQL in your Supabase **SQL Editor** to create the necessary tables:

```sql
-- Create Profiles Table
create table public.profiles (
  id uuid references auth.users not null primary key,
  email text,
  full_name text,
  credits int default 3,
  is_pro boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable Row Level Security (RLS)
alter table public.profiles enable row level security;

-- Create Policy: Users can only view/edit their own profile
create policy "Users can view own profile" on profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on profiles for update using (auth.uid() = id);

-- Trigger to create profile on signup
create function public.handle_new_user() 
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 2. Premium Email Templates
Copy these HTML templates into your **Supabase Dashboard > Authentication > Email Templates**.

#### 📧 Confirm Your Signup
*Subject Line:* `Welcome to RoverAI! Confirm your account.`

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #0b0c15; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #151725; border-radius: 16px; overflow: hidden; border: 1px solid #2d3748; }
    .header { background: #1f2235; padding: 30px; text-align: center; border-bottom: 1px solid #2d3748; }
    .logo { font-size: 24px; font-weight: bold; color: #fff; letter-spacing: 1px; }
    .logo span { color: #6366f1; }
    .content { padding: 40px 30px; text-align: center; }
    h1 { color: #fff; font-size: 24px; margin-bottom: 16px; }
    p { color: #94a3b8; line-height: 1.6; margin-bottom: 30px; font-size: 16px; }
    .btn { display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.3s; }
    .btn:hover { background: #4f46e5; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #2d3748; background: #0b0c15; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Rover<span>AI</span></div>
    </div>
    <div class="content">
      <h1>Verify your email address</h1>
      <p>You're one step away from crafting the perfect resume. Please confirm your email address to unlock your account.</p>
      <a href="{{ .ConfirmationURL }}" class="btn">Confirm Email</a>
    </div>
    <div class="footer">
      &copy; 2024 RoverAI Inc. All rights reserved.<br>
      If you didn't create an account, you can safely ignore this email.
    </div>
  </div>
</body>
</html>
```

#### 🔒 Reset Password
*Subject Line:* `Reset your RoverAI password`

```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: 'Inter', sans-serif; background-color: #0b0c15; color: #e2e8f0; margin: 0; padding: 0; }
    .container { max-width: 600px; margin: 40px auto; background: #151725; border-radius: 16px; overflow: hidden; border: 1px solid #2d3748; }
    .header { background: #1f2235; padding: 30px; text-align: center; border-bottom: 1px solid #2d3748; }
    .logo { font-size: 24px; font-weight: bold; color: #fff; letter-spacing: 1px; }
    .logo span { color: #6366f1; }
    .content { padding: 40px 30px; text-align: center; }
    h1 { color: #fff; font-size: 24px; margin-bottom: 16px; }
    p { color: #94a3b8; line-height: 1.6; margin-bottom: 30px; font-size: 16px; }
    .btn { display: inline-block; background: #6366f1; color: #fff; text-decoration: none; padding: 14px 32px; border-radius: 8px; font-weight: bold; font-size: 16px; transition: background 0.3s; }
    .btn:hover { background: #4f46e5; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; border-top: 1px solid #2d3748; background: #0b0c15; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <div class="logo">Rover<span>AI</span></div>
    </div>
    <div class="content">
      <h1>Reset your password</h1>
      <p>We received a request to reset your password. Click the button below to choose a new one.</p>
      <a href="{{ .ConfirmationURL }}" class="btn">Reset Password</a>
    </div>
    <div class="footer">
      &copy; 2024 RoverAI Inc. All rights reserved.<br>
      If you didn't request this, you can safely ignore this email.
    </div>
  </div>
</body>
</html>
```

---

## 📄 License

This project is licensed under the MIT License.
