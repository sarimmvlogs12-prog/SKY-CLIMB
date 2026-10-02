# DLICOM SKY CLIMB — VS Code, GitHub aur Vercel pe kaise chalayein

## 1. VS Code mein kholo
1. Is zip ko extract karo.
2. VS Code mein `File > Open Folder` se folder kholo.
3. Terminal kholo (Ctrl + `) aur chalao:
   ```
   npm install
   npm run dev
   ```
4. Browser mein `http://localhost:5173` kholo.

## 2. GitHub pe daalo
```
git init
git add .
git commit -m "Dlicom Sky Climb"
git branch -M main
git remote add origin https://github.com/<tumhara-username>/<repo-naam>.git
git push -u origin main
```

## 3. Vercel pe deploy karo
1. https://vercel.com pe jao → **Add New Project** → apna GitHub repo import karo.
2. Framework: **Vite** (Vercel khud detect kar lega).
3. **Environment Variables** mein ye 3 add karo (values `.env` file mein hain):
   - `VITE_SUPABASE_PROJECT_ID`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
   - `VITE_SUPABASE_URL`
4. **Deploy** dabao. Bas.

## Zaroori baatein
- Saari game images `public/assets/` mein hain — kahin aur jaane ki zaroorat nahi.
- Login, leaderboard aur multiplayer Lovable Cloud (database) pe chalta hai. Vercel pe bhi wahi database use hoga kyunki keys `.env` mein hain. Agar Lovable Cloud band ho gaya toh login/leaderboard kaam nahi karega.
- `.env` file mein sirf public keys hain — koi secret nahi, isliye GitHub pe daalna safe hai.
