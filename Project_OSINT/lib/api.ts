export type User = {
  id: number;
  email: string;
  role: "individual" | "company" | "admin";
  company_name: string | null;
  approval_status: "pending" | "approved" | "rejected";
};

export type LoginResponse = {
  access_token: string;
  token_type: "bearer";
  user: User;
};

export type HistoryItem = {
  scan_id: number;
  target_searched: string;
  scan_type: string;
  risk_level: string;
  date: string;
};

export type HistoryResponse = {
  status: "success";
  total_scans: number;
  history: HistoryItem[];
};

export type SourceLog = {
  title: string;
  url: string;
  snippet?: string;
};

export type IntelligenceReport = {
  risk_level: string;
  total_threat_count: number;
  detailed_corporate_report?: {
    risk_level?: string;
    total_threat_count?: number;
    executive_summary?: string;
    threat_actor_exploitation?: string;
    actionable_remediation?: string;
  };
  sarcastic_dashboard?: {
    tl_dr?: string;
    jargon_buster?: Array<{ term: string; sarcastic_explanation: string }>;
  };
  executive_summary?: string;
  threat_actor_exploitation?: string;
  actionable_remediation?: string;
};

export type InfrastructureMap = {
  passive_dns?: {
    resolved_ip?: string;
    status?: string;
    error?: string;
  };
  certificate_transparency?: {
    discovered_subdomains?: string[];
    count?: number;
    error?: string;
  };
};

export type ScanResponse = {
  status: "complete" | "rejected";
  intelligence_report: IntelligenceReport;
  discovered_sources_count: number;
  infrastructure_map?: InfrastructureMap;
  raw_data_logs?: Record<string, SourceLog[] | { error: string }>;
};

export type PendingUsersResponse = {
  status: "success";
  pending_users: Array<{ id: number; email: string; company_name: string | null; status: string }>;
};

// KEY FIX: Empty string — requests go to the same origin (Next.js on port 3000).
// next.config.ts rewrites /api/* → Flask on port 5000 server-side.
// This means the browser NEVER calls Flask directly, so CORS never blocks it.
const API_BASE_URL = "";

class ApiError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

async function request<T>(
  path: string,
  options: RequestInit = {},
  token?: string | null
): Promise<T> {
  const headers = new Headers(options.headers);
  headers.set("Content-Type", "application/json");
  if (token) headers.set("Authorization", `Bearer ${token}`);

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    cache: "no-store",
  });

  const payload = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new ApiError(
      payload.error || payload.message || "Request failed",
      response.status
    );
  }
  return payload as T;
}

export const api = {
  login(email: string, password: string) {
    return request<LoginResponse>("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register(payload: {
    email: string;
    password: string;
    role: "individual" | "company";
    company_name?: string;
  }) {
    return request<{ message: string }>("/api/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  },

  history(token: string) {
    return request<HistoryResponse>("/api/v1/history", { method: "GET" }, token);
  },

  scan(token: string, target_input: string) {
    return request<ScanResponse>(
      "/api/v1/scan",
      {
        method: "POST",
        body: JSON.stringify({ target_input }),
      },
      token
    );
  },

  pendingUsers(token: string) {
    return request<PendingUsersResponse>(
      "/api/admin/pending-users",
      { method: "GET" },
      token
    );
  },

  reviewRequest(token: string, user_id: number, decision: "approved" | "rejected") {
    return request<{ message: string }>(
      "/api/admin/review-request",
      {
        method: "POST",
        body: JSON.stringify({ user_id, decision }),
      },
      token
    );
  },
  submitReview(token: string, rating: number, comment: string) {
    return request<{ message: string }>(
      "/api/v1/review",
      { method: "POST", body: JSON.stringify({ rating, comment }) },
      token
    );
  },

  getReviews(token: string) {
    return request<{
      total: number;
      average_rating: number;
      reviews: Array<{ rating: number; comment: string | null }>;
    }>("/api/v1/reviews", { method: "GET" }, token);
  },
};

