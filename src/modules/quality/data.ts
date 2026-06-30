import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the quality module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "inspections": {
    "kind": "list",
    "search": "Search inspections…",
    "action": "New inspection",
    "filters": [
      "Result",
      "Stage"
    ],
    "columns": [
      {
        "label": "Inspection"
      },
      {
        "label": "Order"
      },
      {
        "label": "Stage"
      },
      {
        "label": "Defects",
        "align": "center"
      },
      {
        "label": "AQL",
        "align": "center"
      },
      {
        "label": "Result"
      }
    ],
    "rows": [
      [
        {
          "t": "QC-7740 · Final",
          "avatar": true,
          "sub": "Inline AQL 2.5"
        },
        "MO-3308",
        {
          "badge": "navy",
          "t": "Final"
        },
        {
          "t": "3",
          "align": "center",
          "mono": true
        },
        {
          "t": "2.5",
          "align": "center",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Pass"
        }
      ],
      [
        {
          "t": "QC-7739 · Inline",
          "avatar": true,
          "sub": "Stitching"
        },
        "MO-3310",
        {
          "badge": "navy",
          "t": "Inline"
        },
        {
          "t": "11",
          "align": "center",
          "mono": true
        },
        {
          "t": "2.5",
          "align": "center",
          "mono": true
        },
        {
          "badge": "red",
          "t": "Fail"
        }
      ],
      [
        {
          "t": "QC-7738 · Final",
          "avatar": true,
          "sub": "Inline AQL 4.0"
        },
        "MO-3309",
        {
          "badge": "navy",
          "t": "Final"
        },
        {
          "t": "6",
          "align": "center",
          "mono": true
        },
        {
          "t": "4.0",
          "align": "center",
          "mono": true
        },
        {
          "badge": "amber",
          "t": "Re-inspect"
        }
      ]
    ]
  },
  "defects": {
    "kind": "list",
    "search": "Search defect types…",
    "action": "New defect type",
    "filters": [
      "Severity"
    ],
    "columns": [
      {
        "label": "Defect"
      },
      {
        "label": "Category"
      },
      {
        "label": "Severity"
      },
      {
        "label": "Frequency",
        "align": "right"
      }
    ],
    "rows": [
      [
        {
          "t": "Broken stitch",
          "strong": true
        },
        "Stitching",
        {
          "badge": "red",
          "t": "Major"
        },
        {
          "t": "32%",
          "align": "right",
          "mono": true
        }
      ],
      [
        {
          "t": "Skipped stitch",
          "strong": true
        },
        "Stitching",
        {
          "badge": "amber",
          "t": "Minor"
        },
        {
          "t": "21%",
          "align": "right",
          "mono": true
        }
      ],
      [
        {
          "t": "Color shading",
          "strong": true
        },
        "Fabric",
        {
          "badge": "red",
          "t": "Major"
        },
        {
          "t": "14%",
          "align": "right",
          "mono": true
        }
      ],
      [
        {
          "t": "Loose button",
          "strong": true
        },
        "Trim",
        {
          "badge": "amber",
          "t": "Minor"
        },
        {
          "t": "9%",
          "align": "right",
          "mono": true
        }
      ]
    ]
  },
  "qscores": {
    "kind": "dashboard",
    "metrics": [
      {
        "label": "Pass rate",
        "value": "94.2%",
        "delta": "1.8%",
        "up": true,
        "sub": "last 30 days",
        "icon": "badge-check",
        "iconBg": "#EAF5EF",
        "iconColor": "#1F7A53"
      },
      {
        "label": "Defect rate",
        "value": "1.4%",
        "delta": "0.3%",
        "up": true,
        "sub": "AQL 2.5",
        "icon": "bug",
        "iconBg": "#FBF3E6",
        "iconColor": "#9C6B0E"
      },
      {
        "label": "Failed lots",
        "value": "3",
        "delta": "2",
        "up": false,
        "sub": "this week",
        "icon": "x-circle",
        "iconBg": "#FBECEA",
        "iconColor": "#C0392B"
      },
      {
        "label": "Inspections",
        "value": "212",
        "delta": "11.0%",
        "up": true,
        "sub": "this month",
        "icon": "clipboard-check",
        "iconBg": "#E7E9F0",
        "iconColor": "#3A4256"
      }
    ],
    "chartTitle": "First-pass yield",
    "chartSub": "Pass rate across all batches · 2026",
    "bars": [
      88,
      90,
      86,
      92,
      94,
      91,
      95,
      93,
      96,
      94,
      95,
      97
    ],
    "donutTitle": "Defects by type",
    "donutTotal": "212",
    "donut": [
      {
        "label": "Broken stitch",
        "value": "32%",
        "pct": 32,
        "color": "#262B3F"
      },
      {
        "label": "Skipped stitch",
        "value": "21%",
        "pct": 21,
        "color": "#5B6478"
      },
      {
        "label": "Color shading",
        "value": "14%",
        "pct": 14,
        "color": "#A9AEBC"
      },
      {
        "label": "Other",
        "value": "33%",
        "pct": 33,
        "color": "#F36523"
      }
    ],
    "tableTitle": "Quality by supplier",
    "tableCols": [
      {
        "l": "Supplier",
        "a": "left"
      },
      {
        "l": "Inspections",
        "a": "left"
      },
      {
        "l": "Pass rate",
        "a": "right"
      },
      {
        "l": "Defect rate",
        "a": "right"
      }
    ],
    "tableData": [
      [
        "Lahore Textile Co.",
        "64",
        "99.2%",
        "0.8%",
        "#2E9E6B"
      ],
      [
        "Porto Trims Ltd.",
        "38",
        "99.6%",
        "0.4%",
        "#2E9E6B"
      ],
      [
        "Anhui Knit Mills",
        "72",
        "98.4%",
        "1.6%",
        "#8A6D3B"
      ],
      [
        "Bursa Denim A.S.",
        "38",
        "96.9%",
        "3.1%",
        "#D9534F"
      ]
    ],
    "activity": [
      {
        "icon": "alert-triangle",
        "bg": "#FBECEA",
        "color": "#C0392B",
        "text": "QC-7739 failed · 11 defects on MO-3310",
        "time": "3 hrs ago"
      },
      {
        "icon": "check-circle-2",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "QC-7740 passed final AQL 2.5",
        "time": "5 hrs ago"
      }
    ]
  }
};
