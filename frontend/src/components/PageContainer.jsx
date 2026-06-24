export default function PageContainer({ title, subtitle, children, actions }) {
  return (
    <>
      <style>{styles}</style>
      <div className="pc-page">
        <div className="pc-inner">
          {/* Page header card */}
          <div className="pc-header-card">
            <div className="pc-header-content">
              <div className="pc-header-text">
                <h1 className="pc-title">{title}</h1>
                {subtitle && <p className="pc-subtitle">{subtitle}</p>}
              </div>
              {actions && <div className="pc-actions">{actions}</div>}
            </div>
          </div>

          {/* Page content */}
          <div className="pc-content">{children}</div>
        </div>
      </div>
    </>
  );
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=Syne:wght@700;800&family=DM+Sans:wght@400;500&display=swap');
  .pc-page {
    min-height: 100vh;
    background: #f4f3ef;
    font-family: 'DM Sans', sans-serif;
  }
  .pc-inner {
    max-width: 1250px;
    margin: 0 auto;
    padding: clamp(20px, 4vw, 36px) clamp(16px, 5vw, 48px);
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .pc-header-card {
    background: #ffffff;
    border-radius: 16px;
    padding: clamp(16px, 3vw, 24px) clamp(18px, 4vw, 28px);
    box-shadow: 0 2px 20px rgba(26,26,46,0.07);
    border-left: 4px solid #e8572a;
  }
  .pc-header-content {
    display: flex;
    align-items: center;
    justify-content: space-between;
    gap: 16px;
    flex-wrap: wrap;
  }
  .pc-title {
    font-family: 'Syne', sans-serif;
    font-size: clamp(1.3rem, 3.5vw, 1.8rem);
    font-weight: 800;
    color: #1a1a2e;
    margin: 0 0 4px;
    line-height: 1.15;
  }
  .pc-subtitle {
    margin: 0;
    color: #6b7280;
    font-size: clamp(0.8rem, 2vw, 0.9rem);
    line-height: 1.5;
  }
  .pc-actions {
    flex-shrink: 0;
  }
  .pc-content {
    display: flex;
    flex-direction: column;
    gap: 18px;
  }
`;