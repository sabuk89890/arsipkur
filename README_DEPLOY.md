# Panduan Deploy ke GitHub + Supabase + Vercel

## 1. Buat repository GitHub
1. Buka https://github.com/new
2. Buat repository baru.
3. Jalankan:

```bash
git remote add origin https://github.com/NAMA_USER/NAMA_REPOSITORY.git
git branch -M main
git push -u origin main
```

## 2. Siapkan Supabase
1. Buka https://supabase.com/
2. Buat project baru.
3. Jalankan SQL berikut di SQL Editor:

```sql
create table if not exists app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
```

4. Ambil nilai dari Project Settings > API:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`

## 3. Deploy ke Vercel
1. Buka https://vercel.com/
2. Import repository GitHub.
3. Tambahkan environment variables:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
4. Deploy.

## 4. Opsional: GitHub Actions
Jika ingin deployment otomatis, tambahkan secrets GitHub:
- `VERCEL_TOKEN`
- `VERCEL_ORG_ID`
- `VERCEL_PROJECT_ID`
