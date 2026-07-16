# Deployment Guide — AWS + S3 + CloudFront + EC2 + PM2 + NGINX + MediaMTX

This guide explains how to deploy the full `EPIC_GUARD_PORTAL` project to AWS, make the frontend live through S3 and CloudFront, and host the backend on an EC2 instance with PM2, NGINX, and MediaMTX.

> This repo has two deployable apps:
> - `client/` = frontend React/Vite app
> - `server/` = backend Node/Express API
>
> There is also a MediaMTX streaming config file in `mediamtxServer/mediamtx.yml`.

## 1. Prerequisites

- AWS account with access to S3, CloudFront, EC2, ACM, Route53 (or external DNS)
- AWS CLI configured on your local machine
- Node.js and npm installed locally for building the frontend
- A MongoDB database URI (Atlas or self-hosted)
- Domain: `akiyaa.online` (or your own custom domain)
- Larix Broadcaster app on your phone for RTMP streaming

## 2. Build and export the frontend to S3

1. From the repo root, build the frontend:

```bash
cd client
npm install
npm run build
```

2. Create an S3 bucket for the static site, for example `akiyaa-frontend`.
3. Enable public access or use CloudFront signed URLs depending on security policy.
4. Upload the generated `dist/` folder to the bucket:

```bash
aws s3 sync dist/ s3://your-frontend-bucket/ --delete
```

5. In the S3 Console, enable Static Website Hosting on that bucket.
   - Index document: `index.html`
   - Error document: `index.html`

6. Make the bucket objects public if you want direct accessibility, or rely on CloudFront.

## 3. Configure CloudFront with your domain

1. In AWS Certificate Manager (ACM), request or import an SSL certificate for `akiyaa.online` and `www.akiyaa.online`.
   - If CloudFront is in `us-east-1`, request the cert there.

2. Create a CloudFront distribution:
   - Origin domain: your S3 bucket website endpoint or S3 bucket.
   - Default root object: `index.html`
   - Viewer protocol policy: Redirect HTTP to HTTPS
   - Alternate domain name (CNAME): `akiyaa.online`
   - SSL certificate: choose your ACM certificate for `akiyaa.online`

3. Configure DNS:
   - If using Route53, create an Alias record for `akiyaa.online` pointing to the CloudFront distribution.
   - If using external DNS, create a CNAME record from `akiyaa.online` to the CloudFront domain.

4. Wait for CloudFront to deploy, then verify that `https://akiyaa.online` opens your React app.

## 4. Export backend files to S3

1. Prepare the server folder for upload. From repo root:

```bash
cd ..
zip -r epic-guard-server.zip server
```

2. Upload the server archive to an S3 bucket, e.g. `akiyaa-backend`:

```bash
aws s3 cp epic-guard-server.zip s3://your-server-bucket/
```

## 5. Launch an EC2 instance for backend + NGINX

1. Create a new EC2 instance:
   - Recommended AMI: Ubuntu Server 22.04 LTS or Amazon Linux 2023
   - Instance type: at least `t3.medium` or larger
   - Security groups:
     - Allow inbound `22` (SSH)
     - Allow inbound `80` (HTTP)
     - Allow inbound `443` (HTTPS)
     - Allow inbound `1935` (RTMP) if you stream directly to this server
     - Allow inbound `8889` if MediaMTX listens there

2. SSH into the instance.

3. Install Node.js, npm, PM2, and NGINX:

```bash
sudo apt update
sudo apt install -y nginx unzip curl
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 6. Configure NGINX

1. Copy the deployment NGINX config into `/etc/nginx/sites-available/default`.
2. Use the following content, updating `server_name` if needed:

```nginx
server {
    server_name epic.akiyaa.online;

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /live/ {
        proxy_pass http://localhost:8889/live/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_buffering off;
    }

    listen 80;
    listen [::]:80;
}
```

> If you want HTTPS on the EC2 instance, use Certbot to obtain certificates and keep the SSL block from the repo config.

3. Enable the site and restart NGINX:

```bash
sudo ln -sf /etc/nginx/sites-available/default /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl restart nginx
```

## 7. Copy server files from S3 and install dependencies

1. On the EC2 instance, copy the server archive from S3:

```bash
cd ~
aws s3 cp s3://your-server-bucket/epic-guard-server.zip ./
unzip epic-guard-server.zip
cd server
npm install
```

2. Create or update `.env` in the `server/` folder:

```bash
nano .env
```

3. Add these values:

```ini
PORT=5000
MONGO_URI=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<dbname>?retryWrites=true&w=majority
JWT_SECRET=your_super_secret_key
```

4. Save and exit.

## 8. Update hardcoded domain URLs

The repo currently contains hardcoded references to `https://epic.akiyaa.online`.
If your backend is on an EC2 instance IP or a new domain, update those references before building or deploying the frontend.

Search in these files and replace the domain with your public hostname or IP:

- `client/src/Dashboard/Dashboard.jsx`
- `client/src/Credentials/Login.jsx`
- `client/src/Dashboard/LiveFeed.jsx`
- `client/src/Componenets/CrowdManagement.jsx`

If you use `akiyaa.online` permanently, keep the domain in place and ensure DNS points to CloudFront/EC2.

## 9. Start the backend with PM2

From the `server/` folder:

```bash
pm install
pm run build # if you add a build step later; current repo uses plain server.js
pm2 start server.js --name cyberwarden-server
pm2 save
pm2 startup systemd
```

If the server is not at the repo root, run it from the folder where `server.js` lives.

## 10. Install and configure MediaMTX

1. Create a folder for MediaMTX on the EC2 instance:

```bash
cd ~
mkdir -p mediamtxServer
cd mediamtxServer
```

2. Install MediaMTX on the instance.
   - On Ubuntu, you can use the official package or download the binary.

3. Copy the `mediamtxServer/mediamtx.yml` content from this repo into `~/mediamtxServer/mediamtx.yml`.
   - Open the file:

```bash
nano ~/mediamtxServer/mediamtx.yml
```

   - Replace all content with the repo config.

4. Start MediaMTX under PM2:

```bash
cd ~
pm install -g pm2
pm2 start mediamtx --name mediamtx -- -f ~/mediamtxServer/mediamtx.yml
pm2 save
```

> If the `mediamtx` binary is installed at a different path, replace the command with the full path.

## 11. Add the head-counting repo/process to PM2

If you have a separate head-counting repository or service, deploy it to the same EC2 instance or a second instance, then add it to PM2:

```bash
cd ~/headcount-repo
npm install
pm2 start index.js --name headcount-model
```

Make sure the service path and startup command match the repo you are using.

## 12. Configure Larix Broadcaster

In Larix Broadcaster, configure the connection:

- Protocol: `RTMP`
- URL: `rtmp://<EC2-IP-or-domain>/live/stream`
- Stream key: anything supported by your MediaMTX config

For example:

```text
rtmp://203.0.113.55/live/stream
```

If you are using the `LiveFeed` WHEP route, use:

```text
https://akiyaa.online/live/stream/whep
```

## 13. Final verification

1. Verify the frontend is live at `https://akiyaa.online`.
2. Verify the backend is reachable through NGINX at `http://<EC2-IP>/` or your domain.
3. Verify the API endpoint works:

```bash
curl http://<EC2-IP>/api/auth/login
```

4. Confirm PM2 has the processes running:

```bash
pm2 list
```

5. Confirm MediaMTX is running and accepting RTMP connections.

## Notes

- If you change the domain or use a different IP, update every hardcoded `https://epic.akiyaa.online` reference in the frontend.
- Keep the `.env` file secure and never commit it.
- If deploying in production, use HTTPS and proper NGINX SSL configuration.
- If you want a more robust setup, split the backend and streaming services onto separate EC2 instances.

---

### Quick checklist

- [ ] Build frontend and sync `client/dist/` to S3
- [ ] Enable S3 static site hosting
- [ ] Create CloudFront distro for `akiyaa.online`
- [ ] Upload backend to S3
- [ ] Launch EC2 and install Node, PM2, NGINX
- [ ] Paste NGINX config into `/etc/nginx/sites-available/default`
- [ ] Copy server files from S3, install dependencies
- [ ] Create `.env` with `MONGO_URI` and `PORT`
- [ ] Update `epic.akiyaa.online` references if needed
- [ ] Install MediaMTX and load `mediamtx.yml`
- [ ] Add services to PM2 and save
- [ ] Point Larix Broadcaster to `rtmp://<IP>/live/stream`

Once these steps are complete, the project should be live and usable.
