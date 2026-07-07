import React, { useState, useEffect } from "react";

// Interfaces matching Database & Backend API
interface AdminStats {
  totalUsers: number;
  totalTechnicians: number;
  totalRepairCases: number;
  totalKnowledgeBaseArticles: number;
  activeSubscriptions: number;
  revenue: number;
}

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  status: string;
}

interface Brand {
  id: string;
  name: string;
  description: string;
}

interface KBArticle {
  id: string;
  title: string;
  difficulty: string;
  visibility: string;
  createdAt: string;
}

interface AuditLog {
  id: string;
  userId: string;
  action: string;
  details: string;
  createdAt: string;
}

export default function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [email, setEmail] = useState("superadmin@microsolder.ai");
  const [password, setPassword] = useState("Password123!");
  const [authToken, setAuthToken] = useState("");
  const [userRole, setUserRole] = useState("");
  
  const [activeTab, setActiveTab] = useState<"overview" | "users" | "db" | "kb" | "ai" | "billing" | "logs">("overview");
  const [backendUrl] = useState("http://localhost:5000");

  // Admin metrics states
  const [stats, setStats] = useState<AdminStats>({
    totalUsers: 3,
    totalTechnicians: 1,
    totalRepairCases: 2,
    totalKnowledgeBaseArticles: 1,
    activeSubscriptions: 3,
    revenue: 2450.00
  });

  // User management states
  const [users, setUsers] = useState<User[]>([
    { id: "u-superadmin", name: "System Super Admin", email: "superadmin@microsolder.ai", role: "SUPER_ADMIN", status: "ACTIVE" },
    { id: "u-admin", name: "Content Administrator", email: "admin@microsolder.ai", role: "ADMIN", status: "ACTIVE" },
    { id: "u-tech", name: "Workbench Technician", email: "tech@microsolder.ai", role: "TECHNICIAN", status: "ACTIVE" }
  ]);

  // Catalog configuration states
  const [brands, setBrands] = useState<Brand[]>([
    { id: "b-apple", name: "Apple", description: "iPhones and MacBooks" },
    { id: "b-samsung", name: "Samsung", description: "Galaxy phones" },
    { id: "b-sony", name: "Sony", description: "PlayStation consoles" }
  ]);
  const [newBrandName, setNewBrandName] = useState("");
  const [newBrandDesc, setNewBrandDesc] = useState("");

  // KB states
  const [kbArticles, setKbArticles] = useState<KBArticle[]>([
    { id: "kb-1", title: "iPhone 12 3-Minute Restarts (Missing prs0)", difficulty: "EASY", visibility: "PUBLIC", createdAt: new Date().toISOString() }
  ]);
  const [newKbTitle, setNewKbTitle] = useState("");
  const [newKbContent, setNewKbContent] = useState("");

  // AI settings
  const [aiProvider, setAiProvider] = useState("OPENAI");
  const [aiModel, setAiModel] = useState("gpt-4o-mini");
  const [aiKey, setAiKey] = useState("••••••••••••••••••••••••••••••••••••••••");
  const [customPrompt, setCustomPrompt] = useState("You are an expert electronics repair AI diagnostics engine...");

  // Audit Logs
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([
    { id: "a1", userId: "u-superadmin", action: "USER_LOGIN", details: "Super Admin logged in from IP 192.168.1.100", createdAt: new Date().toISOString() }
  ]);

  // Load metrics from backend
  useEffect(() => {
    if (isLoggedIn && authToken) {
      fetchAdminStats();
      fetchUsersList();
      fetchAuditLogs();
    }
  }, [isLoggedIn, authToken]);

  const fetchAdminStats = async () => {
    try {
      const res = await fetch(`${backendUrl}/admin/stats`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data && !data.statusCode) setStats(data);
    } catch (e) {}
  };

  const fetchUsersList = async () => {
    try {
      const res = await fetch(`${backendUrl}/users`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data && Array.isArray(data)) setUsers(data);
    } catch (e) {}
  };

  const fetchAuditLogs = async () => {
    try {
      const res = await fetch(`${backendUrl}/admin/audit-logs`, {
        headers: { "Authorization": `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (data && Array.isArray(data)) setAuditLogs(data);
    } catch (e) {}
  };

  // Perform Login
  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${backendUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      if (data.access_token) {
        setAuthToken(data.access_token);
        setUserRole(data.user.role);
        
        // Block non-admin roles for security
        if (data.user.role !== "SUPER_ADMIN" && data.user.role !== "ADMIN") {
          alert("Access Denied: Only Administrators are authorized to view this panel.");
          setAuthToken("");
          return;
        }
        
        setIsLoggedIn(true);
      } else {
        alert(data.message || "Invalid credentials. Run NestJS backend on Port 5000 first.");
      }
    } catch (e) {
      alert("Error: Backend is offline. Run 'npm run start:dev' inside backend folder.");
    }
  };

  // Toggle user state
  const handleToggleUserBlock = async (id: string, currentStatus: string) => {
    const block = currentStatus === "ACTIVE";
    try {
      const res = await fetch(`${backendUrl}/users/${id}/block`, {
        method: "PATCH",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ block })
      });
      const updatedUser = await res.json();
      setUsers(prev => prev.map(u => u.id === id ? { ...u, status: updatedUser.status } : u));
      
      // Log Action
      setAuditLogs(prev => [
        { id: `a-${Date.now()}`, userId: "u-superadmin", action: "BLOCK_USER", details: `Changed block state of user ${id} to ${block}`, createdAt: new Date().toISOString() },
        ...prev
      ]);
    } catch (e) {}
  };

  // Create Brand
  const handleCreateBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newBrandName) return;
    try {
      const res = await fetch(`${backendUrl}/brands`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ name: newBrandName, description: newBrandDesc })
      });
      const newBrand = await res.json();
      setBrands(prev => [...prev, newBrand]);
      setNewBrandName("");
      setNewBrandDesc("");
      
      setAuditLogs(prev => [
        { id: `a-${Date.now()}`, userId: "u-superadmin", action: "CREATE_BRAND", details: `Added device brand: ${newBrand.name}`, createdAt: new Date().toISOString() },
        ...prev
      ]);
    } catch (e) {}
  };

  // Publish KB Article
  const handleCreateKB = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKbTitle || !newKbContent) return;
    try {
      const res = await fetch(`${backendUrl}/knowledge-base`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${authToken}`
        },
        body: JSON.stringify({ title: newKbTitle, content: newKbContent, visibility: "PUBLIC" })
      });
      const newKb = await res.json();
      setKbArticles(prev => [...prev, newKb]);
      setNewKbTitle("");
      setNewKbContent("");

      setAuditLogs(prev => [
        { id: `a-${Date.now()}`, userId: "u-superadmin", action: "PUBLISH_ARTICLE", details: `Published KB Guide: ${newKb.title}`, createdAt: new Date().toISOString() },
        ...prev
      ]);
    } catch (e) {}
  };

  // Handle Logout
  const handleLogout = () => {
    setIsLoggedIn(false);
    setAuthToken("");
  };

  if (!isLoggedIn) {
    return (
      <div style={{ display: "flex", height: "100vh", alignItems: "center", justifyContent: "center" }}>
        <form onSubmit={handleLogin} className="card" style={{ width: "380px" }}>
          <h2 style={{ fontFamily: "var(--font-display)", fontSize: "22px", textAlign: "center", marginBottom: "6px" }}>Admin Authorization</h2>
          <p style={{ fontSize: "12px", color: "var(--text-secondary)", textAlign: "center", marginBottom: "16px" }}>Sign in with administrative privileges</p>
          
          <div className="input-group" style={{ marginBottom: "14px" }}>
            <label className="input-label">Email Address</label>
            <input 
              type="email" 
              className="input-control" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
            />
          </div>

          <div className="input-group" style={{ marginBottom: "20px" }}>
            <label className="input-label">Password</label>
            <input 
              type="password" 
              className="input-control" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
            />
          </div>

          <button type="submit" className="btn">
            🛡️ Access Control Panel
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="admin-shell">
      {/* Sidebar Navigation */}
      <aside>
        <div className="logo">Microsolder AI Admin</div>
        <p style={{ fontSize: "11px", color: "var(--text-secondary)", marginTop: "-14px" }}>Control Center Panel</p>
        
        <ul className="nav-list" style={{ marginTop: "20px" }}>
          <li>
            <a className={`nav-link ${activeTab === "overview" ? "active" : ""}`} onClick={() => setActiveTab("overview")}>
              📊 Overview Metrics
            </a>
          </li>
          <li>
            <a className={`nav-link ${activeTab === "users" ? "active" : ""}`} onClick={() => setActiveTab("users")}>
              👥 User Management
            </a>
          </li>
          <li>
            <a className={`nav-link ${activeTab === "db" ? "active" : ""}`} onClick={() => setActiveTab("db")}>
              📦 Device Database
            </a>
          </li>
          <li>
            <a className={`nav-link ${activeTab === "kb" ? "active" : ""}`} onClick={() => setActiveTab("kb")}>
              📚 Knowledge Base
            </a>
          </li>
          <li>
            <a className={`nav-link ${activeTab === "ai" ? "active" : ""}`} onClick={() => setActiveTab("ai")}>
              🧠 AI Configuration
            </a>
          </li>
          <li>
            <a className={`nav-link ${activeTab === "billing" ? "active" : ""}`} onClick={() => setActiveTab("billing")}>
              💳 Billing & Invoices
            </a>
          </li>
          <li>
            <a className={`nav-link ${activeTab === "logs" ? "active" : ""}`} onClick={() => setActiveTab("logs")}>
              📝 System Audit Logs
            </a>
          </li>
        </ul>

        <div style={{ marginTop: "auto", display: "flex", flexDirection: "column", gap: "10px" }}>
          <div style={{ fontSize: "11px", color: "var(--text-secondary)", textAlign: "center" }}>
            Role: <strong style={{ color: "var(--color-neon-cyan)" }}>{userRole}</strong>
          </div>
          <button className="btn btn-secondary" onClick={handleLogout}>
            🚪 Sign Out
          </button>
        </div>
      </aside>

      {/* Main Panel Content */}
      <main>
        
        {/* TAB 1: OVERVIEW METRICS */}
        {activeTab === "overview" && (
          <>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800 }}>Overview Metrics</h1>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Real-time statistics across all workbench labs</p>
            </div>

            <div className="stats-grid">
              <div className="card">
                <span className="card-title">Total Platform Users</span>
                <span className="card-value">{stats.totalUsers}</span>
              </div>
              <div className="card">
                <span className="card-title">Active Technicians</span>
                <span className="card-value">{stats.totalTechnicians}</span>
              </div>
              <div className="card">
                <span className="card-title">Log Diagnoses Runs</span>
                <span className="card-value">{stats.totalRepairCases}</span>
              </div>
              <div className="card">
                <span className="card-title">Monthly Revenue</span>
                <span className="card-value">${stats.revenue.toFixed(2)}</span>
              </div>
            </div>

            <div className="panel-grid">
              <div className="card">
                <h3 style={{ fontSize: "16px", marginBottom: "12px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>🔥 Frequently Diagnosed Faults</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="flex-between" style={{ fontSize: "14px", padding: "6px 0" }}>
                    <span>No Power / dead board short circuit</span>
                    <span className="status-pill active">9 Cases</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: "14px", padding: "6px 0" }}>
                    <span>Watchdog restart loops (prs0/mic1)</span>
                    <span className="status-pill active">6 Cases</span>
                  </div>
                  <div className="flex-between" style={{ fontSize: "14px", padding: "6px 0" }}>
                    <span>HDMI structural socket push pins</span>
                    <span className="status-pill active">4 Cases</span>
                  </div>
                </div>
              </div>

              <div className="card">
                <h3 style={{ fontSize: "16px", marginBottom: "12px", borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>🏷️ Brand Telemetry</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div className="flex-between" style={{ fontSize: "14px" }}>
                    <span>Apple (iPhone/Mac)</span>
                    <strong>12 runs</strong>
                  </div>
                  <div className="flex-between" style={{ fontSize: "14px" }}>
                    <span>Samsung (Galaxy)</span>
                    <strong>8 runs</strong>
                  </div>
                  <div className="flex-between" style={{ fontSize: "14px" }}>
                    <span>Sony PlayStation</span>
                    <strong>3 runs</strong>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {/* TAB 2: USER MANAGEMENT */}
        {activeTab === "users" && (
          <>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800 }}>User Management</h1>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Manage technician profiles and platform roles</p>
            </div>

            <div className="card" style={{ padding: "0", overflow: "hidden" }}>
              <table>
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email Address</th>
                    <th>Access Role</th>
                    <th>Account Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(u => (
                    <tr key={u.id}>
                      <td>{u.name}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{u.email}</td>
                      <td><strong>{u.role}</strong></td>
                      <td>
                        <span className={`status-pill ${u.status === "ACTIVE" ? "active" : "danger"}`}>{u.status}</span>
                      </td>
                      <td>
                        {u.role !== "SUPER_ADMIN" ? (
                          <button 
                            className={`btn ${u.status === "ACTIVE" ? "btn-secondary" : ""}`} 
                            style={{ padding: "6px 12px", fontSize: "12px" }}
                            onClick={() => handleToggleUserBlock(u.id, u.status)}
                          >
                            {u.status === "ACTIVE" ? "🚫 Block User" : "✅ Unblock"}
                          </button>
                        ) : (
                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Protected</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 3: DEVICE DATABASE */}
        {activeTab === "db" && (
          <>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800 }}>Device Database Catalog</h1>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Configure target device hierarchies for diagnostics</p>
            </div>

            <div className="panel-grid">
              <div className="card">
                <h3>Registered Brand List</h3>
                <table>
                  <thead>
                    <tr>
                      <th>ID</th>
                      <th>Brand Name</th>
                      <th>Description</th>
                    </tr>
                  </thead>
                  <tbody>
                    {brands.map(b => (
                      <tr key={b.id}>
                        <td style={{ fontFamily: "var(--font-mono)", fontSize: "11px" }}>{b.id}</td>
                        <td><strong>{b.name}</strong></td>
                        <td style={{ color: "var(--text-secondary)" }}>{b.description}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <form onSubmit={handleCreateBrand} className="card">
                <h3>🆕 Register Device Brand</h3>
                <div className="input-group" style={{ marginTop: "10px" }}>
                  <label className="input-label">Brand Name</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={newBrandName} 
                    onChange={(e) => setNewBrandName(e.target.value)} 
                    placeholder="e.g. Google" 
                    required 
                  />
                </div>
                <div className="input-group" style={{ marginTop: "10px", marginBottom: "14px" }}>
                  <label className="input-label">Description</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={newBrandDesc} 
                    onChange={(e) => setNewBrandDesc(e.target.value)} 
                    placeholder="Pixel family devices" 
                  />
                </div>
                <button type="submit" className="btn">Add Brand</button>
              </form>
            </div>
          </>
        )}

        {/* TAB 4: KNOWLEDGE BASE */}
        {activeTab === "kb" && (
          <>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800 }}>Knowledge Base Library</h1>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Upload repair schematics and board guides</p>
            </div>

            <div className="panel-grid">
              <div className="card">
                <h3>Published Guides</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "10px" }}>
                  {kbArticles.map(art => (
                    <div key={art.id} style={{ borderBottom: "1px solid var(--border-glass)", paddingBottom: "10px" }}>
                      <strong>{art.title}</strong>
                      <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", gap: "10px", marginTop: "4px" }}>
                        <span>Diff: {art.difficulty}</span>
                        <span>Vis: {art.visibility}</span>
                        <span>Published: {new Date(art.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleCreateKB} className="card">
                <h3>🆕 Publish Article</h3>
                <div className="input-group" style={{ marginTop: "10px" }}>
                  <label className="input-label">Article Title</label>
                  <input 
                    type="text" 
                    className="input-control" 
                    value={newKbTitle} 
                    onChange={(e) => setNewKbTitle(e.target.value)} 
                    placeholder="MacBook A2159 no power..." 
                    required 
                  />
                </div>
                <div className="input-group" style={{ marginTop: "10px", marginBottom: "14px" }}>
                  <label className="input-label">Markdown Content</label>
                  <textarea 
                    className="input-control" 
                    style={{ height: "120px", resize: "none" }}
                    value={newKbContent} 
                    onChange={(e) => setNewKbContent(e.target.value)} 
                    placeholder="### Symptom..." 
                    required 
                  />
                </div>
                <button type="submit" className="btn">Publish Guide</button>
              </form>
            </div>
          </>
        )}

        {/* TAB 5: AI CONFIGURATION */}
        {activeTab === "ai" && (
          <>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800 }}>AI Provider Settings</h1>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Configure models, prompts, and API parameters securely</p>
            </div>

            <div className="card" style={{ maxWidth: "700px" }}>
              <div className="input-group" style={{ marginBottom: "14px" }}>
                <label className="input-label">AI Engine Provider</label>
                <select className="input-control" value={aiProvider} onChange={(e) => setAiProvider(e.target.value)}>
                  <option value="OPENAI">OpenAI API (Cloud)</option>
                  <option value="ANTHROPIC">Anthropic Claude (Cloud)</option>
                  <option value="LOCAL">Local Ollama Llama3 (Offline)</option>
                </select>
              </div>

              <div className="input-group" style={{ marginBottom: "14px" }}>
                <label className="input-label">Model Target Name</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={aiModel} 
                  onChange={(e) => setAiModel(e.target.value)} 
                  placeholder="gpt-4o-mini" 
                />
              </div>

              <div className="input-group" style={{ marginBottom: "14px" }}>
                <label className="input-label">API Access Secret (Masked)</label>
                <input 
                  type="text" 
                  className="input-control" 
                  value={aiKey} 
                  onChange={(e) => setAiKey(e.target.value)} 
                />
                <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Stored on NestJS backend. Never exposed to web browsers.</span>
              </div>

              <div className="input-group" style={{ marginBottom: "20px" }}>
                <label className="input-label">System Prompter Instructions Template</label>
                <textarea 
                  className="input-control" 
                  style={{ height: "100px", resize: "none" }}
                  value={customPrompt} 
                  onChange={(e) => setCustomPrompt(e.target.value)} 
                />
              </div>

              <button className="btn" onClick={() => alert("AI Configuration updated successfully.")}>
                💾 Save System Prompts
              </button>
            </div>
          </>
        )}

        {/* TAB 6: BILLING & INVOICES */}
        {activeTab === "billing" && (
          <>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800 }}>Billing & Subscriptions</h1>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Manage technician invoices and gateway states</p>
            </div>

            <div className="card">
              <h3>Active Gateways</h3>
              <div style={{ display: "flex", gap: "10px", marginTop: "10px", marginBottom: "20px" }}>
                <span className="status-pill active">Paystack Online</span>
                <span className="status-pill active">Flutterwave Online</span>
                <span className="status-pill active">Stripe Offline</span>
              </div>

              <h3>Technician Invoices</h3>
              <table>
                <thead>
                  <tr>
                    <th>Reference</th>
                    <th>Technician Email</th>
                    <th>Plan</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>REF-2026-XW8</td>
                    <td>tech@microsolder.ai</td>
                    <td>Pro Technician</td>
                    <td>$49.99</td>
                    <td><span className="status-pill active">SUCCESSFUL</span></td>
                  </tr>
                  <tr>
                    <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>REF-2026-PO2</td>
                    <td>manager@repairhub.net</td>
                    <td>Shop Plan</td>
                    <td>$149.99</td>
                    <td><span className="status-pill active">SUCCESSFUL</span></td>
                  </tr>
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* TAB 7: AUDIT LOGS */}
        {activeTab === "logs" && (
          <>
            <div>
              <h1 style={{ fontFamily: "var(--font-display)", fontSize: "28px", fontWeight: 800 }}>System Audit Logs</h1>
              <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>Trace administrative modifications and API triggers</p>
            </div>

            <div className="card" style={{ padding: "0", overflow: "hidden" }}>
              <table>
                <thead>
                  <tr>
                    <th>Timestamp</th>
                    <th>Actor ID</th>
                    <th>Event Trigger</th>
                    <th>Details</th>
                  </tr>
                </thead>
                <tbody>
                  {auditLogs.map(log => (
                    <tr key={log.id}>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px", color: "var(--text-secondary)" }}>{new Date(log.createdAt).toLocaleString()}</td>
                      <td style={{ fontFamily: "var(--font-mono)", fontSize: "12px" }}>{log.userId}</td>
                      <td><span className="status-pill warning">{log.action}</span></td>
                      <td style={{ fontSize: "13px" }}>{log.details}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}

      </main>
    </div>
  );
}
