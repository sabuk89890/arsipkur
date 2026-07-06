# Setup Supabase untuk Aplikasi Arsip Kurikulum

## 1. Buat project Supabase
1. Masuk ke https://supabase.com/
2. Buat project baru.
3. Buka menu SQL Editor.
4. Jalankan query berikut untuk membuat tabel penyimpanan:

```sql
create table if not exists app_state (
  key text primary key,
  value jsonb not null,
  updated_at timestamptz default now()
);
```

## 2. Dapatkan kredensial
1. Buka Project Settings > API.
2. Salin URL project dan `anon` key.
3. Tambahkan ke file `.env` di root aplikasi:

```env
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

## 3. Jalankan aplikasi lokal
```bash
npm install
npm run dev
```

## 4. Deploy ke Vercel
1. Push repository ke GitHub.
2. Buka Vercel, import repository.
3. Tambahkan environment variables:
   - VITE_SUPABASE_URL
   - VITE_SUPABASE_ANON_KEY
4. Deploy.
