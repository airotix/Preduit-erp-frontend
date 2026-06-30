import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the finance module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "coa": {
    "kind": "list",
    "search": "Search accounts…",
    "action": "New account",
    "filters": [
      "Type"
    ],
    "columns": [
      {
        "label": "Code"
      },
      {
        "label": "Account"
      },
      {
        "label": "Type"
      },
      {
        "label": "Balance",
        "align": "right"
      }
    ],
    "rows": [
      [
        {
          "t": "1000",
          "mono": true,
          "strong": true
        },
        "Cash & bank",
        {
          "badge": "navy",
          "t": "Asset"
        },
        {
          "t": "€1.84M",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "1100",
          "mono": true,
          "strong": true
        },
        "Accounts receivable",
        {
          "badge": "navy",
          "t": "Asset"
        },
        {
          "t": "€642K",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "1200",
          "mono": true,
          "strong": true
        },
        "Inventory",
        {
          "badge": "navy",
          "t": "Asset"
        },
        {
          "t": "€3.21M",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "2000",
          "mono": true,
          "strong": true
        },
        "Accounts payable",
        {
          "badge": "amber",
          "t": "Liability"
        },
        {
          "t": "€488K",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "2100",
          "mono": true,
          "strong": true
        },
        "Accrued payroll",
        {
          "badge": "amber",
          "t": "Liability"
        },
        {
          "t": "€84.2K",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "3000",
          "mono": true,
          "strong": true
        },
        "Share capital",
        {
          "badge": "accent",
          "t": "Equity"
        },
        {
          "t": "€2.50M",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "4000",
          "mono": true,
          "strong": true
        },
        "Sales revenue",
        {
          "badge": "green",
          "t": "Income"
        },
        {
          "t": "€4.82M",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "5000",
          "mono": true,
          "strong": true
        },
        "Cost of goods sold",
        {
          "badge": "red",
          "t": "Expense"
        },
        {
          "t": "€2.71M",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "6000",
          "mono": true,
          "strong": true
        },
        "Operating expenses",
        {
          "badge": "red",
          "t": "Expense"
        },
        {
          "t": "€984K",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ]
    ]
  },
  "journals": {
    "kind": "list",
    "search": "Search journal entries…",
    "action": "New entry",
    "filters": [
      "Source",
      "Status"
    ],
    "columns": [
      {
        "label": "Reference"
      },
      {
        "label": "Date"
      },
      {
        "label": "Memo"
      },
      {
        "label": "Debit",
        "align": "right"
      },
      {
        "label": "Credit",
        "align": "right"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "JE-4471",
          "mono": true,
          "strong": true
        },
        "27 Jun",
        "Revenue & COGS · SO-12353 shipped",
        {
          "t": "€416.00",
          "align": "right",
          "mono": true
        },
        {
          "t": "€416.00",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Posted"
        }
      ],
      [
        {
          "t": "JE-4470",
          "mono": true,
          "strong": true
        },
        "26 Jun",
        "Inventory & AP · GRN-3320 received",
        {
          "t": "€28,400",
          "align": "right",
          "mono": true
        },
        {
          "t": "€28,400",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Posted"
        }
      ],
      [
        {
          "t": "JE-4469",
          "mono": true,
          "strong": true
        },
        "25 Jun",
        "Customer payment · INV-8839",
        {
          "t": "€9,460",
          "align": "right",
          "mono": true
        },
        {
          "t": "€9,460",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Posted"
        }
      ],
      [
        {
          "t": "JE-4468",
          "mono": true,
          "strong": true
        },
        "24 Jun",
        "Payroll accrual · June",
        {
          "t": "€84,200",
          "align": "right",
          "mono": true
        },
        {
          "t": "€84,200",
          "align": "right",
          "mono": true
        },
        {
          "badge": "neutral",
          "t": "Draft"
        }
      ]
    ]
  },
  "payments": {
    "kind": "list",
    "search": "Search payments…",
    "action": "Record payment",
    "filters": [
      "Type",
      "Status"
    ],
    "columns": [
      {
        "label": "Payment"
      },
      {
        "label": "Date"
      },
      {
        "label": "Party"
      },
      {
        "label": "Allocated to"
      },
      {
        "label": "Amount",
        "align": "right"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "PMT-2231",
          "mono": true,
          "strong": true
        },
        "25 Jun",
        {
          "t": "Boutique Atlas",
          "avatar": true,
          "sub": "Receipt"
        },
        "INV-8839",
        {
          "t": "€9,460",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Cleared"
        }
      ],
      [
        {
          "t": "PMT-2230",
          "mono": true,
          "strong": true
        },
        "24 Jun",
        {
          "t": "Lahore Textile Co.",
          "avatar": true,
          "sub": "Disbursement"
        },
        "BILL-1182",
        {
          "t": "−€28,400",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Cleared"
        }
      ],
      [
        {
          "t": "PMT-2229",
          "mono": true,
          "strong": true
        },
        "23 Jun",
        {
          "t": "Maison Lyon",
          "avatar": true,
          "sub": "Receipt"
        },
        "INV-8841",
        {
          "t": "€2,400",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "amber",
          "t": "Pending"
        }
      ]
    ]
  },
  "araging": {
    "kind": "list",
    "search": "Search customers…",
    "action": "Send reminders",
    "filters": [
      "Region"
    ],
    "columns": [
      {
        "label": "Customer"
      },
      {
        "label": "Current",
        "align": "right"
      },
      {
        "label": "1–30",
        "align": "right"
      },
      {
        "label": "31–60",
        "align": "right"
      },
      {
        "label": "61–90",
        "align": "right"
      },
      {
        "label": "90+",
        "align": "right"
      },
      {
        "label": "Total",
        "align": "right"
      }
    ],
    "rows": [
      [
        {
          "t": "Maison Lyon",
          "avatar": true,
          "sub": "France"
        },
        {
          "t": "€2,420",
          "align": "right",
          "mono": true
        },
        {
          "t": "€2,400",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€4,820",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Nordic Retail Group",
          "avatar": true,
          "sub": "Sweden"
        },
        {
          "t": "€18,240",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€18,240",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Studio Norte",
          "avatar": true,
          "sub": "Portugal"
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€11,900",
          "align": "right",
          "mono": true,
          "color": "#C0392B"
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€11,900",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Boutique Atlas",
          "avatar": true,
          "sub": "Spain"
        },
        {
          "t": "€4,200",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€4,200",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ]
    ]
  },
  "apaging": {
    "kind": "list",
    "search": "Search suppliers…",
    "action": "Schedule run",
    "filters": [
      "Region"
    ],
    "columns": [
      {
        "label": "Supplier"
      },
      {
        "label": "Current",
        "align": "right"
      },
      {
        "label": "1–30",
        "align": "right"
      },
      {
        "label": "31–60",
        "align": "right"
      },
      {
        "label": "61–90",
        "align": "right"
      },
      {
        "label": "90+",
        "align": "right"
      },
      {
        "label": "Total",
        "align": "right"
      }
    ],
    "rows": [
      [
        {
          "t": "Anhui Knit Mills",
          "avatar": true,
          "sub": "China"
        },
        {
          "t": "€42,800",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€42,800",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Lahore Textile Co.",
          "avatar": true,
          "sub": "Pakistan"
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€28,400",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€28,400",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Bursa Denim A.S.",
          "avatar": true,
          "sub": "Turkey"
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€61,200",
          "align": "right",
          "mono": true,
          "color": "#C0392B"
        },
        {
          "t": "€0",
          "align": "right",
          "mono": true
        },
        {
          "t": "€61,200",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ]
    ]
  },
  "finreports": {
    "kind": "dashboard",
    "metrics": [
      {
        "label": "Gross profit",
        "value": "€2.11M",
        "delta": "6.4%",
        "up": true,
        "sub": "43.8% margin",
        "icon": "trending-up",
        "iconBg": "#EAF5EF",
        "iconColor": "#1F7A53"
      },
      {
        "label": "Operating income",
        "value": "€1.13M",
        "delta": "3.2%",
        "up": true,
        "sub": "23.4% margin",
        "icon": "bar-chart-3",
        "iconBg": "#E7E9F0",
        "iconColor": "#3A4256"
      },
      {
        "label": "Total assets",
        "value": "€7.69M",
        "delta": "5.1%",
        "up": true,
        "sub": "balance sheet",
        "icon": "layers",
        "iconBg": "#FCEADF",
        "iconColor": "#C2511A"
      },
      {
        "label": "Total liabilities",
        "value": "€2.69M",
        "delta": "1.4%",
        "up": false,
        "sub": "equity €5.00M",
        "icon": "scale",
        "iconBg": "#FBF3E6",
        "iconColor": "#9C6B0E"
      }
    ],
    "chartTitle": "Profit & loss",
    "chartSub": "Net income trend · 2026",
    "bars": [
      40,
      48,
      60,
      44,
      64,
      78,
      54,
      84,
      62,
      72,
      80,
      96
    ],
    "donutTitle": "Balance sheet",
    "donutTotal": "€7.69M",
    "donut": [
      {
        "label": "Inventory",
        "value": "42%",
        "pct": 42,
        "color": "#262B3F"
      },
      {
        "label": "Cash",
        "value": "24%",
        "pct": 24,
        "color": "#5B6478"
      },
      {
        "label": "Receivables",
        "value": "20%",
        "pct": 20,
        "color": "#A9AEBC"
      },
      {
        "label": "Fixed assets",
        "value": "14%",
        "pct": 14,
        "color": "#F36523"
      }
    ],
    "tableTitle": "P&L summary",
    "tableCols": [
      {
        "l": "Line",
        "a": "left"
      },
      {
        "l": "Account",
        "a": "left"
      },
      {
        "l": "YTD",
        "a": "right"
      },
      {
        "l": "Margin",
        "a": "right"
      }
    ],
    "tableData": [
      [
        "Sales revenue",
        "4000",
        "€4.82M",
        "100%",
        "#262B3F"
      ],
      [
        "Cost of goods sold",
        "5000",
        "−€2.71M",
        "56.2%",
        "#D9534F"
      ],
      [
        "Gross profit",
        "—",
        "€2.11M",
        "43.8%",
        "#2E9E6B"
      ],
      [
        "Operating expenses",
        "6000",
        "−€0.98M",
        "20.4%",
        "#8A6D3B"
      ],
      [
        "Net income",
        "—",
        "€1.13M",
        "23.4%",
        "#262B3F"
      ]
    ],
    "activity": [
      {
        "icon": "file-text",
        "bg": "#E7E9F0",
        "color": "#3A4256",
        "text": "Q2 P&L finalized by Finance",
        "time": "2 hrs ago"
      },
      {
        "icon": "check-circle-2",
        "bg": "#EAF5EF",
        "color": "#1F7A53",
        "text": "Balance sheet reconciled · June",
        "time": "Yesterday"
      }
    ]
  }
};
