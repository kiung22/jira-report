
import { useState } from "react";
import {
  Action,
  ActionPanel,
  Detail,
  Form,
  getPreferenceValues,
  showToast,
  Toast,
  Icon,
  Color,
  openExtensionPreferences,
} from "@raycast/api";
import { JiraAPI, JiraConfig } from "./jira-api";

interface Preferences {
  jiraUrl: string;
  jiraEmail: string;
  jiraToken: string;
}

interface FormValues {
  jiraUrl: string;
  jiraEmail: string;
  jiraToken: string;
}

export default function Settings() {
  const [isLoading, setIsLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"unknown" | "success" | "failed">("unknown");
  const [testResult, setTestResult] = useState<string>("");

  const preferences = getPreferenceValues<Preferences>();

  async function testConnection(values?: FormValues) {
    setIsLoading(true);
    setConnectionStatus("unknown");
    
    try {
      
      const config: JiraConfig = values ? {
        url: values.jiraUrl.replace(/\/$/, ''),
        email: values.jiraEmail,
        token: values.jiraToken,
      } : {
        url: preferences.jiraUrl.replace(/\/$/, ''),
        email: preferences.jiraEmail,
        token: preferences.jiraToken,
      };
      

      // 빈 값 체크
      if (!config.url || !config.email || !config.token) {
        throw new Error("모든 필드를 입력해주세요.");
      }
      

      // URL 형식 체크
      if (!config.url.startsWith('http')) {
        throw new Error("Jira URL은 http:// 또는 https://로 시작해야 합니다.");
      }

      await showToast({
        style: Toast.Style.Animated,
        title: "Jira 연결을 테스트하는 중...",
      });

      // Bearer 토큰 먼저 시도
      let jiraAPI = new JiraAPI(config);
      let user;
      let authMethod = "Bearer";
      
      try {
        user = await jiraAPI.getCurrentUser();
      } catch (bearerError) {
        try {
          // Basic Auth로 재시도
          const basicConfig = { ...config, authType: 'basic' as const };
          jiraAPI = new JiraAPI(basicConfig);
          user = await jiraAPI.getCurrentUser();
          authMethod = "Basic";
        } catch (basicError) {
          // REST API 2 시도 (구버전 Jira Server)
          try {
            const v2Config = { ...config, apiVersion: 'v2' as const };
            jiraAPI = new JiraAPI(v2Config);
            user = await jiraAPI.getCurrentUser();
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
      
      setConnectionStatus("success");
      setTestResult(`✅ 연결 성공!\n\n` +
        `사용자: ${user.displayName}\n` +
        `이메일: ${user.emailAddress}\n` +
        `Jira URL: ${values?.jiraUrl || preferences.jiraUrl}\n` +
        `인증 방식: ${authMethod}`);

      await showToast({
        style: Toast.Style.Success,
        title: "연결 성공",
        message: `${user.displayName}님으로 로그인되었습니다.`,
      });

    } catch (error) {
      setConnectionStatus("failed");
      const errorMessage = error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.";
      
      console.error("Jira connection test failed:", error);
      
      const currentUrl = values?.jiraUrl || preferences.jiraUrl;
      const currentEmail = values?.jiraEmail || preferences.jiraEmail;
      const currentToken = values?.jiraToken || preferences.jiraToken;
      
      setTestResult(`❌ 연결 실패\n\n` +
        `오류: ${errorMessage}\n\n` +
        `설정 정보:\n` +
        `• URL: ${currentUrl}\n` +
        `• 이메일: ${currentEmail}\n` +
        `• 토큰: ${'*'.repeat(currentToken?.length || 0)}\n\n` +
        `확인사항:\n` +
        `• Jira URL이 올바른지 확인 (예: https://company.atlassian.net)\n` +
        `• 이메일 주소가 정확한지 확인\n` +
        `• PAT 토큰이 유효한지 확인\n` +
        `• PAT 권한에 'Read:jira-work-management' 포함되어 있는지 확인\n` +
        `• 네트워크 연결 상태 확인\n` +
        `• 회사 VPN 연결 필요한지 확인`);

      await showToast({
        style: Toast.Style.Failure,
        title: "연결 실패",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  }

  function openPreferences() {
    openExtensionPreferences();
  }

  const hasSettings = preferences.jiraUrl && preferences.jiraEmail && preferences.jiraToken;
  

  if (testResult) {
    return (
      <Detail
        markdown={testResult}
        navigationTitle="Jira 연결 테스트"
        actions={
          <ActionPanel>
            <Action
              title="다시 테스트"
              icon={Icon.ArrowCounterClockwise}
              onAction={() => {
                setTestResult("");
                setConnectionStatus("unknown");
              }}
            />
            <Action
              title="설정 열기"
              icon={Icon.Gear}
              shortcut={{ modifiers: ["cmd"], key: "p" }}
              onAction={openPreferences}
            />
          </ActionPanel>
        }
        metadata={
          <Detail.Metadata>
            <Detail.Metadata.TagList title="연결 상태">
              <Detail.Metadata.TagList.Item
                text={connectionStatus === "success" ? "연결됨" : "연결 실패"}
                color={connectionStatus === "success" ? Color.Green : Color.Red}
              />
            </Detail.Metadata.TagList>
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
          {hasSettings && (
            <Action
              title="현재 설정으로 테스트"
              icon={Icon.Checkmark}
              onAction={() => testConnection()}
            />
          )}
          <Action.SubmitForm
            title="입력한 설정으로 테스트"
            icon={Icon.Globe}
            onSubmit={testConnection}
          />
          <Action
            title="확장 설정 열기"
            icon={Icon.Gear}
            shortcut={{ modifiers: ["cmd"], key: "p" }}
            onAction={openPreferences}
          />
        </ActionPanel>
      }
    >
      <Form.Description text="⚠️ 중요: 설정 값들은 아래 폼이 아닌 'Cmd+P → 확장 설정 열기'에서 저장해야 합니다. 아래 폼은 테스트 전용입니다." />
      
      {hasSettings && (
        <Form.Separator />
      )}

      <Form.TextField
        id="jiraUrl"
        title="Jira URL"
        placeholder="https://company.atlassian.net"
        defaultValue={preferences.jiraUrl || ""}
        info="회사의 Jira 인스턴스 URL을 입력하세요"
      />

      <Form.TextField
        id="jiraEmail"
        title="이메일"
        placeholder="your@company.com"
        defaultValue={preferences.jiraEmail || ""}
        info="Jira 계정에 사용하는 이메일 주소"
      />

      <Form.PasswordField
        id="jiraToken"
        title="Personal Access Token (PAT)"
        placeholder="PAT를 입력하세요"
        defaultValue={preferences.jiraToken || ""}
        info="Jira Settings > Personal Access Tokens에서 생성"
      />

      {hasSettings && (
        <>
          <Form.Separator />
          <Form.Description text={`현재 설정:\n• URL: ${preferences.jiraUrl}\n• 이메일: ${preferences.jiraEmail}\n• 토큰: ${'*'.repeat(preferences.jiraToken?.length || 0)}`} />
        </>
      )}
    </Form>
  );
}
