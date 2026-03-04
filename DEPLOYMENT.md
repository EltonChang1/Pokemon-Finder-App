# Pokemon Finder App - Deployment Guide

## 🚀 Quick Deployment Steps

### 1. MongoDB Atlas (Database)
1. Go to [MongoDB Atlas](https://www.mongodb.com/cloud/atlas)
2. Sign up for free account
3. Create a new cluster (Free M0 tier)
4. Go to Database Access → Add New User → Create username/password
5. Go to Network Access → Add IP Address → Allow Access from Anywhere (0.0.0.0/0)
6. Click "Connect" → "Connect your application" → Copy connection string
7. Replace `<password>` with your password and `<dbname>` with `pokefind`

### 2. Backend Deployment (Render)
1. Go to [Render.com](https://render.com)
2. Sign up and connect your GitHub account
3. Click "New +" → "Web Service"
4. Select the `Pokemon-Finder-App` repository
5. Configure:
   - **Name**: `pokefind-backend`
   - **Region**: Oregon (US West)
   - **Branch**: `main`
   - **Root Directory**: `server`
   - **Runtime**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
6. Add Environment Variables:
   - `NODE_ENV` = `production`
   - `PORT` = `10000`
   - `MONGO_URI` = `your-mongodb-atlas-connection-string`
7. Click "Create Web Service"
8. Copy your backend URL (e.g., `https://pokefind-backend.onrender.com`)

### 3. Frontend Deployment (Vercel)
1. Go to [Vercel.com](https://vercel.com)
2. Sign up and connect GitHub
3. Click "Add New..." → "Project"
4. Import `Pokemon-Finder-App` repository
5. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
6. Add Environment Variable:
   - `REACT_APP_API_URL` = `your-render-backend-url` (from step 2.8)
7. Click "Deploy"
8. Your app will be live at `https://your-app-name.vercel.app`

### 4. Update Portfolio Website
Add a link to your deployed Pokemon Finder App on your GitHub Pages portfolio at:
- https://eltonchang1.github.io

---

## 📝 Important Notes

- **Free Tier Limitations**:
  - Render free tier spins down after 15 minutes of inactivity (cold starts)
  - MongoDB Atlas M0 is limited to 512MB storage
  - Vercel has no sleep time

- **Custom Domain** (Optional):
  - You can add a custom domain in Vercel settings
  - e.g., `pokefind.yourdomain.com`

- **Environment Variables**:
  - Never commit `.env` files to GitHub
  - All sensitive data goes in deployment platform settings

---

## 🔧 Alternative: All-in-One Deployment

If you prefer a simpler setup, you can use **Railway.app** which handles both frontend and backend:

1. Go to [Railway.app](https://railway.app)
2. Connect GitHub repository
3. Railway will auto-detect both services
4. Add MongoDB plugin from Railway marketplace
5. Set environment variables
6. Deploy!

---

## 🌐 Access Your App

Once deployed:
- **Frontend**: `https://your-app.vercel.app`
- **Backend API**: `https://pokefind-backend.onrender.com/api/pokemon-spawns`
- **Portfolio**: Add link on https://eltonchang1.github.io

Enjoy your live Pokemon Finder App! 🎮
