#!/usr/bin/env python3
"""Economy Simulation for Software Dev Clicker.
Replicates all game formulas and plays with optimal ROI-based strategy."""

import math

# ========== GAME CONSTANTS (from gamedev-clicker.html) ==========

GEN_ORIGINAL = [
    {"name": "Intern",             "base": 15,            "rate": 0.7,    "gr": 1.15},
    {"name": "Junior Dev",         "base": 610,           "rate": 3.5,    "gr": 1.15},
    {"name": "Mid-Level Dev",      "base": 20000,         "rate": 14,     "gr": 1.15},
    {"name": "Senior Dev",         "base": 810000,        "rate": 70,     "gr": 1.15},
    {"name": "Staff Engineer",     "base": 33000000,      "rate": 350,    "gr": 1.15},
    {"name": "Principal Engineer", "base": 1100000000,    "rate": 1400,   "gr": 1.15},
    {"name": "Tech Lead",          "base": 44000000000,   "rate": 7000,   "gr": 1.15},
    {"name": "CTO",                "base": 1800000000000, "rate": 35000,  "gr": 1.15},
]

# Compressed rates: ~3x per tier instead of ~5x (same bases)
GEN_COMPRESSED = [
    {"name": "Intern",             "base": 15,            "rate": 0.7,    "gr": 1.15},
    {"name": "Junior Dev",         "base": 610,           "rate": 2.1,    "gr": 1.15},
    {"name": "Mid-Level Dev",      "base": 20000,         "rate": 6.3,    "gr": 1.15},
    {"name": "Senior Dev",         "base": 810000,        "rate": 19,     "gr": 1.15},
    {"name": "Staff Engineer",     "base": 33000000,      "rate": 57,     "gr": 1.15},
    {"name": "Principal Engineer", "base": 1100000000,    "rate": 170,    "gr": 1.15},
    {"name": "Tech Lead",          "base": 44000000000,   "rate": 510,    "gr": 1.15},
    {"name": "CTO",                "base": 1800000000000, "rate": 1530,   "gr": 1.15},
]

GEN = GEN_ORIGINAL

EMP_UPS = [
    {"id": "desk", "tiers": [
        {"mult": 1.25, "baseCost": 75},
        {"mult": 1.5,  "baseCost": 750},
        {"mult": 2.0,  "baseCost": 7500},
    ], "gr": 4},
    {"id": "chair", "tiers": [
        {"mult": 1.375, "baseCost": 300},
        {"mult": 1.75,  "baseCost": 3000},
        {"mult": 2.5,   "baseCost": 30000},
    ], "gr": 5},
    {"id": "computer", "tiers": [
        {"mult": 1.75,  "baseCost": 1500},
        {"mult": 2.5,   "baseCost": 15000},
        {"mult": 4.0,   "baseCost": 150000},
    ], "gr": 6},
]

# Perk indices
P_LUNCH, P_ENERGY, P_DESK, P_DAYCARE, P_PET = 0, 1, 2, 3, 4
P_GYM, P_GAMEROOM, P_PTO, P_NAP, P_RETREAT = 5, 6, 7, 8, 9

CLK = [
    {"name": "Catered Lunches",     "base": 600,      "gr": 4},
    {"name": "Free Energy Drinks",  "base": 1500,     "gr": 3},
    {"name": "Standing Desks",      "base": 10000,    "gr": 5},
    {"name": "On-Site Daycare",     "base": 60000,    "gr": 6},
    {"name": "Pet-Friendly Office", "base": 100000,   "gr": 10},
    {"name": "Gym Membership",      "base": 300000,   "gr": 10},
    {"name": "Game Room",           "base": 400000,   "gr": 8},
    {"name": "Unlimited PTO",       "base": 1000000,  "gr": 10},
    {"name": "Nap Pods",            "base": 2000000,  "gr": 10},
    {"name": "Company Retreat",     "base": 6000000,  "gr": 10},
]

SS_SECRETARY, SS_RECRUITER, SS_MANAGER, SS_FACILITY, SS_TRAINER = 0, 1, 2, 3, 4

SUPPORT = [
    {"name": "Secretary",         "base": 1500,   "gr": 10},
    {"name": "Recruiter",         "base": 15000,  "gr": 10},
    {"name": "Office Manager",    "base": 30000,  "gr": 10},
    {"name": "Facility Director", "base": 45000,  "gr": 10},
    {"name": "Trainer",           "base": 60000,  "gr": 10},
]

RECRUITER_UPS = [
    {"id": "screener",   "baseCost": 40000,  "gr": 3},
    {"id": "linkedin",   "baseCost": 125000, "gr": 4},
    {"id": "headhunter", "baseCost": 500000, "gr": 5},
]

FACILITY_UPS = [
    {"id": "blueprint",  "baseCost": 30000,  "gr": 3},
    {"id": "bulk_order", "baseCost": 90000,  "gr": 4},
    {"id": "contractor", "baseCost": 250000, "gr": 5},
]

CODE_BASE = [
    {"effect": "prod",  "val": 0.10},
    {"effect": "speed", "val": 0.15},
    {"effect": "click", "val": 0.20},
    {"effect": "cheap", "val": 0.10},
    {"effect": "prod",  "val": 0.10},
    {"effect": "speed", "val": 0.15},
    {"effect": "click", "val": 0.20},
    {"effect": "cheap", "val": 0.10},
    {"effect": "prod",  "val": 0.10},
    {"effect": "speed", "val": 0.15},
    {"effect": "click", "val": 0.20},
    {"effect": "cheap", "val": 0.10},
    {"effect": "prod",  "val": 0.15},
    {"effect": "speed", "val": 0.20},
    {"effect": "click", "val": 0.25},
]

FAME_TREE = [
    {"id": "gen", "upgrades": [
        {"id": "genSpeed",      "cost": 1,  "max": 5,  "req": -1},
        {"id": "genCheap",      "cost": 3,  "max": 3,  "req": 0},
        {"id": "genSynergy",    "cost": 5,  "max": 1,  "req": 1},
        {"id": "genThreads",    "cost": 2,  "max": 3,  "req": 0},
        {"id": "genReview",     "cost": 4,  "max": 1,  "req": 0},
        {"id": "genAcquihire",  "cost": 3,  "max": 2,  "req": 1},
        {"id": "genOpenSource", "cost": 7,  "max": 3,  "req": 2},
        {"id": "genPair",       "cost": 8,  "max": 1,  "req": 2},
    ]},
    {"id": "click", "upgrades": [
        {"id": "clickDouble",    "cost": 1,  "max": 3,  "req": -1},
        {"id": "autoClick",      "cost": 3,  "max": 5,  "req": 0},
        {"id": "clickFrenzy",    "cost": 5,  "max": 1,  "req": 1},
        {"id": "clickPrecision", "cost": 2,  "max": 5,  "req": 0},
        {"id": "clickLucky",     "cost": 3,  "max": 3,  "req": 0},
        {"id": "autoBotnet",     "cost": 4,  "max": 3,  "req": 1},
        {"id": "clickHackathon", "cost": 6,  "max": 2,  "req": 2},
        {"id": "clickCaffeine",  "cost": 8,  "max": 1,  "req": 2},
    ]},
    {"id": "prestige", "upgrades": [
        {"id": "engine",          "cost": 2,  "max": 1,  "req": -1},
        {"id": "marketing",       "cost": 1,  "max": 99, "req": 0},
        {"id": "publisher",       "cost": 3,  "max": 1,  "req": 1},
        {"id": "ventureCapital",  "cost": 3,  "max": 5,  "req": 0},
        {"id": "goldenParachute", "cost": 5,  "max": 3,  "req": 0},
        {"id": "viralMarketing",  "cost": 2,  "max": 5,  "req": 1},
        {"id": "franchise",       "cost": 5,  "max": 3,  "req": 2},
        {"id": "ipo",             "cost": 10, "max": 1,  "req": 2},
    ]},
    {"id": "streak", "upgrades": [
        {"id": "streakUnlock",     "cost": 2,  "max": 1,  "req": -1},
        {"id": "streakPower",      "cost": 3,  "max": 3,  "req": 0},
        {"id": "streakMastery",    "cost": 5,  "max": 1,  "req": 1},
        {"id": "streakSecondWind", "cost": 3,  "max": 2,  "req": 0},
        {"id": "streakCombo",      "cost": 3,  "max": 3,  "req": 0},
        {"id": "streakTurbo",      "cost": 4,  "max": 2,  "req": 1},
        {"id": "streakZone",       "cost": 7,  "max": 2,  "req": 2},
        {"id": "streakTranscend",  "cost": 10, "max": 1,  "req": 2},
    ]},
]

LANDMARKS = {
    1979: "Spreadsheet", 1980: "Database", 1981: "Operating System", 1982: "CAD Software",
    1983: "Spreadsheet", 1984: "Graphics Editor", 1985: "Desktop Publishing",
    1986: "Scientific Computing", 1987: "Presentations", 1988: "Math Software",
    1989: "Simulation", 1990: "Image Editing", 1991: "Operating System",
    1992: "Multimedia Player", 1993: "Web Browser", 1994: "Web Browser",
    1995: "Programming Language", 1996: "Instant Messaging", 1997: "Media Player",
    1998: "Strategy Game", 1999: "File Sharing", 2000: "Life Simulator",
    2001: "Operating System", 2002: "Creative Suite", 2003: "Digital Music Store",
    2004: "Email Service", 2005: "Video Streaming", 2006: "Social Media",
    2007: "Mobile Development", 2008: "Web Browser", 2009: "Sandbox Game",
    2010: "Photo Sharing", 2011: "Voice Assistant", 2012: "IoT Platform",
    2013: "Containerization", 2014: "Programming Language", 2015: "Machine Learning",
    2016: "Augmented Reality", 2017: "Orchestration", 2018: "Short Video",
    2019: "Video Conferencing", 2020: "Collaboration Tool", 2021: "AI Coding Assistant",
    2022: "AI Chatbot", 2023: "Social Media", 2024: "AI Video Generator", 2025: "AI IDE",
}

LANDMARK_NAMES = {
    1979: "VisiCrash", 1980: "dBased", 1981: "MS-LOSS", 1982: "AutoSAD",
    1983: "Locus 4-5-6", 1984: "MacStain", 1985: "RageMaker", 1986: "MADLAB",
    1987: "PowerPointless", 1988: "Mathemagica", 1989: "SimBugs", 1990: "Photoslop",
    1991: "Penguinux", 1992: "SlowTime", 1993: "Mosaic Tile", 1994: "Netscapade",
    1995: "Decaf", 1996: "UCQ", 1997: "LoseAmp", 1998: "StairCraft",
    1999: "Napsterdly", 2000: "The Bugs", 2001: "Windows XD", 2002: "Illusthater",
    2003: "iJunes", 2004: "Gfail", 2005: "MeTube", 2006: "Bitter",
    2007: "iFoam SDK", 2008: "Chromium Oxide", 2009: "Minegraft", 2010: "Instagrim",
    2011: "Sorry", 2012: "StrawberryPi", 2013: "Dockyard", 2014: "Slow",
    2015: "TenseFlow", 2016: "Pokemon No", 2017: "Kuberwrecks", 2018: "ClikClok",
    2019: "Doom Meeting", 2020: "Screams", 2021: "CoPillow", 2022: "ChatGPD",
    2023: "Shreds", 2024: "Snora", 2025: "Clod Code",
}

# ========== SIM CONFIG ==========
SIM_CPS = 6
TICK_SIZE = 5       # seconds per tick
MAX_SHIPS = 10
MAX_TIME = 500 * 3600  # 500 hours max per ship
NAP_INTERVAL = 50
NAP_BURST_MUL = 16

# ========== TUNABLE ECONOMY PARAMS ==========
# Change these to test rebalancing
SHIP_BASE = 1e6          # Base LoC for first ship (default: 1e6)
SHIP_MULT = 10           # Threshold multiplier per ship (default: 10)
SHIP_ACCEL = 0.0         # Progressive exponent: effective exp = shipped*(1+accel*shipped)
FAME_PER_POINT = 0.10    # Fame multiplier per point (default: 0.10)
BASE_FAME_GAIN = 1       # Base fame gained per ship (default: 1)
INFLATION_RATE = 1.05    # Cost inflation per ship (default: 1.05)
UNLOCK_DIVISOR = 1       # Unlock every N ships (default: 1 = every ship)
USE_COMPRESSED_RATES = False  # Use compressed coder rate curve


# ========== STATE ==========
class State:
    def __init__(self):
        self.loc = 0.0
        self.tLoc = 0.0
        self.g = [0] * len(GEN)
        self.eu = [[0] * len(EMP_UPS) for _ in range(len(GEN))]
        self.c = [0] * len(CLK)
        self.ss = [0] * len(SUPPORT)
        self.ru = [0] * len(RECRUITER_UPS)
        self.fu = [0] * len(FACILITY_UPS)
        self.cb = 0
        self.cats_seen = []
        self.shipped = 0
        self.fame = 0
        self.tFame = 0
        self.f = {
            "genSpeed": 0, "genCheap": 0, "genSynergy": 0, "genThreads": 0,
            "genReview": 0, "genAcquihire": 0, "genOpenSource": 0, "genPair": 0,
            "clickDouble": 0, "autoClick": 0, "clickFrenzy": 0, "clickPrecision": 0,
            "clickLucky": 0, "autoBotnet": 0, "clickHackathon": 0, "clickCaffeine": 0,
            "engine": 0, "marketing": 0, "publisher": 0, "ventureCapital": 0,
            "goldenParachute": 0, "viralMarketing": 0, "franchise": 0, "ipo": 0,
            "streakUnlock": 0, "streakPower": 0, "streakMastery": 0,
            "streakSecondWind": 0, "streakCombo": 0, "streakTurbo": 0,
            "streakZone": 0, "streakTranscend": 0,
        }
        self.trainer_lvl = [0] * len(GEN)
        self.trainer_ss_lvl = [0] * len(SUPPORT)
        self.trainer_ss_count = [0] * len(SUPPORT)


S = State()


# ========== FORMULAS ==========

def cb_bonus(effect_type):
    v = 0.0
    for i in range(min(S.cb, len(CODE_BASE))):
        if CODE_BASE[i]["effect"] == effect_type:
            v += CODE_BASE[i]["val"]
    return v

def ship_inflation():
    return INFLATION_RATE ** S.shipped

def energy_perk_mul():
    return 1 + 0.30 * S.c[P_ENERGY]

def daycare_mul():
    return 1.6 ** S.c[P_DAYCARE]

def gym_mul():
    return 1 + 0.40 * S.c[P_GYM]

def retreat_mul():
    return 2.50 ** S.c[P_RETREAT]

def desk_discount():
    return 0.90 ** S.c[P_DESK]

def pto_discount():
    return 0.80 ** S.c[P_PTO]

def game_room_mul():
    return 1 + 0.70 * S.c[P_GAMEROOM]

def pet_auto_click():
    return S.c[P_PET] * 2

def fame_mul_val():
    return 1 + FAME_PER_POINT * S.tFame

def hire_cost_mul():
    return ((0.9 ** S.f["genCheap"]) * (0.85 ** S.f["genAcquihire"]) *
            desk_discount() * pto_discount() * (1 - cb_bonus("cheap")))

def gen_speed_mul():
    return ((1 + 0.25 * S.f["genSpeed"]) * (1 + 0.15 * S.f["genThreads"]) *
            (1 + cb_bonus("speed")))

def gen_synergy_mul():
    types_owned = sum(1 for g in S.g if g > 0)
    m = (1 + 0.01 * types_owned) if S.f["genSynergy"] else 1
    if S.f["genReview"]:
        m *= (1 + 0.02 * types_owned)
    return m

def prod_mul():
    pm = (energy_perk_mul() * daycare_mul() * gym_mul() * retreat_mul() *
          fame_mul_val() * (1 + cb_bonus("prod")))
    if S.f["genOpenSource"]:
        pm *= (1 + 0.05 * S.f["genOpenSource"] * S.shipped)
    return pm

def eu_mul(i):
    m = 1.0
    for u in range(len(EMP_UPS)):
        tier = S.eu[i][u]
        if tier > 0:
            m *= EMP_UPS[u]["tiers"][tier - 1]["mult"]
    pair_mul = 1.5 if S.f["genPair"] else 1.0
    t_lvl = S.trainer_lvl[i]
    return m * pair_mul * (1 + 0.01 * t_lvl)

def calc_lps():
    val = 0.0
    for i in range(len(GEN)):
        val += GEN[i]["rate"] * S.g[i] * eu_mul(i)
    return val * gen_speed_mul() * gen_synergy_mul() * prod_mul()

def lunch_bonus():
    total_coders = sum(S.g)
    return S.c[P_LUNCH] * total_coders * 1.0

def click_pow():
    return ((1 + lunch_bonus()) * game_room_mul() * (1 + S.f["clickDouble"]) *
            prod_mul() * (1 + cb_bonus("click")))

def g_cost(i):
    return math.floor(GEN[i]["base"] * GEN[i]["gr"] ** S.g[i] * hire_cost_mul() * ship_inflation())

def c_cost(i):
    return math.floor(CLK[i]["base"] * CLK[i]["gr"] ** S.c[i] * ship_inflation())

def ss_cost(i):
    return math.floor(SUPPORT[i]["base"] * SUPPORT[i]["gr"] ** S.ss[i] * ship_inflation())

def eu_cost_calc(gi, ui):
    tier = S.eu[gi][ui]
    if tier >= len(EMP_UPS[ui]["tiers"]):
        return float("inf")
    t = EMP_UPS[ui]["tiers"][tier]
    return math.floor(t["baseCost"] * EMP_UPS[ui]["gr"] ** tier * GEN[gi]["base"] / 10 * ship_inflation())

def ru_cost(i):
    return math.floor(RECRUITER_UPS[i]["baseCost"] * RECRUITER_UPS[i]["gr"] ** S.ru[i] * ship_inflation())

def fu_cost(i):
    return math.floor(FACILITY_UPS[i]["baseCost"] * FACILITY_UPS[i]["gr"] ** S.fu[i] * ship_inflation())

def ship_at_val():
    effective_exp = S.shipped * (1 + SHIP_ACCEL * S.shipped)
    return math.floor(SHIP_BASE * SHIP_MULT ** effective_exp * (0.9 ** S.f["franchise"]))

def fame_gain():
    base = BASE_FAME_GAIN + 0.5 * S.f["marketing"]
    if S.f["viralMarketing"]:
        base *= (1 + 0.25 * S.f["viralMarketing"])
    if S.f["ipo"]:
        base += math.floor(S.shipped / 5)
    return max(1, math.floor(base))


# ========== STREAK MODEL ==========
def streak_model():
    if not S.f["streakUnlock"]:
        return 1.0, 1.0
    s_max = 2 + S.f["streakPower"] + 2 * S.f["streakTurbo"]
    floor_val = 1.5 if S.f["streakTranscend"] else 1.0
    avg = max(floor_val, s_max * 0.85)
    zone = (1 + 0.25 * S.f["streakZone"]) if (S.f["streakZone"] and avg >= s_max * 0.99) else 1.0
    return avg, zone


# ========== AUTO-CLICK RATE ==========
def auto_click_rate():
    return S.f["autoClick"] + S.f["autoBotnet"] * 2 + pet_auto_click()


# ========== EFFECTIVE PRODUCTION ==========
def effective_lps():
    streak_mul, zone_mul = streak_model()
    base_lps = calc_lps()
    cp = click_pow()

    # Manual clicks
    manual = SIM_CPS * cp * streak_mul
    if S.f["clickPrecision"]:
        manual += SIM_CPS * base_lps * 0.01 * S.f["clickPrecision"]
    if S.f["streakCombo"]:
        manual += SIM_CPS * 0.5 * S.f["streakCombo"] * math.floor(streak_mul)
    lucky_mul = 1 + 0.45 * S.f["clickLucky"]
    manual *= lucky_mul

    # Auto-clicks
    auto_lps = auto_click_rate() * cp

    # Base production with streak and zone
    prod_lps = base_lps * streak_mul * zone_mul

    # Nap bursts as equivalent LPS
    nap_lps = 0.0
    if S.c[P_NAP] > 0:
        nap_interval = NAP_INTERVAL / (1 + 0.5 * S.f["clickHackathon"])
        burst = base_lps * NAP_BURST_MUL * S.c[P_NAP] * (5 if S.f["clickFrenzy"] else 1) * streak_mul * zone_mul
        eff_interval = nap_interval
        if S.f["clickCaffeine"] and auto_click_rate() > 0:
            eff_interval = nap_interval / (1 + auto_click_rate() * 0.3)
        nap_lps = burst / eff_interval

    return prod_lps + manual + auto_lps + nap_lps


# ========== ROI-BASED BUYING ==========
def evaluate_purchases():
    options = []
    current_lps = calc_lps()
    current_eff = effective_lps()
    streak_mul, zone_mul = streak_model()
    unlock_coders = min(len(GEN), 3 + S.shipped // UNLOCK_DIVISOR)
    unlock_perks = min(len(CLK), 3 + S.shipped // UNLOCK_DIVISOR)
    unlock_staff = min(len(SUPPORT), 1 + S.shipped // UNLOCK_DIVISOR)

    # 1. Coder hires
    for i in range(unlock_coders):
        cost = g_cost(i)
        if cost <= 0 or cost == float("inf"):
            continue
        marginal = GEN[i]["rate"] * eu_mul(i) * gen_speed_mul() * gen_synergy_mul() * prod_mul()

        # New type bonus (synergy/review)
        if S.g[i] == 0:
            cur_types = sum(1 for g in S.g if g > 0)
            new_types = cur_types + 1
            syn_before = (1 + 0.01 * cur_types) if S.f["genSynergy"] else 1
            syn_after = (1 + 0.01 * new_types) if S.f["genSynergy"] else 1
            if S.f["genReview"]:
                syn_before *= (1 + 0.02 * cur_types)
                syn_after *= (1 + 0.02 * new_types)
            if syn_before > 0:
                marginal += current_lps * (syn_after / syn_before - 1)

        marginal *= streak_mul * zone_mul
        options.append(("coder", i, cost, marginal, GEN[i]["name"]))

    # 2. Equipment upgrades
    for gi in range(unlock_coders):
        if S.g[gi] == 0:
            continue
        for ui in range(len(EMP_UPS)):
            tier = S.eu[gi][ui]
            if tier >= len(EMP_UPS[ui]["tiers"]):
                continue
            cost = eu_cost_calc(gi, ui)
            if cost <= 0 or cost == float("inf"):
                continue
            new_mult = EMP_UPS[ui]["tiers"][tier]["mult"]
            old_mult = EMP_UPS[ui]["tiers"][tier - 1]["mult"] if tier > 0 else 1
            ratio = new_mult / old_mult
            coder_lps = GEN[gi]["rate"] * S.g[gi] * eu_mul(gi) * gen_speed_mul() * gen_synergy_mul() * prod_mul()
            marginal = coder_lps * (ratio - 1) * streak_mul * zone_mul
            options.append(("equip", (gi, ui), cost, marginal,
                          f"{GEN[gi]['name']} {EMP_UPS[ui]['id']} T{tier+1}"))

    # 3. Perks
    for i in range(unlock_perks):
        cost = c_cost(i)
        if cost <= 0 or cost == float("inf"):
            continue
        marginal = 0.0

        if i == P_LUNCH:
            total_coders = sum(S.g)
            click_rate = SIM_CPS + auto_click_rate()
            marginal = total_coders * click_rate * prod_mul() * game_room_mul() * (1 + S.f["clickDouble"]) * (1 + cb_bonus("click"))
        elif i == P_ENERGY:
            marginal = current_eff * 0.30 / energy_perk_mul()
        elif i == P_DESK:
            marginal = current_eff * 0.02
        elif i == P_DAYCARE:
            marginal = current_eff * 0.6
        elif i == P_PET:
            marginal = 2 * click_pow() * streak_mul
        elif i == P_GYM:
            marginal = current_eff * 0.40 / gym_mul()
        elif i == P_GAMEROOM:
            total_click_rate = SIM_CPS + auto_click_rate()
            marginal = total_click_rate * click_pow() * 0.70 / game_room_mul() * streak_mul
        elif i == P_PTO:
            marginal = current_eff * 0.03
        elif i == P_NAP:
            nap_interval = NAP_INTERVAL / (1 + 0.5 * S.f["clickHackathon"])
            eff_interval = nap_interval
            if S.f["clickCaffeine"] and auto_click_rate() > 0:
                eff_interval = nap_interval / (1 + auto_click_rate() * 0.3)
            new_level = S.c[P_NAP] + 1
            frenzy = 5 if S.f["clickFrenzy"] else 1
            new_burst = current_lps * NAP_BURST_MUL * new_level * frenzy * streak_mul * zone_mul / eff_interval
            old_burst = current_lps * NAP_BURST_MUL * S.c[P_NAP] * frenzy * streak_mul * zone_mul / eff_interval if S.c[P_NAP] > 0 else 0
            marginal = new_burst - old_burst
        elif i == P_RETREAT:
            marginal = current_eff * 1.5

        if marginal > 0:
            options.append(("perk", i, cost, marginal, CLK[i]["name"]))

    # 4. Staff
    for i in range(unlock_staff):
        if S.ss[i] >= 1:
            continue
        cost = ss_cost(i)
        if cost <= 0 or cost == float("inf"):
            continue
        marginal = 0.0

        if i == SS_SECRETARY:
            marginal = current_eff * 0.01
        elif i == SS_RECRUITER:
            rec_interval = 5 if S.ru[1] >= 1 else 10
            best_coder_m = 0
            for j in range(unlock_coders):
                m = GEN[j]["rate"] * eu_mul(j) * gen_speed_mul() * gen_synergy_mul() * prod_mul() * streak_mul * zone_mul
                best_coder_m = max(best_coder_m, m)
            hires = 2 if S.ru[0] >= 1 else 1
            marginal = best_coder_m * hires / rec_interval
        elif i == SS_MANAGER:
            marginal = current_eff * 0.05
        elif i == SS_FACILITY:
            marginal = current_eff * 0.04
        elif i == SS_TRAINER:
            marginal = current_eff * 0.02

        if marginal > 0:
            options.append(("staff", i, cost, marginal, SUPPORT[i]["name"]))

    # 5. Staff upgrades
    if S.ss[SS_RECRUITER] >= 1:
        for i in range(len(RECRUITER_UPS)):
            if S.ru[i] >= 1:
                continue
            cost = ru_cost(i)
            if cost <= 0 or cost == float("inf"):
                continue
            options.append(("ru_up", i, cost, current_eff * 0.02, f"Recruiter:{RECRUITER_UPS[i]['id']}"))

    if S.ss[SS_FACILITY] >= 1:
        for i in range(len(FACILITY_UPS)):
            if S.fu[i] >= 1:
                continue
            cost = fu_cost(i)
            if cost <= 0 or cost == float("inf"):
                continue
            options.append(("fu_up", i, cost, current_eff * 0.02, f"Facility:{FACILITY_UPS[i]['id']}"))

    # Sort by ROI descending
    options.sort(key=lambda o: o[3] / o[2] if o[2] > 0 else 0, reverse=True)
    return options


def buy_best():
    options = evaluate_purchases()
    target = ship_at_val()
    remaining = target - S.tLoc

    for opt in options:
        kind, idx, cost, marginal, name = opt
        if cost > S.loc:
            continue

        # Don't spend too much when close to shipping
        if remaining > 0 and remaining < target * 0.05 and cost > S.loc * 0.3:
            continue

        # Payback heuristic
        if marginal > 0:
            payback = cost / marginal
            est_remaining = remaining / max(1, effective_lps())
            if payback > est_remaining * 0.6 and remaining > 0 and remaining < target * 0.5:
                continue

        if kind == "coder":
            S.loc -= cost; S.g[idx] += 1
        elif kind == "equip":
            gi, ui = idx
            S.loc -= cost; S.eu[gi][ui] += 1
        elif kind == "perk":
            S.loc -= cost; S.c[idx] += 1
        elif kind == "staff":
            S.loc -= cost; S.ss[idx] = 1
        elif kind == "ru_up":
            S.loc -= cost; S.ru[idx] = 1
        elif kind == "fu_up":
            S.loc -= cost; S.fu[idx] = 1
        return True
    return False


# ========== FAME SPENDING ==========
def spend_fame():
    purchases = []

    def score_upgrade(tree_idx, upg_idx):
        tree = FAME_TREE[tree_idx]
        upg = tree["upgrades"][upg_idx]
        uid = upg["id"]
        if S.f[uid] >= upg["max"]:
            return -1

        # Check prereq
        if upg["req"] >= 0:
            req_upg = tree["upgrades"][upg["req"]]
            if S.f[req_upg["id"]] < 1:
                return -1

        cost = upg["cost"]
        if cost > S.fame:
            return -1

        # Dynamic scoring based on actual game state
        remaining_ships = MAX_SHIPS - S.shipped
        cur_lps = calc_lps() if calc_lps() > 0 else 1

        if uid == "engine":
            # Start with 18 coders — massive early-game boost. Score very high.
            if S.f["engine"] == 0:
                # Value: production of 10 interns + 5 juniors + 3 mids at start of run
                starter_lps = (10 * GEN[0]["rate"] + 5 * GEN[1]["rate"] + 3 * GEN[2]["rate"])
                return 100 / cost  # Always top priority
            return -1
        elif uid == "marketing":
            # Compound fame investment with diminishing returns.
            # First few levels are great, but past ~5 the marginal value drops.
            cur_level = S.f["marketing"]
            if cur_level >= 8:
                return 3 / cost  # Diminishing returns
            added_per_ship = 0.5
            if S.f["viralMarketing"]:
                added_per_ship *= (1 + 0.25 * S.f["viralMarketing"])
            total_added = added_per_ship * remaining_ships
            # Scale down with current level
            return (20 + total_added * 2) / (cost * (1 + cur_level * 0.3))
        elif uid == "viralMarketing":
            # +25% multiplicative on fame gain. Value depends on marketing level.
            cur_base = 1 + 0.5 * S.f["marketing"]
            added = cur_base * 0.25 * remaining_ships
            return (15 + added * 2) / cost
        elif uid == "streakUnlock":
            # Unlock 2× streak multiplier — doubles all production
            return 80 / cost
        elif uid == "streakPower":
            return 18 / cost
        elif uid == "streakTurbo":
            return 15 / cost
        elif uid == "streakZone":
            return 12 / cost
        elif uid == "streakMastery":
            return 10 / cost
        elif uid == "genSpeed":
            return 20 / cost
        elif uid == "genThreads":
            return 12 / cost
        elif uid == "genPair":
            return 35 / cost
        elif uid == "clickDouble":
            return 15 / cost
        elif uid == "autoClick":
            return 10 / cost
        elif uid == "autoBotnet":
            return 9 / cost
        elif uid == "clickPrecision":
            return 8 / cost
        elif uid == "genCheap":
            return 7 / cost
        elif uid == "genAcquihire":
            return 6 / cost
        elif uid == "genSynergy":
            return 6 / cost
        elif uid == "genReview":
            return 5 / cost
        elif uid == "genOpenSource":
            return max(3, 3 * S.shipped) / cost
        elif uid == "franchise":
            return 15 / cost
        elif uid == "clickFrenzy":
            return (20 if S.c[P_NAP] > 0 else 3) / cost
        elif uid == "clickHackathon":
            return (12 if S.c[P_NAP] > 0 else 2) / cost
        elif uid == "clickCaffeine":
            return (15 if (S.c[P_NAP] > 0 and auto_click_rate() > 0) else 2) / cost
        elif uid == "publisher":
            return 5 / cost
        elif uid == "ventureCapital":
            return 4 / cost
        elif uid == "goldenParachute":
            return 5 / cost
        elif uid == "ipo":
            return (8 if S.shipped >= 5 else 2) / cost
        elif uid == "clickLucky":
            return 4 / cost
        elif uid == "streakSecondWind":
            return 4 / cost
        elif uid == "streakCombo":
            return 3 / cost
        elif uid == "streakTranscend":
            return 5 / cost
        return 1 / cost

    did_buy = True
    while did_buy:
        did_buy = False
        best_score, best_t, best_u = -1, -1, -1
        # Also track the best upgrade we CAN'T yet afford (for saving logic)
        best_unaffordable_score, best_unaffordable_cost = -1, 0

        for t in range(len(FAME_TREE)):
            for u in range(len(FAME_TREE[t]["upgrades"])):
                tree = FAME_TREE[t]
                upg = tree["upgrades"][u]
                uid = upg["id"]
                if S.f[uid] >= upg["max"]:
                    continue
                if upg["req"] >= 0:
                    req_upg = tree["upgrades"][upg["req"]]
                    if S.f[req_upg["id"]] < 1:
                        continue
                cost = upg["cost"]
                s = score_upgrade(t, u)
                if s <= 0:
                    # Could be unaffordable (-1 from cost check)
                    # Score it without the cost check
                    if cost > S.fame and cost <= S.fame + 5:
                        # Recalculate score ignoring affordability
                        old_fame = S.fame
                        S.fame = cost  # temporarily make affordable
                        s2 = score_upgrade(t, u)
                        S.fame = old_fame
                        if s2 > best_unaffordable_score:
                            best_unaffordable_score = s2
                            best_unaffordable_cost = cost
                    continue
                if s > best_score:
                    best_score = s; best_t = t; best_u = u

        # If the best unaffordable option is significantly better than the best affordable,
        # save fame instead of spending
        if best_score > 0 and best_unaffordable_score > best_score * 1.5:
            # Save fame — don't buy anything this round
            break

        if best_score > 0:
            upg = FAME_TREE[best_t]["upgrades"][best_u]
            S.fame -= upg["cost"]
            S.f[upg["id"]] += 1
            lvl = S.f[upg["id"]]
            purchases.append(f"{upg['id']}{'x' + str(lvl) if lvl > 1 else ''}")
            did_buy = True

    return purchases


# ========== AUTOMATION ==========
def simulate_automation(dt):
    unlock_coders = min(len(GEN), 3 + S.shipped // UNLOCK_DIVISOR)
    unlock_perks = min(len(CLK), 3 + S.shipped // UNLOCK_DIVISOR)

    # Recruiter
    if S.ss[SS_RECRUITER] >= 1:
        interval = (5 if S.ru[1] >= 1 else 10) / (1 + 0.02 * S.trainer_ss_lvl[SS_RECRUITER])
        hires = int(dt / interval)
        if hires > 0:
            per_cycle = 2 if S.ru[0] >= 1 else 1
            if S.ru[2] >= 1:
                ranked = sorted(range(unlock_coders),
                              key=lambda i: GEN[i]["rate"] * eu_mul(i) / max(1, g_cost(i)),
                              reverse=True)[:3]
                for tgt in ranked:
                    for _ in range(hires * per_cycle):
                        c = g_cost(tgt)
                        if S.loc >= c:
                            S.loc -= c; S.g[tgt] += 1
            else:
                best_idx = max(range(unlock_coders),
                             key=lambda i: GEN[i]["rate"] * eu_mul(i) / max(1, g_cost(i)))
                for _ in range(hires * per_cycle):
                    c = g_cost(best_idx)
                    if S.loc >= c:
                        S.loc -= c; S.g[best_idx] += 1

    # Office Manager
    if S.ss[SS_MANAGER] >= 1:
        interval = 20 / (1 + 0.02 * S.trainer_ss_lvl[SS_MANAGER])
        buys = int(dt / interval)
        for _ in range(buys):
            cheapest_idx = min(range(unlock_perks), key=lambda i: c_cost(i))
            cost = c_cost(cheapest_idx)
            if S.loc >= cost:
                S.loc -= cost; S.c[cheapest_idx] += 1

    # Facility Director
    if S.ss[SS_FACILITY] >= 1:
        interval = (15 if S.fu[0] >= 1 else 30) / (1 + 0.02 * S.trainer_ss_lvl[SS_FACILITY])
        buys = int(dt / interval)
        per_cycle = 2 if S.fu[1] >= 1 else 1
        for _ in range(buys * per_cycle):
            if S.fu[2] >= 1:
                best_gi, best_ui, best_val = -1, -1, 0
                for gi in range(unlock_coders):
                    if S.g[gi] == 0:
                        continue
                    for ui in range(len(EMP_UPS)):
                        tier = S.eu[gi][ui]
                        if tier >= len(EMP_UPS[ui]["tiers"]):
                            continue
                        c = eu_cost_calc(gi, ui)
                        if c == float("inf") or c <= 0:
                            continue
                        new_m = EMP_UPS[ui]["tiers"][tier]["mult"]
                        old_m = EMP_UPS[ui]["tiers"][tier - 1]["mult"] if tier > 0 else 1
                        val = (new_m - old_m) / c
                        if val > best_val and S.loc >= c:
                            best_val = val; best_gi = gi; best_ui = ui
                if best_gi >= 0:
                    S.loc -= eu_cost_calc(best_gi, best_ui); S.eu[best_gi][best_ui] += 1
            else:
                cheap_gi, cheap_ui, cheap_cost = -1, -1, float("inf")
                for gi in range(unlock_coders):
                    if S.g[gi] == 0:
                        continue
                    for ui in range(len(EMP_UPS)):
                        if S.eu[gi][ui] >= len(EMP_UPS[ui]["tiers"]):
                            continue
                        c = eu_cost_calc(gi, ui)
                        if c < cheap_cost:
                            cheap_cost = c; cheap_gi = gi; cheap_ui = ui
                if cheap_gi >= 0 and S.loc >= cheap_cost:
                    S.loc -= cheap_cost; S.eu[cheap_gi][cheap_ui] += 1

    # Trainer
    if S.ss[SS_TRAINER] >= 1:
        level_ups = int(dt / 30)
        if level_ups > 0:
            owned = [i for i in range(len(GEN)) if S.g[i] > 0]
            if owned:
                for l in range(level_ups):
                    pick = owned[l % len(owned)]
                    S.trainer_lvl[pick] += 1
            for si in range(len(SUPPORT)):
                if S.ss[si] >= 1:
                    S.trainer_ss_count[si] += level_ups
                    while S.trainer_ss_count[si] >= 3:
                        S.trainer_ss_count[si] -= 3
                        S.trainer_ss_lvl[si] += 1


# ========== SHIP ==========
def do_ship():
    year = 1979 + S.shipped
    cat = LANDMARKS.get(year, "Unknown")
    name = LANDMARK_NAMES.get(year, f"Game{S.shipped + 1}")

    if cat not in S.cats_seen:
        S.cats_seen.append(cat)
        if S.cb < len(CODE_BASE):
            S.cb += 1

    gain = fame_gain()
    S.fame += gain
    S.tFame += gain
    S.shipped += 1

    keep_loc = S.tLoc * 0.05 * S.f["goldenParachute"] if S.f["goldenParachute"] else 0

    S.loc = 0; S.tLoc = 0
    S.g = [0] * len(GEN)
    S.eu = [[0] * len(EMP_UPS) for _ in range(len(GEN))]
    S.c = [0] * len(CLK)
    S.ss = [0] * len(SUPPORT)
    S.ru = [0] * len(RECRUITER_UPS)
    S.fu = [0] * len(FACILITY_UPS)
    S.trainer_lvl = [0] * len(GEN)
    S.trainer_ss_lvl = [0] * len(SUPPORT)
    S.trainer_ss_count = [0] * len(SUPPORT)

    if S.f["engine"]:
        S.g[0] = 10; S.g[1] = 5; S.g[2] = 3

    if S.f["ventureCapital"]:
        S.loc += 1000 * S.f["ventureCapital"]
        S.tLoc += 1000 * S.f["ventureCapital"]

    if keep_loc > 0:
        S.loc += keep_loc
        S.tLoc += keep_loc

    return name, cat, gain, year


# ========== FORMATTING ==========
def fmt(n):
    if n >= 1e12: return f"{n/1e12:.2f}T"
    if n >= 1e9:  return f"{n/1e9:.2f}B"
    if n >= 1e6:  return f"{n/1e6:.2f}M"
    if n >= 1e3:  return f"{n/1e3:.1f}K"
    return f"{n:.0f}"

def fmt_time(secs):
    h = int(secs // 3600)
    m = int((secs % 3600) // 60)
    if h > 0: return f"{h}h {m}m"
    return f"{m}m"


# ========== MAIN ==========
def simulate():
    global S
    S = State()
    results = []
    prev_time = 0

    print("=" * 50)
    print("  SOFTWARE DEV CLICKER - ECONOMY SIMULATION")
    print(f"  CPS: {SIM_CPS} | Max ships: {MAX_SHIPS}")
    print("=" * 50)
    print()

    for ship_num in range(MAX_SHIPS):
        target = ship_at_val()
        time = 0
        timed_out = False

        # Snapshot coders before the run (after fame spending / reset)
        while S.tLoc < target:
            time += TICK_SIZE
            if time > MAX_TIME:
                timed_out = True
                break

            # Production
            eff = effective_lps()
            produced = eff * TICK_SIZE
            S.loc += produced
            S.tLoc += produced

            # Automation
            simulate_automation(TICK_SIZE)

            # Manual buying (up to 10 purchases per tick)
            for _ in range(10):
                if not buy_best():
                    break

        if timed_out:
            print(f"=== Ship {ship_num + 1} === TIMEOUT (>{fmt_time(MAX_TIME)}) ===")
            print(f"  Target: {fmt(target)} LoC | Reached: {fmt(S.tLoc)} ({S.tLoc/target*100:.1f}%)")
            print(f"  End LPS: {fmt(effective_lps())}/s")
            break

        ratio = time / prev_time if prev_time > 0 else 0
        total_coders = sum(S.g)
        total_perks = sum(S.c)
        total_staff = sum(S.ss)
        end_lps = effective_lps()

        # Coder breakdown
        coder_details = []
        for i in range(len(GEN)):
            if S.g[i] > 0:
                coder_details.append(f"{GEN[i]['name'].split()[0]}:{S.g[i]}")

        # Equipment breakdown
        equip_count = sum(S.eu[i][u] for i in range(len(GEN)) for u in range(len(EMP_UPS)))

        name, cat, gain, year = do_ship()
        fame_purchases = spend_fame()

        print(f"=== Ship {ship_num + 1}: {name} ({cat}) — Year {year} ===")
        print(f"  Target: {fmt(target)} LoC")
        ratio_str = f" | Ratio: {ratio:.2f}x" if ratio > 0 else ""
        print(f"  Time: {fmt_time(time)} ({time:,}s){ratio_str}")
        print(f"  End LPS: {fmt(end_lps)}/s | Coders: {total_coders} [{', '.join(coder_details)}]")
        print(f"  Perks: {total_perks}/{min(10, 3 + ship_num)} | Staff: {total_staff}/{min(5, 1 + ship_num)} | Equip tiers: {equip_count}")
        print(f"  Fame gained: {gain} | Total fame: {S.tFame} | Remaining: {S.fame}")
        if fame_purchases:
            print(f"  Fame spent: [{', '.join(fame_purchases)}]")
        print(f"  Code Base: {S.cb}/{len(CODE_BASE)} | Categories: {len(S.cats_seen)}")
        print()

        results.append({
            "ship": ship_num + 1, "time": time, "ratio": ratio,
            "target": target, "end_lps": end_lps, "coders": total_coders,
        })
        prev_time = time

    # Summary table
    print("=" * 70)
    print("  SUMMARY")
    print("=" * 70)
    print(f"{'Ship':>4} | {'Time':>11} | {'Ratio':>6} | {'Target LoC':>13} | {'End LPS':>10}")
    print("-" * 4 + "-+-" + "-" * 11 + "-+-" + "-" * 6 + "-+-" + "-" * 13 + "-+-" + "-" * 10)
    for r in results:
        ratio_str = f"{r['ratio']:.2f}x" if r["ratio"] > 0 else "  -  "
        print(f"  {r['ship']:2d} | {fmt_time(r['time']):>11} | {ratio_str:>6} | {fmt(r['target']):>13} | {fmt(r['end_lps'])}/s")

    # Fame state
    print("\nFame upgrades:")
    fame_str = "  "
    for key, val in S.f.items():
        if val > 0:
            fame_str += f"{key}:{val}  "
    print(fame_str)


def run_config(name, base, mult, accel, fame_pt, base_fame, inflation, unlock_div, compressed=False):
    global SHIP_BASE, SHIP_MULT, SHIP_ACCEL, FAME_PER_POINT, BASE_FAME_GAIN, INFLATION_RATE, UNLOCK_DIVISOR, USE_COMPRESSED_RATES, GEN, S
    SHIP_BASE = base
    SHIP_MULT = mult
    SHIP_ACCEL = accel
    FAME_PER_POINT = fame_pt
    BASE_FAME_GAIN = base_fame
    INFLATION_RATE = inflation
    UNLOCK_DIVISOR = unlock_div
    USE_COMPRESSED_RATES = compressed
    GEN = GEN_COMPRESSED if compressed else GEN_ORIGINAL
    S = State()
    rates_label = "COMPRESSED(3x)" if compressed else "ORIGINAL(5x)"
    print(f"\n{'='*60}")
    print(f"  CONFIG: {name}")
    print(f"  Base={base:.0f} Mult={mult}x Accel={accel} Fame/pt={fame_pt}")
    print(f"  BaseFame={base_fame} Infl={inflation} UnlockEvery={unlock_div}ships")
    print(f"  CoderRates={rates_label}")
    print(f"{'='*60}")
    simulate()


if __name__ == "__main__":
    import sys
    if len(sys.argv) > 1 and sys.argv[1] == "--compare":
        #                 name,              base,  mult, accel, fame/pt, basefame, infl, unlock, compressed
        configs = [
            ("CURRENT",       1e6,   10,  0.0,   0.10, 1, 1.05, 1, False),
            ("COMPRESSED_3x", 1e6,   10,  0.0,   0.10, 2, 1.03, 1, True),
            ("COMPRESS+SLOW", 1e6,   10,  0.0,   0.10, 2, 1.03, 2, True),
            ("FINAL",         1e6,    8,  0.04,  0.12, 2, 1.03, 2, True),
        ]
        for cfg in configs:
            run_config(*cfg)
    else:
        simulate()
