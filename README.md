# CaloEat (कैलरीईट / கலோஈட்) 🥗🔥
### AI-Powered Food Recognition, Calorie Estimation & Personalized Nutrition System

CaloEat is a modern, cross-platform mobile health-tech application built with **React Native**, **Expo**, and **TypeScript**. It is designed specifically with strong support for **Indian regional cuisines** (South Indian, North Indian, Hyderabadi, street foods, thalis) and international staples, combining multimodal AI recognition with honest portion scaling and verified metabolic calculations.

---

## 🎨 Visual Design System & Aesthetics
- **Primary Brand Color:** Warm Terracotta / Orange (`#C96442`)
- **Supporting Accents:** Warm-neutral backgrounds (`#FAF7F2`), crisp white cards with soft elevated shadows, generous whitespace, and high-readability typography.
- **Macronutrient Color Coding:**
  - 🔵 **Protein:** `#3B82F6` (Muscle synthesis & repair, 4 kcal/g)
  - 🟡 **Carbohydrates:** `#EAB308` (Sustained energy, 4 kcal/g)
  - 🟢 **Healthy Fats:** `#10B981` (Hormone balance & cellular health, 9 kcal/g)
  - 🟣 **Dietary Fiber:** `#8B5CF6` (Digestive health & satiety, 14g/1000 kcal)

---

## 📱 Navigation & Core Architecture
CaloEat uses a **persistent 5-destination bottom navigation bar**:
1. **Home:** Daily calorie ring dial, macronutrient progress, hydration tracker (250ml glass check-ins), meal cards for Breakfast, Lunch, Dinner & Snacks, and mood check-in.
2. **Trends:** Weekly & monthly caloric intake vs. target benchmark, macro averages, regional cuisine breakdown, and 3 personalized AI observations.
3. **Scan (Prominent Raised Central Action):** Multimodal food scanner preview, plate itemization (separating rice, dal, roti, paneer), portion control slider (0.5x to 4x), plausible calorie ranges (e.g. 540–640 kcal), and instant logging.
4. **Log:** Chronological daily journal, filtering by meal type, itemized nutrient breakdowns, and delete/edit capabilities.
5. **Profile:** Biometric updates, Mifflin-St Jeor & Katch-McArdle live recalculations, activity level adjustments, weight goals, and health safety disclaimers.

---

## 🧮 Metabolic Science & Safety Guardrails
- **Basal Metabolic Rate (BMR):**
  - **Mifflin-St Jeor Formula (Default):**
    - Male: `10 × weight(kg) + 6.25 × height(cm) - 5 × age + 5`
    - Female: `10 × weight(kg) + 6.25 × height(cm) - 5 × age - 161`
  - **Katch-McArdle Formula (When valid body fat % is provided):**
    - `BMR = 370 + 21.6 × Lean Body Mass(kg)`
- **Total Daily Energy Expenditure (TDEE):**
  - Sedentary (`1.2x`), Lightly Active (`1.375x`), Moderately Active (`1.55x`), Very Active (`1.725x`), Extra Active (`1.9x`).
- **Goal Adjustments:**
  - Weight Loss: Conservative `-400 kcal/day` deficit (safe, sustainable fat loss).
  - Maintenance: `0 kcal/day`.
  - Muscle Gain: Controlled `+350 kcal/day` surplus.
- **Health Guardrails:**
  - Absolute safety floor of `1,200 kcal/day` (females) and `1,500 kcal/day` (males).
  - Explicit safety advisory warning for minors under 18 years old.

---

## 📁 Project Directory Structure
```
samitha/
├── App.tsx                     # Root application container & navigation router
├── app.json                    # Expo configuration & app metadata
├── package.json                # Project dependencies & scripts
├── tsconfig.json               # Strict TypeScript configuration
├── assets/                     # App icons & visual assets
└── src/
    ├── components/
    │   ├── AddFoodModal.tsx    # Searchable food modal with portion multiplier (0.5x–3x)
    │   ├── BottomTabBar.tsx    # Persistent bottom navigation with raised Scan button
    │   ├── CalorieRing.tsx     # SVG circular progress ring (consumed / remaining / target)
    │   ├── Header.tsx          # CaloEat branding, friendly greeting, date & streak badge
    │   ├── MacroBar.tsx        # Protein, Carbs, Fat & Fiber bars with 4/4/9 kcal breakdown
    │   └── MealCard.tsx        # Meal slot card with expandable items and AI insights
    ├── data/
    │   └── foodDatabase.ts     # Authentic Indian regional & global food composition table
    ├── screens/
    │   ├── HomeScreen.tsx      # Main daily dashboard & hydration tracker
    │   ├── LogScreen.tsx       # Filterable food journal & itemized history
    │   ├── OnboardingScreen.tsx# 4-step guided physiological profile setup
    │   ├── ProfileScreen.tsx   # Biometrics, metabolic recalculator, and data reset
    │   ├── ScanScreen.tsx      # Multimodal plate scanner, thali separation & portion control
    │   └── TrendsScreen.tsx    # Weekly intake charts, cuisine distribution & AI observations
    ├── tests/
    │   ├── metabolicAndNutrition.test.ts # Type-level verification suite
    │   └── runTests.js         # Automated executable test runner
    ├── theme/
    │   └── colors.ts           # Warm terracotta theme tokens, shadows & spacing
    ├── types/
    │   └── index.ts            # Type definitions (UserProfile, MealLog, FoodItem, etc.)
    └── utils/
        ├── metabolic.ts        # Mifflin-St Jeor, Katch-McArdle, TDEE & macro split logic
        └── storage.ts          # AsyncStorage local persistence & data seeding
```

---

## 🚀 How to Run the App (Beginner Step-by-Step)

### Step 1: Start the Development Server
Open your terminal inside this directory and run:
```bash
npm start
```
*(On Windows PowerShell, you can also use `npx.cmd expo start`)*

### Step 2: Open on your Phone
1. Install the free **Expo Go** app from the Google Play Store (Android) or App Store (iOS).
2. Scan the QR code displayed in your terminal using the Expo Go camera (Android) or default Camera app (iOS).
3. The app will immediately bundle and load on your phone!

### Step 3: Run the Automated Verification Suite
To verify that all metabolic equations, daily totals, and portion calculations are working with zero errors:
```bash
npm test
```

### Step 4: Run the TypeScript Typechecker
```bash
npm run typecheck
```
