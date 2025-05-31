# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a Raycast extension that generates weekly work reports from Jira issues. Users can quickly access their Jira data and create formatted reports for weekly status updates.

## Architecture

- **TypeScript + React** - Raycast extension framework
- **Jira REST API** - Issue data retrieval
- **Template-based reporting** - Markdown and plain text outputs

### Key Files
- `src/generate-report.tsx` - Main Raycast command UI
- `src/settings.tsx` - Jira settings management and testing
- `src/jira-api.ts` - Jira API integration layer
- `src/report-templates.ts` - Report generation and formatting
- `package.json` - Raycast extension manifest with preferences

## Development Commands

```bash
# Install dependencies
npm install

# Start development mode
npm run dev

# Build extension
npm run build

# Lint code
npm run lint
```

## Raycast Development

- Extension uses Raycast's Form component for user input
- Preferences are configured in package.json for Jira credentials
- Uses Detail component to display generated reports
- Implements copy-to-clipboard functionality

## Available Commands

### Generate Weekly Report
- 주간 업무 보고서 생성
- 기간 및 형식 선택 가능 (3-30일, 마크다운/텍스트)
- 클립보드 자동 복사 기능

### Jira Settings  
- Jira 연결 설정 테스트 및 관리
- 실시간 연결 상태 확인
- 설정 가이드 및 오류 진단
- Raycast 확장 환경설정 바로 열기

## Jira Integration

- Supports Jira Cloud instances
- Uses Basic Auth with email + API token
- Searches for issues assigned to or worked on by current user
- Connection testing and validation
- Configurable time period (3-30 days)