import { useState, useEffect } from "react";
import {
  Action,
  ActionPanel,
  Detail,
  Form,
  getPreferenceValues,
  showToast,
  Toast,
  Clipboard,
  showHUD,
  Icon,
  Color,
} from "@raycast/api";
import { JiraAPI, JiraConfig } from "./jira-api";
import { prepareReportData, generateMarkdownReport, generatePlainTextReport } from "./report-templates";

interface Preferences {
  jiraUrl: string;
  jiraEmail: string;
  jiraToken: string;
}

interface FormValues {
  days: string;
  format: string;
}

export default function GenerateReport() {
  const [isLoading, setIsLoading] = useState(false);
  const [report, setReport] = useState<string>("");
  const [reportGenerated, setReportGenerated] = useState(false);

  const preferences = getPreferenceValues<Preferences>();

  async function handleSubmit(values: FormValues) {
    setIsLoading(true);
    
    try {
      const config: JiraConfig = {
        url: preferences.jiraUrl.replace(/\/$/, ''),
        email: preferences.jiraEmail,
        token: preferences.jiraToken,
      };

      let jiraAPI = new JiraAPI(config);
      const daysBack = parseInt(values.days) || 7;

      await showToast({
        style: Toast.Style.Animated,
        title: "Jira 이슈를 조회하는 중...",
      });

      // 다중 인증 전략 시도
      let issues, user;
      let authMethod = "Bearer";
      
      try {
        // Bearer 토큰 먼저 시도
        user = await jiraAPI.getCurrentUser();
        issues = await jiraAPI.getWeeklyIssues(daysBack);
      } catch (bearerError) {
        try {
          // Basic Auth로 재시도
          const basicConfig = { ...config, authType: 'basic' as const };
          jiraAPI = new JiraAPI(basicConfig);
          user = await jiraAPI.getCurrentUser();
          issues = await jiraAPI.getWeeklyIssues(daysBack);
          authMethod = "Basic";
        } catch (basicError) {
          // REST API 2 시도 (구버전 Jira Server)
          try {
            const v2Config = { ...config, apiVersion: 'v2' as const };
            jiraAPI = new JiraAPI(v2Config);
            user = await jiraAPI.getCurrentUser();
            issues = await jiraAPI.getWeeklyIssues(daysBack);
            authMethod = "Bearer (API v2)";
          } catch (v2Error) {
            // 모든 인증 방식 실패 시 더 상세한 오류 정보 제공
            const bearerMsg = bearerError instanceof Error ? bearerError.message : String(bearerError);
            const basicMsg = basicError instanceof Error ? basicError.message : String(basicError);
            const v2Msg = v2Error instanceof Error ? v2Error.message : String(v2Error);
            
            throw new Error(`All authentication methods failed:\n\nBearer Token (v3): ${bearerMsg}\n\nBasic Auth (v3): ${basicMsg}\n\nBearer Token (v2): ${v2Msg}`);
          }
        }
      }
      
      if (issues.length === 0) {
        await showToast({
          style: Toast.Style.Failure,
          title: "이슈가 없습니다",
          message: `지난 ${daysBack}일간 관련 이슈를 찾을 수 없습니다.`,
        });
        setIsLoading(false);
        return;
      }

      const reportData = prepareReportData(issues, user.emailAddress, daysBack);
      
      let generatedReport: string;
      if (values.format === "markdown") {
        generatedReport = generateMarkdownReport(reportData);
      } else {
        generatedReport = generatePlainTextReport(reportData);
      }

      setReport(generatedReport);
      setReportGenerated(true);

      await showToast({
        style: Toast.Style.Success,
        title: "보고서 생성 완료",
        message: `${issues.length}개 이슈로 보고서를 생성했습니다.`,
      });

    } catch (error) {
      console.error("Error generating report:", error);
      await showToast({
        style: Toast.Style.Failure,
        title: "보고서 생성 실패",
        message: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
      });
    } finally {
      setIsLoading(false);
    }
  }

  async function copyToClipboard() {
    await Clipboard.copy(report);
    await showHUD("보고서가 클립보드에 복사되었습니다 📋");
  }

  if (reportGenerated && report) {
    return (
      <Detail
        markdown={report}
        navigationTitle="주간 업무 보고서"
        actions={
          <ActionPanel>
            <Action
              title="클립보드에 복사"
              icon={Icon.Clipboard}
              onAction={copyToClipboard}
            />
            <Action
              title="새 보고서 생성"
              icon={Icon.ArrowCounterClockwise}
              onAction={() => {
                setReportGenerated(false);
                setReport("");
              }}
            />
          </ActionPanel>
        }
        metadata={
          <Detail.Metadata>
            <Detail.Metadata.TagList title="상태">
              <Detail.Metadata.TagList.Item
                text="생성 완료"
                color={Color.Green}
              />
            </Detail.Metadata.TagList>
            <Detail.Metadata.Separator />
            <Detail.Metadata.Label
              title="길이"
              text={`${report.length.toLocaleString()} 문자`}
            />
          </Detail.Metadata>
        }
      />
    );
  }

  return (
    <Form
      isLoading={isLoading}
      actions={
        <ActionPanel>
          <Action.SubmitForm
            title="보고서 생성"
            icon={Icon.Document}
            onSubmit={handleSubmit}
          />
        </ActionPanel>
      }
    >
      <Form.Dropdown id="days" title="기간" defaultValue="7">
        <Form.Dropdown.Item value="3" title="최근 3일" />
        <Form.Dropdown.Item value="7" title="최근 7일 (1주)" />
        <Form.Dropdown.Item value="14" title="최근 14일 (2주)" />
        <Form.Dropdown.Item value="30" title="최근 30일 (1달)" />
      </Form.Dropdown>

      <Form.Dropdown id="format" title="출력 형식" defaultValue="markdown">
        <Form.Dropdown.Item value="markdown" title="마크다운" />
        <Form.Dropdown.Item value="text" title="일반 텍스트" />
      </Form.Dropdown>

      <Form.Description text="Jira에서 할당받은 이슈와 작업한 이슈를 기반으로 주간 보고서를 생성합니다." />
    </Form>
  );
}