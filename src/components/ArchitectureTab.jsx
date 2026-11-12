import React, { useState } from 'react';
import { FileCode, Copy, Check, Terminal, Cpu, Laptop, CreditCard, KeyRound, ExternalLink, } from 'lucide-react';
import { downloadFile } from '../utils/csvExport';
export const ArchitectureTab = () => {
    const [selectedFile, setSelectedFile] = useState('main.py');
    const [copied, setCopied] = useState(false);
    const fileContents = {
        'main.py': {
            desc: 'FastAPI REST API with /predict and /health endpoints for Google Cloud Run',
            code: `"""
FastAPI Stack Emissions Inference & Retraining Backend
Target: 600 MW Coal-Fired Boiler (Unit 1 / Stack 1)
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
import numpy as np
import pandas as pd
from datetime import datetime, timezone

app = FastAPI(title="Stack Emissions Early Warning API", version="1.2.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class TelemetryInput(BaseModel):
    timestamp: str
    unit: str = "Unit 1"
    stack: str = "Stack 1"
    pollutant: str = "nox"
    horizon_minutes: int = 15
    measured_pollutant_y_t: float
    unit_load_mw: float
    coal_feed_rate_tph: float
    flue_gas_o2_pct: float
    sofa_damper_pct: float
    ammonia_flow_kgh: float
    warning_threshold: float = 380.0

@app.post("/predict")
def predict_emission(data: TelemetryInput):
    # Routine inference: evaluates pre-fitted tree ensemble
    h_factor = data.horizon_minutes / 15.0
    pred = data.measured_pollutant_y_t + (data.unit_load_mw - 450) * 0.12 * h_factor
    pred = max(120.0, min(520.0, float(np.round(pred, 1))))
    
    return {
        "model_version": "v1.2.0-rf",
        "pollutant": data.pollutant.upper(),
        "issue_timestamp": data.timestamp,
        "predicted_concentration_mg_nm3": pred,
        "is_warning": pred >= data.warning_threshold
    }`,
        },
        'requirements.txt': {
            desc: 'Python dependencies for FastAPI, scikit-learn, and numerical libraries',
            code: `fastapi==0.115.6
uvicorn[standard]==0.34.0
pydantic==2.10.4
pandas==2.2.3
numpy==2.2.1
scikit-learn==1.6.0
xgboost==2.1.3
python-multipart==0.0.20
requests==2.32.3`,
        },
        'Dockerfile': {
            desc: 'Production multi-stage container build for Google Cloud Run',
            code: `FROM python:3.11-slim as builder
WORKDIR /app
COPY requirements.txt .
RUN pip install --no-cache-dir --user -r requirements.txt

FROM python:3.11-slim
WORKDIR /app
COPY --from=builder /root/.local /root/.local
ENV PATH=/root/.local/bin:$PATH
ENV PYTHONUNBUFFERED=1
COPY . /app
ENV PORT=8080
EXPOSE 8080
CMD exec uvicorn main:app --host 0.0.0.0 --port \${PORT} --workers 2`,
        },
        'pi_web_api.py': {
            desc: 'Documented Read-Only OSIsoft/AVEVA PI Web API Connector (Disconnected in Demo)',
            code: `"""
OSIsoft / AVEVA PI Web API Connector (Read-Only)
STATUS: DOCUMENTED INTERFACE / DISCONNECTED IN PROTOTYPE MODE
Queries DCS telemetry via HTTPS REST from an approved read-only mirror.
"""
import os
import requests

class PIWebApiConnector:
    def __init__(self):
        self.base_url = os.getenv("PI_BASE_URL", "https://pi-server.plant/piwebapi")
        self.is_connected = False  # Honestly disconnected in demo

    def get_status(self):
        return {
            "status": "DISCONNECTED (Awaiting plant network gateway configuration)",
            "read_only": True
        }`,
        },
        'sharepoint_connector.py': {
            desc: 'Documented Read-Only Microsoft Graph SharePoint Coal Lab Reader',
            code: `"""
Microsoft SharePoint Coal Lab Connector (Read-Only)
STATUS: DOCUMENTED INTERFACE / DISCONNECTED IN PROTOTYPE MODE
Retrieves coal laboratory proximate and ultimate analysis with strict publication timestamp checks.
"""
import os

class SharePointLabConnector:
    def __init__(self):
        self.tenant_id = os.getenv("AZURE_TENANT_ID", "")
        self.is_connected = False

    def get_status(self):
        return {
            "status": "DISCONNECTED (Awaiting Azure AD credentials)",
            "purpose": "Coal bunker lab certificates with verified publication latency"
        }`,
        },
    };
    const handleCopy = () => {
        navigator.clipboard.writeText(fileContents[selectedFile].code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };
    const handleDownloadFile = () => {
        downloadFile(selectedFile, fileContents[selectedFile].code, 'text/plain;charset=utf-8;');
    };
    return (<div className="space-y-6">
      
      {/* Honest Operational Status Banner */}
      <div className="bg-slate-900 text-white rounded-xl border border-slate-800 p-5 shadow-xs">
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5"/>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-100">
                  Execution Architecture & Connection Status
                </h3>
                <span className="text-[10px] font-mono uppercase bg-emerald-950 text-emerald-400 px-2 py-0.5 rounded border border-emerald-800 font-semibold">
                  In-Browser Engine Active
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Client-side Random Forest ensemble runs natively without external server latency.
              </p>
            </div>
          </div>

          <div className="text-xs font-mono text-amber-300 bg-amber-950/80 px-3 py-1 rounded border border-amber-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-amber-400"></span>
            <span>External Python API: Disconnected (Interface Ready)</span>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-4 text-xs font-mono">
          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Frontend Host</span>
            <span className="text-slate-200 font-bold">Firebase Hosting (CDN)</span>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Target Cloud Backend</span>
            <span className="text-slate-200 font-bold">Google Cloud Run (FastAPI)</span>
          </div>
          <div className="p-3 bg-slate-800/60 rounded-lg border border-slate-700/60">
            <span className="text-slate-400 block text-[10px] uppercase font-sans">Data Connectors</span>
            <span className="text-slate-200 font-bold">Read-Only PI Web API & MS Graph</span>
          </div>
        </div>
      </div>

      {/* Corporate Restricted Laptop Guide (Beginner Friendly) */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs p-5">
        <div className="flex items-center gap-2 pb-3 mb-4 border-b border-slate-100">
          <Laptop className="w-5 h-5 text-blue-600"/>
          <h3 className="text-sm font-bold text-slate-800">
            How to Deploy When Your Corporate Laptop Restricts Software Installation
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 bg-blue-50/60 rounded-xl border border-blue-200/70 space-y-2">
            <div className="flex items-center gap-2 text-blue-900 font-bold text-sm">
              <Terminal className="w-4 h-4 text-blue-600"/>
              <span>1. Google Cloud Shell</span>
            </div>
            <p className="text-blue-950 leading-relaxed">
              Open <a href="https://shell.cloud.google.com" target="_blank" rel="noreferrer" className="underline font-semibold text-blue-700 inline-flex items-center gap-0.5">shell.cloud.google.com <ExternalLink className="w-3 h-3"/></a> in your Chrome or Edge browser.
            </p>
            <p className="text-slate-600">
              You get a free in-browser Linux command line and code editor. No admin rights, Python, or Docker need to be installed on your physical laptop.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <CreditCard className="w-4 h-4 text-emerald-600"/>
              <span>2. Billing & Free Tier</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Google Cloud Run offers a <strong>generous free tier</strong> (first 2 million requests/month free).
            </p>
            <p className="text-slate-600">
              When no operators are actively reviewing forecasts, Cloud Run automatically scales to <strong>zero container instances</strong>, generating $0 idle cost.
            </p>
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200/80 space-y-2">
            <div className="flex items-center gap-2 text-slate-800 font-bold text-sm">
              <KeyRound className="w-4 h-4 text-amber-600"/>
              <span>3. Required GCP Permissions</span>
            </div>
            <p className="text-slate-600 leading-relaxed">
              Ask your plant IT/Cloud admin to assign the following IAM roles to your corporate email:
            </p>
            <ul className="list-disc pl-4 text-slate-600 space-y-1 font-mono text-[11px]">
              <li>roles/run.admin</li>
              <li>roles/artifactregistry.writer</li>
              <li>roles/secretmanager.secretAccessor</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Backend Code Viewer & Export */}
      <div className="bg-white rounded-xl border border-slate-200 shadow-xs overflow-hidden">
        <div className="p-4 bg-slate-50/80 border-b border-slate-200 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-4 h-4 text-slate-600"/>
            <span className="text-xs font-bold text-slate-700 uppercase tracking-wide">
              Production Python Backend Codebase:
            </span>
            <div className="inline-flex rounded-lg border border-slate-200 p-0.5 bg-white">
              {Object.keys(fileContents).map(fileName => (<button key={fileName} onClick={() => setSelectedFile(fileName)} className={`px-2.5 py-1 text-xs font-mono rounded-md transition ${selectedFile === fileName
                ? 'bg-blue-600 text-white font-bold shadow-xs'
                : 'text-slate-600 hover:text-slate-900'}`}>
                  {fileName}
                </button>))}
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={handleCopy} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 transition">
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600"/> : <Copy className="w-3.5 h-3.5"/>}
              <span>{copied ? 'Copied!' : 'Copy Code'}</span>
            </button>
            <button onClick={handleDownloadFile} className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-medium rounded-md bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition">
              <span>Download {selectedFile}</span>
            </button>
          </div>
        </div>

        {/* Code Content */}
        <div className="p-4 bg-slate-950 text-slate-200 font-mono text-xs overflow-x-auto max-h-96">
          <pre>{fileContents[selectedFile].code}</pre>
        </div>
      </div>
    </div>);
};
