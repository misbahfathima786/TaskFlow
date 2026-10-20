import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function Home() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("focus");
  const [demoTaskCompleted, setDemoTaskCompleted] = useState(false);

  return (
    <main className="landing-page">
      {/* =========================================================================
          HERO SECTION
          ========================================================================= */}
      <section className="hero">
        <div className="hero-content">
          <div className="hero-badge">
            <span className="badge-pulse"></span>
            <span>TASKFLOW 2.0 • INTELLIGENT WORKSPACE</span>
          </div>

          <h1>
            Work smarter.
            <br />
            Move faster.
            <br />
            <span className="hero-highlight">Accomplish more.</span>
          </h1>

          <p className="hero-description">
            TaskFlow unifies smart urgency prioritization, visual Kanban boards,
            calendar scheduling, and real-time desktop reminders into one calm,
            high-performance productivity suite.
          </p>

          <div className="hero-buttons">
            <button
              type="button"
              className="hero-primary-button"
              onClick={() => navigate("/register")}
            >
              Get Started Free
            </button>

            <button
              type="button"
              className="hero-secondary-button"
              onClick={() => {
                document.getElementById("interactive-demo")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              Explore Interactive Demo
            </button>
          </div>

          <div className="hero-trust-bar">
            <span className="trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              No credit card required
            </span>
            <span className="trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Instant setup
            </span>
            <span className="trust-item">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                <polyline points="20 6 9 17 4 12" />
              </svg>
              Desktop & in-app alerts
            </span>
          </div>
        </div>

        {/* =========================================================================
            INTERACTIVE APP SHOWCASE WIDGET
            ========================================================================= */}
        <div className="hero-visual" id="interactive-demo">
          <div className="showcase-window">
            {/* Window title bar */}
            <div className="showcase-titlebar">
              <div className="window-dots">
                <span className="dot dot-close"></span>
                <span className="dot dot-minimize"></span>
                <span className="dot dot-expand"></span>
              </div>
              <div className="window-title">TaskFlow Workspace • Live Preview</div>
              <div className="window-status">
                <span className="status-indicator"></span> Active
              </div>
            </div>

            {/* Interactive navigation tabs */}
            <div className="showcase-tabs" role="tablist" aria-label="Product Showcase Views">
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "focus"}
                className={`showcase-tab-btn ${activeTab === "focus" ? "active" : ""}`}
                onClick={() => setActiveTab("focus")}
              >
                ⚡ Today's Focus
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "kanban"}
                className={`showcase-tab-btn ${activeTab === "kanban" ? "active" : ""}`}
                onClick={() => setActiveTab("kanban")}
              >
                📋 Kanban Board
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "calendar"}
                className={`showcase-tab-btn ${activeTab === "calendar" ? "active" : ""}`}
                onClick={() => setActiveTab("calendar")}
              >
                📅 Calendar
              </button>
              <button
                type="button"
                role="tab"
                aria-selected={activeTab === "analytics"}
                className={`showcase-tab-btn ${activeTab === "analytics" ? "active" : ""}`}
                onClick={() => setActiveTab("analytics")}
              >
                📊 Analytics
              </button>
            </div>

            {/* Tab 1: Today's Focus Preview */}
            {activeTab === "focus" && (
              <div className="showcase-tab-content">
                <div className="preview-focus-header">
                  <div>
                    <span className="preview-meta-tag">SMART FOCUS</span>
                    <h4>High-Impact Priorities for Today</h4>
                  </div>
                  <span className="preview-stat-pill">
                    {demoTaskCompleted ? "5 of 6 Done (83%)" : "4 of 6 Done (67%)"}
                  </span>
                </div>

                <div className="preview-progress-track">
                  <div
                    className="preview-progress-fill"
                    style={{ width: demoTaskCompleted ? "83%" : "67%" }}
                  ></div>
                </div>

                {/* Interactive Task Card */}
                <div className={`preview-task-item ${demoTaskCompleted ? "completed" : ""}`}>
                  <label className="demo-checkbox-label">
                    <input
                      type="checkbox"
                      checked={demoTaskCompleted}
                      onChange={() => setDemoTaskCompleted(!demoTaskCompleted)}
                      className="demo-checkbox"
                    />
                    <span className="custom-check">
                      {demoTaskCompleted && (
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5">
                          <polyline points="20 6 9 17 4 12" />
                        </svg>
                      )}
                    </span>
                  </label>

                  <div className="demo-task-info">
                    <div className="demo-task-title-line">
                      <span className="demo-task-title">
                        Finalize Product Launch Brief & Deliverables
                      </span>
                      <span className="badge-priority high">URGENT</span>
                    </div>
                    <div className="demo-task-meta">
                      <span>📁 Marketing & Product</span>
                      <span>⏰ Due Today, 5:00 PM</span>
                    </div>
                  </div>
                </div>

                {demoTaskCompleted && (
                  <div className="demo-congrats-banner">
                    🎉 Completed! Task score recorded in daily velocity metrics.
                  </div>
                )}

                <div className="preview-secondary-task">
                  <div className="custom-check static-check"></div>
                  <div className="demo-task-info">
                    <div className="demo-task-title-line">
                      <span className="demo-task-title">Review Backend Rate Limiting & Auth Tests</span>
                      <span className="badge-priority medium">MEDIUM</span>
                    </div>
                    <div className="demo-task-meta">
                      <span>📁 Engineering</span>
                      <span>⏰ Tomorrow, 11:00 AM</span>
                    </div>
                  </div>
                </div>

                <p className="demo-hint-text">
                  💡 <em>Interactive preview: Click the checkbox above to simulate completing a high-priority task.</em>
                </p>
              </div>
            )}

            {/* Tab 2: Kanban Board Preview */}
            {activeTab === "kanban" && (
              <div className="showcase-tab-content showcase-kanban">
                <div className="kanban-preview-columns">
                  <div className="kanban-col">
                    <div className="kanban-col-head">
                      <span>To Do</span>
                      <span className="kanban-count">2</span>
                    </div>
                    <div className="kanban-card-mini">
                      <p className="k-title">Audit API Rate Limits</p>
                      <span className="k-tag high">High</span>
                    </div>
                    <div className="kanban-card-mini">
                      <p className="k-title">Update Client Readme</p>
                      <span className="k-tag low">Low</span>
                    </div>
                  </div>

                  <div className="kanban-col">
                    <div className="kanban-col-head">
                      <span>In Progress</span>
                      <span className="kanban-count">1</span>
                    </div>
                    <div className="kanban-card-mini active-card">
                      <p className="k-title">Modern Sliding Auth UI</p>
                      <span className="k-tag high">Urgent</span>
                    </div>
                  </div>

                  <div className="kanban-col">
                    <div className="kanban-col-head">
                      <span>Done</span>
                      <span className="kanban-count">3</span>
                    </div>
                    <div className="kanban-card-mini done-card">
                      <p className="k-title">RBAC Administration</p>
                      <span className="k-tag done">Done</span>
                    </div>
                    <div className="kanban-card-mini done-card">
                      <p className="k-title">Google One-Tap Link</p>
                      <span className="k-tag done">Done</span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 3: Calendar Preview */}
            {activeTab === "calendar" && (
              <div className="showcase-tab-content showcase-calendar">
                <div className="calendar-preview-header">
                  <strong>October 2026 • Weekly Timeline</strong>
                  <span className="calendar-view-badge">Local Timezone Synced</span>
                </div>
                <div className="calendar-preview-grid">
                  <div className="cal-day-cell">
                    <span className="cal-day-name">Mon 12</span>
                    <div className="cal-event high">Sprint Review</div>
                    <div className="cal-event normal">UI Polishing</div>
                  </div>
                  <div className="cal-day-cell active-day">
                    <span className="cal-day-name">Tue 13 (Today)</span>
                    <div className="cal-event urgent">Release Candidate 1</div>
                  </div>
                  <div className="cal-day-cell">
                    <span className="cal-day-name">Wed 14</span>
                    <div className="cal-event medium">Security Audit</div>
                  </div>
                  <div className="cal-day-cell">
                    <span className="cal-day-name">Thu 15</span>
                    <div className="cal-event normal">Team Retrospective</div>
                  </div>
                </div>
              </div>
            )}

            {/* Tab 4: Analytics Preview */}
            {activeTab === "analytics" && (
              <div className="showcase-tab-content showcase-analytics">
                <div className="analytics-preview-stats">
                  <div className="mini-stat-box">
                    <span>Task Velocity</span>
                    <strong>18 / wk</strong>
                  </div>
                  <div className="mini-stat-box">
                    <span>Completion Rate</span>
                    <strong>92.4%</strong>
                  </div>
                  <div className="mini-stat-box">
                    <span>Avg. Response</span>
                    <strong>1.2 days</strong>
                  </div>
                </div>
                <div className="mini-chart-container">
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: "45%" }}></div>
                    <span>Mon</span>
                  </div>
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: "65%" }}></div>
                    <span>Tue</span>
                  </div>
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: "85%" }}></div>
                    <span>Wed</span>
                  </div>
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: "70%" }}></div>
                    <span>Thu</span>
                  </div>
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: "95%" }}></div>
                    <span>Fri</span>
                  </div>
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: "40%" }}></div>
                    <span>Sat</span>
                  </div>
                  <div className="chart-bar-wrap">
                    <div className="chart-bar" style={{ height: "60%" }}></div>
                    <span>Sun</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* =========================================================================
          KEY CAPABILITIES SECTION
          ========================================================================= */}
      <section className="features" id="features">
        <div className="section-heading">
          <p className="section-label">ENGINEERED FOR FLOW</p>
          <h2>Everything you need to master your commitments</h2>
          <p>
            No fluff or bloated dashboards. Just thoughtful productivity
            systems designed to keep you in a state of high achievement.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" />
                <polyline points="12 6 12 12 16 14" />
              </svg>
            </div>
            <h3>Smart Urgency Prioritization</h3>
            <p>
              Automated algorithmic scoring calculates task importance based on
              approaching deadlines, priority tiers, and categorized focus areas.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="7" height="18" rx="1" />
                <rect x="14" y="3" width="7" height="11" rx="1" />
              </svg>
            </div>
            <h3>Dual Kanban & List Views</h3>
            <p>
              Switch seamlessly between flexible drag-and-drop workflow columns
              and condensed structured lists to match how you think.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="4" width="18" height="18" rx="2" ry="2" />
                <line x1="16" y1="2" x2="16" y2="6" />
                <line x1="8" y1="2" x2="8" y2="6" />
                <line x1="3" y1="10" x2="21" y2="10" />
              </svg>
            </div>
            <h3>Interactive Calendar Timeline</h3>
            <p>
              Visualize deadlines across full month and week agenda views with
              accurate local timezone dates and one-click quick scheduling.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
              </svg>
            </div>
            <h3>Natural Language Task Capture</h3>
            <p>
              Type naturally like <em>"Prepare quarterly report by Friday 5pm high priority"</em> —
              TaskFlow automatically extracts dates, times, and priority weights.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
                <path d="M13.73 21a2 2 0 0 1-3.46 0" />
              </svg>
            </div>
            <h3>Desktop & In-App Reminders</h3>
            <p>
              Native Web Notifications API delivers real-time notifications for
              due-today and overdue items even when TaskFlow runs in the background.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon-wrapper">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
            </div>
            <h3>Role Governance & Analytics</h3>
            <p>
              Enterprise-ready security with Role-Based Access Control (Admin / User),
              account activation controls, and first-party visitor telemetry.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          WORKFLOW SECTION: HOW TASKFLOW WORKS
          ========================================================================= */}
      <section className="workflow-section" id="how-it-works">
        <div className="section-heading">
          <p className="section-label">HOW IT WORKS</p>
          <h2>Three steps to unstoppable execution</h2>
          <p>TaskFlow transforms overwhelming to-do lists into a clear daily action plan.</p>
        </div>

        <div className="workflow-steps">
          <div className="workflow-step-card">
            <div className="step-number">01</div>
            <h4>Capture Fast</h4>
            <p>
              Add tasks in seconds using NLP shortcuts or comprehensive modal inputs with
              due dates, tags, and importance weights.
            </p>
          </div>

          <div className="workflow-step-card">
            <div className="step-number">02</div>
            <h4>Prioritize Automatically</h4>
            <p>
              TaskFlow's urgency engine filters the noise and spotlights Today's Focus
              so you know exactly what to tackle first.
            </p>
          </div>

          <div className="workflow-step-card">
            <div className="step-number">03</div>
            <h4>Review & Accelerate</h4>
            <p>
              Celebrate completed items with historical logging and analyze your
              completion velocity to stay motivated.
            </p>
          </div>
        </div>
      </section>

      {/* =========================================================================
          CALL TO ACTION SECTION
          ========================================================================= */}
      <section className="cta-banner">
        <div className="cta-inner">
          <span className="cta-badge">GET STARTED IN SECONDS</span>
          <h2>Ready to experience effortless productivity?</h2>
          <p>
            Create your account today and experience calm, focused task management
            crafted for modern builders, students, and professionals.
          </p>
          <div className="cta-buttons">
            <button
              type="button"
              className="cta-primary-btn"
              onClick={() => navigate("/register")}
            >
              Create Free Account
            </button>
            <button
              type="button"
              className="cta-secondary-btn"
              onClick={() => navigate("/login")}
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* =========================================================================
          FOOTER
          ========================================================================= */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-brand">
            <div className="footer-logo">
              <span className="navbar-brand-mark">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </span>
              <strong>TaskFlow</strong>
            </div>
            <p>The modern, privacy-conscious productivity suite.</p>
          </div>

          <div className="footer-links">
            <div className="footer-column">
              <h5>Product</h5>
              <a href="#features">Features</a>
              <a href="#interactive-demo">Live Demo</a>
              <a href="#how-it-works">How It Works</a>
            </div>
            <div className="footer-column">
              <h5>Account</h5>
              <Link to="/login">Sign In</Link>
              <Link to="/register">Create Account</Link>
            </div>
            <div className="footer-column">
              <h5>Architecture</h5>
              <span>React 19 + Vite</span>
              <span>Node + Express</span>
              <span>MongoDB Atlas</span>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} TaskFlow. Crafted for high-performance productivity.</p>
        </div>
      </footer>
    </main>
  );
}

export default Home;