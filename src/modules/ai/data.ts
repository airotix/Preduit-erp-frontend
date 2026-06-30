import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the ai module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "forecast": {
    "kind": "dashboard",
    "metrics": [
      {
        "label": "Forecast demand",
        "value": "112K",
        "delta": "14.0%",
        "up": true,
        "sub": "next 90 days",
        "icon": "trending-up",
        "iconBg": "#FCEADF",
        "iconColor": "#C2511A"
      },
      {
        "label": "Projected sell-through",
        "value": "88%",
        "delta": "5.0%",
        "up": true,
        "sub": "Fall '26",
        "icon": "percent",
        "iconBg": "#EAF5EF",
        "iconColor": "#1F7A53"
      },
      {
        "label": "Stockout risk",
        "value": "6 styles",
        "delta": "2",
        "up": false,
        "sub": "within 30 days",
        "icon": "alert-triangle",
        "iconBg": "#FBF3E6",
        "iconColor": "#9C6B0E"
      },
      {
        "label": "Forecast accuracy",
        "value": "91%",
        "delta": "2.0%",
        "up": true,
        "sub": "trailing 3 mo",
        "icon": "target",
        "iconBg": "#E7E9F0",
        "iconColor": "#3A4256"
      }
    ],
    "chartTitle": "Demand forecast",
    "chartSub": "Projected units · next 12 weeks",
    "bars": [
      52,
      58,
      64,
      60,
      70,
      76,
      72,
      80,
      84,
      88,
      92,
      96
    ],
    "donutTitle": "Forecast by category",
    "donutTotal": "112K",
    "donut": [
      {
        "label": "Shirts",
        "value": "34%",
        "pct": 34,
        "color": "#262B3F"
      },
      {
        "label": "Bottoms",
        "value": "28%",
        "pct": 28,
        "color": "#5B6478"
      },
      {
        "label": "Knitwear",
        "value": "22%",
        "pct": 22,
        "color": "#A9AEBC"
      },
      {
        "label": "Outerwear",
        "value": "16%",
        "pct": 16,
        "color": "#F36523"
      }
    ],
    "tableTitle": "Forecast by style",
    "tableCols": [
      {
        "l": "Style",
        "a": "left"
      },
      {
        "l": "On hand",
        "a": "right"
      },
      {
        "l": "Forecast",
        "a": "right"
      },
      {
        "l": "Suggested",
        "a": "right"
      }
    ],
    "tableData": [
      [
        "Oxford Shirt",
        "568",
        "4,400",
        "+0",
        "#2E9E6B"
      ],
      [
        "Merino Crew Knit",
        "362",
        "2,300",
        "+100",
        "#8A6D3B"
      ],
      [
        "Wool Overcoat",
        "0",
        "210",
        "+200",
        "#D9534F"
      ],
      [
        "Field Jacket",
        "12",
        "168",
        "+150",
        "#D9534F"
      ]
    ],
    "activity": [
      {
        "icon": "sparkles",
        "bg": "#FCEADF",
        "color": "#C2511A",
        "text": "AI drafted 4 replenishment POs",
        "time": "1 hr ago"
      },
      {
        "icon": "trending-up",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "Linen Camp Shirt demand up 212%",
        "time": "2 hrs ago"
      }
    ]
  },
  "reorder": {
    "kind": "board",
    "columns": [
      {
        "title": "High priority",
        "accent": "#D9534F",
        "count": 2,
        "cards": [
          {
            "ref": "PO · draft",
            "title": "Wool Overcoat · Charcoal",
            "sub": "On hand 0 · Forecast 210",
            "meta": "+200 units · Anhui Knit Mills",
            "metaIcon": "trending-up",
            "av": "AK",
            "tone": "red",
            "approvable": true,
            "tag": "AI draft",
            "aLabel": "Approve",
            "bLabel": "Dismiss"
          },
          {
            "ref": "PO · draft",
            "title": "Field Jacket · Olive",
            "sub": "On hand 12 · Forecast 168",
            "meta": "+150 units · Bursa Denim",
            "metaIcon": "trending-up",
            "av": "BD",
            "tone": "red",
            "approvable": true,
            "tag": "AI draft",
            "aLabel": "Approve",
            "bLabel": "Dismiss"
          }
        ]
      },
      {
        "title": "Recommended",
        "accent": "#D29A22",
        "count": 2,
        "cards": [
          {
            "ref": "PO · draft",
            "title": "Tailored Chino · Stone",
            "sub": "On hand 38 · Forecast 240",
            "meta": "+120 units · Lahore Textile",
            "metaIcon": "trending-up",
            "av": "LT",
            "tone": "amber",
            "approvable": true,
            "tag": "AI draft",
            "aLabel": "Approve",
            "bLabel": "Dismiss"
          },
          {
            "ref": "PO · draft",
            "title": "Merino Crew · Navy",
            "sub": "On hand 44 · Forecast 190",
            "meta": "+100 units · Anhui Knit Mills",
            "metaIcon": "trending-up",
            "av": "AK",
            "tone": "amber",
            "approvable": true,
            "tag": "AI draft",
            "aLabel": "Approve",
            "bLabel": "Dismiss"
          }
        ]
      },
      {
        "title": "Approved",
        "accent": "#2E9E6B",
        "count": 1,
        "cards": [
          {
            "ref": "PO-5585",
            "title": "Cashmere Scarf · Camel",
            "sub": "On hand 9 · Forecast 120",
            "meta": "+150 units · Porto Trims",
            "metaIcon": "trending-up",
            "av": "PT",
            "tone": "green",
            "tag": "AI draft"
          }
        ]
      }
    ]
  },
  "anomalies": {
    "kind": "list",
    "search": "Search anomalies…",
    "action": "Configure",
    "filters": [
      "Type",
      "Severity"
    ],
    "columns": [
      {
        "label": "Signal"
      },
      {
        "label": "Entity"
      },
      {
        "label": "Metric"
      },
      {
        "label": "Change",
        "align": "right"
      },
      {
        "label": "Severity"
      },
      {
        "label": "Detected"
      }
    ],
    "rows": [
      [
        {
          "t": "Sales spike",
          "avatar": true,
          "sub": "Demand"
        },
        "Linen Camp Shirt",
        "Units / day",
        {
          "t": "+212%",
          "align": "right",
          "mono": true,
          "color": "#1F7A53"
        },
        {
          "badge": "amber",
          "t": "Review"
        },
        "2 hrs ago"
      ],
      [
        {
          "t": "Margin dip",
          "avatar": true,
          "sub": "Finance"
        },
        "Field Jacket",
        "Gross margin",
        {
          "t": "−9.4 pts",
          "align": "right",
          "mono": true,
          "color": "#C0392B"
        },
        {
          "badge": "red",
          "t": "Critical"
        },
        "5 hrs ago"
      ],
      [
        {
          "t": "Stock drain",
          "avatar": true,
          "sub": "Inventory"
        },
        "Merino Crew · Navy",
        "Days of cover",
        {
          "t": "−6 days",
          "align": "right",
          "mono": true,
          "color": "#C0392B"
        },
        {
          "badge": "red",
          "t": "Critical"
        },
        "Today"
      ],
      [
        {
          "t": "Return surge",
          "avatar": true,
          "sub": "Quality"
        },
        "Oxford Shirt",
        "Return rate",
        {
          "t": "+3.8%",
          "align": "right",
          "mono": true,
          "color": "#9C6B0E"
        },
        {
          "badge": "amber",
          "t": "Review"
        },
        "Yesterday"
      ]
    ]
  },
  "aireports": {
    "kind": "list",
    "search": "Search reports…",
    "action": "Generate report",
    "filters": [
      "Period"
    ],
    "columns": [
      {
        "label": "Report"
      },
      {
        "label": "Period"
      },
      {
        "label": "Generated"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "Q2 2026 executive summary",
          "avatar": true,
          "sub": "Operations & finance"
        },
        "Apr–Jun 2026",
        "27 Jun",
        {
          "badge": "green",
          "t": "Ready"
        }
      ],
      [
        {
          "t": "Fall '26 season readiness",
          "avatar": true,
          "sub": "Demand & supply"
        },
        "Fall '26",
        "24 Jun",
        {
          "badge": "green",
          "t": "Ready"
        }
      ],
      [
        {
          "t": "Supplier risk review",
          "avatar": true,
          "sub": "Procurement"
        },
        "June 2026",
        "20 Jun",
        {
          "badge": "green",
          "t": "Ready"
        }
      ]
    ]
  }
};
