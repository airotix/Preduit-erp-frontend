import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the inventory module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "stock": {
    "kind": "list",
    "search": "Search variant, SKU…",
    "action": "Stock receipt",
    "filters": [
      "Location",
      "Category",
      "Status"
    ],
    "total": 1842,
    "columns": [
      {
        "label": "Variant"
      },
      {
        "label": "Location"
      },
      {
        "label": "On hand",
        "align": "right"
      },
      {
        "label": "Reserved",
        "align": "right"
      },
      {
        "label": "Available",
        "align": "right"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "Merino Crew · Navy · M",
          "avatar": true,
          "sub": "APP-KNT-0142-NVY-M"
        },
        "Lahore DC",
        {
          "t": "420",
          "align": "right",
          "mono": true
        },
        {
          "t": "58",
          "align": "right",
          "mono": true
        },
        {
          "t": "362",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Healthy"
        }
      ],
      [
        {
          "t": "Tailored Chino · Stone · 32",
          "avatar": true,
          "sub": "APP-BTM-0098-STN-32"
        },
        "Lahore DC",
        {
          "t": "96",
          "align": "right",
          "mono": true
        },
        {
          "t": "58",
          "align": "right",
          "mono": true
        },
        {
          "t": "38",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "amber",
          "t": "Low"
        }
      ],
      [
        {
          "t": "Oxford Shirt · White · L",
          "avatar": true,
          "sub": "APP-SHT-0211-WHT-L"
        },
        "Dubai DC",
        {
          "t": "610",
          "align": "right",
          "mono": true
        },
        {
          "t": "42",
          "align": "right",
          "mono": true
        },
        {
          "t": "568",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Healthy"
        }
      ],
      [
        {
          "t": "Field Jacket · Olive · L",
          "avatar": true,
          "sub": "APP-OUT-0067-OLV-L"
        },
        "Lahore DC",
        {
          "t": "24",
          "align": "right",
          "mono": true
        },
        {
          "t": "12",
          "align": "right",
          "mono": true
        },
        {
          "t": "12",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "red",
          "t": "Critical"
        }
      ],
      [
        {
          "t": "Denim Jean · Indigo · 34",
          "avatar": true,
          "sub": "APP-BTM-0151-IND-34"
        },
        "Karachi DC",
        {
          "t": "340",
          "align": "right",
          "mono": true
        },
        {
          "t": "30",
          "align": "right",
          "mono": true
        },
        {
          "t": "310",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Healthy"
        }
      ],
      [
        {
          "t": "Wool Overcoat · Charcoal · M",
          "avatar": true,
          "sub": "APP-OUT-0090-CHR-M"
        },
        "Lahore DC",
        {
          "t": "0",
          "align": "right",
          "mono": true
        },
        {
          "t": "0",
          "align": "right",
          "mono": true
        },
        {
          "t": "0",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "red",
          "t": "Out"
        }
      ],
      [
        {
          "t": "Cashmere Scarf · Camel",
          "avatar": true,
          "sub": "APP-ACC-0034-CML"
        },
        "Dubai DC",
        {
          "t": "188",
          "align": "right",
          "mono": true
        },
        {
          "t": "20",
          "align": "right",
          "mono": true
        },
        {
          "t": "168",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Healthy"
        }
      ]
    ]
  },
  "locations": {
    "kind": "list",
    "search": "Search locations…",
    "action": "New location",
    "filters": [
      "Type"
    ],
    "columns": [
      {
        "label": "Location"
      },
      {
        "label": "Type"
      },
      {
        "label": "Region"
      },
      {
        "label": "SKUs",
        "align": "right"
      },
      {
        "label": "Utilization",
        "align": "right"
      }
    ],
    "rows": [
      [
        {
          "t": "Lahore Distribution Center",
          "avatar": true,
          "sub": "WH-LHE-01"
        },
        {
          "badge": "navy",
          "t": "Warehouse"
        },
        "Pakistan",
        {
          "t": "1,240",
          "align": "right",
          "mono": true
        },
        {
          "t": "78%",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Karachi Distribution Center",
          "avatar": true,
          "sub": "WH-KHI-02"
        },
        {
          "badge": "navy",
          "t": "Warehouse"
        },
        "Pakistan",
        {
          "t": "880",
          "align": "right",
          "mono": true
        },
        {
          "t": "61%",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Dubai Fulfillment",
          "avatar": true,
          "sub": "WH-DXB-01"
        },
        {
          "badge": "navy",
          "t": "Warehouse"
        },
        "UAE",
        {
          "t": "1,020",
          "align": "right",
          "mono": true
        },
        {
          "t": "84%",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Flagship Store · Mall of Emirates",
          "avatar": true,
          "sub": "ST-DXB-09"
        },
        {
          "badge": "accent",
          "t": "Retail"
        },
        "UAE",
        {
          "t": "420",
          "align": "right",
          "mono": true
        },
        {
          "t": "52%",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ]
    ]
  },
  "transfers": {
    "kind": "list",
    "search": "Search transfers…",
    "action": "New transfer",
    "filters": [
      "Status",
      "Location"
    ],
    "columns": [
      {
        "label": "Transfer"
      },
      {
        "label": "From"
      },
      {
        "label": "To"
      },
      {
        "label": "Units",
        "align": "right"
      },
      {
        "label": "Status"
      },
      {
        "label": "ETA"
      }
    ],
    "rows": [
      [
        {
          "t": "TRF-2041",
          "strong": true,
          "mono": true
        },
        "Lahore DC",
        "Dubai DC",
        {
          "t": "1,200",
          "align": "right",
          "mono": true
        },
        {
          "badge": "amber",
          "t": "In transit"
        },
        "02 Jul"
      ],
      [
        {
          "t": "TRF-2040",
          "strong": true,
          "mono": true
        },
        "Karachi DC",
        "Lahore DC",
        {
          "t": "640",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Received"
        },
        "24 Jun"
      ],
      [
        {
          "t": "TRF-2039",
          "strong": true,
          "mono": true
        },
        "Dubai DC",
        "Flagship Store",
        {
          "t": "180",
          "align": "right",
          "mono": true
        },
        {
          "badge": "neutral",
          "t": "Draft"
        },
        "—"
      ]
    ]
  },
  "alerts": {
    "kind": "list",
    "search": "Search alerts…",
    "action": "Create PO",
    "filters": [
      "Severity",
      "Category"
    ],
    "columns": [
      {
        "label": "Variant"
      },
      {
        "label": "Available",
        "align": "right"
      },
      {
        "label": "Reorder pt",
        "align": "right"
      },
      {
        "label": "Suggested",
        "align": "right"
      },
      {
        "label": "Severity"
      }
    ],
    "rows": [
      [
        {
          "t": "Wool Overcoat · Charcoal · M",
          "avatar": true,
          "sub": "APP-OUT-0090-CHR-M"
        },
        {
          "t": "0",
          "align": "right",
          "mono": true,
          "color": "#C0392B"
        },
        {
          "t": "40",
          "align": "right",
          "mono": true
        },
        {
          "t": "200",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "red",
          "t": "Critical"
        }
      ],
      [
        {
          "t": "Field Jacket · Olive · L",
          "avatar": true,
          "sub": "APP-OUT-0067-OLV-L"
        },
        {
          "t": "12",
          "align": "right",
          "mono": true
        },
        {
          "t": "50",
          "align": "right",
          "mono": true
        },
        {
          "t": "150",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "red",
          "t": "Critical"
        }
      ],
      [
        {
          "t": "Tailored Chino · Stone · 32",
          "avatar": true,
          "sub": "APP-BTM-0098-STN-32"
        },
        {
          "t": "38",
          "align": "right",
          "mono": true
        },
        {
          "t": "60",
          "align": "right",
          "mono": true
        },
        {
          "t": "120",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "amber",
          "t": "Warning"
        }
      ],
      [
        {
          "t": "Merino Crew · Navy · S",
          "avatar": true,
          "sub": "APP-KNT-0142-NVY-S"
        },
        {
          "t": "44",
          "align": "right",
          "mono": true
        },
        {
          "t": "50",
          "align": "right",
          "mono": true
        },
        {
          "t": "100",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "amber",
          "t": "Warning"
        }
      ]
    ]
  }
};
