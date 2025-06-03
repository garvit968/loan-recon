# Loan Reconciliation & Finance Chatbot AI System


An Interactive reconciliation application that that reconciles corporate loan disbursements and repayments from two uploaded CSV files. It leverages the use of Chat application for interaction using GenAI model systems.

## Table of Content
- Project Structure
- Prerequisites
- Installation 
- Data Description 
- Model Overview 
- Evaluating the Model 
- Results 

## Project Structure

```bash
loan-recon/src/
│
├── components/
│   └── ChatBot.tsx             # Chat Integration Script
│   ├── FileUplodaer.tsx        # Script to upload files
│   ├── ui                      # UI files/folder
│   └── ReconciliationResult.tsx# Script for Reconciling results from 2 uploaded files    
│
├── hooks/
│   └── use-mobile.tsx          # Script to check Mobile Application or Desktop Application
│   └── use-toast.ts            # Toast file for error logs
│
├── utils/
│   └── reconciliation.ts       # Reconciliation script
│
├── requirements.txt            # Python dependencies
└── package.json                # Dependencies Versions


```


## Installation

1. Install Dependencies 
```bash
npm i
```
2. Start the development server with auto-reloading and an instant preview.
```bash
npm run dev
```

## Usage

Upload the file containing the company/firm name and the 'loan_amount' column and other file containing firm/company name and 'payment_amount' column for matching. Use AI Assistant to derive insights from the results. Happy Reconciling and Settling
