/* Nominal integer USD. Evidence applies to each field; simulation values are not historical facts. */
const WNBA_FINANCIAL_SOURCES={
  "early": {
    "url": "https://abc7ny.com/post/road-1m-paydays-how-wnba-salaries-evolved-each-cba/18540983/",
    "location": "Historical reporting; early centralized contracts, not 2026 negotiations"
  },
  "1999": {
    "url": "https://www.deseret.com/1999/4/15/19440119/key-points-of-wnba-wnbpa-collective-bargaining-agreement/",
    "location": "1999\u20132002 minimum salary schedules"
  },
  "2007": {
    "url": "https://slamonline.com/wnba/the-state-of-the-wnba-cba/",
    "location": "2003\u20132007 CBA reporting"
  },
  "2010": {
    "url": "https://www.swishappeal.com/2009/12/22/1210230/ann-meyers-drysdale-mercury-not",
    "location": "Reported 2010 $775,000 actual cap; unamended 2008 CBA schedules $827,000"
  },
  "cba2008": {
    "url": "https://www.ipmall.law.unh.edu/sites/default/files/hosted_resources/SportsEntLaw_Institute/2008WNBA_WNBPA_CBA.pdf",
    "location": "Articles V\u2013VII; Exhibit 5"
  },
  "cba2014": {
    "url": "https://nyc3.digitaloceanspaces.com/sportsarchive-documents/prod/60f617a46431e/WNBA-CBA-2014-2021Final.pdf",
    "location": "Articles V\u2013VII; Exhibit 5; full archival copy"
  },
  "cba2020": {
    "url": "https://www.wnbpa.com/_files/ugd/575289_1904d7b630624d93a59a904e0d5abffb.pdf",
    "location": "Articles V\u2013VII; Exhibit 5 (2020\u20132025 only)"
  },
  "cba2026": {
    "url": "https://www.wnbpa.com/_files/ugd/8121a3_675911316ca142178932adc1e56519ac.pdf",
    "location": "Final executed agreement May 22, 2026; V, VI, VII and Exhibit 5"
  }
};
const WNBA_FINANCIAL_YEARS={
  "1997": {
    "year": 1997,
    "currency": "USD",
    "cba": "early",
    "sources": [
      "early",
      "early"
    ],
    "minimumTiers": [
      [
        0,
        15000
      ]
    ],
    "ordinaryMaximum": 50000,
    "specialMaximum": null,
    "documentedCap": null,
    "cap": 600000,
    "capEvidence": "simulation_estimate",
    "maximumEvidence": "verified",
    "minimumEvidence": "partly_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": null,
    "rfaService": [],
    "rookie": null,
    "gaps": [
      "No verified team cap: centralized league contracts. Simulation budget = 12 \u00d7 operating player maximum; not a historical cap.",
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Separate veteran minimum unavailable; documented common minimum used.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "Pre-CBA centralized contracts"
  },
  "1998": {
    "year": 1998,
    "currency": "USD",
    "cba": "early",
    "sources": [
      "early",
      "early"
    ],
    "minimumTiers": [
      [
        0,
        15000
      ]
    ],
    "ordinaryMaximum": 62500,
    "specialMaximum": null,
    "documentedCap": null,
    "cap": 750000,
    "capEvidence": "simulation_estimate",
    "maximumEvidence": "verified",
    "minimumEvidence": "partly_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": null,
    "rfaService": [],
    "rookie": null,
    "gaps": [
      "No verified team cap: centralized league contracts. Simulation budget = 12 \u00d7 operating player maximum; not a historical cap.",
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Separate veteran minimum unavailable; documented common minimum used.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "Pre-CBA centralized contracts"
  },
  "1999": {
    "year": 1999,
    "currency": "USD",
    "cba": "1999",
    "sources": [
      "1999",
      "early"
    ],
    "minimumTiers": [
      [
        0,
        25000
      ],
      [
        1,
        30000
      ]
    ],
    "ordinaryMaximum": 70000,
    "specialMaximum": null,
    "documentedCap": null,
    "cap": 840000,
    "capEvidence": "simulation_estimate",
    "maximumEvidence": "simulation_estimate",
    "minimumEvidence": "amounts_verified_service_threshold_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": null,
    "rfaService": [],
    "rookie": null,
    "gaps": [
      "No verified team cap: centralized league contracts. Simulation budget = 12 \u00d7 operating player maximum; not a historical cap.",
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Operating maximum is a labeled estimate from reported top pay (2001 midpoint estimate), not a verified legal ceiling.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "1999 CBA (historical reporting)"
  },
  "2000": {
    "year": 2000,
    "currency": "USD",
    "cba": "1999",
    "sources": [
      "1999",
      "early"
    ],
    "minimumTiers": [
      [
        0,
        26500
      ],
      [
        1,
        32500
      ]
    ],
    "ordinaryMaximum": 75798,
    "specialMaximum": null,
    "documentedCap": null,
    "cap": 909576,
    "capEvidence": "simulation_estimate",
    "maximumEvidence": "simulation_estimate",
    "minimumEvidence": "amounts_verified_service_threshold_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": null,
    "rfaService": [],
    "rookie": null,
    "gaps": [
      "No verified team cap: centralized league contracts. Simulation budget = 12 \u00d7 operating player maximum; not a historical cap.",
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Operating maximum is a labeled estimate from reported top pay (2001 midpoint estimate), not a verified legal ceiling.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "1999 CBA (historical reporting)"
  },
  "2001": {
    "year": 2001,
    "currency": "USD",
    "cba": "1999",
    "sources": [
      "1999",
      "early"
    ],
    "minimumTiers": [
      [
        0,
        28000
      ],
      [
        1,
        35000
      ]
    ],
    "ordinaryMaximum": 77500,
    "specialMaximum": null,
    "documentedCap": null,
    "cap": 930000,
    "capEvidence": "simulation_estimate",
    "maximumEvidence": "simulation_estimate",
    "minimumEvidence": "amounts_verified_service_threshold_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": null,
    "rfaService": [],
    "rookie": null,
    "gaps": [
      "No verified team cap: centralized league contracts. Simulation budget = 12 \u00d7 operating player maximum; not a historical cap.",
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Operating maximum is a labeled estimate from reported top pay (2001 midpoint estimate), not a verified legal ceiling.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "1999 CBA (historical reporting)"
  },
  "2002": {
    "year": 2002,
    "currency": "USD",
    "cba": "1999",
    "sources": [
      "1999",
      "early"
    ],
    "minimumTiers": [
      [
        0,
        30000
      ],
      [
        1,
        40000
      ]
    ],
    "ordinaryMaximum": 79500,
    "specialMaximum": null,
    "documentedCap": null,
    "cap": 954000,
    "capEvidence": "simulation_estimate",
    "maximumEvidence": "simulation_estimate",
    "minimumEvidence": "amounts_verified_service_threshold_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": null,
    "rfaService": [],
    "rookie": null,
    "gaps": [
      "No verified team cap: centralized league contracts. Simulation budget = 12 \u00d7 operating player maximum; not a historical cap.",
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Operating maximum is a labeled estimate from reported top pay (2001 midpoint estimate), not a verified legal ceiling.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "1999 CBA (historical reporting)"
  },
  "2003": {
    "year": 2003,
    "currency": "USD",
    "cba": "2007",
    "sources": [
      "2007"
    ],
    "minimumTiers": [
      [
        0,
        30000
      ],
      [
        1,
        42000
      ]
    ],
    "ordinaryMaximum": 85000,
    "specialMaximum": null,
    "documentedCap": 622000,
    "cap": 622000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "amounts_verified_service_threshold_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": null,
    "rfaService": [
      6
    ],
    "rookie": null,
    "gaps": [
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "2003 CBA (historical reporting)"
  },
  "2004": {
    "year": 2004,
    "currency": "USD",
    "cba": "2007",
    "sources": [
      "2007"
    ],
    "minimumTiers": [
      [
        0,
        30600
      ],
      [
        1,
        43680
      ]
    ],
    "ordinaryMaximum": 87000,
    "specialMaximum": null,
    "documentedCap": 647000,
    "cap": 647000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "amounts_verified_service_threshold_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": 6,
    "rfaService": [
      5
    ],
    "rookie": null,
    "gaps": [
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "2003 CBA (historical reporting)"
  },
  "2005": {
    "year": 2005,
    "currency": "USD",
    "cba": "2007",
    "sources": [
      "2007"
    ],
    "minimumTiers": [
      [
        0,
        31200
      ],
      [
        1,
        45427
      ]
    ],
    "ordinaryMaximum": 89000,
    "specialMaximum": null,
    "documentedCap": 673000,
    "cap": 673000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "amounts_verified_service_threshold_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": null,
    "gaps": [
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "2003 CBA (historical reporting)"
  },
  "2006": {
    "year": 2006,
    "currency": "USD",
    "cba": "2007",
    "sources": [
      "2007"
    ],
    "minimumTiers": [
      [
        0,
        31800
      ],
      [
        1,
        47244
      ]
    ],
    "ordinaryMaximum": 91000,
    "specialMaximum": null,
    "documentedCap": 700000,
    "cap": 700000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "partly_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": null,
    "gaps": [
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Veteran minimum $47,244 is estimated from the reported schedule.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "2003 CBA (historical reporting)"
  },
  "2007": {
    "year": 2007,
    "currency": "USD",
    "cba": "2007",
    "sources": [
      "2007"
    ],
    "minimumTiers": [
      [
        0,
        32400
      ],
      [
        1,
        49134
      ]
    ],
    "ordinaryMaximum": 93000,
    "specialMaximum": null,
    "documentedCap": 728000,
    "cap": 728000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "amounts_verified_service_threshold_estimated",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 1,
    "ownTeamMaxYears": 1,
    "annualChange": 0,
    "extensionFirstYearFactor": null,
    "protectedLimit": 0,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": null,
    "gaps": [
      "Full early CBA unavailable: one-year unprotected simulation agreements; veteran service threshold and incomplete rookie bands are estimates. No extensions or special maximum eligibility inferred.",
      "Early active/inactive roster detail is incomplete: the simulation uses 11\u201312 regular roster slots, not a claimed exact historical roster rule."
    ],
    "agreement": "2003 CBA (historical reporting)"
  },
  "2008": {
    "year": 2008,
    "currency": "USD",
    "cba": "cba2008",
    "sources": [
      "cba2008"
    ],
    "minimumTiers": [
      [
        0,
        34500
      ],
      [
        3,
        50000
      ]
    ],
    "ordinaryMaximum": 95000,
    "specialMaximum": 97500,
    "documentedCap": 772000,
    "cap": 772000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 675000,
    "rosterMin": 11,
    "rosterMax": 13,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.04,
    "extensionFirstYearFactor": 1.04,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2008",
      "printedPage": 255,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          44064,
          44945,
          49440,
          56182
        ],
        "round1_picks5_8": [
          40759,
          41574,
          45732,
          51968
        ],
        "round1_remaining": [
          36353,
          37080,
          40788,
          46350
        ],
        "round2": [
          35000,
          35700,
          39270,
          44625
        ],
        "round3": [
          34500,
          35190,
          36950,
          42229
        ],
        "undrafted": [
          34500,
          35190
        ]
      }
    },
    "gaps": [],
    "agreement": "2008 CBA"
  },
  "2009": {
    "year": 2009,
    "currency": "USD",
    "cba": "cba2008",
    "sources": [
      "cba2008"
    ],
    "minimumTiers": [
      [
        0,
        35190
      ],
      [
        3,
        51000
      ]
    ],
    "ordinaryMaximum": 97000,
    "specialMaximum": 99500,
    "documentedCap": 803000,
    "cap": 803000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 694800,
    "rosterMin": 11,
    "rosterMax": 11,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.04,
    "extensionFirstYearFactor": 1.04,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2008",
      "printedPage": 256,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          44945,
          45844,
          50429,
          57305
        ],
        "round1_picks5_8": [
          41574,
          42406,
          46646,
          53007
        ],
        "round1_remaining": [
          37080,
          37821,
          41604,
          47277
        ],
        "round2": [
          35700,
          36414,
          40055,
          45518
        ],
        "round3": [
          35190,
          35894,
          37689,
          43073
        ],
        "undrafted": [
          35190,
          35894
        ]
      }
    },
    "gaps": [],
    "agreement": "2008 CBA"
  },
  "2010": {
    "year": 2010,
    "currency": "USD",
    "cba": "cba2008",
    "sources": [
      "cba2008",
      "2010"
    ],
    "minimumTiers": [
      [
        0,
        35880
      ],
      [
        3,
        52000
      ]
    ],
    "ordinaryMaximum": 99000,
    "specialMaximum": 101500,
    "documentedCap": 775000,
    "cap": 775000,
    "capEvidence": "reported_disputed",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": null,
    "rosterMin": 11,
    "rosterMax": 11,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.04,
    "extensionFirstYearFactor": 1.04,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2008",
      "printedPage": 257,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          45827,
          46743,
          51417,
          58429
        ],
        "round1_picks5_8": [
          42390,
          43237,
          47561,
          54047
        ],
        "round1_remaining": [
          37807,
          38563,
          42419,
          48204
        ],
        "round2": [
          36400,
          37128,
          40841,
          46410
        ],
        "round3": [
          35880,
          36598,
          38428,
          43918
        ],
        "undrafted": [
          35880,
          36598
        ]
      }
    },
    "gaps": [
      "Cap disputed: reported actual $775,000 used, scheduled $827,000 not used. Exact amended floor unavailable."
    ],
    "agreement": "2008 CBA"
  },
  "2011": {
    "year": 2011,
    "currency": "USD",
    "cba": "cba2008",
    "sources": [
      "cba2008"
    ],
    "minimumTiers": [
      [
        0,
        36570
      ],
      [
        3,
        53000
      ]
    ],
    "ordinaryMaximum": 101000,
    "specialMaximum": 103500,
    "documentedCap": 852000,
    "cap": 852000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 737100,
    "rosterMin": 11,
    "rosterMax": 11,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.04,
    "extensionFirstYearFactor": 1.04,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2008",
      "printedPage": 258,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          46708,
          47642,
          52406,
          59552
        ],
        "round1_picks5_8": [
          43205,
          44069,
          48476,
          55086
        ],
        "round1_remaining": [
          38534,
          39305,
          43235,
          49131
        ],
        "round2": [
          37100,
          37842,
          41626,
          47303
        ],
        "round3": [
          36570,
          37301,
          39166,
          44761
        ],
        "undrafted": [
          36570,
          37301
        ]
      }
    },
    "gaps": [],
    "agreement": "2008 CBA"
  },
  "2012": {
    "year": 2012,
    "currency": "USD",
    "cba": "cba2008",
    "sources": [
      "cba2008"
    ],
    "minimumTiers": [
      [
        0,
        37260
      ],
      [
        3,
        54000
      ]
    ],
    "ordinaryMaximum": 103000,
    "specialMaximum": 105500,
    "documentedCap": 878000,
    "cap": 878000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 759600,
    "rosterMin": 11,
    "rosterMax": 11,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.04,
    "extensionFirstYearFactor": 1.04,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2008",
      "printedPage": 259,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          47589,
          48541,
          53395,
          60676
        ],
        "round1_picks5_8": [
          44020,
          44900,
          49390,
          56125
        ],
        "round1_remaining": [
          39261,
          40046,
          44051,
          50058
        ],
        "round2": [
          37800,
          38556,
          42412,
          48195
        ],
        "round3": [
          37260,
          38005,
          39905,
          45606
        ],
        "undrafted": [
          37260,
          38005
        ]
      }
    },
    "gaps": [],
    "agreement": "2008 CBA"
  },
  "2013": {
    "year": 2013,
    "currency": "USD",
    "cba": "cba2008",
    "sources": [
      "cba2008"
    ],
    "minimumTiers": [
      [
        0,
        37950
      ],
      [
        3,
        55000
      ]
    ],
    "ordinaryMaximum": 105000,
    "specialMaximum": 107500,
    "documentedCap": 913000,
    "cap": 913000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 782100,
    "rosterMin": 11,
    "rosterMax": 11,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.04,
    "extensionFirstYearFactor": 1.04,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2008",
      "printedPage": 260,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          48470,
          49440,
          54384,
          61800
        ],
        "round1_picks5_8": [
          44835,
          45732,
          50305,
          57165
        ],
        "round1_remaining": [
          39988,
          40788,
          44867,
          50985
        ],
        "round2": [
          38500,
          39270,
          43197,
          49088
        ],
        "round3": [
          37950,
          38709,
          40644,
          46450
        ],
        "undrafted": [
          37950,
          38709
        ]
      }
    },
    "gaps": [],
    "agreement": "2008 CBA"
  },
  "2014": {
    "year": 2014,
    "currency": "USD",
    "cba": "cba2014",
    "sources": [
      "cba2014"
    ],
    "minimumTiers": [
      [
        0,
        38150
      ],
      [
        3,
        55000
      ]
    ],
    "ordinaryMaximum": 105000,
    "specialMaximum": 107500,
    "documentedCap": 901000,
    "cap": 901000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 771300,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.02,
    "extensionFirstYearFactor": 1.02,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2014",
      "printedPage": 276,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          48670,
          49644,
          54609,
          62055
        ],
        "round1_picks5_8": [
          45035,
          45936,
          50530,
          57420
        ],
        "round1_remaining": [
          40188,
          40992,
          45092,
          51240
        ],
        "round2": [
          38700,
          39474,
          43422,
          49343
        ],
        "round3": [
          38150,
          38913,
          40859,
          46696
        ],
        "undrafted": [
          38150,
          38913
        ]
      }
    },
    "gaps": [],
    "agreement": "2014 CBA"
  },
  "2015": {
    "year": 2015,
    "currency": "USD",
    "cba": "cba2014",
    "sources": [
      "cba2014"
    ],
    "minimumTiers": [
      [
        0,
        38913
      ],
      [
        3,
        55275
      ]
    ],
    "ordinaryMaximum": 107000,
    "specialMaximum": 109500,
    "documentedCap": 919300,
    "cap": 919300,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 786960,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.02,
    "extensionFirstYearFactor": 1.02,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2014",
      "printedPage": 277,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          49644,
          50637,
          55701,
          63297
        ],
        "round1_picks5_8": [
          45936,
          46855,
          51541,
          58569
        ],
        "round1_remaining": [
          40992,
          41812,
          45994,
          52265
        ],
        "round2": [
          39474,
          40264,
          44291,
          50330
        ],
        "round3": [
          38913,
          39692,
          41677,
          47631
        ],
        "undrafted": [
          38913,
          39692
        ]
      }
    },
    "gaps": [],
    "agreement": "2014 CBA"
  },
  "2016": {
    "year": 2016,
    "currency": "USD",
    "cba": "cba2014",
    "sources": [
      "cba2014"
    ],
    "minimumTiers": [
      [
        0,
        39676
      ],
      [
        3,
        55550
      ]
    ],
    "ordinaryMaximum": 109000,
    "specialMaximum": 111500,
    "documentedCap": 937900,
    "cap": 937900,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 802890,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.02,
    "extensionFirstYearFactor": 1.02,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2014",
      "printedPage": 278,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          50617,
          51630,
          56793,
          64538
        ],
        "round1_picks5_8": [
          46837,
          47774,
          52552,
          59718
        ],
        "round1_remaining": [
          41796,
          42632,
          46896,
          53290
        ],
        "round2": [
          40248,
          41053,
          45159,
          51317
        ],
        "round3": [
          39676,
          40470,
          42494,
          48564
        ],
        "undrafted": [
          39676,
          40470
        ]
      }
    },
    "gaps": [],
    "agreement": "2014 CBA"
  },
  "2017": {
    "year": 2017,
    "currency": "USD",
    "cba": "cba2014",
    "sources": [
      "cba2014"
    ],
    "minimumTiers": [
      [
        0,
        40439
      ],
      [
        3,
        55825
      ]
    ],
    "ordinaryMaximum": 111000,
    "specialMaximum": 113500,
    "documentedCap": 956900,
    "cap": 956900,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 819180,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.02,
    "extensionFirstYearFactor": 1.02,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2014",
      "printedPage": 279,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          51591,
          52623,
          57886,
          65779
        ],
        "round1_picks5_8": [
          47738,
          48693,
          53563,
          60867
        ],
        "round1_remaining": [
          42600,
          43452,
          47798,
          54315
        ],
        "round2": [
          41022,
          41843,
          46028,
          52304
        ],
        "round3": [
          40439,
          41248,
          43311,
          49498
        ],
        "undrafted": [
          40439,
          41248
        ]
      }
    },
    "gaps": [],
    "agreement": "2014 CBA"
  },
  "2018": {
    "year": 2018,
    "currency": "USD",
    "cba": "cba2014",
    "sources": [
      "cba2014"
    ],
    "minimumTiers": [
      [
        0,
        41202
      ],
      [
        3,
        56100
      ]
    ],
    "ordinaryMaximum": 113000,
    "specialMaximum": 115500,
    "documentedCap": 976300,
    "cap": 976300,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 835740,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.02,
    "extensionFirstYearFactor": 1.02,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2014",
      "printedPage": 280,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          52564,
          53616,
          58978,
          67020
        ],
        "round1_picks5_8": [
          48638,
          49611,
          54573,
          62014
        ],
        "round1_remaining": [
          43404,
          44273,
          48701,
          55342
        ],
        "round2": [
          41796,
          42632,
          46896,
          53290
        ],
        "round3": [
          41202,
          42027,
          44129,
          50433
        ],
        "undrafted": [
          41202,
          42027
        ]
      }
    },
    "gaps": [],
    "agreement": "2014 CBA"
  },
  "2019": {
    "year": 2019,
    "currency": "USD",
    "cba": "cba2014",
    "sources": [
      "cba2014"
    ],
    "minimumTiers": [
      [
        0,
        41965
      ],
      [
        3,
        56375
      ]
    ],
    "ordinaryMaximum": 115000,
    "specialMaximum": 117500,
    "documentedCap": 996100,
    "cap": 996100,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 852660,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.02,
    "extensionFirstYearFactor": 1.02,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "source": "cba2014",
      "printedPage": 281,
      "confidence": "verified_primary_schedule",
      "bands": {
        "round1_picks1_4": [
          53537,
          54608,
          60069,
          68260
        ],
        "round1_picks5_8": [
          49539,
          50530,
          55583,
          63162
        ],
        "round1_remaining": [
          44207,
          45092,
          49602,
          56365
        ],
        "round2": [
          42570,
          43422,
          47765,
          54278
        ],
        "round3": [
          41965,
          42805,
          44946,
          51366
        ],
        "undrafted": [
          41965,
          42805
        ]
      }
    },
    "gaps": [],
    "agreement": "2014 CBA"
  },
  "2020": {
    "year": 2020,
    "currency": "USD",
    "cba": "cba2020",
    "sources": [
      "cba2020"
    ],
    "minimumTiers": [
      [
        0,
        57000
      ],
      [
        3,
        68000
      ]
    ],
    "ordinaryMaximum": 185000,
    "specialMaximum": 215000,
    "documentedCap": 1300000,
    "cap": 1300000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 1088100,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.03,
    "extensionFirstYearFactor": 1.2,
    "protectedLimit": 6,
    "ufaService": 6,
    "rfaService": [
      4,
      5
    ],
    "rookie": {
      "sourceId": "CBA2020",
      "sourceSection": "Exhibit 5",
      "cohortYear": 2020,
      "scheduleBasis": "contract entry cohort, not current league year",
      "rows": [
        {
          "group": "Picks 1-4",
          "round": 1,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": 4,
          "annualFullSeasonUSD": [
            68000,
            69360,
            76297,
            86701
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Picks 5-8",
          "round": 1,
          "pickWithinRoundMin": 5,
          "pickWithinRoundMax": 8,
          "annualFullSeasonUSD": [
            65250,
            66555,
            73211,
            83194
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Remaining Picks",
          "round": 1,
          "pickWithinRoundMin": 9,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            62500,
            63751,
            70127,
            79690
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Second Round",
          "round": 2,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            59750,
            60946,
            67042,
            76183
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Third Round",
          "round": 3,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            57000,
            58141,
            61049,
            69770
          ],
          "optionYearIndex": 3
        },
        {
          "group": "All Others",
          "round": null,
          "pickWithinRoundMin": null,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            57000,
            58141
          ],
          "optionYearIndex": null
        }
      ]
    },
    "gaps": [],
    "agreement": "2020 CBA"
  },
  "2021": {
    "year": 2021,
    "currency": "USD",
    "cba": "cba2020",
    "sources": [
      "cba2020"
    ],
    "minimumTiers": [
      [
        0,
        58710
      ],
      [
        3,
        70040
      ]
    ],
    "ordinaryMaximum": 190550,
    "specialMaximum": 221450,
    "documentedCap": 1339000,
    "cap": 1339000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 1120770,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.03,
    "extensionFirstYearFactor": 1.2,
    "protectedLimit": 6,
    "ufaService": 5,
    "rfaService": [
      4
    ],
    "rookie": {
      "sourceId": "CBA2020",
      "sourceSection": "Exhibit 5",
      "cohortYear": 2021,
      "scheduleBasis": "contract entry cohort, not current league year",
      "rows": [
        {
          "group": "Picks 1-4",
          "round": 1,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": 4,
          "annualFullSeasonUSD": [
            70040,
            71441,
            78586,
            89302
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Picks 5-8",
          "round": 1,
          "pickWithinRoundMin": 5,
          "pickWithinRoundMax": 8,
          "annualFullSeasonUSD": [
            67208,
            68552,
            75407,
            85690
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Remaining Picks",
          "round": 1,
          "pickWithinRoundMin": 9,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            64375,
            65664,
            72231,
            82081
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Second Round",
          "round": 2,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            61543,
            62774,
            69053,
            78469
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Third Round",
          "round": 3,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            58710,
            59885,
            62880,
            71863
          ],
          "optionYearIndex": 3
        },
        {
          "group": "All Others",
          "round": null,
          "pickWithinRoundMin": null,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            58710,
            59885
          ],
          "optionYearIndex": null
        }
      ]
    },
    "gaps": [],
    "agreement": "2020 CBA"
  },
  "2022": {
    "year": 2022,
    "currency": "USD",
    "cba": "cba2020",
    "sources": [
      "cba2020"
    ],
    "minimumTiers": [
      [
        0,
        60471
      ],
      [
        3,
        72141
      ]
    ],
    "ordinaryMaximum": 196267,
    "specialMaximum": 228094,
    "documentedCap": 1379200,
    "cap": 1379200,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 1154340,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.03,
    "extensionFirstYearFactor": 1.2,
    "protectedLimit": 6,
    "ufaService": 5,
    "rfaService": [
      4
    ],
    "rookie": {
      "sourceId": "CBA2020",
      "sourceSection": "Exhibit 5",
      "cohortYear": 2022,
      "scheduleBasis": "contract entry cohort, not current league year",
      "rows": [
        {
          "group": "Picks 1-4",
          "round": 1,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": 4,
          "annualFullSeasonUSD": [
            72141,
            73584,
            80943,
            91981
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Picks 5-8",
          "round": 1,
          "pickWithinRoundMin": 5,
          "pickWithinRoundMax": 8,
          "annualFullSeasonUSD": [
            69224,
            70609,
            77669,
            88261
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Remaining Picks",
          "round": 1,
          "pickWithinRoundMin": 9,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            66306,
            67634,
            74398,
            84543
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Second Round",
          "round": 2,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            63389,
            64657,
            71124,
            80823
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Third Round",
          "round": 3,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            60471,
            61682,
            64767,
            74019
          ],
          "optionYearIndex": 3
        },
        {
          "group": "All Others",
          "round": null,
          "pickWithinRoundMin": null,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            60471,
            61682
          ],
          "optionYearIndex": null
        }
      ]
    },
    "gaps": [],
    "agreement": "2020 CBA"
  },
  "2023": {
    "year": 2023,
    "currency": "USD",
    "cba": "cba2020",
    "sources": [
      "cba2020"
    ],
    "minimumTiers": [
      [
        0,
        62285
      ],
      [
        3,
        74305
      ]
    ],
    "ordinaryMaximum": 202154,
    "specialMaximum": 234936,
    "documentedCap": 1420500,
    "cap": 1420500,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 1188990,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.03,
    "extensionFirstYearFactor": 1.2,
    "protectedLimit": 6,
    "ufaService": 5,
    "rfaService": [
      4
    ],
    "rookie": {
      "sourceId": "CBA2020",
      "sourceSection": "Exhibit 5",
      "cohortYear": 2023,
      "scheduleBasis": "contract entry cohort, not current league year",
      "rows": [
        {
          "group": "Picks 1-4",
          "round": 1,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": 4,
          "annualFullSeasonUSD": [
            74305,
            75792,
            83371,
            94740
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Picks 5-8",
          "round": 1,
          "pickWithinRoundMin": 5,
          "pickWithinRoundMax": 8,
          "annualFullSeasonUSD": [
            71300,
            72727,
            79999,
            90908
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Remaining Picks",
          "round": 1,
          "pickWithinRoundMin": 9,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            68295,
            69663,
            76630,
            87080
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Second Round",
          "round": 2,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            65290,
            66597,
            73258,
            83248
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Third Round",
          "round": 3,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            62285,
            63532,
            66710,
            76240
          ],
          "optionYearIndex": 3
        },
        {
          "group": "All Others",
          "round": null,
          "pickWithinRoundMin": null,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            62285,
            63532
          ],
          "optionYearIndex": null
        }
      ]
    },
    "gaps": [],
    "agreement": "2020 CBA"
  },
  "2024": {
    "year": 2024,
    "currency": "USD",
    "cba": "cba2020",
    "sources": [
      "cba2020"
    ],
    "minimumTiers": [
      [
        0,
        64154
      ],
      [
        3,
        76535
      ]
    ],
    "ordinaryMaximum": 208219,
    "specialMaximum": 241984,
    "documentedCap": 1463200,
    "cap": 1463200,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 1224630,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.03,
    "extensionFirstYearFactor": 1.2,
    "protectedLimit": 6,
    "ufaService": 5,
    "rfaService": [
      4
    ],
    "rookie": {
      "sourceId": "CBA2020",
      "sourceSection": "Exhibit 5",
      "cohortYear": 2024,
      "scheduleBasis": "contract entry cohort, not current league year",
      "rows": [
        {
          "group": "Picks 1-4",
          "round": 1,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": 4,
          "annualFullSeasonUSD": [
            76535,
            78066,
            85873,
            97582
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Picks 5-8",
          "round": 1,
          "pickWithinRoundMin": 5,
          "pickWithinRoundMax": 8,
          "annualFullSeasonUSD": [
            73439,
            74909,
            82399,
            93636
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Remaining Picks",
          "round": 1,
          "pickWithinRoundMin": 9,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            70344,
            71753,
            78929,
            89692
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Second Round",
          "round": 2,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            67249,
            68595,
            75456,
            85745
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Third Round",
          "round": 3,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            64154,
            65438,
            68711,
            78527
          ],
          "optionYearIndex": 3
        },
        {
          "group": "All Others",
          "round": null,
          "pickWithinRoundMin": null,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            64154,
            65438
          ],
          "optionYearIndex": null
        }
      ]
    },
    "gaps": [],
    "agreement": "2020 CBA"
  },
  "2025": {
    "year": 2025,
    "currency": "USD",
    "cba": "cba2020",
    "sources": [
      "cba2020"
    ],
    "minimumTiers": [
      [
        0,
        66079
      ],
      [
        3,
        78831
      ]
    ],
    "ordinaryMaximum": 214466,
    "specialMaximum": 249244,
    "documentedCap": 1507100,
    "cap": 1507100,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 1261440,
    "rosterMin": 11,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.03,
    "extensionFirstYearFactor": 1.2,
    "protectedLimit": 6,
    "ufaService": 5,
    "rfaService": [
      4
    ],
    "rookie": {
      "sourceId": "CBA2020",
      "sourceSection": "Exhibit 5",
      "cohortYear": 2025,
      "scheduleBasis": "contract entry cohort, not current league year",
      "rows": [
        {
          "group": "Picks 1-4",
          "round": 1,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": 4,
          "annualFullSeasonUSD": [
            78831,
            80408,
            88449,
            100510
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Picks 5-8",
          "round": 1,
          "pickWithinRoundMin": 5,
          "pickWithinRoundMax": 8,
          "annualFullSeasonUSD": [
            75643,
            77156,
            84871,
            96445
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Remaining Picks",
          "round": 1,
          "pickWithinRoundMin": 9,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            72455,
            73905,
            81297,
            92383
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Second Round",
          "round": 2,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            69267,
            70653,
            77720,
            88317
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Third Round",
          "round": 3,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            66079,
            67401,
            70773,
            80883
          ],
          "optionYearIndex": 3
        },
        {
          "group": "All Others",
          "round": null,
          "pickWithinRoundMin": null,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            66079,
            67401
          ],
          "optionYearIndex": null
        }
      ]
    },
    "gaps": [],
    "agreement": "2020 CBA"
  },
  "2026": {
    "year": 2026,
    "currency": "USD",
    "cba": "cba2026",
    "sources": [
      "cba2026"
    ],
    "minimumTiers": [
      [
        0,
        270000
      ],
      [
        1,
        277500
      ],
      [
        4,
        285000
      ],
      [
        7,
        292500
      ],
      [
        10,
        300000
      ]
    ],
    "ordinaryMaximum": 1190000,
    "specialMaximum": 1400000,
    "documentedCap": 7000000,
    "cap": 7000000,
    "capEvidence": "verified",
    "maximumEvidence": "verified",
    "minimumEvidence": "verified",
    "teamMinimum": 5950000,
    "rosterMin": 12,
    "rosterMax": 12,
    "veteranMaxYears": 3,
    "ownTeamMaxYears": 4,
    "annualChange": 0.05,
    "extensionFirstYearFactor": 1.3,
    "protectedLimit": 7,
    "ufaService": 5,
    "rfaService": [
      4
    ],
    "rookie": {
      "sourceId": "CBA2026",
      "sourceSection": "Article VIII(b), printed page103",
      "cohortYear": 2026,
      "scheduleBasis": "NEW contract entry cohort; NOT verified conversion of existing pre-2026 rookie contracts",
      "rows": [
        {
          "group": "First round 1",
          "round": 1,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": 1,
          "annualFullSeasonUSD": [
            500000,
            520000,
            572000,
            646360
          ],
          "optionYearIndex": 3
        },
        {
          "group": "First round 2",
          "round": 1,
          "pickWithinRoundMin": 2,
          "pickWithinRoundMax": 2,
          "annualFullSeasonUSD": [
            466913,
            485590,
            534149,
            603588
          ],
          "optionYearIndex": 3
        },
        {
          "group": "First round 3",
          "round": 1,
          "pickWithinRoundMin": 3,
          "pickWithinRoundMax": 3,
          "annualFullSeasonUSD": [
            436016,
            453457,
            498803,
            563647
          ],
          "optionYearIndex": 3
        },
        {
          "group": "First round 4",
          "round": 1,
          "pickWithinRoundMin": 4,
          "pickWithinRoundMax": 4,
          "annualFullSeasonUSD": [
            407163,
            423450,
            465795,
            526348
          ],
          "optionYearIndex": 3
        },
        {
          "group": "First round 5",
          "round": 1,
          "pickWithinRoundMin": 5,
          "pickWithinRoundMax": 5,
          "annualFullSeasonUSD": [
            380219,
            395428,
            434971,
            491517
          ],
          "optionYearIndex": 3
        },
        {
          "group": "First round 6",
          "round": 1,
          "pickWithinRoundMin": 6,
          "pickWithinRoundMax": 6,
          "annualFullSeasonUSD": [
            355058,
            369260,
            406186,
            458990
          ],
          "optionYearIndex": 3
        },
        {
          "group": "First round 7",
          "round": 1,
          "pickWithinRoundMin": 7,
          "pickWithinRoundMax": 7,
          "annualFullSeasonUSD": [
            331563,
            344826,
            379309,
            428619
          ],
          "optionYearIndex": 3
        },
        {
          "group": "First round 8",
          "round": 1,
          "pickWithinRoundMin": 8,
          "pickWithinRoundMax": 8,
          "annualFullSeasonUSD": [
            309622,
            322007,
            354208,
            400255
          ],
          "optionYearIndex": 3
        },
        {
          "group": "First round 9+",
          "round": 1,
          "pickWithinRoundMin": 9,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            289133,
            300698,
            330768,
            373768
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Second round",
          "round": 2,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            270000,
            288600,
            317460,
            358730
          ],
          "optionYearIndex": 3
        },
        {
          "group": "Third round",
          "round": 3,
          "pickWithinRoundMin": 1,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            270000,
            288600,
            317460,
            358730
          ],
          "optionYearIndex": 3
        },
        {
          "group": "All others",
          "round": null,
          "pickWithinRoundMin": null,
          "pickWithinRoundMax": null,
          "annualFullSeasonUSD": [
            270000,
            288600
          ],
          "optionYearIndex": null
        }
      ]
    },
    "gaps": [
      "2027+ rules held at 2026 pending annual certified figures; clearly labeled future fallback. 2023\u20132025 rookie transition repricing requires manual review. Developmental contracts and EPIC renegotiations not offered."
    ],
    "agreement": "2026 CBA (executed)"
  }
};

(function freezeRegistry(value){Object.values(value).forEach(v=>{if(v&&typeof v==="object")freezeRegistry(v)});Object.freeze(value)})(WNBA_FINANCIAL_YEARS);
