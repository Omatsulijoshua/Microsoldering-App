

export default function App() {
  return (
    <div>
      {/* Navigation */}
      <div className="container">
        <nav>
          <div className="logo">Microsolder AI</div>
          <div className="nav-links">
            <a href="#features" className="nav-link">Features</a>
            <a href="#pricing" className="nav-link">Pricing</a>
            <a href="http://localhost:3001" className="nav-link">Admin Portal</a>
            <a href="http://localhost:3000" className="btn btn-secondary">Open Workbench</a>
          </div>
        </nav>
      </div>

      {/* Hero Section */}
      <div className="container">
        <section className="hero">
          <span className="badge">Next-Gen Repair Suite</span>
          <h1>AI-Powered Hardware Diagnostics for Electronic Repair Labs</h1>
          <p>
            Stop wasting hours chasing shorts. Instantly analyze Apple watchdog panic logs, extract Android tombstone trace files, and pinpoint hardware faults using structured AI prompters.
          </p>
          <div style={{ display: "flex", gap: "16px", justifyContent: "center" }}>
            <a href="http://localhost:3000" className="btn">
              ⚡ Open Workbench Suite
            </a>
            <a href="#pricing" className="btn btn-secondary">
              View Plans & Subscriptions
            </a>
          </div>
        </section>
      </div>

      {/* Features Grid */}
      <div className="container" id="features">
        <section className="features">
          <div className="section-header">
            <h2>The Diagnostic Core</h2>
            <p style={{ color: "var(--text-secondary)" }}>Built by micro-soldering technicians, for electronics engineering labs</p>
          </div>

          <div className="grid-3">
            <div className="card">
              <div className="card-icon">📄</div>
              <h3>Panic Log Analyzer</h3>
              <p>
                Upload core crash reports from iPhones, iPads, and MacBooks. Automatically isolate faulty sensors on communication lines (prs0, mic2, ans2 NAND).
              </p>
            </div>
            
            <div className="card">
              <div className="card-icon">🔌</div>
              <h3>USB Telemetry scan</h3>
              <p>
                Connect target devices directly to your console. Pull hardware status, battery health, and logs automatically using integrated ADB/libimobiledevice wrappers.
              </p>
            </div>

            <div className="card">
              <div className="card-icon">🔬</div>
              <h3>AI Visual Classifier</h3>
              <p>
                Feed microscope board captures or thermal camera heat maps. AI identifies melted IC cores, corroded pin traces, or cracked ceramic capacitors.
              </p>
            </div>
          </div>
        </section>
      </div>

      {/* Pricing Cards */}
      <div className="container" id="pricing">
        <section className="pricing">
          <div className="section-header">
            <h2>Flexible Licensing Plans</h2>
            <p style={{ color: "var(--text-secondary)" }}>Scale diagnostics access to fit your repair shop workflow</p>
          </div>

          <div className="pricing-grid">
            <div className="pricing-card">
              <span className="plan-name">Free Tier</span>
              <div className="plan-price">$0 <span>/ forever</span></div>
              <ul className="plan-features">
                <li>Symptom Diagnostics (5/mo)</li>
                <li>Manual Board checks</li>
                <li>In-memory sandbox</li>
              </ul>
              <a href="http://localhost:3000" className="btn btn-secondary" style={{ marginTop: "auto" }}>
                Launch Free
              </a>
            </div>

            <div className="pricing-card premium">
              <span className="plan-name">Pro Technician</span>
              <div className="plan-price">$49 <span>/ month</span></div>
              <ul className="plan-features">
                <li>Unlimited AI Diagnoses</li>
                <li>Apple Panic Log Parser</li>
                <li>Android ADB Console</li>
                <li>Microscope image classifier</li>
                <li>Export PDF logs</li>
              </ul>
              <a href="http://localhost:3000" className="btn" style={{ marginTop: "auto" }}>
                Upgrade to Pro
              </a>
            </div>

            <div className="pricing-card">
              <span className="plan-name">Shop Portal</span>
              <div className="plan-price">$149 <span>/ month</span></div>
              <ul className="plan-features">
                <li>Up to 10 Technicians</li>
                <li>Shared Case database</li>
                <li>Client Invoice tools</li>
                <li>Audit Logs tracing</li>
                <li>Priority support queue</li>
              </ul>
              <a href="http://localhost:3001" className="btn btn-secondary" style={{ marginTop: "auto" }}>
                Add Shop License
              </a>
            </div>
          </div>
        </section>
      </div>

      {/* Footer */}
      <div className="container" style={{ borderTop: "1px solid var(--border-glass)", padding: "40px 0 60px 0", fontSize: "12px", color: "var(--text-muted)", display: "flex", justifyContent: "space-between" }}>
        <p>© 2026 Microsolder AI. Built for professional electronics labs.</p>
        <div style={{ display: "flex", gap: "24px" }}>
          <a href="http://localhost:3001" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Admin Control</a>
          <a href="http://localhost:3000" style={{ color: "var(--text-muted)", textDecoration: "none" }}>Workbench Suite</a>
        </div>
      </div>
    </div>
  );
}
