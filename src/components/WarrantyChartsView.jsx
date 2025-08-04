// Warranty Charts View Component - Multiple chart visualizations for quarterly warranty data
import React, { useMemo, useState } from "react";
import { Card, Select, Row, Col, Statistic } from "antd";

const { Option } = Select;

// Utility function to format numbers in Indian numbering system
const formatIndianCurrency = (value, showDecimal = true) => {
  if (value < 100000) {
    // Less than 1 lakh - show in thousands
    return `₹${(value / 1000).toFixed(showDecimal ? 1 : 0)}K`;
  } else if (value < 10000000) {
    // 1 lakh to 1 crore - show in lakhs
    return `₹${(value / 100000).toFixed(showDecimal ? 2 : 0)}L`;
  } else {
    // Above 1 crore - show in crores
    return `₹${(value / 10000000).toFixed(showDecimal ? 2 : 0)}Cr`;
  }
};

// Simple Bar Chart Component using SVG
const BarChart = ({ data, title, width = 800, height = 400 }) => {
  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxValue = Math.max(...data.map((d) => d.value));
  const barWidth = (chartWidth / data.length) * 0.8;
  const barSpacing = (chartWidth / data.length) * 0.2;

  return (
    <Card title={title} style={{ marginBottom: 24 }}>
      <svg width={width} height={height}>
        {/* Y-axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={height - margin.bottom}
          stroke="#64748b"
          strokeWidth="1"
        />

        {/* X-axis */}
        <line
          x1={margin.left}
          y1={height - margin.bottom}
          x2={width - margin.right}
          y2={height - margin.bottom}
          stroke="#64748b"
          strokeWidth="1"
        />

        {/* Bars */}
        {data.map((item, index) => {
          const barHeight = (item.value / maxValue) * chartHeight;
          const x =
            margin.left + index * (barWidth + barSpacing) + barSpacing / 2;
          const y = height - margin.bottom - barHeight;

          return (
            <g key={index}>
              <rect
                x={x}
                y={y}
                width={barWidth}
                height={barHeight}
                fill="#10b981"
                stroke="#059669"
                strokeWidth="1"
                opacity="0.8"
              />

              {/* Value labels on bars */}
              <text
                x={x + barWidth / 2}
                y={y - 5}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
              >
                {formatIndianCurrency(item.value, false)}
              </text>

              {/* X-axis labels */}
              <text
                x={x + barWidth / 2}
                y={height - margin.bottom + 15}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
                transform={`rotate(-45, ${x + barWidth / 2}, ${
                  height - margin.bottom + 15
                })`}
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = maxValue * ratio;
          const y = height - margin.bottom - ratio * chartHeight;

          return (
            <g key={ratio}>
              <line
                x1={margin.left - 5}
                y1={y}
                x2={margin.left}
                y2={y}
                stroke="#64748b"
                strokeWidth="1"
              />
              <text
                x={margin.left - 10}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
              >
                {formatIndianCurrency(value, false)}
              </text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
};

// Simple Line Chart Component using SVG
const LineChart = ({ data, title, width = 800, height = 400 }) => {
  const margin = { top: 20, right: 30, bottom: 60, left: 80 };
  const chartWidth = width - margin.left - margin.right;
  const chartHeight = height - margin.top - margin.bottom;

  const maxValue = Math.max(...data.map((d) => d.value));
  const minValue = Math.min(...data.map((d) => d.value));
  const valueRange = maxValue - minValue;

  // Generate path for the line
  const pathData = data
    .map((item, index) => {
      const x = margin.left + (index / (data.length - 1)) * chartWidth;
      const y =
        height -
        margin.bottom -
        ((item.value - minValue) / valueRange) * chartHeight;
      return `${index === 0 ? "M" : "L"} ${x} ${y}`;
    })
    .join(" ");

  return (
    <Card title={title} style={{ marginBottom: 24 }}>
      <svg width={width} height={height}>
        {/* Y-axis */}
        <line
          x1={margin.left}
          y1={margin.top}
          x2={margin.left}
          y2={height - margin.bottom}
          stroke="#64748b"
          strokeWidth="1"
        />

        {/* X-axis */}
        <line
          x1={margin.left}
          y1={height - margin.bottom}
          x2={width - margin.right}
          y2={height - margin.bottom}
          stroke="#64748b"
          strokeWidth="1"
        />

        {/* Line */}
        <path
          d={pathData}
          fill="none"
          stroke="#10b981"
          strokeWidth="2"
          opacity="0.8"
        />

        {/* Data points */}
        {data.map((item, index) => {
          const x = margin.left + (index / (data.length - 1)) * chartWidth;
          const y =
            height -
            margin.bottom -
            ((item.value - minValue) / valueRange) * chartHeight;

          return (
            <g key={index}>
              <circle cx={x} cy={y} r="4" fill="#059669" opacity="0.8" />
              <text
                x={x}
                y={y - 10}
                textAnchor="middle"
                fontSize="10"
                fill="#374151"
              >
                {formatIndianCurrency(item.value, false)}
              </text>
            </g>
          );
        })}

        {/* X-axis labels */}
        {data.map((item, index) => {
          const x = margin.left + (index / (data.length - 1)) * chartWidth;
          return (
            <text
              key={index}
              x={x}
              y={height - margin.bottom + 15}
              textAnchor="middle"
              fontSize="11"
              fill="#64748b"
              transform={`rotate(-45, ${x}, ${height - margin.bottom + 15})`}
            >
              {item.label}
            </text>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio) => {
          const value = minValue + valueRange * ratio;
          const y = height - margin.bottom - ratio * chartHeight;

          return (
            <g key={ratio}>
              <line
                x1={margin.left - 5}
                y1={y}
                x2={margin.left}
                y2={y}
                stroke="#64748b"
                strokeWidth="1"
              />
              <text
                x={margin.left - 10}
                y={y + 3}
                textAnchor="end"
                fontSize="10"
                fill="#64748b"
              >
                {formatIndianCurrency(value, false)}
              </text>
            </g>
          );
        })}
      </svg>
    </Card>
  );
};

// Simple Pie Chart Component using SVG
const PieChart = ({ data, title, width = 400, height = 400 }) => {
  const radius = Math.min(width, height) / 2 - 40;
  const centerX = width / 2;
  const centerY = height / 2;

  const total = data.reduce((sum, item) => sum + item.value, 0);

  let cumulativeAngle = 0;
  const slices = data.map((item, index) => {
    const angle = (item.value / total) * 2 * Math.PI;
    const startAngle = cumulativeAngle;
    const endAngle = cumulativeAngle + angle;

    const x1 = centerX + radius * Math.cos(startAngle);
    const y1 = centerY + radius * Math.sin(startAngle);
    const x2 = centerX + radius * Math.cos(endAngle);
    const y2 = centerY + radius * Math.sin(endAngle);

    const largeArcFlag = angle > Math.PI ? 1 : 0;

    const pathData = [
      `M ${centerX} ${centerY}`,
      `L ${x1} ${y1}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
      "Z",
    ].join(" ");

    // Label position
    const labelAngle = startAngle + angle / 2;
    const labelX = centerX + radius * 0.7 * Math.cos(labelAngle);
    const labelY = centerY + radius * 0.7 * Math.sin(labelAngle);

    const percentage = ((item.value / total) * 100).toFixed(1);

    cumulativeAngle += angle;

    // Color palette for warranty charts
    const colors = [
      "#10b981",
      "#059669",
      "#047857",
      "#065f46",
      "#064e3b",
      "#34d399",
      "#6ee7b7",
      "#a7f3d0",
      "#d1fae5",
      "#ecfdf5",
    ];

    return {
      ...item,
      pathData,
      labelX,
      labelY,
      percentage,
      color: colors[index % colors.length],
    };
  });

  return (
    <Card title={title} style={{ marginBottom: 24 }}>
      <div style={{ textAlign: "center" }}>
        <svg width={width} height={height}>
          {slices.map((slice, index) => (
            <g key={index}>
              <path d={slice.pathData} fill={slice.color} opacity="0.8" />
              {parseFloat(slice.percentage) > 5 && (
                <text
                  x={slice.labelX}
                  y={slice.labelY}
                  textAnchor="middle"
                  fontSize="10"
                  fill="#374151"
                  fontWeight="600"
                >
                  {slice.percentage}%
                </text>
              )}
            </g>
          ))}
        </svg>

        {/* Legend */}
        <div style={{ marginTop: 16 }}>
          {slices.map((slice, index) => (
            <div
              key={index}
              style={{
                display: "inline-block",
                margin: "4px 8px",
                fontSize: "12px",
              }}
            >
              <span
                style={{
                  display: "inline-block",
                  width: "12px",
                  height: "12px",
                  backgroundColor: slice.color,
                  marginRight: "6px",
                  borderRadius: "2px",
                }}
              ></span>
              {slice.label}: {formatIndianCurrency(slice.value)}
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Main Warranty Charts View Component
const WarrantyChartsView = ({ data, rawResults }) => {
  const [selectedChart, setSelectedChart] = useState("overview");
  const [selectedYear, setSelectedYear] = useState("all");

  // Process data for charts
  const chartData = useMemo(() => {
    if (!data || data.length === 0) return null;

    // Extract quarterly totals from the data
    const quarterTotals = {};
    const yearTotals = {};

    // Process all products except Grand Total
    const productRows = data.filter((row) => row.itemName !== "Grand Total");

    productRows.forEach((product) => {
      Object.keys(product).forEach((key) => {
        // Process quarter columns (e.g., "JFM 2024", "AMJ 2024")
        if (key.match(/^(JFM|AMJ|JAS|OND) \d{4}$/)) {
          const value = product[key] || 0;
          if (!quarterTotals[key]) {
            quarterTotals[key] = 0;
          }
          quarterTotals[key] += value;

          // Extract year for yearly totals
          const year = key.split(" ")[1];
          if (!yearTotals[year]) {
            yearTotals[year] = 0;
          }
          yearTotals[year] += value;
        }
      });
    });

    // Quarterly totals chart data
    const allQuarterlyData = Object.entries(quarterTotals)
      .sort(([a], [b]) => {
        const [qA, yearA] = a.split(" ");
        const [qB, yearB] = b.split(" ");
        if (parseInt(yearA) !== parseInt(yearB)) {
          return parseInt(yearA) - parseInt(yearB);
        }
        const quarterOrder = { JFM: 0, AMJ: 1, JAS: 2, OND: 3 };
        return quarterOrder[qA] - quarterOrder[qB];
      })
      .map(([quarter, value]) => ({
        label: quarter,
        value: value || 0,
      }));

    // Filter quarterly data based on selected year
    const quarterlyData =
      selectedYear === "all"
        ? allQuarterlyData
        : allQuarterlyData.filter((q) => q.label.includes(selectedYear));

    // Yearly totals chart data
    const yearlyData = Object.entries(yearTotals)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([year, value]) => ({
        label: year,
        value: value || 0,
      }));

    // Top products by warranty value
    const productData = productRows
      .map((product) => {
        // Find the total column for each product
        const totalColumn = Object.keys(product).find(
          (key) => key.includes("Total (") && key.includes(" Years)")
        );
        return {
          label: product.itemName,
          value: totalColumn ? product[totalColumn] || 0 : 0,
        };
      })
      .sort((a, b) => b.value - a.value)
      .slice(0, 10); // Top 10 products

    // Quarter-over-quarter growth (based on filtered data)
    const growthData = quarterlyData.map((quarter, index) => {
      if (index === 0) return { ...quarter, growth: 0 };
      const prevValue = quarterlyData[index - 1].value;
      const growth =
        prevValue > 0 ? ((quarter.value - prevValue) / prevValue) * 100 : 0;
      return { ...quarter, growth };
    });

    // Extract available years
    const availableYears = ["all", ...yearlyData.map((year) => year.label)];

    return {
      quarterly: quarterlyData,
      yearly: yearlyData,
      products: productData,
      growth: growthData,
      availableYears: availableYears,
    };
  }, [data, selectedYear]);

  if (!chartData) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📊</div>
        <h3 style={{ color: "#64748b", marginBottom: "8px" }}>
          No Data Available
        </h3>
        <p style={{ color: "#94a3b8" }}>
          Please calculate warranty schedules first to view charts and
          analytics.
        </p>
      </div>
    );
  }

  // Summary statistics (based on filtered quarterly data)
  const totalWarranty = chartData.quarterly.reduce(
    (sum, q) => sum + q.value,
    0
  );
  const avgQuarterly =
    chartData.quarterly.length > 0
      ? totalWarranty / chartData.quarterly.length
      : 0;
  const maxQuarter =
    chartData.quarterly.length > 0
      ? Math.max(...chartData.quarterly.map((q) => q.value))
      : 0;
  const totalProducts = chartData.products.length;

  return (
    <div style={{ padding: "24px" }}>
      {/* Header with Controls */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: "24px",
          flexWrap: "wrap",
          gap: "16px",
        }}
      >
        <h2 style={{ margin: 0, color: "#374151" }}>Warranty Analytics</h2>
        <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
          <Select
            value={selectedChart}
            onChange={setSelectedChart}
            style={{ width: 150 }}
          >
            <Option value="overview">Overview</Option>
            <Option value="quarterly">Quarterly</Option>
            <Option value="yearly">Yearly</Option>
            <Option value="products">Top Products</Option>
          </Select>
          {(selectedChart === "quarterly" || selectedChart === "overview") && (
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 120 }}
            >
              {chartData.availableYears.map((year) => (
                <Option key={year} value={year}>
                  {year === "all" ? "All Years" : year}
                </Option>
              ))}
            </Select>
          )}
        </div>
      </div>

      {/* Summary Statistics */}
      <Row gutter={16} style={{ marginBottom: "24px" }}>
        <Col span={6}>
          <Card>
            <Statistic
              title="Total Warranty Value"
              value={totalWarranty}
              formatter={(value) => formatIndianCurrency(value)}
              valueStyle={{ color: "#10b981" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Average per Quarter"
              value={avgQuarterly}
              formatter={(value) => formatIndianCurrency(value)}
              valueStyle={{ color: "#059669" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Peak Quarter"
              value={maxQuarter}
              formatter={(value) => formatIndianCurrency(value)}
              valueStyle={{ color: "#047857" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title="Products with Warranty"
              value={totalProducts}
              valueStyle={{ color: "#065f46" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      {selectedChart === "overview" && (
        <Row gutter={16}>
          <Col span={12}>
            <BarChart
              data={chartData.quarterly.slice(0, 8)}
              title={
                selectedYear === "all"
                  ? "Recent Quarterly Warranty Trends"
                  : `Quarterly Warranty Trends - ${selectedYear}`
              }
              width={500}
              height={350}
            />
          </Col>
          <Col span={12}>
            <PieChart
              data={chartData.yearly}
              title="Warranty Distribution by Year"
              width={500}
              height={350}
            />
          </Col>
        </Row>
      )}

      {selectedChart === "quarterly" && (
        <Row gutter={16}>
          <Col span={24}>
            <BarChart
              data={chartData.quarterly}
              title={
                selectedYear === "all"
                  ? "Complete Quarterly Warranty Schedule (All Years)"
                  : `Quarterly Warranty Schedule - ${selectedYear}`
              }
              width={1000}
              height={400}
            />
          </Col>
          <Col span={24}>
            <LineChart
              data={chartData.quarterly}
              title={
                selectedYear === "all"
                  ? "Quarterly Warranty Trends (All Years)"
                  : `Quarterly Warranty Trends - ${selectedYear}`
              }
              width={1000}
              height={350}
            />
          </Col>
        </Row>
      )}

      {selectedChart === "yearly" && (
        <Row gutter={16}>
          <Col span={12}>
            <BarChart
              data={chartData.yearly}
              title="Yearly Warranty Totals"
              width={600}
              height={400}
            />
          </Col>
          <Col span={12}>
            <PieChart
              data={chartData.yearly}
              title="Year-wise Warranty Distribution"
              width={500}
              height={400}
            />
          </Col>
        </Row>
      )}

      {selectedChart === "products" && (
        <Row gutter={16}>
          <Col span={24}>
            <BarChart
              data={chartData.products}
              title="Top 10 Products by Warranty Value"
              width={1000}
              height={450}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default WarrantyChartsView;
