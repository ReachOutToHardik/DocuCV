# DocuCV - The AI Resume Builder That Gets You Hired 🚀

**DocuCV** is a next-generation AI resume builder designed to help professionals land their dream jobs. It leverages **Google Gemini AI** to rewrite bullet points using the STAR method, quantifies achievements, and compiles everything into a flawless, ATS-friendly **LaTeX PDF**.

![DocuCV Screenshot](https://cdn.dribbble.com/users/1615584/screenshots/15963368/media/f62569927560308eb355041a8ef8a63a.jpg?resize=1600x1200&vertical=center)

## ✨ Features

*   **AI-Powered Writing**: Transforms "I did sales" into "Spearheaded a sales initiative generating $50k in Q3 revenue" using the STAR method.
*   **Real LaTeX Compilation**: Generates professional, typographically perfect PDFs that pass 99.9% of ATS scanners.
*   **ATS Scanner**: Upload your current resume + a job description to get a match score and actionable feedback.
*   **Nebula Pro Design**: A stunning, dark-mode interface with glassmorphism and smooth animations.
*   **Supabase Integration**: Secure authentication (Email/Password, OAuth) and database storage for user profiles and credits.
*   **Multi-Page Architecture**: Dedicated Landing, Login, Pricing, and App Dashboard pages.

## 🛠️ Tech Stack

*   **Frontend**: HTML5, Tailwind CSS, Alpine.js, Vanilla JS
*   **Backend**: Node.js, Express.js
*   **AI Engine**: Google Gemini 1.5 Flash
*   **Database & Auth**: Supabase
*   **PDF Engine**: Remote LaTeX Compiler (latex.ytotech.com)

## 🚀 Quick Start

### Prerequisites

*   Node.js (v18+)
*   NPM
*   A Supabase Project
*   A Google Gemini API Key

### Installation

1.  **Clone the repository**
    ```bash
    git clone https://github.com/yourusername/docucv.git
    cd docucv
    ```

2.  **Install dependencies**
    ```bash
    npm install
    ```

3.  **Configure Environment Variables**
    Create a `.env` file in the root directory:
    ```env
    SUPABASE_URL=your_supabase_url
    SUPABASE_KEY=your_supabase_anon_key
    ```

4.  **Start the Server**
    ```bash
    node server.js
    ```

5.  **Open the App**
    Visit `http://localhost:3000` in your browser.

## 🗄️ Supabase Configuration

To get the backend working, you need to set up your Supabase project.

### 1. Database Schema
Run the following SQL in your Supabase **SQL Editor** to create the user profiles table:

```sql
-- Create a table for public profiles
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  updated_at timestamp with time zone,
  full_name text,
  avatar_url text,
  website text,
  credits integer default 3,
  is_pro boolean default false,

  constraint username_length check (char_length(full_name) >= 3)
);

-- Set up Row Level Security (RLS)
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Function to handle new user signup automatically
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, full_name, avatar_url, credits)
  values (new.id, new.raw_user_meta_data->>'full_name', new.raw_user_meta_data->>'avatar_url', 3);
  return new;
end;
$$;

-- Trigger the function every time a user is created
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
```

### 2. Email Templates
Go to **Authentication > Email Templates** in Supabase and use these "Nebula Pro" themed templates:

**Confirm Your Signup**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background-color: #030305; color: #e2e8f0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: #0A0A0F; border: 1px solid #1C1C26; border-radius: 16px; overflow: hidden; }
    .header { background: #12121A; padding: 30px; text-align: center; border-bottom: 1px solid #1C1C26; }
    .content { padding: 40px; text-align: center; }
    .button { display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Docu<span style="color: #6366f1;">CV</span></h1>
    </div>
    <div class="content">
      <h2 style="color: white;">Confirm your email</h2>
      <p style="color: #94a3b8; line-height: 1.6;">Welcome to the future of career building. Click the button below to verify your email address and start building your resume.</p>
      <a href="{{ .ConfirmationURL }}" class="button">Confirm Email</a>
    </div>
    <div class="footer">
      &copy; 2024 DocuCV Inc.
    </div>
  </div>
</body>
</html>
```

**Reset Password**
```html
<!DOCTYPE html>
<html>
<head>
  <style>
    body { background-color: #030305; color: #e2e8f0; font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; padding: 40px; }
    .container { max-width: 600px; margin: 0 auto; background: #0A0A0F; border: 1px solid #1C1C26; border-radius: 16px; overflow: hidden; }
    .header { background: #12121A; padding: 30px; text-align: center; border-bottom: 1px solid #1C1C26; }
    .content { padding: 40px; text-align: center; }
    .button { display: inline-block; background-color: #6366f1; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin-top: 20px; }
    .footer { padding: 20px; text-align: center; font-size: 12px; color: #64748b; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1 style="color: white; margin: 0;">Docu<span style="color: #6366f1;">CV</span></h1>
    </div>
    <div class="content">
      <h2 style="color: white;">Reset Password</h2>
      <p style="color: #94a3b8; line-height: 1.6;">Follow this link to reset the password for your user:</p>
      <a href="{{ .ConfirmationURL }}" class="button">Reset Password</a>
    </div>
    <div class="footer">
      &copy; 2024 DocuCV Inc.
    </div>
  </div>
</body>
</html>
```

## 📄 License

This project is licensed under the MIT License.
