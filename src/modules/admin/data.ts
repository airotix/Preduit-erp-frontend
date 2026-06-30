import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the admin module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "users": {
    "kind": "list",
    "search": "Search users…",
    "action": "Invite user",
    "filters": [
      "Role",
      "Status"
    ],
    "columns": [
      {
        "label": "User"
      },
      {
        "label": "Role"
      },
      {
        "label": "Department"
      },
      {
        "label": "Last active"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "Ayesha Khan",
          "avatar": true,
          "sub": "ayesha.k@systemsapparel.com"
        },
        {
          "badge": "accent",
          "t": "Administrator"
        },
        "Operations",
        "2 min ago",
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Daniel Roth",
          "avatar": true,
          "sub": "daniel.r@systemsapparel.com"
        },
        {
          "badge": "navy",
          "t": "Merchandiser"
        },
        "Catalog",
        "1 hr ago",
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Sofia Marino",
          "avatar": true,
          "sub": "sofia.m@systemsapparel.com"
        },
        {
          "badge": "navy",
          "t": "Warehouse Lead"
        },
        "Inventory",
        "Yesterday",
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Omar Farooq",
          "avatar": true,
          "sub": "omar.f@systemsapparel.com"
        },
        {
          "badge": "neutral",
          "t": "Buyer"
        },
        "Procurement",
        "3 days ago",
        {
          "badge": "amber",
          "t": "Invited"
        }
      ]
    ]
  },
  "roles": {
    "kind": "list",
    "search": "Search roles…",
    "action": "New role",
    "filters": [],
    "columns": [
      {
        "label": "Role"
      },
      {
        "label": "Users",
        "align": "center"
      },
      {
        "label": "Scope"
      },
      {
        "label": "Updated"
      }
    ],
    "rows": [
      [
        {
          "t": "Administrator",
          "strong": true
        },
        {
          "t": "3",
          "align": "center",
          "mono": true
        },
        "Full access",
        "12 Jun"
      ],
      [
        {
          "t": "Merchandiser",
          "strong": true
        },
        {
          "t": "8",
          "align": "center",
          "mono": true
        },
        "Catalog, Sales",
        "08 Jun"
      ],
      [
        {
          "t": "Warehouse Lead",
          "strong": true
        },
        {
          "t": "6",
          "align": "center",
          "mono": true
        },
        "Inventory, Shipments",
        "01 Jun"
      ],
      [
        {
          "t": "Buyer",
          "strong": true
        },
        {
          "t": "4",
          "align": "center",
          "mono": true
        },
        "Procurement",
        "28 May"
      ]
    ]
  },
  "approvalrules": {
    "kind": "list",
    "search": "Search rules…",
    "action": "New rule",
    "filters": [
      "Module"
    ],
    "columns": [
      {
        "label": "Rule"
      },
      {
        "label": "Condition"
      },
      {
        "label": "Approver"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "High-value PO",
          "strong": true
        },
        "PO total over €5,000",
        "Finance Manager",
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "New supplier onboarding",
          "strong": true
        },
        "Supplier not yet approved",
        "Procurement Lead",
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Stock write-off",
          "strong": true
        },
        "Adjustment over €1,000",
        "Operations Director",
        {
          "badge": "green",
          "t": "Active"
        }
      ],
      [
        {
          "t": "Price override",
          "strong": true
        },
        "Discount over 20%",
        "Sales Manager",
        {
          "badge": "neutral",
          "t": "Draft"
        }
      ]
    ]
  },
  "notifsettings": {
    "kind": "settings",
    "groups": [
      {
        "title": "Channels",
        "items": [
          {
            "label": "Email notifications",
            "sub": "Daily digest and critical alerts",
            "enabled": true
          },
          {
            "label": "In-app notifications",
            "sub": "Bell badge and toast messages",
            "enabled": true
          },
          {
            "label": "SMS alerts",
            "sub": "Critical stockouts only",
            "enabled": false
          }
        ]
      },
      {
        "title": "Events",
        "items": [
          {
            "label": "Low stock & reorder",
            "sub": "When availability drops below the reorder point",
            "enabled": true
          },
          {
            "label": "Order status changes",
            "sub": "Picking, packed, shipped, delivered",
            "enabled": true
          },
          {
            "label": "Approval requests",
            "sub": "POs and transfers awaiting your approval",
            "enabled": true
          },
          {
            "label": "Sync errors",
            "sub": "Channel sync failures",
            "enabled": false
          }
        ]
      }
    ]
  },
  "doclibrary": {
    "kind": "list",
    "search": "Search documents…",
    "action": "Upload",
    "filters": [
      "Type",
      "Owner"
    ],
    "columns": [
      {
        "label": "Document"
      },
      {
        "label": "Type"
      },
      {
        "label": "Owner"
      },
      {
        "label": "Updated"
      },
      {
        "label": "Size",
        "align": "right"
      }
    ],
    "rows": [
      [
        {
          "t": "Supplier agreement · Anhui",
          "avatar": true,
          "sub": "PDF"
        },
        {
          "badge": "navy",
          "t": "Contract"
        },
        "Omar Farooq",
        "12 Jun",
        {
          "t": "1.2 MB",
          "align": "right",
          "mono": true
        }
      ],
      [
        {
          "t": "Fall '26 tech pack · Field Jacket",
          "avatar": true,
          "sub": "PDF"
        },
        {
          "badge": "accent",
          "t": "Tech pack"
        },
        "Daniel Roth",
        "08 Jun",
        {
          "t": "4.8 MB",
          "align": "right",
          "mono": true
        }
      ],
      [
        {
          "t": "AQL inspection SOP",
          "avatar": true,
          "sub": "DOCX"
        },
        {
          "badge": "neutral",
          "t": "Policy"
        },
        "Sofia Marino",
        "01 Jun",
        {
          "t": "320 KB",
          "align": "right",
          "mono": true
        }
      ],
      [
        {
          "t": "Customs declaration · SHP-9910",
          "avatar": true,
          "sub": "PDF"
        },
        {
          "badge": "navy",
          "t": "Shipping"
        },
        "System",
        "04 Jul",
        {
          "t": "210 KB",
          "align": "right",
          "mono": true
        }
      ]
    ]
  },
  "syssettings": {
    "kind": "settings",
    "groups": [
      {
        "title": "Localization",
        "items": [
          {
            "label": "Multi-currency",
            "sub": "Display prices in customer currency",
            "enabled": true
          },
          {
            "label": "Automatic tax",
            "sub": "Calculate VAT by region",
            "enabled": true
          }
        ]
      },
      {
        "title": "Operations",
        "items": [
          {
            "label": "Auto-allocate stock",
            "sub": "Reserve inventory on order confirmation",
            "enabled": true
          },
          {
            "label": "Backorders",
            "sub": "Allow orders beyond available stock",
            "enabled": false
          },
          {
            "label": "Barcode scanning",
            "sub": "Enable warehouse scan-to-pick",
            "enabled": true
          }
        ]
      },
      {
        "title": "Security",
        "items": [
          {
            "label": "Two-factor authentication",
            "sub": "Require 2FA for all users",
            "enabled": true
          },
          {
            "label": "Session timeout",
            "sub": "Auto sign-out after 30 minutes idle",
            "enabled": true
          }
        ]
      }
    ]
  },
  "audit": {
    "kind": "list",
    "search": "Search audit log…",
    "action": "Export",
    "filters": [
      "User",
      "Entity",
      "Date"
    ],
    "columns": [
      {
        "label": "Time"
      },
      {
        "label": "User"
      },
      {
        "label": "Action"
      },
      {
        "label": "Entity"
      },
      {
        "label": "IP"
      }
    ],
    "rows": [
      [
        {
          "t": "14:41",
          "mono": true
        },
        "Ayesha Khan",
        {
          "badge": "green",
          "t": "Approved"
        },
        "PO-5582",
        {
          "t": "203.0.113.4",
          "mono": true
        }
      ],
      [
        {
          "t": "14:30",
          "mono": true
        },
        "Daniel Roth",
        {
          "badge": "navy",
          "t": "Updated"
        },
        "APP-KNT-0142",
        {
          "t": "203.0.113.9",
          "mono": true
        }
      ],
      [
        {
          "t": "13:55",
          "mono": true
        },
        "Sofia Marino",
        {
          "badge": "accent",
          "t": "Created"
        },
        "TRF-2041",
        {
          "t": "198.51.100.2",
          "mono": true
        }
      ],
      [
        {
          "t": "13:10",
          "mono": true
        },
        "System",
        {
          "badge": "red",
          "t": "Failed login"
        },
        "omar.f@…",
        {
          "t": "198.51.100.7",
          "mono": true
        }
      ]
    ]
  }
};
