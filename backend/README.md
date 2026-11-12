# Plant Operation Engineer's Deployment & Architecture Guide
**App Title**: Short-Term Prediction of Stack Emissions for Early Operational Warning  
**Target Unit**: Supercritical Pulverized Coal-Fired Boiler (Stack 1 / Unit 1)  
**Author**: Thermal Power Plant Operation Engineering

---

## 1. Operating On A Restricted Company Laptop (No Admin Rights)

Power plant corporate laptops typically have strict endpoint security (Group Policy, no administrator privileges, USB restrictions, and blocked software installers).

### Recommended Solution: 100% In-Browser Development
You do **not** need to install Python, Node.js, Docker, or Git locally on your laptop:
1. **Google Cloud Shell** (Recommended):
   - Access directly in your browser at `https://shell.cloud.google.com`.
   - Free ephemeral Linux virtual machine with 5GB persistent storage, pre-installed with `gcloud`, `docker`, `python3`, `git`, and `node`.
   - Includes a built-in browser-based VS Code editor with terminal.
2. **GitHub Codespaces**:
   - Cloud developer environment accessible from Chrome/Edge with full terminal and port forwarding.
3. **Google Colab**:
   - Excellent for exploratory data analysis (EDA) and evaluating XGBoost hyperparameter search before committing to Cloud Run.

---

## 2. Architecture Overview

```
+-------------------------------------------------------------+
| Browser / Control Room HMI Screen                           |
| React + TypeScript SPA (Hosted on Firebase Hosting / CDN)   |
+-------------------------------------------------------------+
                            |
           HTTPS REST API   | (Prediction Requests / Metrics)
                            v
+-------------------------------------------------------------+
| Google Cloud Run (Containerized FastAPI Python Backend)      |
| - Low-latency routine inference (<50 ms)                    |
| - Asynchronous scheduled model retraining                   |
| - Conformal prediction intervals & warning metrics          |
+-------------------------------------------------------------+
          |                                      |
          v                                      v
+------------------------+             +------------------------+
| Read-Only PI Web API   |             | Read-Only SharePoint   |
| (DCS / CEMS Telemetry) |             | (Coal Lab Certificates)|
+------------------------+             +------------------------+
```

---

## 3. Required Google Cloud Permissions, APIs & Billing Setup

Before deploying to Google Cloud, your organization's GCP Project Administrator must configure:

### A. Billing Account
- Cloud Run and Firebase Hosting have a generous **Free Tier**:
  - Cloud Run: First 2 million requests/month and 360,000 GB-seconds memory are free.
  - Scale-to-zero when no operators are actively reviewing forecasts.

### B. Enable GCP Services
In Google Cloud Shell, run:
```bash
gcloud services enable run.googleapis.com \
    artifactregistry.googleapis.com \
    cloudbuild.googleapis.com
```

### C. Required IAM Roles
Assign to your corporate account:
- `roles/run.admin` (Cloud Run Administrator)
- `roles/artifactregistry.writer` (Push Docker containers)
- `roles/storage.admin` (Model artifact storage)

---

## 4. Deploying the Python Backend to Cloud Run

Open **Google Cloud Shell** and execute these 4 commands:

```bash
# 1. Clone repository
git clone <your-repo-url>
cd backend

# 2. Build and submit container image via Cloud Build
gcloud builds submit --tag gcr.io/$GOOGLE_CLOUD_PROJECT/cems-prediction-backend:v1.2

# 3. Deploy container to Cloud Run (with scale-to-zero)
gcloud run deploy cems-prediction-backend \
    --image gcr.io/$GOOGLE_CLOUD_PROJECT/cems-prediction-backend:v1.2 \
    --platform managed \
    --region asia-southeast1 \
    --allow-unauthenticated \
    --memory 1Gi \
    --cpu 1 \
    --min-instances 0 \
    --max-instances 3

# 4. Note the generated HTTPS URL:
# https://cems-prediction-backend-xxxxx.a.run.app
```

---

## 5. Deploying the React Frontend to Firebase Hosting

```bash
# 1. Install Firebase CLI in Cloud Shell (already available or via npm)
npm install -g firebase-tools

# 2. Login to Firebase
firebase login --no-localhost

# 3. Build production bundle
npm run build

# 4. Deploy to Firebase
firebase deploy --only hosting
```

---

## 6. Documented Industrial Plant Interfaces

1. **OSIsoft / AVEVA PI Web API (Read-Only)**:
   - Queries the plant's PI Asset Framework via HTTPS.
   - Credentials (Kerberos service ticket or Basic Auth) are stored **strictly in Google Cloud Secret Manager** on the backend.
   - The frontend never receives DCS credentials.
2. **Microsoft SharePoint (Coal Laboratory Analysis)**:
   - Microsoft Graph API with Application Permissions (`Files.Read.All`).
   - Retrieves coal proximate/ultimate certificates.
   - Enforces `lab_result_available_time`: never uses pending lab results before certificate issuance.

---

## 7. Important Operational Safety Rule

> **REGULATORY & CONTROL BOUNDARY**:  
> This forecasting software is an **advisory operational warning system** only. It does NOT replace Continuous Emission Monitoring Systems (CEMS) and does not possess regulatory approval. Predictions must never be wired directly to boiler DCS actuators without licensed engineering review.
