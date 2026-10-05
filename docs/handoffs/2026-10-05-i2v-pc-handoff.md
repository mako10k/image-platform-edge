# 別PCへの引継ぎ（2026-10-05）

正本の再開入口: [API側の総合引継ぎ](https://github.com/mako10k/image-platform/blob/main/docs/handoffs/2026-10-05-i2v/README.md)。
リモートへの保存はユーザー承認済みです。最新HEADはgit log/リモートHEADで確認してください。

API r10/catalog r12のI2Vを追加し、API Modal v74を配備済み。Web/CLIの実装とローカル検証は完了。
I2V実GPU生成/取得/視聴受入は未実施、追加実測費用は未承認。CLIは動画scope付き再ログインが必要。
新しいブランチを増やさず、各リポジトリの既存デフォルトブランチで継続します。
Web公開preview/tunnel、秘密・keyring・.env.localはGitだけでは別PCへ移りません。

Edgeはデフォルトfix/issue-1-scope-parity。稼働中Workerのcompiled CORS修正は
Edgeのdocs/deployments/2026-10-05-video-corsに保存済みで、TypeScriptへの反映は未完了。
古いソースをそのままdeployせず、総合資料の契約・認証・検証・配備証拠を照合してください。
