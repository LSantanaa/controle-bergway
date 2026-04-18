export function SkeletonStat() {
  return (
    <article className="stat-card">
      <span className="muted" style={{ backgroundColor: "#e5e7eb", height: "12px", borderRadius: "4px", display: "block", width: "80px", marginBottom: "8px" }} />
      <div className="stat-value" style={{ backgroundColor: "#e5e7eb", height: "32px", borderRadius: "4px", width: "60px" }} />
    </article>
  );
}

export function SkeletonTimelineItem() {
  return (
    <div className="timeline-item" style={{ opacity: 0.5 }}>
      <div className="toolbar">
        <strong style={{ backgroundColor: "#e5e7eb", height: "16px", borderRadius: "4px", display: "block", width: "200px", marginBottom: "8px" }} />
        <span className="muted" style={{ backgroundColor: "#e5e7eb", height: "14px", borderRadius: "4px", display: "block", width: "100px" }} />
      </div>
      <div className="muted" style={{ backgroundColor: "#e5e7eb", height: "14px", borderRadius: "4px", display: "block", width: "150px", marginTop: "8px" }} />
      <div className="muted" style={{ backgroundColor: "#e5e7eb", height: "14px", borderRadius: "4px", display: "block", width: "120px", marginTop: "4px" }} />
    </div>
  );
}

export function SkeletonTableRow() {
  return (
    <tr style={{ opacity: 0.5 }}>
      <td><div style={{ backgroundColor: "#e5e7eb", height: "14px", borderRadius: "4px", width: "80px" }} /></td>
      <td><div style={{ backgroundColor: "#e5e7eb", height: "14px", borderRadius: "4px", width: "60px" }} /></td>
      <td><div style={{ backgroundColor: "#e5e7eb", height: "14px", borderRadius: "4px", width: "90px" }} /></td>
      <td><div style={{ backgroundColor: "#e5e7eb", height: "14px", borderRadius: "4px", width: "120px" }} /></td>
      <td><div style={{ backgroundColor: "#e5e7eb", height: "14px", borderRadius: "4px", width: "100px" }} /></td>
      <td><div style={{ backgroundColor: "#e5e7eb", height: "14px", borderRadius: "4px", width: "70px" }} /></td>
    </tr>
  );
}
