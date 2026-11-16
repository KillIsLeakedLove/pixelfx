# Project Rules / 项目规则

## Public Repository Security / 公开仓库安全

- This is a public repository. Never stage, commit, or push credentials, tokens, private keys, certificates, production data, or files containing other sensitive information. 本项目为公开仓库，严禁暂存、提交或推送密钥、令牌、私钥、证书、生产数据及其他敏感信息。
- Keep secrets in environment variables or a local, ignored file. Provide redacted placeholders in examples; never paste real credentials into source, docs, issues, or test fixtures. 密钥仅通过环境变量或本地忽略文件提供；示例必须使用脱敏占位值，禁止把真实凭据写入代码、文档、问题单或测试样例。
- Before committing or pushing, inspect the staged file list and diff, run `npm run check:secrets`, and resolve every finding. 提交或推送前检查暂存文件清单与差异，运行 `npm run check:secrets` 并处理所有发现。
- Do not bypass a secret-scanning failure by suppressing or rewriting a detection. Confirm a finding is a false positive and add a narrow documented exception only when necessary. 不得通过屏蔽或改写检测来绕过密钥扫描失败；只有确认误报后，才可添加范围明确且有说明的例外。

## Changes / 项目改动

- Keep the public English API and effect IDs stable unless a request explicitly changes them.
- User-facing Gallery controls and documentation links must have English and Simplified Chinese text, and language selection must work on static GitHub Pages URLs.
- Public-facing changes should retain the existing lightweight, dependency-free browser runtime.
