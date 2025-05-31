import { JiraIssue } from "./jira-api";

export interface WeeklyReportData {
  period: string;
  totalIssues: number;
  completedIssues: number;
  inProgressIssues: number;
  issues: JiraIssue[];
  userEmail: string;
}

export function generateMarkdownReport(data: WeeklyReportData): string {
  const { period, totalIssues, completedIssues, inProgressIssues, issues } = data;
  
  let report = `# 주간 업무 보고서\n\n`;
  report += `**기간**: ${period}\n\n`;
  report += `## 📊 요약\n\n`;
  report += `- 총 이슈: ${totalIssues}개\n`;
  report += `- 완료: ${completedIssues}개\n`;
  report += `- 진행중: ${inProgressIssues}개\n`;
  report += `- 완료율: ${totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0}%\n\n`;

  const completedList = issues.filter(issue => 
    issue.fields.status.name.toLowerCase().includes('done') ||
    issue.fields.status.name.toLowerCase().includes('완료') ||
    issue.fields.status.name.toLowerCase().includes('resolved')
  );

  const inProgressList = issues.filter(issue => 
    issue.fields.status.name.toLowerCase().includes('progress') ||
    issue.fields.status.name.toLowerCase().includes('진행') ||
    issue.fields.status.name.toLowerCase().includes('개발')
  );

  const otherList = issues.filter(issue => 
    !completedList.includes(issue) && !inProgressList.includes(issue)
  );

  if (completedList.length > 0) {
    report += `## ✅ 완료된 작업\n\n`;
    completedList.forEach(issue => {
      report += `- [${issue.key}] ${issue.fields.summary}\n`;
      report += `  - 상태: ${issue.fields.status.name}\n`;
      report += `  - 유형: ${issue.fields.issuetype.name}\n`;
      if (issue.fields.resolutiondate) {
        const resolvedDate = new Date(issue.fields.resolutiondate).toLocaleDateString('ko-KR');
        report += `  - 완료일: ${resolvedDate}\n`;
      }
      report += `\n`;
    });
  }

  if (inProgressList.length > 0) {
    report += `## 🔄 진행중인 작업\n\n`;
    inProgressList.forEach(issue => {
      report += `- [${issue.key}] ${issue.fields.summary}\n`;
      report += `  - 상태: ${issue.fields.status.name}\n`;
      report += `  - 유형: ${issue.fields.issuetype.name}\n`;
      report += `  - 우선순위: ${issue.fields.priority.name}\n`;
      report += `\n`;
    });
  }

  if (otherList.length > 0) {
    report += `## 📋 기타 관련 이슈\n\n`;
    otherList.forEach(issue => {
      report += `- [${issue.key}] ${issue.fields.summary}\n`;
      report += `  - 상태: ${issue.fields.status.name}\n`;
      report += `  - 유형: ${issue.fields.issuetype.name}\n`;
      report += `\n`;
    });
  }

  return report;
}

export function generatePlainTextReport(data: WeeklyReportData): string {
  const { period, totalIssues, completedIssues, inProgressIssues, issues } = data;
  
  let report = `주간 업무 보고서\n`;
  report += `===============\n\n`;
  report += `기간: ${period}\n\n`;
  report += `요약:\n`;
  report += `- 총 이슈: ${totalIssues}개\n`;
  report += `- 완료: ${completedIssues}개\n`;
  report += `- 진행중: ${inProgressIssues}개\n`;
  report += `- 완료율: ${totalIssues > 0 ? Math.round((completedIssues / totalIssues) * 100) : 0}%\n\n`;

  const completedList = issues.filter(issue => 
    issue.fields.status.name.toLowerCase().includes('done') ||
    issue.fields.status.name.toLowerCase().includes('완료') ||
    issue.fields.status.name.toLowerCase().includes('resolved')
  );

  const inProgressList = issues.filter(issue => 
    issue.fields.status.name.toLowerCase().includes('progress') ||
    issue.fields.status.name.toLowerCase().includes('진행') ||
    issue.fields.status.name.toLowerCase().includes('개발')
  );

  if (completedList.length > 0) {
    report += `완료된 작업:\n`;
    completedList.forEach(issue => {
      report += `• [${issue.key}] ${issue.fields.summary}\n`;
      report += `  상태: ${issue.fields.status.name}, 유형: ${issue.fields.issuetype.name}\n`;
    });
    report += `\n`;
  }

  if (inProgressList.length > 0) {
    report += `진행중인 작업:\n`;
    inProgressList.forEach(issue => {
      report += `• [${issue.key}] ${issue.fields.summary}\n`;
      report += `  상태: ${issue.fields.status.name}, 유형: ${issue.fields.issuetype.name}\n`;
    });
    report += `\n`;
  }

  return report;
}

export function prepareReportData(issues: JiraIssue[], userEmail: string, daysBack: number): WeeklyReportData {
  const endDate = new Date();
  const startDate = new Date();
  startDate.setDate(startDate.getDate() - daysBack);
  
  const period = `${startDate.toLocaleDateString('ko-KR')} ~ ${endDate.toLocaleDateString('ko-KR')}`;
  
  const completedCount = issues.filter(issue => 
    issue.fields.status.name.toLowerCase().includes('done') ||
    issue.fields.status.name.toLowerCase().includes('완료') ||
    issue.fields.status.name.toLowerCase().includes('resolved')
  ).length;

  const inProgressCount = issues.filter(issue => 
    issue.fields.status.name.toLowerCase().includes('progress') ||
    issue.fields.status.name.toLowerCase().includes('진행') ||
    issue.fields.status.name.toLowerCase().includes('개발')
  ).length;

  return {
    period,
    totalIssues: issues.length,
    completedIssues: completedCount,
    inProgressIssues: inProgressCount,
    issues,
    userEmail
  };
}