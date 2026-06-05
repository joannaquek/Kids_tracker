import React from 'react';
import { useTracker } from '../context/TrackerContext';

export const HealthAnalytics: React.FC = () => {
  const { children, selectedChildId, sicknessLogs } = useTracker();

  // Filter logs with temperature
  const tempLogs = sicknessLogs
    .filter((log) => {
      const matchesChild = selectedChildId === 'all' ? true : log.childId === selectedChildId;
      return matchesChild && log.temperature !== undefined;
    })
    // Sort oldest to newest for chronological plotting
    .sort((a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime());

  // Convert all temps to Celsius for standardized charting
  const standardLogs = tempLogs.map((log) => {
    const val = log.temperature!;
    const celsius = log.temperatureUnit === 'F' ? ((val - 32) * 5) / 9 : val;
    return {
      id: log.id,
      childId: log.childId,
      timestamp: new Date(log.timestamp),
      celsius,
      displayTemp: `${val.toFixed(1)}°${log.temperatureUnit}`
    };
  });

  const hasChartData = standardLogs.length >= 2;

  // Chart layout config
  const paddingX = 50;
  const paddingY = 40;
  const width = 500;
  const height = 250;

  // Find min/max temperature values (clamped to show reasonable fever ranges)
  const tempVals = standardLogs.map((l) => l.celsius);
  const minTemp = Math.min(36.0, ...tempVals) - 0.5;
  const maxTemp = Math.max(39.5, ...tempVals) + 0.5;

  const getCoordinates = () => {
    if (standardLogs.length < 2) return [];

    const minTime = standardLogs[0].timestamp.getTime();
    const maxTime = standardLogs[standardLogs.length - 1].timestamp.getTime();
    const timeRange = maxTime - minTime || 1; // Prevent division by zero
    const tempRange = maxTemp - minTemp;

    return standardLogs.map((log) => {
      // X coordinate spaced proportional to time or just even increments if desired.
      // Proportional to time is cleaner:
      const t = log.timestamp.getTime();
      const x = paddingX + ((t - minTime) / timeRange) * (width - 2 * paddingX);
      
      // Y coordinate: high temperature at top (lower Y in SVG)
      const y = height - paddingY - ((log.celsius - minTemp) / tempRange) * (height - 2 * paddingY);

      return { x, y, log };
    });
  };

  const coords = getCoordinates();
  
  // Build SVG Path strings
  let linePath = '';
  let areaPath = '';

  if (coords.length > 0) {
    linePath = `M ${coords[0].x} ${coords[0].y} ` + coords.slice(1).map(c => `L ${c.x} ${c.y}`).join(' ');
    // Area path closes the shape down to the bottom of the chart
    areaPath = `${linePath} L ${coords[coords.length - 1].x} ${height - paddingY} L ${coords[0].x} ${height - paddingY} Z`;
  }

  // Draw grid lines
  const gridLines = [];
  const tempStep = 1; // 1 degree step
  const minGridTemp = Math.ceil(minTemp);
  const maxGridTemp = Math.floor(maxTemp);

  for (let t = minGridTemp; t <= maxGridTemp; t += tempStep) {
    const y = height - paddingY - ((t - minTemp) / (maxTemp - minTemp)) * (height - 2 * paddingY);
    gridLines.push({ value: t, y });
  }

  return (
    <div className="analytics-card card">
      <div className="card-header">
        <h3>Temperature Trends</h3>
        {selectedChildId !== 'all' && children.find(c => c.id === selectedChildId) && (
          <span className="badge" style={{ backgroundColor: children.find(c => c.id === selectedChildId)?.color }}>
            {children.find(c => c.id === selectedChildId)?.name}
          </span>
        )}
      </div>

      <div className="analytics-body">
        {!hasChartData ? (
          <div className="chart-empty-state">
            <span className="chart-empty-icon">📈</span>
            <p>Please record at least 2 temperature logs to view trend analytics.</p>
          </div>
        ) : (
          <div className="chart-container-wrapper">
            <svg
              viewBox={`0 0 ${width} ${height}`}
              className="trend-svg"
              width="100%"
              height="100%"
            >
              {/* Defs for gradients */}
              <defs>
                <linearGradient id="chart-area-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="var(--accent)" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="fever-grad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ef4444" stopOpacity="0.1" />
                  <stop offset="50%" stopColor="#f59e0b" stopOpacity="0.05" />
                  <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Fever Range Shading */}
              {/* High fever zone (38.5C+) */}
              {(() => {
                const y38_5 = height - paddingY - ((38.5 - minTemp) / (maxTemp - minTemp)) * (height - 2 * paddingY);
                if (y38_5 >= paddingY && y38_5 <= height - paddingY) {
                  return (
                    <rect
                      x={paddingX}
                      y={paddingY}
                      width={width - 2 * paddingX}
                      height={y38_5 - paddingY}
                      fill="rgba(239, 68, 68, 0.05)"
                    />
                  );
                }
                return null;
              })()}

              {/* Grid Lines & Labels */}
              {gridLines.map((line, idx) => (
                <g key={idx}>
                  <line
                    x1={paddingX}
                    y1={line.y}
                    x2={width - paddingX}
                    y2={line.y}
                    stroke="var(--border)"
                    strokeWidth="1"
                    strokeDasharray="4,4"
                  />
                  <text
                    x={paddingX - 10}
                    y={line.y + 4}
                    textAnchor="end"
                    className="chart-label-text"
                    fill="var(--text)"
                    fontSize="10"
                  >
                    {line.value}°C
                  </text>
                </g>
              ))}

              {/* Area Under Path */}
              <path d={areaPath} fill="url(#chart-area-grad)" />

              {/* Line Path */}
              <path
                d={linePath}
                fill="none"
                stroke="var(--accent)"
                strokeWidth="3"
                strokeLinecap="round"
                strokeLinejoin="round"
              />

              {/* Data points (circles) */}
              {coords.map((c, idx) => {
                const child = children.find((kid) => kid.id === c.log.childId);
                const pointColor = child ? child.color : 'var(--accent)';
                return (
                  <g key={idx} className="chart-point-group">
                    <circle
                      cx={c.x}
                      cy={c.y}
                      r="6"
                      fill={pointColor}
                      stroke="var(--bg)"
                      strokeWidth="2"
                    />
                    {/* Tooltip on hover */}
                    <g className="chart-tooltip-bubble">
                      <rect
                        x={c.x - 45}
                        y={c.y - 35}
                        width="90"
                        height="25"
                        rx="4"
                        fill="var(--text-h)"
                        opacity="0.9"
                      />
                      <text
                        x={c.x}
                        y={c.y - 18}
                        textAnchor="middle"
                        fill="var(--bg)"
                        fontSize="10"
                        fontWeight="bold"
                      >
                        {c.log.displayTemp}
                      </text>
                    </g>
                  </g>
                );
              })}

              {/* Time bounds labels */}
              {coords.length >= 2 && (
                <g>
                  <text
                    x={paddingX}
                    y={height - paddingY + 20}
                    textAnchor="start"
                    className="chart-label-text"
                    fill="var(--text)"
                    fontSize="10"
                  >
                    {coords[0].log.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </text>
                  <text
                    x={width - paddingX}
                    y={height - paddingY + 20}
                    textAnchor="end"
                    className="chart-label-text"
                    fill="var(--text)"
                    fontSize="10"
                  >
                    {coords[coords.length - 1].log.timestamp.toLocaleDateString([], { month: 'short', day: 'numeric' })}
                  </text>
                </g>
              )}
            </svg>

            {/* Quick Summary Grid */}
            <div className="analytics-stats">
              <div className="stat-card">
                <span className="stat-num max-temp">
                  {Math.max(...tempVals).toFixed(1)}°C
                </span>
                <span className="stat-label">Max Temperature</span>
              </div>
              <div className="stat-card">
                <span className="stat-num avg-temp">
                  {(tempVals.reduce((a, b) => a + b, 0) / tempVals.length).toFixed(1)}°C
                </span>
                <span className="stat-label">Average Temperature</span>
              </div>
              <div className="stat-card">
                <span className="stat-num logs-count">{tempVals.length}</span>
                <span className="stat-label">Readings Taken</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
