import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the procurement module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "pos": {
    "kind": "list",
    "search": "Search purchase orders…",
    "action": "New PO",
    "filters": [
      "Supplier",
      "Status"
    ],
    "total": 312,
    "columns": [
      {
        "label": "PO"
      },
      {
        "label": "Supplier"
      },
      {
        "label": "Items",
        "align": "center"
      },
      {
        "label": "Total",
        "align": "right"
      },
      {
        "label": "Expected"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "PO-5582",
          "strong": true,
          "mono": true
        },
        {
          "t": "Anhui Knit Mills",
          "avatar": true,
          "sub": "CN"
        },
        {
          "t": "6",
          "align": "center",
          "mono": true
        },
        {
          "t": "€42,800",
          "align": "right",
          "mono": true,
          "strong": true
        },
        "18 Jul",
        {
          "badge": "amber",
          "t": "Pending approval"
        }
      ],
      [
        {
          "t": "PO-5581",
          "strong": true,
          "mono": true
        },
        {
          "t": "Lahore Textile Co.",
          "avatar": true,
          "sub": "PK"
        },
        {
          "t": "12",
          "align": "center",
          "mono": true
        },
        {
          "t": "€28,400",
          "align": "right",
          "mono": true,
          "strong": true
        },
        "02 Jul",
        {
          "badge": "green",
          "t": "Confirmed"
        }
      ],
      [
        {
          "t": "PO-5580",
          "strong": true,
          "mono": true
        },
        {
          "t": "Porto Trims Ltd.",
          "avatar": true,
          "sub": "PT"
        },
        {
          "t": "4",
          "align": "center",
          "mono": true
        },
        {
          "t": "€8,900",
          "align": "right",
          "mono": true,
          "strong": true
        },
        "28 Jun",
        {
          "badge": "navy",
          "t": "Received"
        }
      ],
      [
        {
          "t": "PO-5579",
          "strong": true,
          "mono": true
        },
        {
          "t": "Bursa Denim A.S.",
          "avatar": true,
          "sub": "TR"
        },
        {
          "t": "8",
          "align": "center",
          "mono": true
        },
        {
          "t": "€61,200",
          "align": "right",
          "mono": true,
          "strong": true
        },
        "20 Jul",
        {
          "badge": "neutral",
          "t": "Draft"
        }
      ]
    ]
  },
  "approvals": {
    "kind": "board",
    "columns": [
      {
        "title": "Awaiting approval",
        "accent": "#D29A22",
        "count": 3,
        "cards": [
          {
            "ref": "PO-5582",
            "title": "Anhui Knit Mills",
            "sub": "6 lines · Merino yarn",
            "meta": "€42,800",
            "metaIcon": "banknote",
            "av": "OF",
            "tone": "amber",
            "approvable": true,
            "tag": "Approval"
          },
          {
            "ref": "PO-5584",
            "title": "Bursa Denim A.S.",
            "sub": "8 lines · Denim 12oz",
            "meta": "€61,200",
            "metaIcon": "banknote",
            "av": "OF",
            "tone": "amber",
            "approvable": true,
            "tag": "Approval"
          },
          {
            "ref": "TRF-2042",
            "title": "Transfer · Lahore → Dubai",
            "sub": "1,800 units",
            "meta": "€0",
            "metaIcon": "arrow-left-right",
            "av": "SM",
            "tone": "amber",
            "approvable": true,
            "tag": "Approval"
          }
        ]
      },
      {
        "title": "Approved",
        "accent": "#2E9E6B",
        "count": 2,
        "cards": [
          {
            "ref": "PO-5581",
            "title": "Lahore Textile Co.",
            "sub": "12 lines · Shirting",
            "meta": "€28,400",
            "metaIcon": "banknote",
            "av": "AK",
            "tone": "green"
          },
          {
            "ref": "PO-5580",
            "title": "Porto Trims Ltd.",
            "sub": "4 lines · Corozo buttons",
            "meta": "€8,900",
            "metaIcon": "banknote",
            "av": "AK",
            "tone": "green"
          }
        ]
      },
      {
        "title": "Rejected",
        "accent": "#D9534F",
        "count": 1,
        "cards": [
          {
            "ref": "PO-5578",
            "title": "Vendor X Trims",
            "sub": "Over budget threshold",
            "meta": "€19,400",
            "metaIcon": "banknote",
            "av": "AK",
            "tone": "red"
          }
        ]
      }
    ]
  },
  "receipts": {
    "kind": "list",
    "search": "Search goods receipts…",
    "action": "Receive against PO",
    "filters": [
      "Supplier",
      "Status"
    ],
    "columns": [
      {
        "label": "GRN"
      },
      {
        "label": "PO"
      },
      {
        "label": "Supplier"
      },
      {
        "label": "Lines",
        "align": "center"
      },
      {
        "label": "Received"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "GRN-3320",
          "mono": true,
          "strong": true
        },
        "PO-5581",
        {
          "t": "Lahore Textile Co.",
          "avatar": true,
          "sub": "PK"
        },
        {
          "t": "12",
          "align": "center",
          "mono": true
        },
        {
          "t": "12 / 12",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Complete"
        }
      ],
      [
        {
          "t": "GRN-3319",
          "mono": true,
          "strong": true
        },
        "PO-5582",
        {
          "t": "Anhui Knit Mills",
          "avatar": true,
          "sub": "CN"
        },
        {
          "t": "6",
          "align": "center",
          "mono": true
        },
        {
          "t": "4 / 6",
          "mono": true
        },
        {
          "badge": "amber",
          "t": "Partial"
        }
      ],
      [
        {
          "t": "GRN-3318",
          "mono": true,
          "strong": true
        },
        "PO-5580",
        {
          "t": "Porto Trims Ltd.",
          "avatar": true,
          "sub": "PT"
        },
        {
          "t": "4",
          "align": "center",
          "mono": true
        },
        {
          "t": "0 / 4",
          "mono": true
        },
        {
          "badge": "neutral",
          "t": "Expected"
        }
      ]
    ]
  },
  "suppliers": {
    "kind": "list",
    "search": "Search suppliers…",
    "action": "New supplier",
    "filters": [
      "Region",
      "Rating"
    ],
    "columns": [
      {
        "label": "Supplier"
      },
      {
        "label": "Region"
      },
      {
        "label": "Lead time"
      },
      {
        "label": "On-time",
        "align": "right"
      },
      {
        "label": "Score",
        "align": "right"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "Anhui Knit Mills",
          "avatar": true,
          "sub": "Knitwear · Yarn"
        },
        "China",
        "45 days",
        {
          "t": "94%",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.6",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Preferred"
        }
      ],
      [
        {
          "t": "Lahore Textile Co.",
          "avatar": true,
          "sub": "Woven · Shirting"
        },
        "Pakistan",
        "21 days",
        {
          "t": "97%",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.8",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Preferred"
        }
      ],
      [
        {
          "t": "Bursa Denim A.S.",
          "avatar": true,
          "sub": "Denim"
        },
        "Turkey",
        "38 days",
        {
          "t": "88%",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.1",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "amber",
          "t": "On watch"
        }
      ],
      [
        {
          "t": "Porto Trims Ltd.",
          "avatar": true,
          "sub": "Trims · Hardware"
        },
        "Portugal",
        "14 days",
        {
          "t": "99%",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.9",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Preferred"
        }
      ]
    ]
  },
  "scorecard": {
    "kind": "list",
    "search": "Search suppliers…",
    "action": "Export",
    "filters": [
      "Region"
    ],
    "columns": [
      {
        "label": "Supplier"
      },
      {
        "label": "On-time",
        "align": "right"
      },
      {
        "label": "Defect rate",
        "align": "right"
      },
      {
        "label": "Price rating",
        "align": "right"
      },
      {
        "label": "Score",
        "align": "right"
      },
      {
        "label": "Rating"
      }
    ],
    "rows": [
      [
        {
          "t": "Lahore Textile Co.",
          "avatar": true,
          "sub": "Woven · Shirting"
        },
        {
          "t": "97%",
          "align": "right",
          "mono": true
        },
        {
          "t": "0.8%",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.8",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.8",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Preferred"
        }
      ],
      [
        {
          "t": "Porto Trims Ltd.",
          "avatar": true,
          "sub": "Trims"
        },
        {
          "t": "99%",
          "align": "right",
          "mono": true
        },
        {
          "t": "0.4%",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.7",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.9",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Preferred"
        }
      ],
      [
        {
          "t": "Anhui Knit Mills",
          "avatar": true,
          "sub": "Knitwear"
        },
        {
          "t": "94%",
          "align": "right",
          "mono": true
        },
        {
          "t": "1.6%",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.3",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.6",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Preferred"
        }
      ],
      [
        {
          "t": "Bursa Denim A.S.",
          "avatar": true,
          "sub": "Denim"
        },
        {
          "t": "88%",
          "align": "right",
          "mono": true,
          "color": "#C0392B"
        },
        {
          "t": "3.1%",
          "align": "right",
          "mono": true,
          "color": "#C0392B"
        },
        {
          "t": "3.9",
          "align": "right",
          "mono": true
        },
        {
          "t": "4.1",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "amber",
          "t": "On watch"
        }
      ]
    ]
  }
};
