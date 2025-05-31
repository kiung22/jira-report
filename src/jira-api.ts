import fetch from "node-fetch";

export interface JiraIssue {
  key: string;
  fields: {
    summary: string;
    status: {
      name: string;
    };
    assignee?: {
      displayName: string;
      emailAddress: string;
    };
    created: string;
    updated: string;
    resolutiondate?: string;
    issuetype: {
      name: string;
    };
    priority: {
      name: string;
    };
    worklog?: {
      worklogs: Array<{
        timeSpent: string;
        started: string;
        author: {
          displayName: string;
          emailAddress: string;
        };
      }>;
    };
  };
}

export interface JiraConfig {
  url: string;
  email: string;
  token: string;
  authType?: 'bearer' | 'basic';
  apiVersion?: 'v2' | 'v3';
}

export class JiraAPI {
  private config: JiraConfig;

  constructor(config: JiraConfig) {
    this.config = config;
  }

  private getAuthHeader(): string {
    if (this.config.authType === 'basic') {
      const auth = Buffer.from(`${this.config.email}:${this.config.token}`).toString('base64');
      console.log('Using Basic auth with email:', this.config.email);
      return `Basic ${auth}`;
    }
    console.log('Using Bearer auth with token length:', this.config.token.length);
    return `Bearer ${this.config.token}`;
  }

  async searchIssues(jql: string): Promise<JiraIssue[]> {
    const apiVersion = this.config.apiVersion || 'v3';
    const url = `${this.config.url}/rest/api/${apiVersion.replace('v', '')}/search`;
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': this.getAuthHeader(),
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        jql,
        expand: ['worklog'],
        fields: [
          'summary',
          'status',
          'assignee',
          'created',
          'updated',
          'resolutiondate',
          'issuetype',
          'priority',
          'worklog'
        ],
        maxResults: 100
      }),
    });

    if (!response.ok) {
      throw new Error(`Jira API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json() as { issues: JiraIssue[] };
    return data.issues;
  }

  async getCurrentUser(): Promise<{ emailAddress: string; displayName: string }> {
    const apiVersion = this.config.apiVersion || 'v3';
    const url = `${this.config.url}/rest/api/${apiVersion.replace('v', '')}/myself`;
    
    const headers = {
      'Authorization': this.getAuthHeader(),
      'Accept': 'application/json',
      'Content-Type': 'application/json',
    };
    
    console.log('Jira API Request:', {
      url,
      headers: {
        ...headers,
        'Authorization': `Bearer ***${this.config.token.slice(-4)}`
      },
      tokenInfo: {
        tokenLength: this.config.token.length,
        tokenStart: this.config.token.slice(0, 4),
        tokenEnd: this.config.token.slice(-4)
      }
    });
    
    const response = await fetch(url, {
      method: 'GET',
      headers,
    });

    console.log('Jira API Response:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries())
    });

    if (!response.ok) {
      let errorBody = '';
      try {
        errorBody = await response.text();
        console.error('Jira API Error Body:', errorBody);
      } catch (e) {
        console.error('Could not read error body:', e);
      }
      
      const errorDetails = errorBody ? ` - Body: ${errorBody}` : '';
      throw new Error(`HTTP ${response.status} ${response.statusText}${errorDetails}`);
    }

    return await response.json() as { emailAddress: string; displayName: string };
  }

  createWeeklyJQL(userEmail: string, daysBack: number = 7): string {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - daysBack);
    const startDateStr = startDate.toISOString().split('T')[0];

    return `(assignee = "${userEmail}" OR worklogAuthor = "${userEmail}") AND updated >= "${startDateStr}" ORDER BY updated DESC`;
  }

  async getWeeklyIssues(daysBack: number = 7): Promise<JiraIssue[]> {
    const user = await this.getCurrentUser();
    const jql = this.createWeeklyJQL(user.emailAddress, daysBack);
    return await this.searchIssues(jql);
  }
}