# 目标文章去 AI 味

这是一个钉钉 AI 表格自定义字段，用于对当前行的目标文章正文进行自然化改写，减少模板化、机械化和过度工整的表达。

字段会保留原文的事实、主题和业务信息，只返回改写后的完整正文。它不负责采集链接、解析网页、生成新卖点，也不承诺规避 AI 检测或平台风控。

## 输入

| 配置项 | 说明 |
| --- | --- |
| 目标文章正文 | 必填，支持文本或富文本字段，正文长度为 50 至 8,000 个字符。 |
| 处理强度 | 可选轻度润色、标准自然化或深度重写，默认为标准自然化。 |

处理强度的区别：

- `light`：保留原文结构和段落顺序，主要清理明显的模板化表达。
- `balanced`：调整句式、段落节奏和局部表达，适合大多数正文。
- `strong`：允许重组段落和改写大部分句子，但不会主动新增事实。

## 本地运行

环境要求：Node.js 22 或更高版本、npm 11，以及共享 AI 工具服务提供的访问密钥。

```bash
npm install
cp config.example.json config.json
```

将 `config.json` 中的占位值替换为测试环境的服务访问密钥：

```json
{
  "authorizations": "replace-with-local-service-api-key"
}
```

启动字段调试服务：

```bash
npm start
```

生成可提交到钉钉开放平台的字段包：

```bash
npm run pack
```

打包产物位于 `output/` 目录。

## 服务依赖

字段固定调用以下接口，不在客户端保存模型服务商密钥：

```text
POST https://field.kazhilian.com/v1/tools/xhs-humanize-rewrite
Authorization: Bearer <service-api-key>
```

钉钉字段授权 ID 为 `xhs_ai_tools_service`，允许访问的域名为 `field.kazhilian.com`。服务鉴权失败、限流、配额不足或响应异常时，字段会返回对应的钉钉执行错误码，不会返回不完整正文。

## 目录结构

```text
src/index.ts           字段配置、表单和多语言文案
src/execute.ts         输入校验、服务调用和错误映射
src/service-config.ts  服务地址、授权 ID 和 API 版本
test/execute.test.ts   字段执行逻辑测试
config.example.json    本地调试配置示例
```

## 安全说明

`config.json` 包含本地服务访问密钥，已被 `.gitignore` 忽略，请勿提交到代码仓库。字段只应处理允许发送到共享 AI 工具服务的正文，发布前仍需人工审核改写结果。
