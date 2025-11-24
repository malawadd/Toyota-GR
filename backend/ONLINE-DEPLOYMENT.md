# Running Racing Data Explorer Online

This guide shows you how to run the racing data analysis in the cloud without needing a powerful local machine.

## Option 1: GitHub Codespaces (Recommended - Free Tier Available)

GitHub Codespaces provides a full development environment in the cloud.

### Steps:

1. **Push your code to GitHub**
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin <your-github-repo-url>
   git push -u origin main
   ```

2. **Open in Codespaces**
   - Go to your GitHub repository
   - Click the green "Code" button
   - Select "Codespaces" tab
   - Click "Create codespace on main"

3. **Run the analysis**
   ```bash
   npm install
   npm run explore:all-streaming
   ```

4. **Download reports**
   - Reports will be generated in the workspace
   - Right-click files and select "Download"

**Free Tier**: 60 hours/month for free accounts

---

## Option 2: Replit (Easiest - No Git Required)

Replit is a browser-based IDE that's perfect for quick runs.

### Steps:

1. **Create a Repl**
   - Go to [replit.com](https://replit.com)
   - Click "Create Repl"
   - Select "Node.js" template
   - Name it "racing-data-explorer"

2. **Upload your files**
   - Drag and drop all your `.js` files
   - Upload all CSV files
   - Upload `package.json`

3. **Install and run**
   - In the Shell tab:
   ```bash
   npm install
   npm run explore:all-streaming
   ```

4. **Download reports**
   - Click on generated `.md` files
   - Download from the file menu

**Free Tier**: Available with some limitations

---

## Option 3: Google Colab (Free - Good for Large Files)

Google Colab provides free access to cloud computing resources.

### Steps:

1. **Create a new notebook**
   - Go to [colab.research.google.com](https://colab.research.google.com)
   - Create a new notebook

2. **Install Node.js**
   ```python
   !curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
   !apt-get install -y nodejs
   !node --version
   ```

3. **Upload files to Google Drive**
   - Upload all your project files to a folder in Google Drive
   - Upload all CSV files

4. **Mount Google Drive**
   ```python
   from google.colab import drive
   drive.mount('/content/drive')
   ```

5. **Navigate and run**
   ```python
   %cd /content/drive/MyDrive/racing-data-explorer
   !npm install
   !npm run explore:all-streaming
   ```

6. **Download reports**
   - Reports will be in your Google Drive folder
   - Download from Google Drive

**Free Tier**: Generous free tier with GPU/TPU access

---

## Option 4: Cloud VM (AWS/GCP/Azure)

For production use or very large datasets.

### AWS EC2 Example:

1. **Launch an EC2 instance**
   - Instance type: t3.medium (4GB RAM) or larger
   - OS: Ubuntu 22.04 LTS
   - Storage: 20GB+

2. **Connect via SSH**
   ```bash
   ssh -i your-key.pem ubuntu@your-instance-ip
   ```

3. **Install Node.js**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

4. **Upload files**
   ```bash
   # From your local machine
   scp -i your-key.pem -r ./racing-data-explorer ubuntu@your-instance-ip:~/
   ```

5. **Run analysis**
   ```bash
   cd racing-data-explorer
   npm install
   npm run explore:all-streaming
   ```

6. **Download reports**
   ```bash
   # From your local machine
   scp -i your-key.pem ubuntu@your-instance-ip:~/racing-data-explorer/*.md ./
   ```

**Cost**: ~$0.04/hour for t3.medium (stop when not in use)

---

## Comparison Table

| Platform | Setup Time | Free Tier | Best For | Difficulty |
|----------|------------|-----------|----------|------------|
| **GitHub Codespaces** | 2 min | 60 hrs/month | Regular use | Easy |
| **Replit** | 1 min | Yes (limited) | Quick tests | Very Easy |
| **Google Colab** | 3 min | Generous | Large files | Medium |
| **Cloud VM** | 10 min | Trial credits | Production | Hard |

---

## Recommended Workflow

### For Quick Analysis:
1. Use **Replit** - fastest to get started
2. Upload files, run `npm run explore:all-streaming`
3. Download reports

### For Regular Use:
1. Use **GitHub Codespaces** - best development experience
2. Push code to GitHub once
3. Open Codespace whenever you need to analyze new data
4. 60 free hours per month is usually enough

### For Very Large Files (>500MB):
1. Use **Google Colab** - free and powerful
2. Upload to Google Drive
3. Run analysis in Colab
4. Reports saved to Drive automatically

---

## Tips for Online Execution

1. **Use the streaming version**: Always run `npm run explore:all-streaming` online to minimize memory usage

2. **Compress CSV files**: If uploading is slow, compress your CSV files:
   ```bash
   gzip *.csv
   ```
   Then decompress online:
   ```bash
   gunzip *.csv.gz
   ```

3. **Process in batches**: If you have multiple races, process them one at a time

4. **Save reports immediately**: Download generated reports right away to avoid losing them

5. **Monitor memory**: Most free tiers have 2-4GB RAM, which is enough for the streaming version

---

## Troubleshooting

### "Out of memory" error online
- Make sure you're using `npm run explore:all-streaming`
- Try a platform with more RAM (Google Colab or paid VM)

### Upload is too slow
- Compress files before uploading
- Use a platform with better upload speeds (Codespaces)

### Can't install dependencies
- Check Node.js version: `node --version` (need v18+)
- Clear npm cache: `npm cache clean --force`
- Try: `npm install --legacy-peer-deps`

---

## Next Steps

After running online:
1. Download all generated `.md` reports
2. Review them locally in any markdown viewer
3. Share reports with your team
4. Archive CSV files and reports for future reference
