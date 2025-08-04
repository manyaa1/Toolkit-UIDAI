// AMC Charts View Component - Multiple chart visualizations for quarterly AMC data
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
                fill="#3b82f6"
                stroke="#1e40af"
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
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = height - margin.bottom - ratio * chartHeight;
          const value = ratio * maxValue;

          return (
            <g key={index}>
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

  // Generate path for line
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
        <path d={pathData} fill="none" stroke="#10b981" strokeWidth="3" />

        {/* Data points */}
        {data.map((item, index) => {
          const x = margin.left + (index / (data.length - 1)) * chartWidth;
          const y =
            height -
            margin.bottom -
            ((item.value - minValue) / valueRange) * chartHeight;

          return (
            <g key={index}>
              <circle
                cx={x}
                cy={y}
                r="4"
                fill="#059669"
                stroke="white"
                strokeWidth="2"
              />

              {/* X-axis labels */}
              <text
                x={x}
                y={height - margin.bottom + 15}
                textAnchor="middle"
                fontSize="11"
                fill="#64748b"
                transform={`rotate(-45, ${x}, ${height - margin.bottom + 15})`}
              >
                {item.label}
              </text>
            </g>
          );
        })}

        {/* Y-axis labels */}
        {[0, 0.25, 0.5, 0.75, 1].map((ratio, index) => {
          const y = height - margin.bottom - ratio * chartHeight;
          const value = minValue + ratio * valueRange;

          return (
            <g key={index}>
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
  let currentAngle = -Math.PI / 2; // Start at top

  const colors = [
    "#3b82f6",
    "#10b981",
    "#f59e0b",
    "#ef4444",
    "#8b5cf6",
    "#06b6d4",
  ];

  return (
    <Card title={title} style={{ marginBottom: 24 }}>
      <div style={{ display: "flex", alignItems: "center" }}>
        <svg width={width} height={height}>
          {data.map((item, index) => {
            const angle = (item.value / total) * 2 * Math.PI;
            const startAngle = currentAngle;
            const endAngle = currentAngle + angle;

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

            currentAngle += angle;

            // Label position
            const labelAngle = startAngle + angle / 2;
            const labelX = centerX + radius * 0.7 * Math.cos(labelAngle);
            const labelY = centerY + radius * 0.7 * Math.sin(labelAngle);

            return (
              <g key={index}>
                <path
                  d={pathData}
                  fill={colors[index % colors.length]}
                  stroke="white"
                  strokeWidth="2"
                  opacity="0.8"
                />
                <text
                  x={labelX}
                  y={labelY}
                  textAnchor="middle"
                  fontSize="12"
                  fill="white"
                  fontWeight="600"
                >
                  {((item.value / total) * 100).toFixed(1)}%
                </text>
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div style={{ marginLeft: 20 }}>
          {data.map((item, index) => (
            <div
              key={index}
              style={{ display: "flex", alignItems: "center", marginBottom: 8 }}
            >
              <div
                style={{
                  width: 16,
                  height: 16,
                  backgroundColor: colors[index % colors.length],
                  marginRight: 8,
                  borderRadius: 2,
                }}
              />
              <span style={{ fontSize: "0.875rem" }}>
                {item.label}: {formatIndianCurrency(item.value)}
              </span>
            </div>
          ))}
        </div>
      </div>
    </Card>
  );
};

// Main AMC Charts View Component
const AMCChartsView = ({ data, quarterTotals, yearTotals, rawResults }) => {
  const [selectedChart, setSelectedChart] = useState("overview");
  const [selectedYear, setSelectedYear] = useState("all");

  // Process data for charts
  const chartData = useMemo(() => {
    if (!rawResults || rawResults.length === 0) return null;

    // Quarterly totals chart data
    const allQuarterlyData = Object.entries(quarterTotals)
      .sort(([a], [b]) => {
        const [qA, yearA] = a.split("-");
        const [qB, yearB] = b.split("-");
        if (parseInt(yearA) !== parseInt(yearB)) {
          return parseInt(yearA) - parseInt(yearB);
        }
        const quarterOrder = { JFM: 0, AMJ: 1, JAS: 2, OND: 3 };
        return quarterOrder[qA] - quarterOrder[qB];
      })
      .map(([quarter, data]) => ({
        label: quarter,
        value: data.withGst || 0,
      }));

    // Filter quarterly data based on selected year
    const quarterlyData =
      selectedYear === "all"
        ? allQuarterlyData
        : allQuarterlyData.filter((q) => q.label.includes(selectedYear));

    // Yearly totals chart data
    const yearlyData = Object.entries(yearTotals)
      .sort(([a], [b]) => parseInt(a) - parseInt(b))
      .map(([year, data]) => ({
        label: year,
        value: data.withGst || 0,
      }));

    // Top products by AMC value
    const productData = rawResults
      .map((product) => ({
        label: product.productName,
        value: product.totalAmountWithGST || 0,
      }))
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

    // Extract available years from yearly data
    const availableYears = ["all", ...yearlyData.map((year) => year.label)];

    return {
      quarterly: quarterlyData,
      yearly: yearlyData,
      products: productData,
      growth: growthData,
      availableYears: availableYears,
    };
  }, [rawResults, quarterTotals, yearTotals, selectedYear]);

  if (!chartData) {
    return (
      <div style={{ textAlign: "center", padding: "60px 20px" }}>
        <div style={{ fontSize: "3rem", marginBottom: "16px" }}>📊</div>
        <h3 style={{ color: "#64748b", marginBottom: "8px" }}>
          No Data Available
        </h3>
        <p style={{ color: "#94a3b8" }}>
          Please calculate AMC schedules first to view charts and analytics.
        </p>
      </div>
    );
  }

  // Summary statistics (based on filtered quarterly data)
  const totalAMC = chartData.quarterly.reduce((sum, q) => sum + q.value, 0);
  const avgQuarterly =
    chartData.quarterly.length > 0 ? totalAMC / chartData.quarterly.length : 0;
  const highestQuarter =
    chartData.quarterly.length > 0
      ? chartData.quarterly.reduce(
          (max, q) => (q.value > max.value ? q : max),
          chartData.quarterly[0]
        )
      : { label: "N/A", value: 0 };

  return (
    <div style={{ padding: "0 20px" }}>
      {/* Chart Selection */}
      <div
        style={{
          marginBottom: 24,
          display: "flex",
          alignItems: "center",
          gap: 16,
          flexWrap: "wrap",
        }}
      >
        <span style={{ fontWeight: 600, color: "#374151" }}>View:</span>
        <Select
          value={selectedChart}
          onChange={setSelectedChart}
          style={{ width: 200 }}
        >
          <Option value="overview">📊 Overview</Option>
          <Option value="quarterly">📈 Quarterly Trends</Option>
          <Option value="yearly">📅 Yearly Distribution</Option>
          <Option value="products">🏆 Top Products</Option>
        </Select>

        {/* Year Filter - Show only for quarterly charts */}
        {(selectedChart === "quarterly" || selectedChart === "overview") && (
          <>
            <span style={{ fontWeight: 600, color: "#374151" }}>Year:</span>
            <Select
              value={selectedYear}
              onChange={setSelectedYear}
              style={{ width: 150 }}
            >
              <Option value="all">🗓️ All Years</Option>
              {chartData.availableYears
                .filter((year) => year !== "all")
                .map((year) => (
                  <Option key={year} value={year}>
                    📅 {year}
                  </Option>
                ))}
            </Select>
          </>
        )}
      </div>

      {/* Summary Cards */}
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={6}>
          <Card>
            <Statistic
              title={
                selectedYear === "all"
                  ? "Total AMC Value"
                  : `Total AMC Value (${selectedYear})`
              }
              value={totalAMC}
              formatter={(value) => formatIndianCurrency(value)}
              valueStyle={{ color: "#3b82f6" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={
                selectedYear === "all"
                  ? "Average per Quarter"
                  : `Avg per Quarter (${selectedYear})`
              }
              value={avgQuarterly}
              formatter={(value) => formatIndianCurrency(value)}
              valueStyle={{ color: "#10b981" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={
                selectedYear === "all"
                  ? "Highest Quarter"
                  : `Highest Quarter (${selectedYear})`
              }
              value={highestQuarter.label}
              suffix={formatIndianCurrency(highestQuarter.value)}
              valueStyle={{ color: "#f59e0b" }}
            />
          </Card>
        </Col>
        <Col span={6}>
          <Card>
            <Statistic
              title={
                selectedYear === "all"
                  ? "Total Quarters"
                  : `Quarters in ${selectedYear}`
              }
              value={chartData.quarterly.length}
              suffix="quarters"
              valueStyle={{ color: "#8b5cf6" }}
            />
          </Card>
        </Col>
      </Row>

      {/* Charts */}
      {selectedChart === "overview" && (
        <Row gutter={16}>
          <Col span={12}>
            <BarChart
              data={chartData.quarterly.slice(0, 8)} // First 8 quarters
              title={
                selectedYear === "all"
                  ? "Quarterly AMC Revenue (First 8 Quarters)"
                  : `Quarterly AMC Revenue - ${selectedYear}`
              }
              width={600}
              height={350}
            />
          </Col>
          <Col span={12}>
            <PieChart
              data={chartData.yearly}
              title="AMC Distribution by Year"
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
                  ? "Complete Quarterly AMC Schedule (All Years)"
                  : `Quarterly AMC Schedule - ${selectedYear}`
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
                  ? "Quarterly AMC Trends (All Years)"
                  : `Quarterly AMC Trends - ${selectedYear}`
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
              title="Yearly AMC Totals"
              width={600}
              height={400}
            />
          </Col>
          <Col span={12}>
            <PieChart
              data={chartData.yearly}
              title="Year-wise AMC Distribution"
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
              title="Top 10 Products by AMC Value"
              width={1000}
              height={450}
            />
          </Col>
        </Row>
      )}
    </div>
  );
};

export default AMCChartsView;
