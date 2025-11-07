const os = require("os");
const config = require("./config");

// Metrics stored in memory
const requests = {};

// Function to track when the greeting is changed
let authSuccess = 0;
let authFailed = 0;
let activeUsers = 0;

function addUser() {
  activeUsers++;
}

function decrementUser() {
  activeUsers++;
}

function trackAuth(req, res, next) {
  const originalJson = res.json.bind(res);
  const originalStatus = res.status.bind(res);

  let statusCode = 200; // default

  res.status = (code) => {
    statusCode = code;
    return originalStatus(code);
  };

  res.json = (body) => {
    if (statusCode >= 200 && statusCode < 300) authSuccess++;
    else if (statusCode >= 400 && statusCode < 600) authFailed++;

    return originalJson(body);
  };

  next();
}

let pizzaSuccessCount = 0;
let pizzaFailureCount = 0;
let pizzaRevenue = 0;
let totalPizzaLatency = 0;
let pizzaCountForLatency = 0;
let totalRequests = 0;
let totalLatency = 0;

function purchasePizza(success, latency, price) {
  if (success) {
    pizzaSuccessCount++;
    pizzaRevenue += Number(price);
  } else {
    pizzaFailureCount++;
  }

  totalPizzaLatency += latency;
  pizzaCountForLatency++;
}

// Middleware to track requests
function requestTracker(req, res, next) {
  const endpoint = `[${req.method}] ${req.path}`;
  requests[endpoint] = (requests[endpoint] || 0) + 1;
  totalRequests++;

  const startTime = Date.now();
  res.on("finish", () => {
    const latency = Date.now() - startTime;
    totalLatency += latency;
  });

  next();
}

// This will periodically send metrics to Grafana
setInterval(() => {
  const metrics = [];
  Object.keys(requests).forEach((endpoint) => {
    metrics.push(
      createMetric("requests", requests[endpoint], "1", "sum", "asInt", {
        endpoint,
      })
    );
  });
  metrics.push(
    createMetric("auth_success", authSuccess, "1", "sum", "asInt", {})
  );
  metrics.push(
    createMetric("auth_failure", authFailed, "1", "sum", "asInt", {})
  );

  metrics.push(
    createMetric("pizza_success", pizzaSuccessCount, "1", "sum", "asInt", {})
  );
  metrics.push(
    createMetric("pizza_failure", pizzaFailureCount, "1", "sum", "asInt", {})
  );
  metrics.push(
    createMetric("pizza_revenue", pizzaRevenue, "USD", "sum", "asDouble", {})
  );

  metrics.push(
    createMetric("active_users", activeUsers, "1", "sum", "asInt", {})
  );

  if (pizzaCountForLatency > 0) {
    const avgLatency = totalPizzaLatency / pizzaCountForLatency;
    metrics.push(
      createMetric(
        "pizza_latency_avg",
        avgLatency,
        "ms",
        "gauge",
        "asDouble",
        {}
      )
    );
  }

  if (totalLatency > 0) {
    const avgTotalLatency = totalLatency / totalRequests;
    metrics.push(
      createMetric(
        "total_latency_avg",
        avgTotalLatency,
        "ms",
        "gauge",
        "asDouble",
        {}
      )
    );
  }

  const cpuPercent = getCpuUsagePercentage();
  metrics.push(
    createMetric("cpu_usage", cpuPercent, "%", "gauge", "asDouble", {})
  );

  const memoryPercent = getMemoryUsagePercentage();
  metrics.push(
    createMetric("memory_usage", memoryPercent, "%", "gauge", "asDouble", {})
  );

  sendMetricToGrafana(metrics);
}, 10000);

function createMetric(
  metricName,
  metricValue,
  metricUnit,
  metricType,
  valueType,
  attributes
) {
  attributes = { ...attributes, source: config.source };

  const metric = {
    name: metricName,
    unit: metricUnit,
    [metricType]: {
      dataPoints: [
        {
          [valueType]: metricValue,
          timeUnixNano: Date.now() * 1000000,
          attributes: [],
        },
      ],
    },
  };

  Object.keys(attributes).forEach((key) => {
    metric[metricType].dataPoints[0].attributes.push({
      key: key,
      value: { stringValue: attributes[key] },
    });
  });

  if (metricType === "sum") {
    metric[metricType].aggregationTemporality =
      "AGGREGATION_TEMPORALITY_CUMULATIVE";
    metric[metricType].isMonotonic = true;
  }

  return metric;
}

function sendMetricToGrafana(metrics) {
  const body = {
    resourceMetrics: [
      {
        scopeMetrics: [
          {
            metrics,
          },
        ],
      },
    ],
  };

  fetch(`${config.metric.url}`, {
    method: "POST",
    body: JSON.stringify(body),
    headers: {
      Authorization: `Bearer ${config.metric.apiKey}`,
      "Content-Type": "application/json",
    },
  })
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP status: ${response.status}`);
      }
    })
    .catch((error) => {
      console.error("Error pushing metrics:", error);
    });
}

function getCpuUsagePercentage() {
  const cpuUsage = os.loadavg()[0] / os.cpus().length;
  return cpuUsage.toFixed(2) * 100;
}

function getMemoryUsagePercentage() {
  const totalMemory = os.totalmem();
  const freeMemory = os.freemem();
  const usedMemory = totalMemory - freeMemory;
  const memoryUsage = (usedMemory / totalMemory) * 100;
  return memoryUsage.toFixed(2);
}

module.exports = {
  requestTracker,
  trackAuth,
  purchasePizza,
  addUser,
  decrementUser,
};
