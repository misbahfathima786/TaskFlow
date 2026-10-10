import { useNavigate } from "react-router-dom";

function Home() {
  const navigate = useNavigate();

  return (
    <main>
      {/* Hero Section */}
      <section className="hero">
        <div className="hero-content">
          <p className="hero-label">YOUR PRODUCTIVITY, SIMPLIFIED</p>

          <h1>
            Organize your work.
            <br />
            Accomplish more.
          </h1>

          <p className="hero-description">
            TaskFlow helps you manage tasks, track progress, and stay on top
            of your priorities — all in one simple workspace.
          </p>

          <div className="hero-buttons">
            <button
              className="hero-primary-button"
              onClick={() => navigate("/auth")}
            >
              Get Started
            </button>

            <button
              className="hero-secondary-button"
              onClick={() => {
                document.getElementById("features")?.scrollIntoView({
                  behavior: "smooth",
                });
              }}
            >
              Explore Features
            </button>
          </div>
        </div>

        <div className="hero-visual">
          <div className="dashboard-preview">
            <div className="preview-header">
              <div>
                <span className="preview-small-text">Overview</span>
                <h3>Your Tasks</h3>
              </div>

              <span className="preview-date">Today</span>
            </div>

            <div className="preview-stats">
              <div className="preview-stat">
                <span>Total Tasks</span>
                <strong>24</strong>
              </div>

              <div className="preview-stat">
                <span>Completed</span>
                <strong>16</strong>
              </div>

              <div className="preview-stat">
                <span>Pending</span>
                <strong>8</strong>
              </div>
            </div>

            <div className="preview-progress">
              <div className="progress-info">
                <span>Weekly Progress</span>
                <strong>67%</strong>
              </div>

              <div className="progress-bar">
                <div className="progress-fill"></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features" id="features">
        <div className="section-heading">
          <p className="section-label">POWERFUL FEATURES</p>

          <h2>Everything you need to stay organized.</h2>

          <p>
            Simple tools designed to help you plan your work, manage
            priorities, and make steady progress.
          </p>
        </div>

        <div className="feature-grid">
          <div className="feature-card">
            <div className="feature-icon">✓</div>

            <h3>Smart Task Management</h3>

            <p>
              Create, update, complete, and organize your tasks from one
              simple workspace.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">★</div>

            <h3>Priorities & Categories</h3>

            <p>
              Organize your work using priorities and categories so you
              always know what matters most.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">◷</div>

            <h3>Due Date Tracking</h3>

            <p>
              Keep track of upcoming deadlines and identify overdue tasks
              before they become a problem.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⌕</div>

            <h3>Search & Filters</h3>

            <p>
              Quickly find the tasks you need using search and useful
              filtering options.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">↗</div>

            <h3>Progress Tracking</h3>

            <p>
              Monitor completed and pending work to understand your
              productivity at a glance.
            </p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">◆</div>

            <h3>Secure Authentication</h3>

            <p>
              Keep your personal tasks and productivity data connected to
              your own secure account.
            </p>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="about" id="about">
        <div className="about-content">
          <p className="section-label">ABOUT TASKFLOW</p>

          <h2>Designed to make everyday work easier.</h2>

          <p>
            TaskFlow is a simple productivity platform that brings your
            tasks, priorities, deadlines, and progress together in one
            organized workspace.
          </p>

          <p>
            Whether you're managing college work, personal goals, projects,
            or professional tasks, TaskFlow helps you stay focused and
            keep moving forward.
          </p>
        </div>

        <div className="about-highlight">
          <div className="highlight-item">
            <strong>01</strong>
            <span>Plan your tasks</span>
          </div>

          <div className="highlight-item">
            <strong>02</strong>
            <span>Track your progress</span>
          </div>

          <div className="highlight-item">
            <strong>03</strong>
            <span>Achieve your goals</span>
          </div>
        </div>
      </section>
    </main>
  );
}

export default Home;