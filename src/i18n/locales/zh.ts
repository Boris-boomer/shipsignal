export const zh = {
  // 通用
  "common.loading": "加载中…",
  "common.cancel": "取消",
  "common.save": "保存",
  "common.saving": "保存中…",
  "common.saved": "已保存",
  "common.confirm": "确认",
  "common.close": "关闭",
  "common.notSet": "未设置",
  "common.unknown": "未知",
  "common.noSource": "无来源",

  // 实体
  "entity.signal": "信号",
  "entity.decision": "决策",
  "entity.conversion": "转化",
  "entity.lesson": "学习",

  // 可信度
  "confidence.high": "高",
  "confidence.medium": "中",
  "confidence.low": "低",

  // 侧边栏
  "nav.dashboard": "总览",
  "nav.onboarding": "新项目入口",
  "nav.portfolio": "产品组合",
  "nav.harbor": "Harbor",
  "nav.ai": "AI 助手",
  "nav.settings": "设置",
  "nav.footer": "v1.1.0 · 数据在本地",

  // Topbar
  "topbar.search": "搜索",
  "topbar.notifications": "通知",
  "topbar.language": "语言",

  // 设置页（保持不变，接上一批）
  "settings.title": "设置",
  "settings.subtitle": "数据存储在本机 SQLite，不需要注册账号。",
  "settings.ai.title": "AI 助手",
  "settings.ai.provider": "服务提供商",
  "settings.ai.apiKey": "API Key",
  "settings.ai.apiKeyPlaceholder": "粘贴你的 API Key",
  "settings.ai.advanced": "高级选项",
  "settings.ai.apiBase": "API Base",
  "settings.ai.model": "Model",
  "settings.ai.temperature": "Temperature",
  "settings.save": "保存",
  "settings.saved": "已保存",
  "settings.appearance.title": "外观",
  "settings.appearance.theme": "主题",
  "settings.appearance.theme.dark": "深色",
  "settings.appearance.theme.light": "浅色",
  "settings.appearance.theme.system": "跟随系统",
  "settings.appearance.fontSize": "字体大小",
  "settings.appearance.fontSize.compact": "紧凑",
  "settings.appearance.fontSize.standard": "标准",
  "settings.appearance.fontSize.comfortable": "宽松",
  "settings.appearance.fontSize.large": "特大",
  "settings.appearance.fontSize.xlarge": "超大",
  "settings.appearance.fontSize.xxlarge": "极大",
  "settings.appearance.fontSize.huge": "巨大",
  "settings.appearance.fontSizeHint":
    "调节后立即生效。上限 44px，适合老年人或视力较弱的用户。",
  "settings.provider.openai.name": "OpenAI",
  "settings.provider.openai.hint": "在 platform.openai.com/api-keys 创建 API Key",
  "settings.provider.zhipu.name": "智谱 GLM",
  "settings.provider.zhipu.hint": "在 open.bigmodel.cn 创建 API Key",
  "settings.provider.deepseek.name": "DeepSeek",
  "settings.provider.deepseek.hint": "在 platform.deepseek.com 创建 API Key",
  "settings.provider.moonshot.name": "月之暗面 Kimi",
  "settings.provider.moonshot.hint": "在 platform.moonshot.cn 创建 API Key",
  "settings.provider.dashscope.name": "通义千问",
  "settings.provider.dashscope.hint":
    "在 dashscope.console.aliyun.com 创建 API Key",
  "settings.provider.custom.name": "自定义（OpenAI 兼容）",
  "settings.provider.custom.hint":
    "填你自己的 OpenAI 兼容端点，需包含 /v1 之类的版本前缀，末尾不要带 /chat/completions",
  "settings.datasource.title": "数据源",
  "settings.datasource.subtitle":
    "连接内容平台，自动抓取公开数据作为信号。凭证只存在本机 SQLite。",
  "settings.datasource.clearError": "清除错误",
  "settings.datasource.provider.bilibili.name": "B站",
  "settings.datasource.provider.bilibili.description":
    "抓取你的视频列表，作为平台指标信号。",
  "settings.datasource.provider.bilibili.caveat":
    "B站开放平台目前仅面向企业开发者，个人申请会被拒。代码已完成，有企业资质时直接可用。",
  "settings.datasource.provider.kuaishou.name": "快手",
  "settings.datasource.provider.kuaishou.description": "即将推出",
  "settings.datasource.provider.weibo.name": "微博",
  "settings.datasource.provider.weibo.description": "即将推出",
  "settings.datasource.status.unsupported": "未支持",
  "settings.datasource.status.disconnected": "未连接",
  "settings.datasource.status.connected": "已连接",
  "settings.datasource.status.expired": "已过期",
  "settings.datasource.status.error": "错误",
  "settings.datasource.comingSoon": "即将推出",
  "settings.datasource.disconnect": "断开",
  "settings.datasource.disconnectConfirm": "确定要断开 {{name}} 吗？",
  "settings.datasource.clientId": "Client ID",
  "settings.datasource.clientSecret": "Client Secret",
  "settings.datasource.clientIdPlaceholder": "应用的 Client ID",
  "settings.datasource.clientSecretPlaceholder": "应用的 Client Secret",
  "settings.datasource.authorizeHint": "点击连接后会打开浏览器完成授权。",
  "settings.datasource.connect": "连接",
  "settings.datasource.waitingAuth": "等待授权…",
  "settings.datasource.waitingBrowser": "等待浏览器授权…",
  "settings.datasource.cancelAuthHint":
    "取消（不影响已发起的授权，仅隐藏链接）",
  "settings.datasource.copyLink": "复制链接",
  "settings.datasource.copied": "已复制",
  "settings.datasource.reopenBrowser": "再次打开浏览器",
  "settings.datasource.browserOpenFailed":
    "如果浏览器没有自动打开，请复制上面的链接到浏览器里访问。",
  "settings.datasource.authorized": "已授权",
  "settings.datasource.lastSync": "上次同步：{{time}}",
  "settings.datasource.neverSynced": "尚未同步",
  "settings.datasource.noProjects": "没有可用项目",
  "settings.datasource.syncToProject": "同步到项目",
  "settings.datasource.syncing": "同步中…",
  "settings.datasource.syncResultAdded": "新增 {{n}} 条信号",
  "settings.datasource.syncResultFailed": "，失败 {{n}} 条",
  "settings.export.title": "数据",
  "settings.export.subtitle":
    "导出为可读 Markdown，或备份为 JSON。备份不包含 API Key 和登录凭证。",
  "settings.export.markdown": "导出为 Markdown",
  "settings.export.allProjects": "全部项目",
  "settings.export.selectProject": "选择单个项目…",
  "settings.export.noProjects": "暂无项目",
  "settings.export.backupTitle": "JSON 备份 / 恢复",
  "settings.export.backup": "导出备份",
  "settings.export.restore": "从备份恢复…",
  "settings.export.restoreWarning":
    "恢复是覆盖式的：会先清空现有全部项目与记录，再导入备份内容。请确保已备份当前数据。",
  "settings.export.restoreOverwrite": "覆盖式",
  "settings.export.restoreConfirmTitle": "确认恢复备份",
  "settings.export.restoreConfirmWarn": "⚠️ 此操作会覆盖现有数据",
  "settings.export.restoreConfirmHint": "恢复前请确认已导出当前项目的备份。",
  "settings.export.restoreFile": "文件：{{path}}",
  "settings.export.restoreTime": "导出时间：{{time}}",
  "settings.export.summaryProjects": "项目：{{n}}",
  "settings.export.summarySignals": "信号：{{n}}",
  "settings.export.summaryConversions": "转化：{{n}}",
  "settings.export.summaryLessons": "学习：{{n}}",
  "settings.export.summaryDecisions": "决策：{{n}}",
  "settings.export.restoreCancel": "取消",
  "settings.export.restoreDo": "确认覆盖并恢复",
  "settings.export.restoring": "正在恢复…",
  "settings.export.flashExported": "已导出",
  "settings.export.flashBackupDone": "备份完成",
  "settings.export.flashRestoreDone": "恢复完成，已重新加载项目",
  "settings.about.title": "关于 ShipSignal",
  "settings.about.version": "v1.1.0 · 数据本地 · 你的机器，你的数据",
  "settings.about.feedback": "反馈 / 建议",
  "settings.about.supportQuestion": "这个小工具帮到你了？",
  "settings.about.supportHint": "点一下，让作者知道有人在用",
  "settings.about.thanks": "谢谢！",
  "settings.about.thanksHint": "这杯咖啡不会让我变富，但会让我开心一整天。",
  "settings.about.supported": "已支持",
  "settings.about.supportAction": "帮到我了",
  "settings.about.donateHint":
    "如果 ShipSignal 帮到了你，欢迎请我喝杯咖啡 ☕ 完全自愿，不影响任何功能。",
  "settings.about.wechat": "微信赞赏码",
  "settings.about.alipay": "支付宝收款码",
  "settings.about.scanHint": "手机微信/支付宝「扫一扫」即可",

  // Dashboard
  "dashboard.title": "我的项目",
  "dashboard.projectCount": "共 {{n}} 个项目",
  "dashboard.newProject": "新建项目",
  "dashboard.empty.title": "还没有项目",
  "dashboard.empty.description": "从三种入口之一开始",
  "dashboard.empty.action": "开始",
  "dashboard.charts.timeline": "信号时间线",
  "dashboard.charts.timelineSub": "最近 30 天每天新增信号数",
  "dashboard.charts.channels": "渠道分布",
  "dashboard.charts.channelsSub": "信号来自哪里",
  "dashboard.charts.types": "信号类型分布",
  "dashboard.charts.typesSub": "哪类信号最多",
  "dashboard.charts.funnel": "信号可信度漏斗",
  "dashboard.charts.funnelSub": "全部信号 → 中/高可信 → 高可信",

  // 项目详情
  "project.tab.overview": "概览",
  "project.tab.signals": "信号",
  "project.tab.decisions": "决策",
  "project.tab.conversions": "转化",
  "project.tab.lessons": "学习",
  "project.tab.archive": "归档",
  "project.entryBadge": "入口 {{entry}}",
  "project.delete": "删除项目",
  "project.deleteModal.title": "删除项目",
  "project.deleteModal.warning": "⚠️ 此操作不可撤销",
  "project.deleteModal.body":
    "将永久删除项目「{{name}}」及其所有关联数据{{recordCount}}：信号、转化、学习、决策都会被清空。",
  "project.deleteModal.recordCount": "（共 {{n}} 条记录）",
  "project.deleteModal.confirmLabelPrefix": "请输入项目名",
  "project.deleteModal.confirmLabelSuffix": "以确认：",
  "project.deleteModal.confirm": "确认删除",
  "project.deleteModal.deleting": "正在删除…",

  // 概览
  "overview.title": "项目概览",
  "overview.field.entry": "入口",
  "overview.field.type": "类型",
  "overview.field.criteria": "完成标准",
  "overview.field.hours": "构建/分发工时",
  "overview.field.createdAt": "创建时间",
  "overview.field.updatedAt": "更新时间",
  "overview.mini.signals": "信号",
  "overview.mini.decisions": "决策",
  "overview.mini.conversions": "转化",
  "overview.mini.lessons": "学习",
  "overview.principles.title": "关键原则",
  "overview.principles.p1": "· 工具只让决策可追溯，不替你做决定。",
  "overview.principles.p2": "· 付费信号权重远高于非付费信号。",
  "overview.principles.p3": "· 构建时间与分发时间至少 1:1。",
  "overview.principles.p4": "· 每次放弃必须产生可迁移的认知。",

  // 信号
  "signals.stat.total": "总信号",
  "signals.stat.withPayment": "含付费信号",
  "signals.stat.lowConf": "低可信",
  "signals.card.title": "信号记录",
  "signals.card.description":
    "工具只标注可信度，不自动过滤。付费信号权重最高。",
  "signals.action.aiDraft": "AI 起草",
  "signals.action.import": "导入",
  "signals.action.record": "记录信号",
  "signals.action.collapse": "收起",
  "signals.empty.title": "还没有信号",
  "signals.empty.description":
    "从渠道表现、用户行为、付费事件里抽取可追溯的信号。",
  "signals.form.signalType": "信号类型",
  "signals.form.source": "来源",
  "signals.form.sourcePlaceholder": "例如 w2solo / v2ex / 直接对话",
  "signals.form.verifiability": "来源可验证性",
  "signals.form.value": "数值（可选）",
  "signals.form.valuePlaceholder": "例如 35",
  "signals.form.paymentCheckbox": "这条信号包含真实付费事件（权重最高）",
  "signals.form.notes": "备注",
  "signals.form.notesPlaceholder":
    "例如：社区回复中有 3 人询问 API 集成方式",
  "signals.form.save": "保存信号",
  "signals.row.anomaly": "异常",
  "signals.row.overridden": "已覆盖",
  "signals.detail.autoSuggested": "自动建议",
  "signals.detail.sourceVerifiability": "来源可验证性",
  "signals.detail.developerOverride": "人工覆盖",
  "signals.detail.notOverridden": "未覆盖",
  "signals.detail.overrideReason": "覆盖理由：{{reason}}",
  "signals.override.title": "人工覆盖",
  "signals.override.reasonPlaceholder": "覆盖理由",
  "signals.override.impactPlaceholder": "此数据将如何影响你的决策？",
  "signals.override.save": "保存覆盖",
  "signals.type.view": "浏览",
  "signals.type.click": "点击",
  "signals.type.signup": "注册",
  "signals.type.reply": "回复",
  "signals.type.payment": "付费",
  "signals.type.churn": "流失",
  "signals.type.other": "其他",
  "signals.verifiability.high": "high（平台后台）",
  "signals.verifiability.medium": "medium（手动录入）",
  "signals.verifiability.low": "low（第三方抓取 / 截图）",

  // 决策
  "decisions.card.title": "决策日志",
  "decisions.card.description": "每个决策必须留下依据。回看时才能学到东西。",
  "decisions.action.aiDraft": "AI 起草",
  "decisions.action.new": "新增决策",
  "decisions.action.collapse": "收起",
  "decisions.empty.title": "还没有决策记录",
  "decisions.empty.description":
    "记录你基于哪些信号做了什么决定，后续可以验证对错。",
  "decisions.row.basis": "依据：{{basis}}",
  "decisions.row.confidence": "置信度 {{level}}",
  "decisions.row.outcome.confirmed": "已验证",
  "decisions.row.outcome.reversed": "已推翻",
  "decisions.row.outcome.pending": "待验证",
  "decisions.action.verify": "验证",
  "decisions.action.reverse": "推翻",
  "decisions.form.decision": "决策",
  "decisions.form.decisionPlaceholder": "例如：暂缓在该渠道加大投入",
  "decisions.form.basis": "依据",
  "decisions.form.basisPlaceholder": "基于哪些信号、考虑了什么",
  "decisions.form.confidence": "置信度",
  "decisions.form.save": "保存决策",

  // 转化
  "conversions.total": "累计收入",
  "conversions.card.title": "转化记录",
  "conversions.card.description":
    "每笔真实付费都值得记录，它是可信度最高的信号。",
  "conversions.action.aiDraft": "AI 起草",
  "conversions.action.import": "导入",
  "conversions.action.new": "新增转化",
  "conversions.action.collapse": "收起",
  "conversions.empty.title": "还没有转化记录",
  "conversions.empty.description":
    "有付费事件时，请务必记录。它的权重远高于点赞和注册。",
  "conversions.row.recurring": "订阅",
  "conversions.row.unknownSegment": "未知客群",
  "conversions.row.unknownForm": "未标注形态",
  "conversions.row.paid": "付费",
  "conversions.form.segment": "客群",
  "conversions.form.segmentPlaceholder": "例如 荷兰 SaaS 开发者",
  "conversions.form.monetizationForm": "变现形态",
  "conversions.form.amount": "金额",
  "conversions.form.amountPlaceholder": "例如 800",
  "conversions.form.currency": "币种",
  "conversions.form.recurring": "这是订阅/持续付费",
  "conversions.form.notes": "备注",
  "conversions.form.save": "保存转化",
  "conversions.form.oneTime": "一次性买断",
  "conversions.form.subscription": "订阅",
  "conversions.form.apiLicense": "API 授权",
  "conversions.form.customDev": "定制开发",
  "conversions.form.sourceLicense": "源码授权",
  "conversions.form.other": "其他",

  // 学习
  "lessons.card.title": "学习信号",
  "lessons.card.description":
    "每次放弃或推进，都必须提取可迁移的认知。归档时至少 3 条。",
  "lessons.action.aiDraft": "AI 起草",
  "lessons.action.new": "新增学习",
  "lessons.action.collapse": "收起",
  "lessons.empty.title": "还没有学习信号",
  "lessons.empty.description":
    "这个产品验证了什么？推翻了什么？下一个产品应该继承或避免什么？",
  "lessons.count": "{{n}} 条",
  "lessons.type.validated": "验证成立",
  "lessons.type.invalidated": "被推翻",
  "lessons.type.discovered": "新发现",
  "lessons.form.type": "类型",
  "lessons.form.description": "认知内容",
  "lessons.form.descriptionPlaceholder":
    "例如：这个渠道对工具类产品无效",
  "lessons.form.applicableTo": "适用场景（逗号分隔，可选）",
  "lessons.form.applicablePlaceholder": "例如：渠道选择, 定价, 客群定位",
  "lessons.form.save": "保存学习信号",

  // 归档
  "archive.archived.title": "已归档",
  "archive.archived.noReason": "无归档原因记录",
  "archive.archived.restore": "恢复为 converting",
  "archive.archived.archivedAt": "归档时间：{{time}}",
  "archive.archived.lessonsCount": "已提取学习信号 {{n}} 条。",
  "archive.card.title": "归档审查",
  "archive.card.description":
    "达到完成标准则升级为运营型；未达到则归档，并强制提取学习信号。",
  "archive.check.criteria": "启动前写下了完成标准",
  "archive.check.criteriaHint":
    "日落条款：没有标准就无法判断该推进还是归档。",
  "archive.check.lessons": "至少提取 3 条学习信号",
  "archive.check.lessonsHint":
    "当前 {{n}} 条。目标是让每次放弃产生可复利认知。",
  "archive.check.payment": "记录了至少 1 条付费信号，或明确说明没有",
  "archive.check.paymentHint":
    "付费信号权重最高；如果没有，请确认不是渠道选择问题。",
  "archive.reason": "归档原因",
  "archive.reasonPlaceholder":
    "例如：未在 90 天内产生付费信号；渠道选择错误",
  "archive.ready": "可以归档",
  "archive.notReady": "有未通过项，仍可归档，但请补充说明",
  "archive.action.archive": "归档项目",
  "archive.action.archiving": "处理中…",
  "archive.sunset.title": "日落条款",
  "archive.sunset.description":
    "什么条件下你会放弃这个项目。写具体、写数字。启动前就写好，才能在情感上放得下。",
  "archive.sunset.empty": "未记录日落条款。",
  "archive.sunset.example": "示例",
  "archive.sunset.example1": "连续 3 个月零收入",
  "archive.sunset.example2": "维护时间超过每周 2 小时",
  "archive.sunset.example3": "连续 2 个 review 周期无增长",
  "archive.sunset.placeholder":
    "例如：\n- 连续 3 个月零收入\n- 维护时间超过每周 2 小时",
  "archive.sunset.save": "保存日落条款",

  // 导入
  "import.title": "批量导入 · {{entity}}",
  "import.error.readFile": "读取文件失败：{{msg}}",
  "import.error.empty": "请粘贴内容或选择文件。",
  "import.error.noRows": "没有解析到任何数据行。",
  "import.hint.signalCsv":
    "CSV 列名（含表头）：signal_type, source, source_verifiability, payment_signal_present, value, notes",
  "import.hint.jsonArray": "JSON：对象数组，字段名同上",
  "import.hint.conversionCsv":
    "CSV 列名（含表头）：user_segment, monetization_form, amount, currency, recurring, notes",
  "import.placeholder": "粘贴 CSV 或 JSON 文本…",
  "import.pickFile": "选择文件",
  "import.emptyHint": "请先粘贴内容或选择文件",
  "import.parse": "解析预览",
  "import.parsing": "正在分析重复…",
  "import.stats.total": "共 {{n}} 行",
  "import.stats.valid": "可导入 {{n}}",
  "import.stats.duplicate": "重复 {{n}}",
  "import.stats.failed": "失败 {{n}}",
  "import.skipDuplicates": "跳过 {{n}} 条与现有记录重复的行",
  "import.skipDuplicatesOff": "（取消勾选将全部导入）",
  "import.table.type": "类型",
  "import.table.source": "来源",
  "import.table.confidence": "可信度",
  "import.table.paid": "付费",
  "import.table.segment": "客群",
  "import.table.form": "形态",
  "import.table.amount": "金额",
  "import.table.currency": "币种",
  "import.table.status": "状态",
  "import.status.importable": "可导入",
  "import.status.duplicateSkip": "重复（跳过）",
  "import.status.duplicate": "重复",
  "import.status.failed": "失败",
  "import.onlyFirst100": "只显示前 100 行",
  "import.action.reset": "重新输入",
  "import.action.confirm": "确认导入 {{n}} 条",
  "import.importing": "正在导入…",
  "import.done.success": "成功导入 {{n}} 条",
  "import.done.duplicates": "已跳过 {{n}} 条重复记录",
  "import.done.failed": "失败 {{n}} 条",
  "import.done.failLine": "第 {{n}} 行：{{error}}",
  "import.done.more": "…还有 {{n}} 条",
  "import.done.close": "完成",

  // AI 起草卡
  "aidraft.title": "AI 起草 · {{entity}}",
  "aidraft.noApiKey": "尚未配置 API Key，请前往「设置」填写。",
  "aidraft.parseFail":
    "未能从这段文本中提取出有效记录。检查一下内容，或改写成更明确的形式再试。",
  "aidraft.placeholder.signal":
    "粘贴一段用户反馈、平台数据、或任何有信号价值的文本…",
  "aidraft.placeholder.conversion":
    "粘贴一段支付确认、购买通知、或用户付费描述…",
  "aidraft.placeholder.lesson": "粘贴一段项目复盘、反思笔记…",
  "aidraft.placeholder.decision": "粘贴一段决策背景描述…",
  "aidraft.action.generate": "生成",
  "aidraft.drafting": "正在提取…",
  "aidraft.action.reset": "重新输入",
  "aidraft.action.confirm": "确认写入",
  "aidraft.saving": "正在写入…",

  // 结构化信息表单
  "mode.title": "结构化信息",
  "mode.filled": "{{filled}} / {{total}} 个字段已填",
  "mode.action.aiDraft": "AI 起草",
  "mode.action.drafting": "起草中…",
  "mode.action.edit": "编辑",
  "mode.action.add": "补充详情",
  "mode.action.cancel": "取消",
  "mode.action.save": "保存",
  "mode.action.saving": "保存中…",
  "mode.noApiKey": "尚未配置 API Key，请前往「设置」填写。",
  "mode.aiParseError": "AI 返回的内容无法解析为 JSON，请重试。",
  "mode.aiDrafting": "AI 正在分析项目上下文并起草，请稍候…",
  "mode.empty":
    "还没有填写结构化信息。点「补充详情」手动填写，或让 AI 根据已有记录起草。",

      // AI 页
  "ai.title": "AI 助手",
  "ai.subtitle": "AI 只做总结、归纳、草稿、学习整理；不判断数据真假，不改变可信度。",
  "ai.tab.chat": "对话",
  "ai.tab.history": "历史",
  "ai.field.purpose": "用途",
  "ai.field.project": "关联项目（可选）",
  "ai.field.project.none": "（不关联）",
  "ai.clear": "清空对话",
  "ai.noApiKey":
    "尚未配置 API Key。请前往「设置」填写 API Base、Model 和 API Key。",
  "ai.empty": "开始一段对话。AI 不会替你判断真假，只帮你整理思路。",
  "ai.input.placeholder": "输入消息…（Enter 发送，Shift+Enter 换行）",
  "ai.cancel.stopping": "正在停止…",
  "ai.cancel.title": "停止生成",
  "ai.continue": "继续生成",
  "ai.continue.title": "从上一次中断处继续生成",

  // AI 用途
  "ai.purpose.general": "通用对话",
  "ai.purpose.signal_summary": "信号模式总结",
  "ai.purpose.channel_summary": "渠道归纳",
  "ai.purpose.distribution_draft": "分发草稿",
  "ai.purpose.lesson_summary": "学习总结",
  "ai.purpose.structured_draft": "结构化起草",
  "ai.purpose.draft_signal": "起草信号",
  "ai.purpose.draft_conversion": "起草转化",
  "ai.purpose.draft_lesson": "起草学习",
  "ai.purpose.draft_decision": "起草决策",

  // 历史
  "history.filter.all": "全部项目",
  "history.loading": "正在加载…",
  "history.empty.title": "暂无历史记录。",
  "history.empty.description": "每次 AI 对话都会自动落库，可以在这里回看。",
  "history.confirm.delete": "确定要删除这条记录吗？",
  "history.project.none": "（未关联）",
  "history.project.deleted": "（已删除项目）",
  "history.prompt.none": "（无 prompt）",
  "history.response.none": "（无响应）",
  "history.role.user": "用户",
  "history.delete": "删除",
  "history.footer.total": "共 {{n}} 条记录",
  "history.footer.filtered": "（已按项目筛选）",
  "history.footer.recent": "（显示最近 200 条）",

  // Harbor
  "harbor.title": "Harbor",
  "harbor.subtitle": "已归档项目停靠的地方。归档不是失败，是把经历变成资产。",
  "harbor.empty.title": "Harbor 还是空的",
  "harbor.empty.description":
    "当一个项目完成使命（或被冻结），把它归档，它会停靠到这里。",
  "harbor.stat.products": "停靠产品",
  "harbor.stat.signals": "累计信号",
  "harbor.stat.lessons": "累计学习",
  "harbor.stat.income": "累计收入",
  "harbor.card.archiveReason": "归档原因：",
  "harbor.card.sunset": "日落条款：",
  "harbor.card.noIncome": "无收入记录",
  "harbor.card.days": "{{n}} 天",

  // 产品组合
  "portfolio.title": "产品组合",
  "portfolio.subtitle": "所有项目的状态一览。归档的项目停靠在 Harbor。",
  "portfolio.empty.title": "还没有项目",
  "portfolio.empty.description":
    "从「新项目」开始，或在 Dashboard 里查看已有的项目。",
  "portfolio.stat.total": "全部",
  "portfolio.stat.active": "进行中",
  "portfolio.stat.archived": "Harbor",
  "portfolio.stat.frozen": "冻结",
  "portfolio.group.active": "进行中",
  "portfolio.group.archived": "Harbor（已归档）",
  "portfolio.group.frozen": "冻结",
  "portfolio.group.activeDesc": "正在推进或已上线、有收入的产品",
  "portfolio.group.archivedDesc": "已完成使命的项目。归档不是失败，是资产。",
  "portfolio.group.frozenDesc": "暂时搁置，可能未来重启",
  "portfolio.mode.validateFirst": "验证优先",
  "portfolio.mode.buildFirst": "构建优先",
  "portfolio.mode.portfolio": "组合管理",
  "portfolio.status.planning": "规划中",
  "portfolio.status.building": "构建中",
  "portfolio.status.launched": "已上线",
  "portfolio.status.converting": "有转化",
  "portfolio.status.active": "运营中",
  "portfolio.status.archived": "已归档",
  "portfolio.status.frozen": "已冻结",
  "portfolio.card.archiveReason": "归档原因：",
  "portfolio.card.sunset": "日落条款：",
  "portfolio.card.signals": "信号 {{n}}",
  "portfolio.card.lessons": "学习 {{n}}",
  "portfolio.card.entryBadge": "入口 {{entry}}",

  // 新项目入口
  "onboarding.title": "选择入口",
  "onboarding.subtitle": "工具只让决策可追溯，不替你决定方向。",
  "onboarding.entry.A.title": "我有个想法",
  "onboarding.entry.A.desc":
    "有渠道、能感知外部痛点，愿意在开发前投入验证成本。",
  "onboarding.entry.B.title": "我有个产品",
  "onboarding.entry.B.desc":
    "已做出可运行产品但转化困难，需要反向定位和渠道聚焦。",
  "onboarding.entry.C.title": "我有多个产品",
  "onboarding.entry.C.desc": "偏好持续开发新产品，用数量对抗不确定性。",
  "onboarding.form.title": "项目基础信息",
  "onboarding.form.name": "名称",
  "onboarding.form.namePlaceholder": "例如：ShipSignal",
  "onboarding.form.description": "描述（可选）",
  "onboarding.form.create": "创建项目",
  "onboarding.form.creating": "创建中…",

    // 结构化信息字段
  "modeData.validate_first.pain_point.title": "痛点",
  "modeData.validate_first.pain_point.description":
    "你要验证的问题本身。写具体，不要抽象。",
  "modeData.validate_first.pain_point.fields.who.label": "谁有这个问题",
  "modeData.validate_first.pain_point.fields.who.hint": "越具体越好",
  "modeData.validate_first.pain_point.fields.who.placeholder":
    "例如：独立开发者、跨境电商卖家",
  "modeData.validate_first.pain_point.fields.what.label": "具体是什么问题",
  "modeData.validate_first.pain_point.fields.what.placeholder":
    "例如：找不到靠谱的海外支付方案，手续费高、集成复杂",
  "modeData.validate_first.pain_point.fields.workaround.label":
    "他们现在怎么凑合",
  "modeData.validate_first.pain_point.fields.workaround.hint":
    "现有替代方案是什么",
  "modeData.validate_first.pain_point.fields.workaround.placeholder":
    "例如：用 PayPal，但转化率低；或手动处理，效率极差",

  "modeData.validate_first.validation_result.title": "验证结果",
  "modeData.validate_first.validation_result.fields.method.label":
    "怎么验证的",
  "modeData.validate_first.validation_result.fields.method.placeholder":
    "例如：用户访谈 / 落地页 / 预售",
  "modeData.validate_first.validation_result.fields.sample_size.label":
    "样本量",
  "modeData.validate_first.validation_result.fields.sample_size.placeholder":
    "例如：访谈了 12 人，落地页 200 访问",
  "modeData.validate_first.validation_result.fields.conclusion.label":
    "结论",
  "modeData.validate_first.validation_result.fields.conclusion.placeholder":
    "例如：7/12 人表示愿意付费，价格敏感度低",

  "modeData.validate_first.product_spec.title": "产品定义",
  "modeData.validate_first.product_spec.fields.core_feature.label":
    "核心功能",
  "modeData.validate_first.product_spec.fields.core_feature.placeholder":
    "一句话说清这个产品做什么",
  "modeData.validate_first.product_spec.fields.target_user.label":
    "目标用户",
  "modeData.validate_first.product_spec.fields.target_user.placeholder":
    "第一波用户是谁",
  "modeData.validate_first.product_spec.fields.scope.label": "范围边界",
  "modeData.validate_first.product_spec.fields.scope.hint":
    "做什么、不做什么",
  "modeData.validate_first.product_spec.fields.scope.placeholder":
    "例如：只做支付集成，不做账户系统",

  "modeData.build_first.product_layer.title": "产品状态",
  "modeData.build_first.product_layer.fields.what_it_does.label":
    "产品做什么",
  "modeData.build_first.product_layer.fields.what_it_does.placeholder":
    "一句话描述",
  "modeData.build_first.product_layer.fields.current_state.label":
    "当前状态",
  "modeData.build_first.product_layer.fields.current_state.placeholder":
    "例如：MVP 已上线 / 有 20 个付费用户",
  "modeData.build_first.product_layer.fields.user_count.label":
    "用户规模",
  "modeData.build_first.product_layer.fields.user_count.placeholder":
    "例如：注册 500，活跃 80",

  "modeData.build_first.channel_signal.title": "渠道信号",
  "modeData.build_first.channel_signal.fields.tried_channels.label":
    "试过的渠道",
  "modeData.build_first.channel_signal.fields.tried_channels.placeholder":
    "例如：Twitter、Product Hunt、Reddit r/SaaS",
  "modeData.build_first.channel_signal.fields.best_channel.label":
    "效果最好的",
  "modeData.build_first.channel_signal.fields.best_channel.placeholder":
    "哪个渠道带来了真实转化",
  "modeData.build_first.channel_signal.fields.detail.label": "具体数据",
  "modeData.build_first.channel_signal.fields.detail.hint":
    "带数字，别写形容词",
  "modeData.build_first.channel_signal.fields.detail.placeholder":
    "例如：Reddit 一帖带来 30 注册、3 付费",

  "modeData.build_first.monetization_match.title": "变现匹配",
  "modeData.build_first.monetization_match.fields.current_model.label":
    "当前变现方式",
  "modeData.build_first.monetization_match.fields.current_model.placeholder":
    "例如：一次性买断 / 订阅 / API 授权",
  "modeData.build_first.monetization_match.fields.price_point.label": "价格",
  "modeData.build_first.monetization_match.fields.price_point.placeholder":
    "例如：$29 一次性 / $9/月",
  "modeData.build_first.monetization_match.fields.assessment.label":
    "匹配度评估",
  "modeData.build_first.monetization_match.fields.assessment.placeholder":
    "例如：用户付费意愿强，但复购率低",

  "modeData.portfolio.portfolio_management.title": "组合管理",
  "modeData.portfolio.portfolio_management.fields.products.label":
    "产品清单",
  "modeData.portfolio.portfolio_management.fields.products.hint":
    "一行一个",
  "modeData.portfolio.portfolio_management.fields.products.placeholder":
    "例如：\nA - 支付 SDK（已验证）\nB - 邮件工具（开发中）\nC - 图标库（维护中）",
  "modeData.portfolio.portfolio_management.fields.allocation.label":
    "时间分配原则",
  "modeData.portfolio.portfolio_management.fields.allocation.placeholder":
    "例如：60% 给已验证产品，30% 给新产品，10% 维护",
  "modeData.portfolio.portfolio_management.fields.review_cycle.label":
    "多久 review 一次",
  "modeData.portfolio.portfolio_management.fields.review_cycle.placeholder":
    "例如：每两周一次",

  "modeData.portfolio.sunset_clause.title": "日落条款",
  "modeData.portfolio.sunset_clause.description":
    "什么条件下放弃一个产品。写清楚，才能在情感上放得下。",
  "modeData.portfolio.sunset_clause.fields.trigger_conditions.label":
    "触发条件",
  "modeData.portfolio.sunset_clause.fields.trigger_conditions.hint":
    "写具体，写数字",
  "modeData.portfolio.sunset_clause.fields.trigger_conditions.placeholder":
    "例如：\n- 连续 3 个月零收入\n- 维护时间超过每周 2 小时\n- 连续 2 个 review 周期无增长",
  "modeData.portfolio.sunset_clause.fields.exit_plan.label": "退出方式",
  "modeData.portfolio.sunset_clause.fields.exit_plan.placeholder":
    "例如：归档 / 开源 / 打包出售 / 转免费维护",

      // 通用操作
  "common.edit": "编辑",
  "common.delete": "删除",
  "common.deleteConfirmTitle": "确认删除？",
  "common.deleteConfirmBody": "此操作不可撤销。",

  // 信号编辑
  "signals.edit.title": "编辑信号",
  "signals.edit.save": "保存修改",
  "signals.edit.saving": "保存中…",
  "signals.delete.title": "确认删除这条信号？",


    // 决策编辑
  "decisions.edit.title": "编辑决策",
  "decisions.edit.save": "保存修改",
  "decisions.edit.saving": "保存中…",
  "decisions.delete.title": "确认删除这条决策？",

  // 转化编辑
  "conversions.edit.title": "编辑转化",
  "conversions.edit.save": "保存修改",
  "conversions.edit.saving": "保存中…",
  "conversions.delete.title": "确认删除这条转化记录？",

  // 学习编辑
  "lessons.edit.title": "编辑学习信号",
  "lessons.edit.save": "保存修改",
  "lessons.edit.saving": "保存中…",
  "lessons.delete.title": "确认删除这条学习信号？",

   // 关闭确认弹窗
  "window.closeConfirm.title": "关闭 ShipSignal",
  "window.closeConfirm.body": "退出应用，还是最小化到系统托盘？",
  "window.closeConfirm.remember": "记住我的选择（可在设置中修改）",
  "window.closeConfirm.tray": "最小化到托盘",
  "window.closeConfirm.exit": "退出应用",

  // 设置页 - 关闭行为
  "settings.appearance.closeBehavior": "关闭窗口时",
  "settings.appearance.closeBehavior.ask": "每次询问",
  "settings.appearance.closeBehavior.exit": "退出应用",
  "settings.appearance.closeBehavior.tray": "最小化到托盘",

    // 搜索
  "search.placeholder": "搜索项目、信号、学习、决策、转化…",
  "search.empty": "输入关键词开始搜索",
  "search.noResults": "没有匹配结果",
  "search.loading": "搜索中…",
  "search.hint": "↑↓ 选择 · Enter 打开 · Esc 关闭",
  "search.kind.project": "项目",
  "search.kind.signal": "信号",
  "search.kind.lesson": "学习",
  "search.kind.decision": "决策",
  "search.kind.conversion": "转化",

  "nav.today": "今日",

  "today.title": "今日建议",
  "today.refresh": "刷新建议",
  "today.refreshing": "计算中…",
  "today.filter.all": "全部",
  "today.done": "完成",
  "today.skip": "跳过",
  "today.replace": "换一个",
  "today.draft.label": "草稿",
  "today.draft.generate": "AI 起草",
  "today.draft.generating": "生成中…",
  "today.draft.noApiKey": "请先在「设置」里配置 AI API Key。",
  "today.draft.placeholder": "写点什么，或留空…",
  "today.empty.restartColdStart": "重新显示冷启动引导",
  "today.empty.title": "今天没有建议",
  "today.empty.hint": "去记录点信号吧，工具会从你的记录里给出下一步。",
  "today.empty.cta": "去记录信号",



  "coldStart.panel.title": "「{{name}}」还没有信号",
  "coldStart.panel.attempts": "已尝试 {{n}} 次",
  "coldStart.panel.dismiss": "暂时跳过",
  "coldStart.panel.noApiKey": "请先在「设置」里配置 AI API Key。",
  "coldStart.back": "返回",

  "coldStart.menu.question": "你想怎么开始？",
  "coldStart.menu.case.title": "看别人怎么写的",
  "coldStart.menu.case.desc": "三条真实风格的发布案例，你自己照着改",
  "coldStart.menu.quick.title": "一句话生成",
  "coldStart.menu.quick.desc": "用一句话说你的产品，AI 出一段",
  "coldStart.menu.mirror.title": "我写了，你帮我看看",
  "coldStart.menu.mirror.desc": "AI 只给一条改进建议，不重写",

  "coldStart.case.hint": "看别人怎么写的，然后写你自己的。",
  "coldStart.case.refresh": "换一批",
  "coldStart.case.writeYours": "现在轮到你写",
  "coldStart.case.placeholder": "可以借鉴案例的结构，但用你自己的话。",

  "coldStart.quick.hint": "一句话说清楚你的产品。",
  "coldStart.quick.placeholder": "比如：帮开发者在项目里自动找图标",
  "coldStart.quick.tip": "懒得想也没关系，直接点生成。",
  "coldStart.quick.generate": "生成一版",
  "coldStart.quick.regenerate": "换一版",

  "coldStart.mirror.hint": "把你写好的内容粘进来。AI 只给一条建议，不改你的文字。",
  "coldStart.mirror.placeholder": "粘贴或写下你的初稿…",
  "coldStart.mirror.review": "帮我看看",
  "coldStart.mirror.reviewing": "正在看…",

  "coldStart.draft.label": "你的内容",
  "coldStart.draft.writing": "正在写…",
  "coldStart.draft.published": "我发出去了",
  "coldStart.draft.empty": "AI 没返回内容。检查一下 API Key 和网络。",

  "coldStart.publish.done": "发出去那一刻，就已经赢了。",

  "coldStart.mood.question": "感觉怎么样？没有标准答案。",
  "coldStart.mood.confident": "有信心，我觉得有戏",
  "coldStart.mood.ok": "还行，发出去就行",
  "coldStart.mood.unsure": "没底，不太确定",
  "coldStart.mood.retry": "想再试一次，换个方式",

  "coldStart.retry.again": "再试一次",
  "coldStart.retry.done": "今天先到这",

  "coldStart.feedback.reading": "我读一下…",
  "coldStart.feedback.recognition": "我看到了",
  "coldStart.feedback.direction": "你可以试试",
  "coldStart.feedback.timeout": "AI 15 秒没回应。检查一下 API Key 和网络。",
  "coldStart.feedback.fallbackHint": "内容已经存下来了。你可以直接去发布，或者回菜单重试。",

} as const;

export type ZhKeys = keyof typeof zh;