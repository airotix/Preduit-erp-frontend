import type { ScreenConfig } from "@/lib/screen-types";

/** In-memory mock store for the sales module — ported from the Apparel ERP design. */
export const screens: Record<string, ScreenConfig> = {
  "orders": {
    "kind": "list",
    "search": "Search orders, customer…",
    "action": "New order",
    "filters": [
      "Channel",
      "Status",
      "Date"
    ],
    "total": 1284,
    "columns": [
      {
        "label": "Order"
      },
      {
        "label": "Customer"
      },
      {
        "label": "Channel"
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
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "#SO-12354",
          "strong": true,
          "mono": true
        },
        {
          "t": "Maison Lyon",
          "avatar": true,
          "sub": "Wholesale"
        },
        {
          "badge": "navy",
          "t": "Wholesale"
        },
        {
          "t": "12",
          "align": "center",
          "mono": true
        },
        {
          "t": "€4,820",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "navy",
          "t": "Packed"
        }
      ],
      [
        {
          "t": "#SO-12353",
          "strong": true,
          "mono": true
        },
        {
          "t": "Hugo Bernard",
          "avatar": true,
          "sub": "Online"
        },
        {
          "badge": "accent",
          "t": "Online"
        },
        {
          "t": "3",
          "align": "center",
          "mono": true
        },
        {
          "t": "€287",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Shipped"
        }
      ],
      [
        {
          "t": "#SO-12352",
          "strong": true,
          "mono": true
        },
        {
          "t": "Nordic Retail Group",
          "avatar": true,
          "sub": "Wholesale"
        },
        {
          "badge": "navy",
          "t": "Wholesale"
        },
        {
          "t": "46",
          "align": "center",
          "mono": true
        },
        {
          "t": "€18,240",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "neutral",
          "t": "New"
        }
      ],
      [
        {
          "t": "#SO-12351",
          "strong": true,
          "mono": true
        },
        {
          "t": "Amelia Chen",
          "avatar": true,
          "sub": "Marketplace"
        },
        {
          "badge": "neutral",
          "t": "Amazon"
        },
        {
          "t": "2",
          "align": "center",
          "mono": true
        },
        {
          "t": "€158",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Delivered"
        }
      ],
      [
        {
          "t": "#SO-12350",
          "strong": true,
          "mono": true
        },
        {
          "t": "Boutique Atlas",
          "avatar": true,
          "sub": "Wholesale"
        },
        {
          "badge": "navy",
          "t": "Wholesale"
        },
        {
          "t": "28",
          "align": "center",
          "mono": true
        },
        {
          "t": "€9,460",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "amber",
          "t": "Packed"
        }
      ],
      [
        {
          "t": "#SO-12349",
          "strong": true,
          "mono": true
        },
        {
          "t": "Liam O’Connor",
          "avatar": true,
          "sub": "Online"
        },
        {
          "badge": "accent",
          "t": "Online"
        },
        {
          "t": "5",
          "align": "center",
          "mono": true
        },
        {
          "t": "€512",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "red",
          "t": "On hold"
        }
      ],
      [
        {
          "t": "#SO-12348",
          "strong": true,
          "mono": true
        },
        {
          "t": "Studio Norte",
          "avatar": true,
          "sub": "Wholesale"
        },
        {
          "badge": "navy",
          "t": "Wholesale"
        },
        {
          "t": "34",
          "align": "center",
          "mono": true
        },
        {
          "t": "€11,900",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Shipped"
        }
      ]
    ]
  },
  "board": {
    "kind": "board",
    "columns": [
      {
        "title": "New",
        "accent": "#9499A6",
        "count": 2,
        "cards": [
          {
            "ref": "#SO-12352",
            "title": "Nordic Retail Group",
            "sub": "46 items · Wholesale",
            "meta": "€18,240",
            "metaIcon": "package",
            "av": "NR",
            "tone": "neutral"
          },
          {
            "ref": "#SO-12349",
            "title": "Liam O’Connor",
            "sub": "5 items · Online",
            "meta": "€512",
            "metaIcon": "package",
            "av": "LO",
            "tone": "neutral"
          }
        ]
      },
      {
        "title": "Packed",
        "accent": "#3A4256",
        "count": 1,
        "cards": [
          {
            "ref": "#SO-12350",
            "title": "Boutique Atlas",
            "sub": "28 items · Wholesale",
            "meta": "€9,460",
            "metaIcon": "package",
            "av": "BA",
            "tone": "navy"
          }
        ]
      },
      {
        "title": "Shipped",
        "accent": "#2E9E6B",
        "count": 2,
        "cards": [
          {
            "ref": "#SO-12353",
            "title": "Hugo Bernard",
            "sub": "3 items · Online",
            "meta": "€287",
            "metaIcon": "truck",
            "av": "HB",
            "tone": "green"
          },
          {
            "ref": "#SO-12348",
            "title": "Studio Norte",
            "sub": "34 items · Wholesale",
            "meta": "€11,900",
            "metaIcon": "truck",
            "av": "SN",
            "tone": "green"
          }
        ]
      }
    ]
  },
  "invoices": {
    "kind": "list",
    "search": "Search invoices…",
    "action": "New invoice",
    "filters": [
      "Status",
      "Customer"
    ],
    "columns": [
      {
        "label": "Invoice"
      },
      {
        "label": "Customer"
      },
      {
        "label": "Issued"
      },
      {
        "label": "Due"
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
          "t": "INV-8841",
          "strong": true,
          "mono": true
        },
        "Maison Lyon",
        "14 Jun",
        "14 Jul",
        {
          "t": "€4,820",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "amber",
          "t": "Open"
        }
      ],
      [
        {
          "t": "INV-8840",
          "strong": true,
          "mono": true
        },
        "Nordic Retail Group",
        "12 Jun",
        "12 Jul",
        {
          "t": "€18,240",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "amber",
          "t": "Open"
        }
      ],
      [
        {
          "t": "INV-8839",
          "strong": true,
          "mono": true
        },
        "Boutique Atlas",
        "08 Jun",
        "08 Jul",
        {
          "t": "€9,460",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "green",
          "t": "Paid"
        }
      ],
      [
        {
          "t": "INV-8838",
          "strong": true,
          "mono": true
        },
        "Studio Norte",
        "02 Jun",
        "02 Jul",
        {
          "t": "€11,900",
          "align": "right",
          "mono": true,
          "strong": true
        },
        {
          "badge": "red",
          "t": "Overdue"
        }
      ]
    ]
  },
  "customers": {
    "kind": "list",
    "search": "Search customers…",
    "action": "New customer",
    "filters": [
      "Type",
      "Region"
    ],
    "columns": [
      {
        "label": "Customer"
      },
      {
        "label": "Type"
      },
      {
        "label": "Region"
      },
      {
        "label": "Orders",
        "align": "center"
      },
      {
        "label": "Lifetime",
        "align": "right"
      }
    ],
    "rows": [
      [
        {
          "t": "Maison Lyon",
          "avatar": true,
          "sub": "maison.lyon@b2b.fr"
        },
        {
          "badge": "navy",
          "t": "Wholesale"
        },
        "France",
        {
          "t": "64",
          "align": "center",
          "mono": true
        },
        {
          "t": "€284K",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Nordic Retail Group",
          "avatar": true,
          "sub": "buy@nordicretail.se"
        },
        {
          "badge": "navy",
          "t": "Wholesale"
        },
        "Sweden",
        {
          "t": "120",
          "align": "center",
          "mono": true
        },
        {
          "t": "€512K",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Amelia Chen",
          "avatar": true,
          "sub": "amelia.c@gmail.com"
        },
        {
          "badge": "accent",
          "t": "Retail"
        },
        "Singapore",
        {
          "t": "8",
          "align": "center",
          "mono": true
        },
        {
          "t": "€1,240",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ],
      [
        {
          "t": "Boutique Atlas",
          "avatar": true,
          "sub": "orders@boutiqueatlas.es"
        },
        {
          "badge": "navy",
          "t": "Wholesale"
        },
        "Spain",
        {
          "t": "41",
          "align": "center",
          "mono": true
        },
        {
          "t": "€176K",
          "align": "right",
          "mono": true,
          "strong": true
        }
      ]
    ]
  },
  "returns": {
    "kind": "list",
    "search": "Search RMAs…",
    "action": "New return",
    "filters": [
      "Reason",
      "Status"
    ],
    "columns": [
      {
        "label": "RMA"
      },
      {
        "label": "Order"
      },
      {
        "label": "Customer"
      },
      {
        "label": "Reason"
      },
      {
        "label": "Refund",
        "align": "right"
      },
      {
        "label": "Status"
      }
    ],
    "rows": [
      [
        {
          "t": "RMA-0421",
          "strong": true,
          "mono": true
        },
        "#SO-12340",
        "Amelia Chen",
        "Size too small",
        {
          "t": "€79",
          "align": "right",
          "mono": true
        },
        {
          "badge": "amber",
          "t": "Inspecting"
        }
      ],
      [
        {
          "t": "RMA-0420",
          "strong": true,
          "mono": true
        },
        "#SO-12331",
        "Hugo Bernard",
        "Defective seam",
        {
          "t": "€129",
          "align": "right",
          "mono": true
        },
        {
          "badge": "green",
          "t": "Refunded"
        }
      ],
      [
        {
          "t": "RMA-0419",
          "strong": true,
          "mono": true
        },
        "#SO-12320",
        "Liam O’Connor",
        "Changed mind",
        {
          "t": "€89",
          "align": "right",
          "mono": true
        },
        {
          "badge": "neutral",
          "t": "Requested"
        }
      ]
    ]
  }
};
