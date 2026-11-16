# Security / 安全

## Public repository / 公开仓库

This repository is public. Never commit or push API keys, passwords, access tokens, private keys, certificates, production data, or other credentials. Store local secrets in environment variables or ignored files such as `.env`; share only redacted placeholders.

本仓库为公开仓库。禁止提交或推送 API 密钥、密码、访问令牌、私钥、证书、生产数据或其他凭据。仅通过环境变量或 `.env` 等已忽略的本地文件保存密钥；分享内容必须使用脱敏占位符。

Run `npm run check:secrets` before committing or pushing. GitHub Actions also scans repository history with Gitleaks.

提交或推送前运行 `npm run check:secrets`。GitHub Actions 还会使用 Gitleaks 扫描仓库提交历史。

## If a secret is exposed / 如果密钥已泄露

Revoke or rotate it immediately. Removing the file from a later commit does not invalidate a leaked credential. Review the repository's GitHub secret-scanning alert and remove the secret from history using the repository's incident-response process.

立即吊销或轮换泄露的密钥。后续提交中删除文件并不能让已泄露凭据失效。请检查 GitHub 密钥扫描告警，并按仓库事件响应流程从历史中移除敏感数据。
