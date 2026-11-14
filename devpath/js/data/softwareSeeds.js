/**
 * DEVPATH // Software Domain Seeds
 * ------------------------------------------------------------------
 * What a software project CONTAINS and DOES — document management, OCR,
 * finance, AI prediction, inventory, CRM, scheduling — expressed as a
 * recursive graph the user walks to build their own path.
 *
 * Technology is NOT offered at the top. It becomes reachable only after a
 * product decision implies it (persistence needs a database, auth needs a
 * session store). This is enforced by the validator, not by convention.
 *
 * Entry ids are exported as SOFTWARE_ENTRY_IDS and wired up in
 * js/knowledge.js. No other file needs to change to add a domain.
 */

import { NODE_KINDS as K } from "./nodeTypes.js";

/**
 * Entry seeds offered once SOFTWARE is chosen. These are DOMAINS (what
 * the software is for), not technologies — implementation only becomes
 * reachable after a domain decision implies it.
 */
export const SOFTWARE_ENTRY_IDS = [
  "sw-documents", "sw-finance", "sw-ai", "sw-inventory", "sw-crm",
  "sw-scheduling", "sw-media", "sw-devtools", "sw-collab",
  "sw-security", "sw-automation", "sw-education", "sw-health",
  "sw-realestate", "sw-travel", "sw-social"
];

export const SOFTWARE_SEEDS = [  /* ══════════════════════════════════════════════════════════════
     DOCUMENT MANAGEMENT
     SOFTWARE → DOCUMENT MANAGEMENT → OCR READING → UPLOAD
             → EXTRACTION → SEARCH → ORGANIZATION → TAGGING
             → PREVIEW → EXPORT
     ══════════════════════════════════════════════════════════════ */
  {
    id: "sw-documents",
    kind: K.DOMAIN,
    title: "Document Management",
    category: "DOMAIN",
    tagline: "Store, find and process documents",
    description: "Ingest documents, extract their contents, and make them searchable.",
    iconId: "document",
    unlocks: ["doc-ocr", "doc-ingest", "doc-library", "doc-preview", "doc-export", "doc-collab", "doc-compliance"]
  },
  {
    id: "doc-ocr",
    kind: K.FEATURE,
    title: "OCR Reading",
    category: "FEATURE",
    tagline: "Text extraction from images and scans",
    description: "Recognise text inside scanned documents so they become searchable.",
    iconId: "scan",
    unlocks: ["ocr-upload", "ocr-preprocess", "ocr-engine", "ocr-confidence", "doc-search"]
  },
  {
    id: "ocr-upload",
    kind: K.FLOW,
    title: "Document Upload",
    category: "FLOW",
    tagline: "Bring documents in",
    description: "Drag-and-drop, bulk upload, or watched-folder ingestion.",
    iconId: "upload",
    unlocks: ["ocr-formats", "ocr-batch", "upload-resume"]
  },
  {
    id: "ocr-formats",
    kind: K.SYSTEM,
    title: "Supported Formats",
    tagline: "PDF, images, Office documents",
    iconId: "file"
  },
  {
    id: "ocr-batch",
    kind: K.SYSTEM,
    title: "Batch Processing",
    tagline: "Many documents at once",
    technical: true,
    iconId: "automation"
  },
  {
    id: "upload-resume",
    kind: K.FEATURE,
    title: "Resumable Upload",
    tagline: "Large files survive interruptions",
    technical: true,
    iconId: "cloud"
  },
  {
    id: "ocr-preprocess",
    kind: K.SYSTEM,
    title: "Preprocessing",
    category: "SYSTEM",
    tagline: "Clean the image before reading",
    description: "Deskew, denoise and binarise — most OCR accuracy is won here, not in the recogniser.",
    iconId: "filter",
    unlocks: ["ocr-deskew", "ocr-denoise", "ocr-binarize"]
  },
  {
    id: "ocr-deskew",
    kind: K.TECHNOLOGY,
    title: "Deskew",
    tagline: "Straighten rotated pages",
    technical: true,
    iconId: "rotate"
  },
  {
    id: "ocr-denoise",
    kind: K.TECHNOLOGY,
    title: "Denoise",
    tagline: "Remove scanning artefacts",
    technical: true,
    iconId: "filter"
  },
  {
    id: "ocr-binarize",
    kind: K.TECHNOLOGY,
    title: "Binarisation",
    tagline: "Black and white thresholding",
    technical: true,
    iconId: "contrast"
  },
  {
    id: "ocr-engine",
    kind: K.TECHNOLOGY,
    title: "OCR Engine",
    category: "TECHNOLOGY",
    tagline: "The recogniser itself",
    description: "Only offered once you have decided you need OCR — never up front.",
    technical: true,
    iconId: "engine",
    unlocks: ["ocr-tesseract", "ocr-cloud-vision", "ocr-vision-llm", "ocr-paddle"]
  },
  {
    id: "ocr-tesseract",
    kind: K.TECHNOLOGY,
    title: "Tesseract",
    tagline: "Local, open-source OCR",
    technical: true,
    iconId: "engine"
  },
  {
    id: "ocr-cloud-vision",
    kind: K.SERVICE,
    title: "Cloud Vision API",
    tagline: "Hosted OCR, high accuracy",
    technical: true,
    iconId: "cloud"
  },
  {
    id: "ocr-vision-llm",
    kind: K.SERVICE,
    title: "Vision LLM",
    tagline: "OCR via a multimodal model",
    description: "Handles messy layouts and handwriting better than classic OCR, at higher cost.",
    technical: true,
    iconId: "ai"
  },
  {
    id: "ocr-paddle",
    kind: K.TECHNOLOGY,
    title: "PaddleOCR",
    tagline: "Strong on layout analysis",
    technical: true,
    iconId: "engine"
  },
  {
    id: "ocr-confidence",
    kind: K.FEATURE,
    title: "Confidence Scoring",
    tagline: "Flag uncertain extractions",
    description: "Low-confidence pages go to human review instead of silently corrupting search.",
    iconId: "check",
    unlocks: ["ocr-review-queue", "ocr-handoff"]
  },
  {
    id: "ocr-review-queue",
    kind: K.FLOW,
    title: "Human Review Queue",
    tagline: "Correct the uncertain pages",
    iconId: "users"
  },
  {
    id: "ocr-handoff",
    kind: K.INTEGRATION,
    title: "Send to LLM for Cleanup",
    tagline: "Model fixes broken extraction",
    technical: true,
    iconId: "ai"
  },
  {
    id: "doc-search",
    kind: K.FEATURE,
    title: "Search",
    category: "FEATURE",
    tagline: "Find text inside documents",
    description: "Full-text search across everything that has been extracted.",
    iconId: "search",
    unlocks: ["search-fulltext", "search-fuzzy", "search-semantic", "search-filters", "search-highlight"]
  },
  {
    id: "search-fulltext",
    kind: K.TECHNOLOGY,
    title: "Full-Text Index",
    tagline: "Keyword search",
    technical: true,
    iconId: "database"
  },
  {
    id: "search-fuzzy",
    kind: K.TECHNOLOGY,
    title: "Fuzzy Matching",
    tagline: "Typos and partial words",
    technical: true,
    iconId: "search"
  },
  {
    id: "search-semantic",
    kind: K.TECHNOLOGY,
    title: "Semantic Search",
    tagline: "Meaning, not keywords",
    description: "Vector embeddings let users search by concept rather than exact wording.",
    technical: true,
    iconId: "ai",
    unlocks: ["embeddings-model", "vector-store"]
  },
  {
    id: "embeddings-model",
    kind: K.TECHNOLOGY,
    title: "Embedding Model",
    tagline: "Turning text into vectors",
    technical: true,
    iconId: "ai"
  },
  {
    id: "vector-store",
    kind: K.DATABASE,
    title: "Vector Store",
    tagline: "Similarity search index",
    technical: true,
    iconId: "database",
    unlocks: ["vec-pgvector", "vec-qdrant", "vec-chroma"]
  },
  {
    id: "vec-pgvector",
    kind: K.DATABASE,
    title: "pgvector",
    tagline: "Vectors inside Postgres",
    technical: true,
    iconId: "database"
  },
  {
    id: "vec-qdrant",
    kind: K.DATABASE,
    title: "Qdrant",
    tagline: "Purpose-built vector engine",
    technical: true,
    iconId: "database"
  },
  {
    id: "vec-chroma",
    kind: K.DATABASE,
    title: "Chroma",
    tagline: "Lightweight local vectors",
    technical: true,
    iconId: "database"
  },
  {
    id: "search-filters",
    kind: K.FEATURE,
    title: "Faceted Filters",
    tagline: "Narrow by metadata",
    iconId: "filter"
  },
  {
    id: "search-highlight",
    kind: K.FEATURE,
    title: "Match Highlighting",
    tagline: "Show where it matched",
    iconId: "search"
  },
  {
    id: "doc-ingest",
    kind: K.FEATURE,
    title: "Text Extraction",
    category: "FEATURE",
    tagline: "Pull structured data out",
    iconId: "extract",
    unlocks: ["doc-parsing", "doc-tables", "doc-forms", "doc-metadata-extract"]
  },
  {
    id: "doc-parsing",
    kind: K.TECHNOLOGY,
    title: "Document Parser",
    tagline: "Layout-aware reading",
    technical: true,
    iconId: "engine"
  },
  {
    id: "doc-tables",
    kind: K.FEATURE,
    title: "Table Extraction",
    tagline: "Structured data from tables",
    technical: true,
    iconId: "table"
  },
  {
    id: "doc-forms",
    kind: K.FEATURE,
    title: "Form Field Mapping",
    tagline: "Key-value pairs from forms",
    technical: true,
    iconId: "form"
  },
  {
    id: "doc-metadata-extract",
    kind: K.FEATURE,
    title: "Metadata Capture",
    tagline: "Author, date, page count",
    iconId: "tag"
  },
  {
    id: "doc-library",
    kind: K.FEATURE,
    title: "File Organization",
    category: "FEATURE",
    tagline: "Structure and navigation",
    iconId: "folder",
    unlocks: ["doc-folders", "doc-tagging", "doc-versioning", "doc-duplicates", "doc-bulk-actions"]
  },
  {
    id: "doc-folders",
    kind: K.SYSTEM,
    title: "Folder Hierarchy",
    tagline: "Nested manual structure",
    iconId: "folder"
  },
  {
    id: "doc-tagging",
    kind: K.FEATURE,
    title: "Tagging",
    category: "FEATURE",
    tagline: "Flexible labels",
    description: "Flat or nested tags applied across documents — usually better than deep folders.",
    iconId: "tag",
    unlocks: ["tag-auto", "tag-bulk", "tag-smart-folders"]
  },
  {
    id: "tag-auto",
    kind: K.FEATURE,
    title: "Auto-Tagging",
    tagline: "Tag from content",
    technical: true,
    iconId: "ai"
  },
  {
    id: "tag-bulk",
    kind: K.FEATURE,
    title: "Bulk Tagging",
    tagline: "Tag many at once",
    iconId: "check"
  },
  {
    id: "tag-smart-folders",
    kind: K.SYSTEM,
    title: "Smart Folders",
    tagline: "Folders defined by a query",
    iconId: "folder"
  },
  {
    id: "doc-versioning",
    kind: K.SYSTEM,
    title: "Version History",
    tagline: "Track document revisions",
    iconId: "history",
    unlocks: ["ver-diff", "ver-restore"]
  },
  {
    id: "ver-diff",
    kind: K.FEATURE,
    title: "Version Diff",
    tagline: "What changed",
    iconId: "diff"
  },
  {
    id: "ver-restore",
    kind: K.FEATURE,
    title: "Restore Previous",
    tagline: "Roll back a document",
    iconId: "history"
  },
  {
    id: "doc-duplicates",
    kind: K.SYSTEM,
    title: "Duplicate Detection",
    tagline: "Find and merge copies",
    technical: true,
    iconId: "copy"
  },
  {
    id: "doc-bulk-actions",
    kind: K.FEATURE,
    title: "Bulk Operations",
    tagline: "Move, rename, delete in bulk",
    iconId: "check"
  },
  {
    id: "doc-preview",
    kind: K.FEATURE,
    title: "Preview",
    category: "FEATURE",
    tagline: "View without downloading",
    iconId: "eye",
    unlocks: ["preview-inline", "preview-annotate", "preview-compare"]
  },
  {
    id: "preview-inline",
    kind: K.FEATURE,
    title: "Inline Viewer",
    tagline: "Render in the browser",
    iconId: "eye"
  },
  {
    id: "preview-annotate",
    kind: K.FEATURE,
    title: "Annotation",
    tagline: "Highlight and comment",
    iconId: "pen"
  },
  {
    id: "preview-compare",
    kind: K.FEATURE,
    title: "Side-by-Side Compare",
    tagline: "Two documents at once",
    iconId: "diff"
  },
  {
    id: "doc-export",
    kind: K.FEATURE,
    title: "Export",
    category: "FEATURE",
    tagline: "Get documents out",
    iconId: "download",
    unlocks: ["export-pdf", "export-docx", "export-csv", "export-api", "export-zip"]
  },
  {
    id: "export-pdf",
    kind: K.FEATURE,
    title: "PDF Export",
    tagline: "Share as PDF",
    iconId: "download"
  },
  {
    id: "export-docx",
    kind: K.FEATURE,
    title: "Word Export",
    tagline: "Share as DOCX",
    iconId: "download"
  },
  {
    id: "export-csv",
    kind: K.FEATURE,
    title: "CSV Export",
    tagline: "Data as spreadsheet",
    iconId: "table"
  },
  {
    id: "export-api",
    kind: K.INTEGRATION,
    title: "API Access",
    tagline: "Pull data programmatically",
    technical: true,
    iconId: "api"
  },
  {
    id: "export-zip",
    kind: K.FEATURE,
    title: "Bulk Download",
    tagline: "Archive as ZIP",
    iconId: "download"
  },
  {
    id: "doc-collab",
    kind: K.FEATURE,
    title: "Team Collaboration",
    category: "FEATURE",
    tagline: "Work together on documents",
    iconId: "users",
    unlocks: ["collab-comments", "collab-assign", "collab-activity", "doc-sharing"]
  },
  {
    id: "collab-comments",
    kind: K.FEATURE,
    title: "Comments & Mentions",
    tagline: "Discuss in context",
    iconId: "comment"
  },
  {
    id: "collab-assign",
    kind: K.FEATURE,
    title: "Task Assignment",
    tagline: "Who reviews what",
    iconId: "check"
  },
  {
    id: "collab-activity",
    kind: K.SYSTEM,
    title: "Activity Feed",
    tagline: "Audit trail",
    iconId: "history"
  },
  {
    id: "doc-sharing",
    kind: K.FEATURE,
    title: "Sharing Links",
    tagline: "Send access, not files",
    iconId: "share",
    unlocks: ["share-permission", "share-expiry"]
  },
  {
    id: "share-permission",
    kind: K.SYSTEM,
    title: "Permission Levels",
    tagline: "View vs edit",
    iconId: "lock"
  },
  {
    id: "share-expiry",
    kind: K.SYSTEM,
    title: "Expiring Links",
    tagline: "Access that ends",
    iconId: "clock"
  },
  {
    id: "doc-compliance",
    kind: K.SYSTEM,
    title: "Compliance & Retention",
    category: "SYSTEM",
    tagline: "Legal and audit obligations",
    iconId: "shield",
    unlocks: ["comp-audit-log", "comp-retention", "comp-redaction", "doc-encryption"]
  },
  {
    id: "comp-audit-log",
    kind: K.SYSTEM,
    title: "Audit Logging",
    tagline: "Who did what, when",
    iconId: "history"
  },
  {
    id: "comp-retention",
    kind: K.SYSTEM,
    title: "Retention Policies",
    tagline: "Auto-delete after N days",
    iconId: "clock"
  },
  {
    id: "comp-redaction",
    kind: K.FEATURE,
    title: "Redaction",
    tagline: "Permanently hide sensitive text",
    iconId: "lock"
  },
  {
    id: "doc-encryption",
    kind: K.SECURITY,
    title: "Encryption at Rest",
    tagline: "Documents encrypted on disk",
    technical: true,
    iconId: "lock"
  },
  /* ══════════════════════════════════════════════════════════════
     FINANCE
     SOFTWARE → FINANCE → CASH MANAGEMENT → INCOME → EXPENSES
             → TRANSACTIONS → BUDGETS → CATEGORIES
             → MONTHLY REPORTS → CASH FLOW
     ══════════════════════════════════════════════════════════════ */
  {
    id: "sw-finance",
    kind: K.DOMAIN,
    title: "Finance",
    category: "DOMAIN",
    tagline: "Track money in and out",
    description: "Accounts, transactions, budgets and reporting.",
    iconId: "finance",
    unlocks: ["fin-cash", "fin-accounts", "fin-billing", "fin-investing", "fin-tax", "fin-fraud"]
  },
  {
    id: "fin-cash",
    kind: K.FEATURE,
    title: "Cash Management",
    category: "FEATURE",
    tagline: "Where the money actually is",
    description: "Record every movement of cash and keep balances correct.",
    iconId: "finance",
    unlocks: ["fin-income", "fin-expenses", "fin-transactions", "fin-budgets", "fin-categories", "fin-reports", "fin-cashflow"]
  },
  {
    id: "fin-income",
    kind: K.FEATURE,
    title: "Income",
    tagline: "Money coming in",
    iconId: "trendUp",
    unlocks: ["income-source", "income-recurring"]
  },
  {
    id: "income-source",
    kind: K.DATA,
    title: "Income Sources",
    tagline: "Salary, sales, interest",
    iconId: "database"
  },
  {
    id: "income-recurring",
    kind: K.SYSTEM,
    title: "Recurring Income",
    tagline: "Scheduled arrivals",
    iconId: "clock"
  },
  {
    id: "fin-expenses",
    kind: K.FEATURE,
    title: "Expenses",
    tagline: "Money going out",
    iconId: "trendDown",
    unlocks: ["expense-entry", "expense-receipts", "expense-recurring"]
  },
  {
    id: "expense-entry",
    kind: K.FLOW,
    title: "Expense Entry",
    tagline: "Record a spend",
    iconId: "form"
  },
  {
    id: "expense-receipts",
    kind: K.FEATURE,
    title: "Receipt Capture",
    tagline: "Attach proof of purchase",
    description: "Reuses the OCR branch — receipts are just another document to read.",
    iconId: "scan",
    unlocks: ["doc-ocr"]
  },
  {
    id: "expense-recurring",
    kind: K.SYSTEM,
    title: "Recurring Expenses",
    tagline: "Subscriptions and bills",
    iconId: "clock"
  },
  {
    id: "fin-transactions",
    kind: K.FEATURE,
    title: "Transactions",
    category: "FEATURE",
    tagline: "The ledger itself",
    description: "Every entry, immutable and ordered. The core record of the system.",
    iconId: "list",
    unlocks: ["tx-ledger", "tx-import", "tx-reconcile", "tx-search", "tx-attachments"]
  },
  {
    id: "tx-ledger",
    kind: K.DATA,
    title: "Transaction Ledger",
    tagline: "Append-only record",
    description: "Append-only is what makes financial data trustworthy — corrections are new entries, not edits.",
    iconId: "database"
  },
  {
    id: "tx-import",
    kind: K.INTEGRATION,
    title: "Bank Feed Import",
    tagline: "Pull statements automatically",
    technical: true,
    iconId: "api",
    unlocks: ["import-ofx", "import-plaid", "import-csv-bank"]
  },
  {
    id: "import-ofx",
    kind: K.INTEGRATION,
    title: "OFX / QIF Import",
    tagline: "Standard bank file formats",
    technical: true,
    iconId: "file"
  },
  {
    id: "import-plaid",
    kind: K.SERVICE,
    title: "Plaid",
    tagline: "Direct bank connectivity",
    technical: true,
    iconId: "api"
  },
  {
    id: "import-csv-bank",
    kind: K.FEATURE,
    title: "CSV Import",
    tagline: "Manual statement upload",
    technical: true,
    iconId: "upload"
  },
  {
    id: "tx-reconcile",
    kind: K.FEATURE,
    title: "Reconciliation",
    tagline: "Match records to reality",
    description: "The job users actually hate — automate the matching and the product wins.",
    iconId: "check",
    unlocks: ["recon-auto-match", "recon-manual"]
  },
  {
    id: "recon-auto-match",
    kind: K.SYSTEM,
    title: "Auto-Matching",
    tagline: "Suggest likely pairs",
    technical: true,
    iconId: "automation"
  },
  {
    id: "recon-manual",
    kind: K.FLOW,
    title: "Manual Matching",
    tagline: "Human confirms",
    iconId: "users"
  },
  {
    id: "tx-search",
    kind: K.FEATURE,
    title: "Transaction Search",
    tagline: "Find any entry",
    iconId: "search"
  },
  {
    id: "tx-attachments",
    kind: K.FEATURE,
    title: "Attachments",
    tagline: "Link documents to entries",
    iconId: "paperclip"
  },
  {
    id: "fin-budgets",
    kind: K.FEATURE,
    title: "Budgets",
    category: "FEATURE",
    tagline: "Plan spending limits",
    iconId: "target",
    unlocks: ["budget-period", "budget-envelope", "budget-alerts", "budget-rollover"]
  },
  {
    id: "budget-period",
    kind: K.RULE,
    title: "Budget Period",
    tagline: "Monthly, weekly, custom",
    iconId: "clock"
  },
  {
    id: "budget-envelope",
    kind: K.RULE,
    title: "Envelope Method",
    tagline: "Allocate every unit of currency",
    description: "Zero-based budgeting — every amount is assigned a job.",
    iconId: "folder"
  },
  {
    id: "budget-alerts",
    kind: K.FEATURE,
    title: "Overspend Alerts",
    tagline: "Warn before the limit",
    iconId: "bell",
    unlocks: ["notify-push", "notify-email"]
  },
  {
    id: "budget-rollover",
    kind: K.RULE,
    title: "Rollover",
    tagline: "Carry leftovers forward",
    iconId: "refresh"
  },
  {
    id: "fin-categories",
    kind: K.FEATURE,
    title: "Categories",
    category: "FEATURE",
    tagline: "Classify every transaction",
    iconId: "tag",
    unlocks: ["cat-hierarchy", "cat-auto-rule", "cat-ml"]
  },
  {
    id: "cat-hierarchy",
    kind: K.DATA,
    title: "Category Tree",
    tagline: "Parent and child categories",
    iconId: "folder"
  },
  {
    id: "cat-auto-rule",
    kind: K.SYSTEM,
    title: "Rule-Based Assignment",
    tagline: "If merchant matches, then category",
    technical: true,
    iconId: "rule"
  },
  {
    id: "cat-ml",
    kind: K.FEATURE,
    title: "Automatic Categorisation",
    tagline: "Model predicts the category",
    technical: true,
    iconId: "ai"
  },
  {
    id: "fin-reports",
    kind: K.FEATURE,
    title: "Reports",
    category: "FEATURE",
    tagline: "Understand the numbers",
    iconId: "chart",
    unlocks: ["rep-monthly", "rep-income-statement", "rep-balance", "rep-export", "rep-dashboard"]
  },
  {
    id: "rep-monthly",
    kind: K.FEATURE,
    title: "Monthly Report",
    tagline: "The standard summary",
    iconId: "calendar"
  },
  {
    id: "rep-income-statement",
    kind: K.FEATURE,
    title: "Income Statement",
    tagline: "Profit and loss",
    iconId: "chart"
  },
  {
    id: "rep-balance",
    kind: K.FEATURE,
    title: "Balance Sheet",
    tagline: "Assets and liabilities",
    iconId: "table"
  },
  {
    id: "rep-export",
    kind: K.FEATURE,
    title: "Report Export",
    tagline: "PDF and spreadsheet",
    unlocks: ["export-pdf", "export-csv"],
    iconId: "download"
  },
  {
    id: "rep-dashboard",
    kind: K.FEATURE,
    title: "Financial Dashboard",
    tagline: "Live overview",
    iconId: "chart"
  },
  {
    id: "fin-cashflow",
    kind: K.FEATURE,
    title: "Cash Flow",
    category: "FEATURE",
    tagline: "Money movement over time",
    description: "Forecast what is coming rather than only reporting what happened.",
    iconId: "flow",
    unlocks: ["cf-projection", "cf-runway", "cf-scenarios"]
  },
  {
    id: "cf-projection",
    kind: K.FEATURE,
    title: "Cash Flow Projection",
    tagline: "Forecast future balance",
    iconId: "trendUp"
  },
  {
    id: "cf-runway",
    kind: K.FEATURE,
    title: "Runway Calculation",
    tagline: "How long the money lasts",
    iconId: "clock"
  },
  {
    id: "cf-scenarios",
    kind: K.FEATURE,
    title: "Scenario Planning",
    tagline: "What if spending changes",
    iconId: "target"
  },
  {
    id: "fin-accounts",
    kind: K.FEATURE,
    title: "Multi-Account",
    category: "FEATURE",
    tagline: "Several accounts at once",
    iconId: "wallet",
    unlocks: ["acct-types", "acct-transfer", "acct-multi-currency"]
  },
  {
    id: "acct-types",
    kind: K.DATA,
    title: "Account Types",
    tagline: "Checking, savings, credit, cash",
    iconId: "database"
  },
  {
    id: "acct-transfer",
    kind: K.FEATURE,
    title: "Transfers",
    tagline: "Move between accounts",
    iconId: "refresh"
  },
  {
    id: "acct-multi-currency",
    kind: K.FEATURE,
    title: "Multi-Currency",
    tagline: "Hold more than one currency",
    unlocks: ["fx-rates", "fx-conversion"],
    iconId: "globe"
  },
  {
    id: "fx-rates",
    kind: K.INTEGRATION,
    title: "Exchange Rates",
    tagline: "Live conversion data",
    technical: true,
    iconId: "api"
  },
  {
    id: "fx-conversion",
    kind: K.SYSTEM,
    title: "Conversion Handling",
    tagline: "Which rate applied, and when",
    technical: true,
    iconId: "refresh"
  },
  {
    id: "fin-billing",
    kind: K.FEATURE,
    title: "Invoicing & Billing",
    category: "FEATURE",
    tagline: "Charge other people",
    iconId: "invoice",
    unlocks: ["bill-invoice", "bill-recurring", "bill-payments", "bill-dunning"]
  },
  {
    id: "bill-invoice",
    kind: K.FEATURE,
    title: "Invoices",
    tagline: "Issue and track",
    unlocks: ["export-pdf"],
    iconId: "invoice"
  },
  {
    id: "bill-recurring",
    kind: K.SYSTEM,
    title: "Subscription Billing",
    tagline: "Recurring charges",
    iconId: "refresh"
  },
  {
    id: "bill-payments",
    kind: K.INTEGRATION,
    title: "Payment Collection",
    tagline: "Take the money",
    technical: true,
    unlocks: ["pay-stripe", "pay-paypal", "pay-bank-transfer"],
    iconId: "card"
  },
  {
    id: "pay-stripe",
    kind: K.SERVICE,
    title: "Stripe",
    tagline: "Cards, wallets, subscriptions",
    technical: true,
    iconId: "card"
  },
  {
    id: "pay-paypal",
    kind: K.SERVICE,
    title: "PayPal",
    tagline: "Widely recognised checkout",
    technical: true,
    iconId: "card"
  },
  {
    id: "pay-bank-transfer",
    kind: K.INTEGRATION,
    title: "Bank Transfer",
    tagline: "Manual reconciliation",
    technical: true,
    iconId: "wallet"
  },
  {
    id: "bill-dunning",
    kind: K.FLOW,
    title: "Failed Payment Recovery",
    tagline: "Retry and remind",
    iconId: "bell"
  },
  {
    id: "fin-investing",
    kind: K.FEATURE,
    title: "Investments",
    category: "FEATURE",
    tagline: "Track holdings and value",
    iconId: "trendUp",
    unlocks: ["invf-holdings", "invf-prices", "invf-performance", "invf-dividends"]
  },
  {
    id: "invf-holdings",
    kind: K.DATA,
    title: "Holdings",
    tagline: "What is owned",
    iconId: "database"
  },
  {
    id: "invf-prices",
    kind: K.INTEGRATION,
    title: "Market Data",
    tagline: "Live and historical prices",
    technical: true,
    iconId: "api"
  },
  {
    id: "invf-performance",
    kind: K.FEATURE,
    title: "Performance Tracking",
    tagline: "Return over time",
    iconId: "chart"
  },
  {
    id: "invf-dividends",
    kind: K.FEATURE,
    title: "Dividends & Interest",
    tagline: "Income from holdings",
    iconId: "finance"
  },
  {
    id: "fin-tax",
    kind: K.FEATURE,
    title: "Tax Support",
    category: "FEATURE",
    tagline: "Make filing survivable",
    iconId: "receipt",
    unlocks: ["tax-categories", "tax-export", "tax-estimate", "tax-jurisdiction"]
  },
  {
    id: "tax-categories",
    kind: K.DATA,
    title: "Tax Categories",
    tagline: "Deductible vs not",
    iconId: "tag"
  },
  {
    id: "tax-export",
    kind: K.FEATURE,
    title: "Tax Export",
    tagline: "Hand off to an accountant",
    unlocks: ["export-csv", "export-pdf"],
    iconId: "download"
  },
  {
    id: "tax-estimate",
    kind: K.FEATURE,
    title: "Tax Estimation",
    tagline: "Estimate what is owed",
    iconId: "calculator"
  },
  {
    id: "tax-jurisdiction",
    kind: K.RULE,
    title: "Multi-Jurisdiction",
    tagline: "Different rules per region",
    iconId: "globe"
  },
  {
    id: "fin-fraud",
    kind: K.FEATURE,
    title: "Fraud & Anomalies",
    category: "FEATURE",
    tagline: "Catch what looks wrong",
    iconId: "shield",
    unlocks: ["fraud-anomaly", "fraud-duplicate", "fraud-alerts"]
  },
  {
    id: "fraud-anomaly",
    kind: K.FEATURE,
    title: "Anomaly Detection",
    tagline: "Flag unusual spending",
    technical: true,
    iconId: "ai"
  },
  {
    id: "fraud-duplicate",
    kind: K.SYSTEM,
    title: "Duplicate Charge Detection",
    tagline: "Same charge twice",
    technical: true,
    iconId: "copy"
  },
  {
    id: "fraud-alerts",
    kind: K.FEATURE,
    title: "Fraud Alerts",
    tagline: "Tell someone immediately",
    iconId: "bell",
    unlocks: ["notify-push", "notify-email"]
  },
  /* ══════════════════════════════════════════════════════════════
     AI PREDICTION
     SOFTWARE → AI PREDICTION → DATA INPUT → MODEL → PREDICTION
             → CONFIDENCE → HISTORY → ANALYTICS → REPORT
     ══════════════════════════════════════════════════════════════ */
  {
    id: "sw-ai",
    kind: K.DOMAIN,
    title: "AI Prediction",
    category: "DOMAIN",
    tagline: "Predict an outcome from data",
    description: "Collect inputs, model them, and return a forecast with a confidence.",
    iconId: "ai",
    unlocks: ["ai-input", "ai-model", "ai-output", "ai-monitoring", "ai-ethics"]
  },
  {
    id: "ai-input",
    kind: K.FLOW,
    title: "Data Input",
    category: "FLOW",
    tagline: "What the model sees",
    description: "Every prediction system lives or dies on what goes in.",
    iconId: "input",
    unlocks: ["input-manual", "input-api", "input-batch", "input-stream", "input-validation"]
  },
  {
    id: "input-manual",
    kind: K.SCREEN,
    title: "Manual Entry",
    tagline: "User types the values",
    iconId: "form"
  },
  {
    id: "input-api",
    kind: K.INTEGRATION,
    title: "API Ingestion",
    tagline: "Systems submit data",
    technical: true,
    iconId: "api"
  },
  {
    id: "input-batch",
    kind: K.FEATURE,
    title: "Batch Import",
    tagline: "Process a dataset at once",
    technical: true,
    iconId: "upload"
  },
  {
    id: "input-stream",
    kind: K.SYSTEM,
    title: "Streaming Input",
    tagline: "Continuous real-time data",
    technical: true,
    iconId: "flow"
  },
  {
    id: "input-validation",
    kind: K.SYSTEM,
    title: "Input Validation",
    tagline: "Reject impossible values",
    iconId: "check"
  },
  {
    id: "ai-model",
    kind: K.FEATURE,
    title: "Model",
    category: "FEATURE",
    tagline: "The thing doing the predicting",
    iconId: "brain",
    unlocks: ["model-approach", "model-training", "model-features", "model-versioning"]
  },
  {
    id: "model-approach",
    kind: K.CONCEPT,
    title: "Model Approach",
    category: "CONCEPT",
    tagline: "How prediction works",
    group: "model-approach",
    unlocks: ["model-rule-based", "model-classical-ml", "model-deep", "model-llm", "model-hybrid"]
  },
  {
    id: "model-rule-based",
    kind: K.TECHNOLOGY,
    title: "Rule-Based Heuristic",
    tagline: "Explicit logic, no learning",
    description: "Wildly underrated. If the rules are simple and stable, this beats a model on every axis.",
    technical: true,
    iconId: "rule"
  },
  {
    id: "model-classical-ml",
    kind: K.TECHNOLOGY,
    title: "Classical ML",
    tagline: "Regression, trees, boosting",
    description: "Strong on tabular data, cheap to train, easy to explain.",
    technical: true,
    iconId: "chart",
    unlocks: ["ml-sklearn", "ml-xgboost", "ml-lightgbm"]
  },
  {
    id: "ml-sklearn",
    kind: K.FRAMEWORK,
    title: "scikit-learn",
    tagline: "Classic Python ML",
    technical: true,
    iconId: "engine"
  },
  {
    id: "ml-xgboost",
    kind: K.FRAMEWORK,
    title: "XGBoost",
    tagline: "Gradient boosting",
    technical: true,
    iconId: "engine"
  },
  {
    id: "ml-lightgbm",
    kind: K.FRAMEWORK,
    title: "LightGBM",
    tagline: "Fast gradient boosting",
    technical: true,
    iconId: "engine"
  },
  {
    id: "model-deep",
    kind: K.TECHNOLOGY,
    title: "Deep Learning",
    tagline: "Neural networks",
    description: "Worth it for images, audio and text. Usually overkill for tabular data.",
    technical: true,
    iconId: "brain",
    unlocks: ["dl-pytorch", "dl-tensorflow", "dl-gpu-hosting"]
  },
  {
    id: "dl-pytorch",
    kind: K.FRAMEWORK,
    title: "PyTorch",
    tagline: "Research-friendly framework",
    technical: true,
    iconId: "engine"
  },
  {
    id: "dl-tensorflow",
    kind: K.FRAMEWORK,
    title: "TensorFlow",
    tagline: "Production-oriented framework",
    technical: true,
    iconId: "engine"
  },
  {
    id: "dl-gpu-hosting",
    kind: K.INFRASTRUCTURE,
    title: "GPU Hosting",
    tagline: "Where training runs",
    technical: true,
    iconId: "cloud"
  },
  {
    id: "model-llm",
    kind: K.SERVICE,
    title: "LLM / Foundation Model",
    tagline: "Prompt a large model",
    description: "Fastest to prototype, highest per-call cost, least control.",
    technical: true,
    iconId: "ai",
    unlocks: ["llm-hosted", "llm-self-hosted", "llm-finetune"]
  },
  {
    id: "llm-hosted",
    kind: K.SERVICE,
    title: "Hosted API",
    tagline: "Call someone else's model",
    technical: true,
    iconId: "cloud"
  },
  {
    id: "llm-self-hosted",
    kind: K.INFRASTRUCTURE,
    title: "Self-Hosted Model",
    tagline: "Run the weights yourself",
    technical: true,
    iconId: "server"
  },
  {
    id: "llm-finetune",
    kind: K.FEATURE,
    title: "Fine-Tuning",
    tagline: "Adapt a base model",
    technical: true,
    iconId: "brain"
  },
  {
    id: "model-hybrid",
    kind: K.CONCEPT,
    title: "Hybrid",
    tagline: "Rules guard a learned model",
    description: "Often the pragmatic answer: the model predicts, deterministic rules constrain it.",
    technical: true,
    iconId: "system"
  },
  {
    id: "model-training",
    kind: K.FLOW,
    title: "Training Pipeline",
    tagline: "How the model learns",
    technical: true,
    unlocks: ["train-dataset", "train-evaluation", "train-retrain"]
  },
  {
    id: "train-dataset",
    kind: K.DATA,
    title: "Training Dataset",
    tagline: "Labelled examples",
    iconId: "database"
  },
  {
    id: "train-evaluation",
    kind: K.FEATURE,
    title: "Evaluation Metrics",
    tagline: "Precision, recall, error",
    iconId: "chart"
  },
  {
    id: "train-retrain",
    kind: K.SYSTEM,
    title: "Retraining Schedule",
    tagline: "Keep the model current",
    iconId: "refresh"
  },
  {
    id: "model-features",
    kind: K.SYSTEM,
    title: "Feature Engineering",
    tagline: "Turning raw data into signals",
    technical: true,
    iconId: "database"
  },
  {
    id: "model-versioning",
    kind: K.SYSTEM,
    title: "Model Versioning",
    tagline: "Which model made this prediction",
    technical: true,
    iconId: "history"
  },
  {
    id: "ai-output",
    kind: K.FEATURE,
    title: "Prediction Output",
    category: "FEATURE",
    tagline: "What the user receives",
    iconId: "output",
    unlocks: ["ai-prediction", "ai-confidence", "ai-explanation", "ai-history"]
  },
  {
    id: "ai-prediction",
    kind: K.FEATURE,
    title: "Prediction",
    tagline: "The answer itself",
    iconId: "target"
  },
  {
    id: "ai-confidence",
    kind: K.FEATURE,
    title: "Confidence Score",
    category: "FEATURE",
    tagline: "How sure the model is",
    description: "Users make better decisions with a calibrated confidence than with a bare number.",
    iconId: "gauge",
    unlocks: ["conf-calibration", "conf-threshold", "conf-uncertainty"]
  },
  {
    id: "conf-calibration",
    kind: K.SYSTEM,
    title: "Calibration",
    tagline: "80% confidence should be right 80% of the time",
    technical: true,
    iconId: "gauge"
  },
  {
    id: "conf-threshold",
    kind: K.RULE,
    title: "Decision Threshold",
    tagline: "Below this, do not act",
    iconId: "rule"
  },
  {
    id: "conf-uncertainty",
    kind: K.FEATURE,
    title: "Uncertainty Bands",
    tagline: "A range, not a point",
    technical: true,
    iconId: "chart"
  },
  {
    id: "ai-explanation",
    kind: K.FEATURE,
    title: "Explainability",
    tagline: "Why this prediction",
    description: "Increasingly a legal requirement, not a nice-to-have.",
    iconId: "info",
    unlocks: ["explain-feature-importance", "explain-shap", "explain-counterfactual"]
  },
  {
    id: "explain-feature-importance",
    kind: K.FEATURE,
    title: "Feature Importance",
    tagline: "What mattered most",
    iconId: "chart"
  },
  {
    id: "explain-shap",
    kind: K.TECHNOLOGY,
    title: "SHAP Values",
    tagline: "Per-prediction attribution",
    technical: true,
    iconId: "chart"
  },
  {
    id: "explain-counterfactual",
    kind: K.FEATURE,
    title: "Counterfactuals",
    tagline: "What would change the answer",
    technical: true,
    iconId: "target"
  },
  {
    id: "ai-history",
    kind: K.FEATURE,
    title: "Prediction History",
    category: "FEATURE",
    tagline: "Past predictions and outcomes",
    iconId: "history",
    unlocks: ["hist-store", "hist-outcome-feedback", "hist-drift"]
  },
  {
    id: "hist-store",
    kind: K.DATA,
    title: "Prediction Log",
    tagline: "Every prediction kept",
    description: "Without the log you cannot measure accuracy, and without accuracy you cannot improve.",
    iconId: "database"
  },
  {
    id: "hist-outcome-feedback",
    kind: K.FLOW,
    title: "Outcome Feedback",
    tagline: "Did it turn out right",
    iconId: "refresh"
  },
  {
    id: "hist-drift",
    kind: K.FEATURE,
    title: "Drift Detection",
    tagline: "When reality moves away from the model",
    technical: true,
    iconId: "alert"
  },
  {
    id: "ai-monitoring",
    kind: K.FEATURE,
    title: "Analytics",
    category: "FEATURE",
    tagline: "Measure the system",
    iconId: "chart",
    unlocks: ["ai-accuracy-dash", "ai-latency", "ai-cost", "ai-alerts"]
  },
  {
    id: "ai-accuracy-dash",
    kind: K.FEATURE,
    title: "Accuracy Dashboard",
    tagline: "Is it still working",
    iconId: "gauge",
    unlocks: ["mon-datadog", "mon-grafana", "mon-sentry"]
  },
  {
    id: "ai-latency",
    kind: K.FEATURE,
    title: "Latency Tracking",
    tagline: "Inference speed",
    technical: true,
    iconId: "clock"
  },
  {
    id: "ai-cost",
    kind: K.FEATURE,
    title: "Cost Tracking",
    tagline: "Per-prediction spend",
    description: "The thing that kills LLM products in production.",
    technical: true,
    iconId: "finance"
  },
  {
    id: "ai-alerts",
    kind: K.FEATURE,
    title: "Degradation Alerts",
    tagline: "Tell someone when it breaks",
    iconId: "bell",
    unlocks: ["notify-email", "notify-webhook"]
  },
  {
    id: "ai-ethics",
    kind: K.SYSTEM,
    title: "Responsible AI",
    category: "SYSTEM",
    tagline: "Bias, consent and oversight",
    iconId: "shield",
    unlocks: ["ethics-bias-audit", "ethics-consent", "ethics-human-override"]
  },
  {
    id: "ethics-bias-audit",
    kind: K.SYSTEM,
    title: "Bias Audit",
    tagline: "Check fairness across groups",
    iconId: "shield"
  },
  {
    id: "ethics-consent",
    kind: K.SYSTEM,
    title: "Data Consent",
    tagline: "What may be trained on",
    iconId: "lock"
  },
  {
    id: "ethics-human-override",
    kind: K.FLOW,
    title: "Human Override",
    tagline: "A person can always overrule",
    iconId: "users"
  },
  /* ══════════════════════════════════════════════════════════════
     INVENTORY / CRM / SCHEDULING
     ══════════════════════════════════════════════════════════════ */
  {
    id: "sw-inventory",
    kind: K.DOMAIN,
    title: "Inventory & Stock",
    category: "DOMAIN",
    tagline: "Track physical things",
    iconId: "box",
    unlocks: ["inv-products", "inv-stock-levels", "inv-orders", "inv-suppliers", "inv-warehouse"]
  },
  {
    id: "inv-products",
    kind: K.FEATURE,
    title: "Product Catalogue",
    tagline: "What you sell or hold",
    iconId: "list",
    unlocks: ["prod-variants", "prod-barcodes", "prod-images", "prod-pricing"]
  },
  {
    id: "prod-variants",
    kind: K.SYSTEM,
    title: "Variants",
    tagline: "Size, colour, model",
    iconId: "copy"
  },
  {
    id: "prod-barcodes",
    kind: K.INTEGRATION,
    title: "Barcode / SKU",
    tagline: "Scan to identify",
    technical: true,
    iconId: "scan"
  },
  {
    id: "prod-images",
    kind: K.CONTENT,
    title: "Product Media",
    tagline: "Photos and documents",
    iconId: "image"
  },
  {
    id: "prod-pricing",
    kind: K.SYSTEM,
    title: "Pricing Rules",
    tagline: "Tiers, discounts, tax",
    iconId: "calculator"
  },
  {
    id: "inv-stock-levels",
    kind: K.FEATURE,
    title: "Stock Levels",
    category: "FEATURE",
    tagline: "How much is where",
    iconId: "box",
    unlocks: ["stock-movements", "stock-thresholds", "stock-counts"]
  },
  {
    id: "stock-movements",
    kind: K.DATA,
    title: "Stock Movements",
    tagline: "Every in and out",
    iconId: "database"
  },
  {
    id: "stock-thresholds",
    kind: K.RULE,
    title: "Reorder Points",
    tagline: "Warn when running low",
    unlocks: ["notify-email"],
    iconId: "alert"
  },
  {
    id: "stock-counts",
    kind: K.FLOW,
    title: "Stocktake",
    tagline: "Reconcile counted vs recorded",
    iconId: "check"
  },
  {
    id: "inv-orders",
    kind: K.FEATURE,
    title: "Purchase & Sales Orders",
    tagline: "Requests to move stock",
    iconId: "invoice",
    unlocks: ["order-lifecycle", "order-fulfilment"]
  },
  {
    id: "order-lifecycle",
    kind: K.RULE,
    title: "Order Lifecycle",
    tagline: "Draft to received",
    iconId: "flow"
  },
  {
    id: "order-fulfilment",
    kind: K.FLOW,
    title: "Fulfilment",
    tagline: "Pick, pack, ship",
    iconId: "truck"
  },
  {
    id: "inv-suppliers",
    kind: K.FEATURE,
    title: "Suppliers",
    tagline: "Who you buy from",
    iconId: "users"
  },
  {
    id: "inv-warehouse",
    kind: K.FEATURE,
    title: "Multi-Location",
    tagline: "Several warehouses",
    iconId: "building"
  },
  {
    id: "sw-crm",
    kind: K.DOMAIN,
    title: "CRM",
    category: "DOMAIN",
    tagline: "Manage customer relationships",
    iconId: "users",
    unlocks: ["crm-contacts", "crm-pipeline", "crm-communication", "crm-support", "crm-reporting"]
  },
  {
    id: "crm-contacts",
    kind: K.FEATURE,
    title: "Contacts & Companies",
    tagline: "Who you deal with",
    iconId: "users",
    unlocks: ["contact-dedup", "contact-import"]
  },
  {
    id: "contact-dedup",
    kind: K.SYSTEM,
    title: "Deduplication",
    tagline: "Merge duplicate records",
    technical: true,
    iconId: "copy"
  },
  {
    id: "contact-import",
    kind: K.FLOW,
    title: "Contact Import",
    tagline: "Bring in existing data",
    technical: true,
    unlocks: ["import-csv-bank"],
    iconId: "upload"
  },
  {
    id: "crm-pipeline",
    kind: K.FEATURE,
    title: "Sales Pipeline",
    tagline: "Deals moving through stages",
    iconId: "flow",
    unlocks: ["pipeline-stages", "pipeline-kanban", "pipeline-forecast"]
  },
  {
    id: "pipeline-stages",
    kind: K.RULE,
    title: "Stage Definitions",
    tagline: "Lead to closed",
    iconId: "flow"
  },
  {
    id: "pipeline-kanban",
    kind: K.SCREEN,
    title: "Kanban Board",
    tagline: "Drag deals between stages",
    iconId: "grid"
  },
  {
    id: "pipeline-forecast",
    kind: K.FEATURE,
    title: "Revenue Forecast",
    tagline: "Weighted by stage",
    iconId: "trendUp"
  },
  {
    id: "crm-communication",
    kind: K.FEATURE,
    title: "Communication Log",
    tagline: "Calls, emails, meetings",
    iconId: "comment",
    unlocks: ["comm-email-sync", "comm-notes", "comm-templates"]
  },
  {
    id: "comm-email-sync",
    kind: K.INTEGRATION,
    title: "Email Sync",
    tagline: "Two-way mailbox integration",
    technical: true,
    iconId: "mail"
  },
  {
    id: "comm-notes",
    kind: K.FEATURE,
    title: "Notes & Activity",
    tagline: "History of the relationship",
    iconId: "pen"
  },
  {
    id: "comm-templates",
    kind: K.FEATURE,
    title: "Message Templates",
    tagline: "Reusable outreach",
    iconId: "copy"
  },
  {
    id: "crm-support",
    kind: K.FEATURE,
    title: "Support Tickets",
    tagline: "Handle incoming problems",
    iconId: "lifebuoy",
    unlocks: ["ticket-lifecycle", "ticket-sla", "ticket-kb"]
  },
  {
    id: "ticket-lifecycle",
    kind: K.FLOW,
    title: "Ticket Lifecycle",
    tagline: "Open to resolved",
    iconId: "flow"
  },
  {
    id: "ticket-sla",
    kind: K.RULE,
    title: "SLA Tracking",
    tagline: "Response time targets",
    iconId: "clock"
  },
  {
    id: "ticket-kb",
    kind: K.FEATURE,
    title: "Knowledge Base",
    tagline: "Self-service answers",
    iconId: "book"
  },
  {
    id: "crm-reporting",
    kind: K.FEATURE,
    title: "Sales Reporting",
    tagline: "What is actually working",
    iconId: "chart"
  },
  {
    id: "sw-scheduling",
    kind: K.DOMAIN,
    title: "Scheduling & Booking",
    category: "DOMAIN",
    tagline: "Manage time and availability",
    iconId: "calendar",
    unlocks: ["sched-calendar", "sched-availability", "sched-booking", "sched-reminders", "sched-recurring"]
  },
  {
    id: "sched-calendar",
    kind: K.SCREEN,
    title: "Calendar View",
    tagline: "Day, week, month",
    iconId: "calendar",
    unlocks: ["cal-views", "cal-drag", "cal-timezones"]
  },
  {
    id: "cal-views",
    kind: K.FEATURE,
    title: "Multiple Views",
    tagline: "Day / week / month / agenda",
    iconId: "grid"
  },
  {
    id: "cal-drag",
    kind: K.FEATURE,
    title: "Drag to Reschedule",
    tagline: "Move events directly",
    iconId: "drag"
  },
  {
    id: "cal-timezones",
    kind: K.SYSTEM,
    title: "Time Zones",
    tagline: "Correct across the world",
    technical: true,
    description: "Storing local times instead of UTC is the classic scheduling bug.",
    iconId: "globe"
  },
  {
    id: "sched-availability",
    kind: K.FEATURE,
    title: "Availability",
    tagline: "When someone is free",
    iconId: "clock",
    unlocks: ["avail-rules", "avail-buffer", "avail-blackout"]
  },
  {
    id: "avail-rules",
    kind: K.RULE,
    title: "Working Hours",
    tagline: "Recurring availability",
    iconId: "clock"
  },
  {
    id: "avail-buffer",
    kind: K.RULE,
    title: "Buffers",
    tagline: "Gaps between appointments",
    iconId: "clock"
  },
  {
    id: "avail-blackout",
    kind: K.RULE,
    title: "Blackout Dates",
    tagline: "Explicitly unavailable",
    iconId: "block"
  },
  {
    id: "sched-booking",
    kind: K.FLOW,
    title: "Booking Flow",
    category: "FLOW",
    tagline: "Reserve a slot",
    iconId: "check",
    unlocks: ["book-self-service", "book-approval", "book-payment", "book-conflict"]
  },
  {
    id: "book-self-service",
    kind: K.FEATURE,
    title: "Self-Service Booking",
    tagline: "Customer picks a slot",
    iconId: "users"
  },
  {
    id: "book-approval",
    kind: K.FLOW,
    title: "Approval Workflow",
    tagline: "Request then confirm",
    iconId: "check"
  },
  {
    id: "book-payment",
    kind: K.FEATURE,
    title: "Deposit / Prepayment",
    tagline: "Charge at booking",
    technical: true,
    unlocks: ["pay-stripe"],
    iconId: "card"
  },
  {
    id: "book-conflict",
    kind: K.SYSTEM,
    title: "Conflict Prevention",
    tagline: "No double-booking",
    description: "Needs real locking. Two people booking the last slot simultaneously is the test case.",
    technical: true,
    iconId: "lock"
  },
  {
    id: "sched-reminders",
    kind: K.FEATURE,
    title: "Reminders",
    tagline: "Reduce no-shows",
    iconId: "bell",
    unlocks: ["notify-email", "notify-push", "notify-sms"]
  },
  {
    id: "sched-recurring",
    kind: K.SYSTEM,
    title: "Recurring Events",
    tagline: "Repeat patterns",
    technical: true,
    iconId: "refresh"
  },
