import type { ZhKeys } from "./zh";

export const en: Record<ZhKeys, string> = {
  // 通用
  "common.loading": "Loading…",
  "common.cancel": "Cancel",
  "common.save": "Save",
  "common.saving": "Saving…",
  "common.saved": "Saved",
  "common.confirm": "Confirm",
  "common.close": "Close",
  "common.notSet": "Not set",
  "common.unknown": "Unknown",
  "common.noSource": "No source",

  // 实体
  "entity.signal": "Signal",
  "entity.decision": "Decision",
  "entity.conversion": "Conversion",
  "entity.lesson": "Lesson",

  // 可信度
  "confidence.high": "High",
  "confidence.medium": "Medium",
  "confidence.low": "Low",

  // 侧边栏
  "nav.dashboard": "Dashboard",
  "nav.onboarding": "New Project",
  "nav.portfolio": "Portfolio",
  "nav.harbor": "Harbor",
  "nav.ai": "AI Assistant",
  "nav.settings": "Settings",
  "nav.footer": "v1.1.0 · Data stays local",

  // Topbar
  "topbar.search": "Search",
  "topbar.notifications": "Notifications",
  "topbar.language": "Language",

  // 设置页
  "settings.title": "Settings",
  "settings.subtitle": "Data is stored in local SQLite. No account needed.",
  "settings.ai.title": "AI Assistant",
  "settings.ai.provider": "Provider",
  "settings.ai.apiKey": "API Key",
  "settings.ai.apiKeyPlaceholder": "Paste your API Key",
  "settings.ai.advanced": "Advanced",
  "settings.ai.apiBase": "API Base",
  "settings.ai.model": "Model",
  "settings.ai.temperature": "Temperature",
  "settings.save": "Save",
  "settings.saved": "Saved",
  "settings.appearance.title": "Appearance",
  "settings.appearance.theme": "Theme",
  "settings.appearance.theme.dark": "Dark",
  "settings.appearance.theme.light": "Light",
  "settings.appearance.theme.system": "System",
  "settings.appearance.fontSize": "Font size",
  "settings.appearance.fontSize.compact": "Compact",
  "settings.appearance.fontSize.standard": "Standard",
  "settings.appearance.fontSize.comfortable": "Comfortable",
  "settings.appearance.fontSize.large": "Large",
  "settings.appearance.fontSize.xlarge": "Extra Large",
  "settings.appearance.fontSize.xxlarge": "XX Large",
  "settings.appearance.fontSize.huge": "Huge",
  "settings.appearance.fontSizeHint":
    "Applies immediately. Max 44px, suitable for elderly or low-vision users.",
  "settings.provider.openai.name": "OpenAI",
  "settings.provider.openai.hint":
    "Create an API Key at platform.openai.com/api-keys",
  "settings.provider.zhipu.name": "Zhipu GLM",
  "settings.provider.zhipu.hint": "Create an API Key at open.bigmodel.cn",
  "settings.provider.deepseek.name": "DeepSeek",
  "settings.provider.deepseek.hint":
    "Create an API Key at platform.deepseek.com",
  "settings.provider.moonshot.name": "Moonshot Kimi",
  "settings.provider.moonshot.hint":
    "Create an API Key at platform.moonshot.cn",
  "settings.provider.dashscope.name": "Qwen (Tongyi)",
  "settings.provider.dashscope.hint":
    "Create an API Key at dashscope.console.aliyun.com",
  "settings.provider.custom.name": "Custom (OpenAI-compatible)",
  "settings.provider.custom.hint":
    "Enter your own OpenAI-compatible endpoint. Include a version prefix like /v1; do not append /chat/completions.",
  "settings.datasource.title": "Data Sources",
  "settings.datasource.subtitle":
    "Connect content platforms to auto-fetch public data as signals. Credentials stay in local SQLite.",
  "settings.datasource.clearError": "Clear error",
  "settings.datasource.provider.bilibili.name": "Bilibili",
  "settings.datasource.provider.bilibili.description":
    "Fetch your video list as platform metrics.",
  "settings.datasource.provider.bilibili.caveat":
    "Bilibili's open platform is currently enterprise-only; individual applications are rejected. Code is ready for when you have enterprise credentials.",
  "settings.datasource.provider.kuaishou.name": "Kuaishou",
  "settings.datasource.provider.kuaishou.description": "Coming soon",
  "settings.datasource.provider.weibo.name": "Weibo",
  "settings.datasource.provider.weibo.description": "Coming soon",
  "settings.datasource.status.unsupported": "Unsupported",
  "settings.datasource.status.disconnected": "Not connected",
  "settings.datasource.status.connected": "Connected",
  "settings.datasource.status.expired": "Expired",
  "settings.datasource.status.error": "Error",
  "settings.datasource.comingSoon": "Coming soon",
  "settings.datasource.disconnect": "Disconnect",
  "settings.datasource.disconnectConfirm":
    "Are you sure you want to disconnect {{name}}?",
  "settings.datasource.clientId": "Client ID",
  "settings.datasource.clientSecret": "Client Secret",
  "settings.datasource.clientIdPlaceholder": "Your app's Client ID",
  "settings.datasource.clientSecretPlaceholder": "Your app's Client Secret",
  "settings.datasource.authorizeHint":
    "Click Connect to open your browser for authorization.",
  "settings.datasource.connect": "Connect",
  "settings.datasource.waitingAuth": "Waiting for authorization…",
  "settings.datasource.waitingBrowser": "Waiting for browser authorization…",
  "settings.datasource.cancelAuthHint":
    "Cancel (does not abort the authorization; just hides the link)",
  "settings.datasource.copyLink": "Copy link",
  "settings.datasource.copied": "Copied",
  "settings.datasource.reopenBrowser": "Open browser again",
  "settings.datasource.browserOpenFailed":
    "If your browser didn't open automatically, copy the link above and open it manually.",
  "settings.datasource.authorized": "Authorized",
  "settings.datasource.lastSync": "Last sync: {{time}}",
  "settings.datasource.neverSynced": "Never synced",
  "settings.datasource.noProjects": "No available projects",
  "settings.datasource.syncToProject": "Sync to project",
  "settings.datasource.syncing": "Syncing…",
  "settings.datasource.syncResultAdded": "Added {{n}} signal(s)",
  "settings.datasource.syncResultFailed": ", {{n}} failed",
  "settings.export.title": "Data",
  "settings.export.subtitle":
    "Export as readable Markdown, or back up as JSON. Backups exclude API keys and login credentials.",
  "settings.export.markdown": "Export as Markdown",
  "settings.export.allProjects": "All projects",
  "settings.export.selectProject": "Select a project…",
  "settings.export.noProjects": "No projects",
  "settings.export.backupTitle": "JSON Backup / Restore",
  "settings.export.backup": "Export backup",
  "settings.export.restore": "Restore from backup…",
  "settings.export.restoreWarning":
    "Restore is destructive: all current projects and records will be wiped before importing the backup. Make sure you've backed up your data first.",
  "settings.export.restoreOverwrite": "destructive",
  "settings.export.restoreConfirmTitle": "Confirm Restore",
  "settings.export.restoreConfirmWarn": "⚠️ This will overwrite existing data",
  "settings.export.restoreConfirmHint":
    "Please make sure you've exported a backup of your current data.",
  "settings.export.restoreFile": "File: {{path}}",
  "settings.export.restoreTime": "Exported: {{time}}",
  "settings.export.summaryProjects": "Projects: {{n}}",
  "settings.export.summarySignals": "Signals: {{n}}",
  "settings.export.summaryConversions": "Conversions: {{n}}",
  "settings.export.summaryLessons": "Lessons: {{n}}",
  "settings.export.summaryDecisions": "Decisions: {{n}}",
  "settings.export.restoreCancel": "Cancel",
  "settings.export.restoreDo": "Overwrite and restore",
  "settings.export.restoring": "Restoring…",
  "settings.export.flashExported": "Exported",
  "settings.export.flashBackupDone": "Backup complete",
  "settings.export.flashRestoreDone": "Restore complete, projects reloaded",
  "settings.about.title": "About ShipSignal",
  "settings.about.version": "v1.1.0 · Local-first · Your data, your machine",
  "settings.about.feedback": "Feedback / Suggestions",
  "settings.about.supportQuestion": "Is this tool helpful?",
  "settings.about.supportHint": "Tap to let the author know someone's using it",
  "settings.about.thanks": "Thanks!",
  "settings.about.thanksHint":
    "This coffee won't make me rich, but it'll make my day.",
  "settings.about.supported": "Supported",
  "settings.about.supportAction": "It helped me",
  "settings.about.donateHint":
    "If ShipSignal has helped you, consider buying me a coffee ☕ Completely voluntary, no features are locked.",
  "settings.about.wechat": "WeChat tip code",
  "settings.about.alipay": "Alipay QR code",
  "settings.about.scanHint": "Scan with WeChat / Alipay on your phone",

  // Dashboard
  "dashboard.title": "My Projects",
  "dashboard.projectCount": "{{n}} project(s)",
  "dashboard.newProject": "New Project",
  "dashboard.empty.title": "No projects yet",
  "dashboard.empty.description": "Start with one of three entry points",
  "dashboard.empty.action": "Get Started",

  // 项目详情
  "project.tab.overview": "Overview",
  "project.tab.signals": "Signals",
  "project.tab.decisions": "Decisions",
  "project.tab.conversions": "Conversions",
  "project.tab.lessons": "Lessons",
  "project.tab.archive": "Archive",
  "project.entryBadge": "Entry {{entry}}",
  "project.delete": "Delete project",
  "project.deleteModal.title": "Delete Project",
  "project.deleteModal.warning": "⚠️ This action cannot be undone",
  "project.deleteModal.body":
    'Will permanently delete project "{{name}}" and all related data{{recordCount}}: signals, conversions, lessons, decisions will all be cleared.',
  "project.deleteModal.recordCount": " ({{n}} records total)",
  "project.deleteModal.confirmLabelPrefix": "Type project name",
  "project.deleteModal.confirmLabelSuffix": "to confirm:",
  "project.deleteModal.confirm": "Confirm Delete",
  "project.deleteModal.deleting": "Deleting…",

  // 概览
  "overview.title": "Project Overview",
  "overview.field.entry": "Entry",
  "overview.field.type": "Type",
  "overview.field.criteria": "Completion Criteria",
  "overview.field.hours": "Build / Distribution Hours",
  "overview.field.createdAt": "Created",
  "overview.field.updatedAt": "Updated",
  "overview.mini.signals": "Signals",
  "overview.mini.decisions": "Decisions",
  "overview.mini.conversions": "Conversions",
  "overview.mini.lessons": "Lessons",
  "overview.principles.title": "Key Principles",
  "overview.principles.p1": "· The tool makes decisions traceable, not decided for you.",
  "overview.principles.p2": "· Paid signals weigh far more than unpaid ones.",
  "overview.principles.p3": "· Build time to distribution time should be at least 1:1.",
  "overview.principles.p4": "· Every abandonment must yield transferable lessons.",

  // 信号
  "signals.stat.total": "Total signals",
  "signals.stat.withPayment": "With payment",
  "signals.stat.lowConf": "Low confidence",
  "signals.card.title": "Signals",
  "signals.card.description":
    "The tool only annotates confidence, never auto-filters. Paid signals weigh most.",
  "signals.action.aiDraft": "AI Draft",
  "signals.action.import": "Import",
  "signals.action.record": "Add Signal",
  "signals.action.collapse": "Collapse",
  "signals.empty.title": "No signals yet",
  "signals.empty.description":
    "Extract traceable signals from channel performance, user behavior, payment events.",
  "signals.form.signalType": "Signal Type",
  "signals.form.source": "Source",
  "signals.form.sourcePlaceholder": "e.g. w2solo / v2ex / direct conversation",
  "signals.form.verifiability": "Source Verifiability",
  "signals.form.value": "Value (optional)",
  "signals.form.valuePlaceholder": "e.g. 35",
  "signals.form.paymentCheckbox":
    "This signal includes a real payment event (highest weight)",
  "signals.form.notes": "Notes",
  "signals.form.notesPlaceholder":
    "e.g. 3 people in community replies asked about API integration",
  "signals.form.save": "Save Signal",
  "signals.row.anomaly": "Anomaly",
  "signals.row.overridden": "Overridden",
  "signals.detail.autoSuggested": "Auto suggested",
  "signals.detail.sourceVerifiability": "Source verifiability",
  "signals.detail.developerOverride": "Manual override",
  "signals.detail.notOverridden": "Not overridden",
  "signals.detail.overrideReason": "Override reason: {{reason}}",
  "signals.override.title": "Manual Override",
  "signals.override.reasonPlaceholder": "Override reason",
  "signals.override.impactPlaceholder": "How will this affect your decisions?",
  "signals.override.save": "Save Override",
  "signals.type.view": "view",
  "signals.type.click": "click",
  "signals.type.signup": "signup",
  "signals.type.reply": "reply",
  "signals.type.payment": "payment",
  "signals.type.churn": "churn",
  "signals.type.other": "other",
  "signals.verifiability.high": "high (platform backend)",
  "signals.verifiability.medium": "medium (manual entry)",
  "signals.verifiability.low": "low (third-party scrape / screenshot)",

  // 决策
  "decisions.card.title": "Decision Log",
  "decisions.card.description":
    "Every decision needs a recorded basis. That's how you learn on review.",
  "decisions.action.aiDraft": "AI Draft",
  "decisions.action.new": "Add Decision",
  "decisions.action.collapse": "Collapse",
  "decisions.empty.title": "No decisions yet",
  "decisions.empty.description":
    "Record what signals led to what decisions; verify later.",
  "decisions.row.basis": "Basis: {{basis}}",
  "decisions.row.confidence": "Confidence {{level}}",
  "decisions.row.outcome.confirmed": "Verified",
  "decisions.row.outcome.reversed": "Reversed",
  "decisions.row.outcome.pending": "Pending",
  "decisions.action.verify": "Verify",
  "decisions.action.reverse": "Reverse",
  "decisions.form.decision": "Decision",
  "decisions.form.decisionPlaceholder":
    "e.g. Hold off on increasing spend in this channel",
  "decisions.form.basis": "Basis",
  "decisions.form.basisPlaceholder": "Which signals, what considerations",
  "decisions.form.confidence": "Confidence",
  "decisions.form.save": "Save Decision",

  // 转化
  "conversions.total": "Total revenue",
  "conversions.card.title": "Conversions",
  "conversions.card.description":
    "Every real payment is worth recording. It's the highest-credibility signal.",
  "conversions.action.aiDraft": "AI Draft",
  "conversions.action.import": "Import",
  "conversions.action.new": "Add Conversion",
  "conversions.action.collapse": "Collapse",
  "conversions.empty.title": "No conversions yet",
  "conversions.empty.description":
    "Record every payment event. It weighs far more than likes or signups.",
  "conversions.row.recurring": "Recurring",
  "conversions.row.unknownSegment": "Unknown segment",
  "conversions.row.unknownForm": "Form unknown",
  "conversions.row.paid": "Paid",
  "conversions.form.segment": "Segment",
  "conversions.form.segmentPlaceholder": "e.g. Dutch SaaS developer",
  "conversions.form.monetizationForm": "Monetization Form",
  "conversions.form.amount": "Amount",
  "conversions.form.amountPlaceholder": "e.g. 800",
  "conversions.form.currency": "Currency",
  "conversions.form.recurring": "This is a subscription/recurring payment",
  "conversions.form.notes": "Notes",
  "conversions.form.save": "Save Conversion",
  "conversions.form.oneTime": "One-time purchase",
  "conversions.form.subscription": "Subscription",
  "conversions.form.apiLicense": "API license",
  "conversions.form.customDev": "Custom development",
  "conversions.form.sourceLicense": "Source code license",
  "conversions.form.other": "Other",

  // 学习
  "lessons.card.title": "Lessons",
  "lessons.card.description":
    "Every abandonment or push must yield transferable insights. At least 3 when archiving.",
  "lessons.action.aiDraft": "AI Draft",
  "lessons.action.new": "Add Lesson",
  "lessons.action.collapse": "Collapse",
  "lessons.empty.title": "No lessons yet",
  "lessons.empty.description":
    "What did this validate or invalidate? What should the next product inherit or avoid?",
  "lessons.count": "{{n}} item(s)",
  "lessons.type.validated": "Validated",
  "lessons.type.invalidated": "Invalidated",
  "lessons.type.discovered": "Discovered",
  "lessons.form.type": "Type",
  "lessons.form.description": "Insight",
  "lessons.form.descriptionPlaceholder":
    "e.g. This channel doesn't work for tool products",
  "lessons.form.applicableTo": "Applicable to (comma-separated, optional)",
  "lessons.form.applicablePlaceholder":
    "e.g. Channel choice, pricing, segment",
  "lessons.form.save": "Save Lesson",

  // 归档
  "archive.archived.title": "Archived",
  "archive.archived.noReason": "No archive reason recorded",
  "archive.archived.restore": "Restore as converting",
  "archive.archived.archivedAt": "Archived: {{time}}",
  "archive.archived.lessonsCount": "{{n}} lessons extracted.",
  "archive.card.title": "Archive Review",
  "archive.card.description":
    "If it meets the completion criteria, upgrade to operational; otherwise archive and force lesson extraction.",
  "archive.check.criteria": "Completion criteria written before starting",
  "archive.check.criteriaHint":
    "Sunset clause: without criteria, you can't tell whether to push or archive.",
  "archive.check.lessons": "At least 3 lessons extracted",
  "archive.check.lessonsHint":
    "Currently {{n}}. Goal: every abandonment yields compounding insight.",
  "archive.check.payment":
    "At least 1 payment signal recorded, or explicitly note there is none",
  "archive.check.paymentHint":
    "Payment signals weigh most; if none, confirm it's not a channel-choice problem.",
  "archive.reason": "Archive Reason",
  "archive.reasonPlaceholder":
    "e.g. No payment signal within 90 days; wrong channel",
  "archive.ready": "Ready to archive",
  "archive.notReady": "Some checks failed; can still archive but please explain",
  "archive.action.archive": "Archive Project",
  "archive.action.archiving": "Processing…",
  "archive.sunset.title": "Sunset Clause",
  "archive.sunset.description":
    "Under what conditions will you abandon this project? Be specific, use numbers. Write it before launch so you can let go emotionally.",
  "archive.sunset.empty": "No sunset clause recorded.",
  "archive.sunset.example": "Examples",
  "archive.sunset.example1": "3 consecutive months of zero revenue",
  "archive.sunset.example2": "Maintenance exceeds 2 hours/week",
  "archive.sunset.example3": "No growth for 2 consecutive review cycles",
  "archive.sunset.placeholder":
    "e.g.\n- 3 consecutive months of zero revenue\n- Maintenance exceeds 2 hours/week",
  "archive.sunset.save": "Save Sunset Clause",

  // 导入
  "import.title": "Bulk Import · {{entity}}",
  "import.error.readFile": "Read file failed: {{msg}}",
  "import.error.empty": "Paste content or pick a file.",
  "import.error.noRows": "No data rows parsed.",
  "import.hint.signalCsv":
    "CSV columns (with header): signal_type, source, source_verifiability, payment_signal_present, value, notes",
  "import.hint.jsonArray": "JSON: array of objects, same field names",
  "import.hint.conversionCsv":
    "CSV columns (with header): user_segment, monetization_form, amount, currency, recurring, notes",
  "import.placeholder": "Paste CSV or JSON text…",
  "import.pickFile": "Choose File",
  "import.emptyHint": "Paste content or choose a file first",
  "import.parse": "Parse & Preview",
  "import.parsing": "Analyzing duplicates…",
  "import.stats.total": "{{n}} rows total",
  "import.stats.valid": "{{n}} importable",
  "import.stats.duplicate": "{{n}} duplicates",
  "import.stats.failed": "{{n}} failed",
  "import.skipDuplicates": "Skip {{n}} duplicate row(s)",
  "import.skipDuplicatesOff": " (Uncheck to import all)",
  "import.table.type": "Type",
  "import.table.source": "Source",
  "import.table.confidence": "Confidence",
  "import.table.paid": "Paid",
  "import.table.segment": "Segment",
  "import.table.form": "Form",
  "import.table.amount": "Amount",
  "import.table.currency": "Currency",
  "import.table.status": "Status",
  "import.status.importable": "Importable",
  "import.status.duplicateSkip": "Duplicate (skip)",
  "import.status.duplicate": "Duplicate",
  "import.status.failed": "Failed",
  "import.onlyFirst100": "Showing only first 100 rows",
  "import.action.reset": "Reset",
  "import.action.confirm": "Import {{n}}",
  "import.importing": "Importing…",
  "import.done.success": "Successfully imported {{n}}",
  "import.done.duplicates": "Skipped {{n}} duplicate records",
  "import.done.failed": "{{n}} failed",
  "import.done.failLine": "Row {{n}}: {{error}}",
  "import.done.more": "…and {{n}} more",
  "import.done.close": "Done",

  // AI 起草卡
  "aidraft.title": "AI Draft · {{entity}}",
  "aidraft.noApiKey": "API Key not configured. Go to Settings to fill it in.",
  "aidraft.parseFail":
    "Couldn't extract a valid record from this text. Check the content, or rewrite it more explicitly and try again.",
  "aidraft.placeholder.signal":
    "Paste user feedback, platform data, or any signal-worthy text…",
  "aidraft.placeholder.conversion":
    "Paste a payment confirmation, purchase notice, or payment description…",
  "aidraft.placeholder.lesson":
    "Paste project retrospective or reflection notes…",
  "aidraft.placeholder.decision": "Paste decision context…",
  "aidraft.action.generate": "Generate",
  "aidraft.drafting": "Extracting…",
  "aidraft.action.reset": "Reset",
  "aidraft.action.confirm": "Confirm & Save",
  "aidraft.saving": "Saving…",

  // 结构化信息表单
  "mode.title": "Structured Info",
  "mode.filled": "{{filled}} / {{total}} fields filled",
  "mode.action.aiDraft": "AI Draft",
  "mode.action.drafting": "Drafting…",
  "mode.action.edit": "Edit",
  "mode.action.add": "Add Details",
  "mode.action.cancel": "Cancel",
  "mode.action.save": "Save",
  "mode.action.saving": "Saving…",
  "mode.noApiKey": "API Key not configured. Go to Settings to fill it in.",
  "mode.aiParseError": "AI response is not valid JSON. Please retry.",
  "mode.aiDrafting":
    "AI is analyzing project context and drafting, please wait…",
  "mode.empty":
    'No structured info yet. Click "Add Details" to fill manually, or let AI draft from existing records.',

      // AI 页
  "ai.title": "AI Assistant",
  "ai.subtitle":
    "AI only summarizes, organizes, drafts, and synthesizes. It does not judge truth or alter credibility.",
  "ai.tab.chat": "Chat",
  "ai.tab.history": "History",
  "ai.field.purpose": "Purpose",
  "ai.field.project": "Related project (optional)",
  "ai.field.project.none": "(None)",
  "ai.clear": "Clear chat",
  "ai.noApiKey":
    "API Key not configured. Go to Settings to set API Base, Model, and API Key.",
  "ai.empty":
    "Start a conversation. AI won't judge truth, only help you organize thoughts.",
  "ai.input.placeholder":
    "Type a message… (Enter to send, Shift+Enter for newline)",
  "ai.cancel.stopping": "Stopping…",
  "ai.cancel.title": "Stop generating",
  "ai.continue": "Continue",
  "ai.continue.title": "Continue generating from where it stopped",

  // AI 用途
  "ai.purpose.general": "General chat",
  "ai.purpose.signal_summary": "Signal pattern summary",
  "ai.purpose.channel_summary": "Channel synthesis",
  "ai.purpose.distribution_draft": "Distribution draft",
  "ai.purpose.lesson_summary": "Lesson synthesis",
  "ai.purpose.structured_draft": "Structured draft",
  "ai.purpose.draft_signal": "Draft signal",
  "ai.purpose.draft_conversion": "Draft conversion",
  "ai.purpose.draft_lesson": "Draft lesson",
  "ai.purpose.draft_decision": "Draft decision",

  // 历史
  "history.filter.all": "All projects",
  "history.loading": "Loading…",
  "history.empty.title": "No history yet.",
  "history.empty.description":
    "Every AI conversation is saved locally. You can review them here.",
  "history.confirm.delete": "Are you sure you want to delete this entry?",
  "history.project.none": "(No project)",
  "history.project.deleted": "(Deleted project)",
  "history.prompt.none": "(No prompt)",
  "history.response.none": "(No response)",
  "history.role.user": "User",
  "history.delete": "Delete",
  "history.footer.total": "{{n}} record(s)",
  "history.footer.filtered": " (filtered by project)",
  "history.footer.recent": " (last 200)",

  // Harbor
  "harbor.title": "Harbor",
  "harbor.subtitle":
    "Where archived projects dock. Archiving isn't failure — it's turning experience into assets.",
  "harbor.empty.title": "Harbor is empty",
  "harbor.empty.description":
    "When a project finishes its mission (or gets frozen), archive it and it'll dock here.",
  "harbor.stat.products": "Docked products",
  "harbor.stat.signals": "Total signals",
  "harbor.stat.lessons": "Total lessons",
  "harbor.stat.income": "Total revenue",
  "harbor.card.archiveReason": "Archive reason: ",
  "harbor.card.sunset": "Sunset clause: ",
  "harbor.card.noIncome": "No revenue recorded",
  "harbor.card.days": "{{n}} day(s)",

  // 产品组合
  "portfolio.title": "Portfolio",
  "portfolio.subtitle":
    "Overview of all projects. Archived projects dock in Harbor.",
  "portfolio.empty.title": "No projects yet",
  "portfolio.empty.description":
    'Start from "New Project", or view existing projects on the Dashboard.',
  "portfolio.stat.total": "All",
  "portfolio.stat.active": "Active",
  "portfolio.stat.archived": "Harbor",
  "portfolio.stat.frozen": "Frozen",
  "portfolio.group.active": "Active",
  "portfolio.group.archived": "Harbor (Archived)",
  "portfolio.group.frozen": "Frozen",
  "portfolio.group.activeDesc":
    "Products in progress, launched, or generating revenue",
  "portfolio.group.archivedDesc":
    "Projects that completed their mission. Archiving isn't failure — it's an asset.",
  "portfolio.group.frozenDesc": "Paused, may restart later",
  "portfolio.mode.validateFirst": "Validation first",
  "portfolio.mode.buildFirst": "Build first",
  "portfolio.mode.portfolio": "Portfolio",
  "portfolio.status.planning": "Planning",
  "portfolio.status.building": "Building",
  "portfolio.status.launched": "Launched",
  "portfolio.status.converting": "Converting",
  "portfolio.status.active": "Active",
  "portfolio.status.archived": "Archived",
  "portfolio.status.frozen": "Frozen",
  "portfolio.card.archiveReason": "Archive reason: ",
  "portfolio.card.sunset": "Sunset clause: ",
  "portfolio.card.signals": "Signals {{n}}",
  "portfolio.card.lessons": "Lessons {{n}}",
  "portfolio.card.entryBadge": "Entry {{entry}}",

  // 新项目入口
  "onboarding.title": "Choose Entry Point",
  "onboarding.subtitle":
    "The tool makes decisions traceable, not decided for you.",
  "onboarding.entry.A.title": "I have an idea",
  "onboarding.entry.A.desc":
    "You have channels, sense external pain points, and are willing to invest in validation before building.",
  "onboarding.entry.B.title": "I have a product",
  "onboarding.entry.B.desc":
    "You've built a working product but conversion is hard. You need reverse positioning and channel focus.",
  "onboarding.entry.C.title": "I have multiple products",
  "onboarding.entry.C.desc":
    "You prefer to keep shipping new products, using quantity against uncertainty.",
  "onboarding.form.title": "Project Basics",
  "onboarding.form.name": "Name",
  "onboarding.form.namePlaceholder": "e.g. ShipSignal",
  "onboarding.form.description": "Description (optional)",
  "onboarding.form.create": "Create Project",
  "onboarding.form.creating": "Creating…",

    // 结构化信息字段
  "modeData.validate_first.pain_point.title": "Pain Point",
  "modeData.validate_first.pain_point.description":
    "The problem you're validating. Be specific, not abstract.",
  "modeData.validate_first.pain_point.fields.who.label":
    "Who has this problem",
  "modeData.validate_first.pain_point.fields.who.hint":
    "More specific is better",
  "modeData.validate_first.pain_point.fields.who.placeholder":
    "e.g. indie developers, cross-border e-commerce sellers",
  "modeData.validate_first.pain_point.fields.what.label":
    "What exactly is the problem",
  "modeData.validate_first.pain_point.fields.what.placeholder":
    "e.g. can't find a reliable overseas payment solution; high fees, complex integration",
  "modeData.validate_first.pain_point.fields.workaround.label":
    "What they currently work around with",
  "modeData.validate_first.pain_point.fields.workaround.hint":
    "What alternatives exist now",
  "modeData.validate_first.pain_point.fields.workaround.placeholder":
    "e.g. using PayPal but low conversion; or handling manually, very inefficient",

  "modeData.validate_first.validation_result.title": "Validation Result",
  "modeData.validate_first.validation_result.fields.method.label":
    "How it was validated",
  "modeData.validate_first.validation_result.fields.method.placeholder":
    "e.g. user interviews / landing page / pre-sale",
  "modeData.validate_first.validation_result.fields.sample_size.label":
    "Sample size",
  "modeData.validate_first.validation_result.fields.sample_size.placeholder":
    "e.g. interviewed 12 people, landing page 200 visits",
  "modeData.validate_first.validation_result.fields.conclusion.label":
    "Conclusion",
  "modeData.validate_first.validation_result.fields.conclusion.placeholder":
    "e.g. 7/12 said willing to pay, low price sensitivity",

  "modeData.validate_first.product_spec.title": "Product Definition",
  "modeData.validate_first.product_spec.fields.core_feature.label":
    "Core feature",
  "modeData.validate_first.product_spec.fields.core_feature.placeholder":
    "One sentence describing what this product does",
  "modeData.validate_first.product_spec.fields.target_user.label":
    "Target user",
  "modeData.validate_first.product_spec.fields.target_user.placeholder":
    "Who are the first-wave users",
  "modeData.validate_first.product_spec.fields.scope.label":
    "Scope boundary",
  "modeData.validate_first.product_spec.fields.scope.hint":
    "What to do, what not to do",
  "modeData.validate_first.product_spec.fields.scope.placeholder":
    "e.g. only payment integration, no account system",

  "modeData.build_first.product_layer.title": "Product Status",
  "modeData.build_first.product_layer.fields.what_it_does.label":
    "What the product does",
  "modeData.build_first.product_layer.fields.what_it_does.placeholder":
    "One sentence",
  "modeData.build_first.product_layer.fields.current_state.label":
    "Current state",
  "modeData.build_first.product_layer.fields.current_state.placeholder":
    "e.g. MVP launched / 20 paying users",
  "modeData.build_first.product_layer.fields.user_count.label":
    "User base",
  "modeData.build_first.product_layer.fields.user_count.placeholder":
    "e.g. 500 registered, 80 active",

  "modeData.build_first.channel_signal.title": "Channel Signals",
  "modeData.build_first.channel_signal.fields.tried_channels.label":
    "Channels tried",
  "modeData.build_first.channel_signal.fields.tried_channels.placeholder":
    "e.g. Twitter, Product Hunt, Reddit r/SaaS",
  "modeData.build_first.channel_signal.fields.best_channel.label":
    "Best performer",
  "modeData.build_first.channel_signal.fields.best_channel.placeholder":
    "Which channel brought real conversions",
  "modeData.build_first.channel_signal.fields.detail.label":
    "Concrete data",
  "modeData.build_first.channel_signal.fields.detail.hint":
    "Use numbers, not adjectives",
  "modeData.build_first.channel_signal.fields.detail.placeholder":
    "e.g. one Reddit post brought 30 signups, 3 paid",

  "modeData.build_first.monetization_match.title": "Monetization Fit",
  "modeData.build_first.monetization_match.fields.current_model.label":
    "Current monetization",
  "modeData.build_first.monetization_match.fields.current_model.placeholder":
    "e.g. one-time purchase / subscription / API license",
  "modeData.build_first.monetization_match.fields.price_point.label":
    "Price",
  "modeData.build_first.monetization_match.fields.price_point.placeholder":
    "e.g. $29 one-time / $9/month",
  "modeData.build_first.monetization_match.fields.assessment.label":
    "Fit assessment",
  "modeData.build_first.monetization_match.fields.assessment.placeholder":
    "e.g. users show strong willingness to pay, but low repurchase",

  "modeData.portfolio.portfolio_management.title": "Portfolio Management",
  "modeData.portfolio.portfolio_management.fields.products.label":
    "Product list",
  "modeData.portfolio.portfolio_management.fields.products.hint":
    "One per line",
  "modeData.portfolio.portfolio_management.fields.products.placeholder":
    "e.g.\nA - Payment SDK (validated)\nB - Email tool (building)\nC - Icon library (maintained)",
  "modeData.portfolio.portfolio_management.fields.allocation.label":
    "Time allocation principle",
  "modeData.portfolio.portfolio_management.fields.allocation.placeholder":
    "e.g. 60% to validated products, 30% to new products, 10% maintenance",
  "modeData.portfolio.portfolio_management.fields.review_cycle.label":
    "Review cadence",
  "modeData.portfolio.portfolio_management.fields.review_cycle.placeholder":
    "e.g. every two weeks",

  "modeData.portfolio.sunset_clause.title": "Sunset Clause",
  "modeData.portfolio.sunset_clause.description":
    "Under what conditions you'll give up a product. Write it clearly so you can let go emotionally.",
  "modeData.portfolio.sunset_clause.fields.trigger_conditions.label":
    "Trigger conditions",
  "modeData.portfolio.sunset_clause.fields.trigger_conditions.hint":
    "Be specific, use numbers",
  "modeData.portfolio.sunset_clause.fields.trigger_conditions.placeholder":
    "e.g.\n- 3 consecutive months of zero revenue\n- Maintenance exceeds 2 hours/week\n- No growth for 2 consecutive review cycles",
  "modeData.portfolio.sunset_clause.fields.exit_plan.label": "Exit plan",
  "modeData.portfolio.sunset_clause.fields.exit_plan.placeholder":
    "e.g. archive / open source / sell / move to free maintenance",

  // 通用操作
  "common.edit": "Edit",
  "common.delete": "Delete",
  "common.deleteConfirmTitle": "Confirm delete?",
  "common.deleteConfirmBody": "This action cannot be undone.",

    // 信号编辑
  "signals.edit.title": "Edit Signal",
  "signals.edit.save": "Save Changes",
  "signals.edit.saving": "Saving…",
  "signals.delete.title": "Delete this signal?",

    // 决策编辑
  "decisions.edit.title": "Edit Decision",
  "decisions.edit.save": "Save Changes",
  "decisions.edit.saving": "Saving…",
  "decisions.delete.title": "Delete this decision?",

  // 转化编辑
  "conversions.edit.title": "Edit Conversion",
  "conversions.edit.save": "Save Changes",
  "conversions.edit.saving": "Saving…",
  "conversions.delete.title": "Delete this conversion?",

  // 学习编辑
  "lessons.edit.title": "Edit Lesson",
  "lessons.edit.save": "Save Changes",
  "lessons.edit.saving": "Saving…",
  "lessons.delete.title": "Delete this lesson?",

    // 关闭确认弹窗
  "window.closeConfirm.title": "Close ShipSignal",
  "window.closeConfirm.body": "Quit the app, or minimize to the system tray?",
  "window.closeConfirm.remember": "Remember my choice (changeable in Settings)",
  "window.closeConfirm.tray": "Minimize to tray",
  "window.closeConfirm.exit": "Quit app",

  // 设置页 - 关闭行为
  "settings.appearance.closeBehavior": "When closing window",
  "settings.appearance.closeBehavior.ask": "Ask every time",
  "settings.appearance.closeBehavior.exit": "Quit app",
  "settings.appearance.closeBehavior.tray": "Minimize to tray",

    // 搜索
  "search.placeholder":
    "Search projects, signals, lessons, decisions, conversions…",
  "search.empty": "Type a keyword to start searching",
  "search.noResults": "No matches",
  "search.loading": "Searching…",
  "search.hint": "↑↓ navigate · Enter open · Esc close",
  "search.kind.project": "Project",
  "search.kind.signal": "Signal",
  "search.kind.lesson": "Lesson",
  "search.kind.decision": "Decision",
  "search.kind.conversion": "Conversion",

  "nav.today": "Today",

  "today.title": "Today's suggestion",
  "today.refresh": "Refresh",
  "today.refreshing": "Computing…",
  "today.filter.all": "All",
  "today.done": "Done",
  "today.skip": "Skip",
  "today.replace": "Another",
  "today.draft.label": "Draft",
  "today.draft.generate": "AI draft",
  "today.draft.generating": "Generating…",
  "today.draft.noApiKey": "Please configure your AI API key in Settings first.",
  "today.draft.placeholder": "Write something, or leave it empty…",
  "today.empty.restartColdStart": "Show cold start guide again",
  "today.empty.title": "No suggestion today",
  "today.empty.hint": "Go record some signals — the tool will suggest next steps from your own data.",
  "today.empty.cta": "Record signals",


  "coldStart.panel.title": "「{{name}}」 has no signals yet",
  "coldStart.panel.attempts": "{{n}} attempt(s)",
  "coldStart.panel.dismiss": "Skip for now",
  "coldStart.panel.noApiKey": "Please configure your AI API key in Settings first.",
  "coldStart.back": "Back",

  "coldStart.menu.question": "How do you want to start?",
  "coldStart.menu.case.title": "See how others wrote it",
  "coldStart.menu.case.desc": "Three real-style examples. Adapt one yourself",
  "coldStart.menu.quick.title": "One-line generate",
  "coldStart.menu.quick.desc": "Describe your product in one line, AI writes a draft",
  "coldStart.menu.mirror.title": "I wrote it, you review",
  "coldStart.menu.mirror.desc": "AI gives one suggestion. It won't rewrite",

  "coldStart.case.hint": "See how others wrote it, then write your own.",
  "coldStart.case.refresh": "Shuffle",
  "coldStart.case.writeYours": "Now your turn",
  "coldStart.case.placeholder": "Borrow the structure, use your own words.",

  "coldStart.quick.hint": "Describe your product in one line.",
  "coldStart.quick.placeholder": "e.g. helps devs find icons in projects",
  "coldStart.quick.tip": "Don't feel like thinking? Just hit generate.",
  "coldStart.quick.generate": "Generate",
  "coldStart.quick.regenerate": "Regenerate",

  "coldStart.mirror.hint": "Paste your draft. AI gives one suggestion, won't rewrite.",
  "coldStart.mirror.placeholder": "Paste or write your draft…",
  "coldStart.mirror.review": "Review it",
  "coldStart.mirror.reviewing": "Reviewing…",

  "coldStart.draft.label": "Your content",
  "coldStart.draft.writing": "Writing…",
  "coldStart.draft.published": "I posted it",
  "coldStart.draft.empty": "AI didn't return content. Check API key and network.",

  "coldStart.publish.done": "The moment you posted it, you already won.",

  "coldStart.mood.question": "How does it feel? No right answer.",
  "coldStart.mood.confident": "Confident",
  "coldStart.mood.ok": "It's fine",
  "coldStart.mood.unsure": "Not sure",
  "coldStart.mood.retry": "Want to try again",

  "coldStart.retry.again": "Try again",
  "coldStart.retry.done": "That's enough for today",

  "coldStart.feedback.reading": "Reading it…",
  "coldStart.feedback.recognition": "What I saw",
  "coldStart.feedback.direction": "Try this next",
  "coldStart.feedback.timeout": "AI didn't respond in 15s. Check your API key and network.",
  "coldStart.feedback.fallbackHint": "Your content is saved. You can post it directly or retry from the menu.",
  
};