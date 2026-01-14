# 4MGI Git Board - Tóm tắt

Mục tiêu: VS Code Extension quản lý Git workflow bằng visual UI

## Tech Stack:

- Extension Host: TypeScript
- UI: React + Zustand
- Graph: @gitgraph/js
- Git: simple-git
- Azure API: azure-devops-node-api
- GitHub API: @octokit/rest
- Styling: CSS Modules
- Build: esbuild
- Test: Vitest

## Cấu trúc:
src/
├── extension/ # VS Code extension host
├── webview/ # React UI
├── core/ # Shared logic
└── types/ # TypeScript types

## Tính năng chính:

1. Visual Commit Graph (zoom/pan, click commit detail)
2. Drag-and-drop Git operations (rebase, cherry-pick, merge)
3. Branch management (create, delete, checkout)
4. Interactive Rebase UI (pick/squash/fixup/drop)
5. Conflict resolution (3-way diff)
6. Azure Repos integration (PR, Work Items, Pipelines, Branch Policies)
7. GitHub integration (basic)

## Communication:
Extension ↔ Webview qua message protocol (postMessage)
