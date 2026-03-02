# Requirement Co-Builder CLI

## What This Is

一个本地命令行工具，通过"合作型导师"风格的对话，帮助用户将模糊想法逐步打磨为逻辑闭合、结构清晰的需求表达。它不是自动写 PRD 的工具，而是一个认知澄清引擎——强调从模糊到清晰的过程，而非风险验证。产物为纯文本，可直接交给 AI 编码工具执行。

## Core Value

通过结构化对话让模糊想法逐轮收敛为可执行的需求描述，同时保持人对思考过程的主导权。

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] CLI 工具支持 `req new / chat / build / snapshot / list / research` 六个核心命令
- [ ] 合作型导师对话引擎：每轮只推进一个关键点，重述理解 + 压缩重写
- [ ] 五维展开模型（Context / Actors / Intent / Mechanism / Boundary）
- [ ] 四级清晰阶段（concept → direction → structure → executable）
- [ ] 逻辑前提显性化（LOGIC_BASE）+ 因果链可视化（LOGIC_CHAIN）
- [ ] 防模型带节奏机制：禁止抽象空话、禁止未到 structure 阶段给方案
- [ ] 受控知识解释机制：用户触发（/explain /deep-dive /later），≤8句，标注置信度
- [ ] 业务假设显性化（BUSINESS_ASSUMPTION）
- [ ] 文件夹存储：每个想法一个项目目录，含 state.json / idea.md / logs / snapshots
- [ ] 可中断可继续：退出后 `req chat <project>` 恢复上下文
- [ ] `req build` 编译产物：spec.md + acceptance.md + tasks.md
- [ ] idea.md 固定结构：一句话版本 / 三句话版本 / 结构化版本 / 阶段 / 开放点
- [ ] 可配置多 LLM 后端（OpenAI / Anthropic 等）
- [ ] 存储位置支持全局（~/.reqgen/projects/）和本地（--local 当前目录）
- [ ] 对话语言中文，结构化输出英文

### Out of Scope

- 风险验证/证据审计模式 — v2 插件扩展
- 图形界面/网页端 — CLI 优先
- 团队协作/多人权限 — 个人自用
- 自动联网抓取竞品 — v1 手动 + 占位，后续可插拔
- 架构图自动生成 — 文本表达即可
- 多模式切换（功能需求/产品模块/体系重构）— v2 扩展

## Context

- 用户为个人开发者，常进行产品类需求规划和系统级架构思考
- 用户是逻辑触发型决策者，最怕被模型带节奏产生"虚假清晰感"
- 现有方式（文档/脑图/随手记）缺乏逐轮收敛引导、版本演进追溯、压缩表达训练
- 产物需要可直接喂给 Codex / Claude Code 等 AI 编码工具
- 设计源自与 ChatGPT 的深度讨论，参考了 GSD / Superpower / OMO 框架的需求层设计
- 系统版本为 v1.3（逻辑护栏版），已冻结核心范围

## Constraints

- **Tech Stack**: Node.js / TypeScript — 生态丰富，与 AI 编码链路天然对接
- **LLM**: 可配置多后端（OpenAI / Anthropic），不绑定单一 provider
- **Platform**: 跨平台（Windows / macOS / Linux）
- **Privacy**: 项目内容默认仅本地，不自动上传第三方（除 LLM API 请求本身）
- **Offline**: 除 LLM 调用外离线可用，所有状态本地文件可读可编辑

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| 合作型导师风格（非审问/非自动生成） | 保持人对思考的主导权，防止模型替代思考 | — Pending |
| 逻辑前提显性化 + 因果链可视化 | 用户为逻辑驱动型，需要看见推理依据 | — Pending |
| 防节奏机制（禁止抽象空话/限制建议频率） | 防止"流畅≠清晰"的虚假共识 | — Pending |
| 知识解释用户触发制 | 防止学习发散吞掉主线 | — Pending |
| Node.js/TypeScript | 生态丰富，与 Codex/Claude Code 链路对接 | — Pending |
| 可配置多 LLM 后端 | 不绑定单一 provider，灵活切换 | — Pending |
| 存储支持全局+本地 | 兼顾集中管理和项目就近存储 | — Pending |

---
*Last updated: 2026-03-02 after initialization*
