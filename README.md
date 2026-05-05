# WEX Receipt Portal

AI-powered gas receipt submission tool for Chicago Testing Lab. Upload receipts and have fields auto-extracted — works on mobile and desktop.

## Structure

```
gas-receipts/
├── api/
│   └── extract.js      # Serverless function — calls Anthropic API
├── public/
│   └── index.html      # Frontend
├── vercel.json         # Vercel config
├── package.json
└── README.md
```

## Deploy to Vercel (one time setup)

### 1. Install Vercel CLI
```bash
npm install -g vercel
```

### 2. Get your Anthropic API key
Go to https://console.anthropic.com → API Keys → Create Key

### 3. Push this code to GitHub
```bash
git init
git add .
git commit -m "initial commit"
git remote add origin https://github.com/Hyphycodes/Gas-Receipts.git
git push -u origin main
```

### 4. Deploy
```bash
vercel
```
- Follow the prompts (link to your GitHub repo)
- When asked about environment variables, add:
  - Key: `ANTHROPIC_API_KEY`
  - Value: your API key from step 2

### 5. Set env variable (if you skipped it above)
```bash
vercel env add ANTHROPIC_API_KEY
```
Then redeploy:
```bash
vercel --prod
```

Your app will be live at `https://gas-receipts.vercel.app` (or similar).

## Connecting Google Sheets (later)

When you're ready to wire up submissions to a Google Sheet, update `submitAll()` in `public/index.html` to POST to a Google Apps Script web endpoint. Instructions in a separate doc.

## Cost estimate

- Claude Sonnet: ~$0.01–0.03 per receipt image
- 30 employees × 5 receipts/week = ~$1.50–4.50/week
- Vercel hosting: free tier covers this usage
