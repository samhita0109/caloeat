// Node test runner for CaloEat Metabolic and Nutrition Calculation Engine

function calculateMifflinStJeorBMR(weightKg, heightCm, age, sex) {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? Math.round(base + 5) : Math.round(base - 161);
}

function calculateKatchMcArdleBMR(weightKg, bodyFatPercentage) {
  if (weightKg <= 0 || bodyFatPercentage <= 0 || bodyFatPercentage >= 70) return 0;
  const leanBodyMassKg = weightKg * (1 - bodyFatPercentage / 100);
  return Math.round(370 + 21.6 * leanBodyMassKg);
}

function calculateBMR(weightKg, heightCm, age, sex, bodyFatPercentage) {
  if (bodyFatPercentage && bodyFatPercentage >= 4 && bodyFatPercentage <= 55) {
    const katchBmr = calculateKatchMcArdleBMR(weightKg, bodyFatPercentage);
    if (katchBmr > 0) {
      return { bmr: katchBmr, formulaUsed: 'Katch-McArdle' };
    }
  }
  return {
    bmr: calculateMifflinStJeorBMR(weightKg, heightCm, age, sex),
    formulaUsed: 'Mifflin-St Jeor',
  };
}

const ACTIVITY_MULTIPLIERS = {
  sedentary: 1.2,
  lightly_active: 1.375,
  moderately_active: 1.55,
  very_active: 1.725,
  extra_active: 1.9,
};

function calculateTDEE(bmr, activityLevel) {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel] || 1.2;
  return Math.round(bmr * multiplier);
}

function calculateDailyCalorieTarget(tdee, goal, sex, age) {
  let adjustment = 0;
  if (goal === 'lose') adjustment = -400;
  else if (goal === 'gain') adjustment = 350;

  let target = tdee + adjustment;
  const minSafeFloor = sex === 'male' ? 1500 : 1200;
  let warning = undefined;

  if (age < 18) {
    warning = 'Notice: Standard adult metabolic equations and caloric deficits are not suitable for minors.';
  } else if (target < minSafeFloor) {
    target = minSafeFloor;
    warning = `Goal-adjusted intake fell below safe physiological threshold. Adjusted to ${minSafeFloor} kcal.`;
  }

  return { target: Math.round(target), adjustment, warning };
}

function calculateMacroTargets(dailyCalories) {
  return {
    proteinGrams: Math.round((dailyCalories * 0.25) / 4),
    carbsGrams: Math.round((dailyCalories * 0.45) / 4),
    fatGrams: Math.round((dailyCalories * 0.30) / 9),
    fiberGrams: Math.max(25, Math.round((dailyCalories / 1000) * 14)),
  };
}

function recalculateDailyTotals(meals) {
  let cal = 0, p = 0, c = 0, f = 0, fib = 0;
  for (const m of meals) {
    cal += m.totalCalories;
    p += m.totalProteinG;
    c += m.totalCarbsG;
    f += m.totalFatG;
    fib += m.totalFiberG;
  }
  return {
    totalCaloriesConsumed: Math.round(cal),
    totalProteinG: Math.round(p * 10) / 10,
    totalCarbsG: Math.round(c * 10) / 10,
    totalFatG: Math.round(f * 10) / 10,
    totalFiberG: Math.round(fib * 10) / 10,
  };
}

// RUN TESTS
console.log('\n======================================================');
console.log('       CALOEAT NUTRITION & METABOLIC TEST SUITE       ');
console.log('======================================================\n');

let passed = 0;
let failed = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`✅ PASS: ${testName}`);
    passed++;
  } else {
    console.error(`❌ FAIL: ${testName}`);
    failed++;
  }
}

// 1. Male BMR (70kg, 175cm, 22yo male) -> 10*70 + 6.25*175 - 5*22 + 5 = 1689
const bmrMale = calculateMifflinStJeorBMR(70, 175, 22, 'male');
assert(bmrMale === 1689, `Mifflin-St Jeor Male BMR (expected 1689, got ${bmrMale})`);

// 2. Female BMR (60kg, 165cm, 24yo female) -> 10*60 + 6.25*165 - 5*24 - 161 = 1350
const bmrFemale = calculateMifflinStJeorBMR(60, 165, 24, 'female');
assert(bmrFemale === 1350, `Mifflin-St Jeor Female BMR (expected 1350, got ${bmrFemale})`);

// 3. Katch-McArdle with Body Fat % (70kg, 15% fat -> 59.5kg LBM) -> 370 + 21.6*59.5 = 1655
const bmrKatch = calculateKatchMcArdleBMR(70, 15);
assert(bmrKatch === 1655, `Katch-McArdle Lean Body Mass BMR (expected 1655, got ${bmrKatch})`);

// 4. Formula selection preference
const bmrSelected1 = calculateBMR(70, 175, 22, 'male', 15);
assert(bmrSelected1.formulaUsed === 'Katch-McArdle' && bmrSelected1.bmr === 1655, 'Prefers Katch-McArdle when body fat % provided');

const bmrSelected2 = calculateBMR(70, 175, 22, 'male');
assert(bmrSelected2.formulaUsed === 'Mifflin-St Jeor' && bmrSelected2.bmr === 1689, 'Falls back to Mifflin-St Jeor when body fat % absent');

// 5. TDEE Calculation with activity multipliers
const tdeeMod = calculateTDEE(1689, 'moderately_active');
assert(tdeeMod === Math.round(1689 * 1.55), `TDEE multiplier (1.55x expected ${Math.round(1689 * 1.55)}, got ${tdeeMod})`);

// 6. Safe Deficit & Floor
const targetDeficit = calculateDailyCalorieTarget(2618, 'lose', 'male', 22);
assert(targetDeficit.target === 2218 && targetDeficit.adjustment === -400, 'Weight loss applies conservative -400 kcal deficit');

const targetFloor = calculateDailyCalorieTarget(1300, 'lose', 'female', 25);
assert(targetFloor.target === 1200, `Female safety floor enforced at 1200 kcal min (got ${targetFloor.target})`);

const minorCheck = calculateDailyCalorieTarget(2200, 'lose', 'male', 15);
assert(!!minorCheck.warning, 'Minor safety warning triggered for age < 18');

// 7. Macro Splits (4/4/9 kcal/g)
const macroSplit = calculateMacroTargets(2000);
assert(macroSplit.proteinGrams === 125, `Protein target: 25% of 2000 kcal / 4 = 125g (got ${macroSplit.proteinGrams}g)`);
assert(macroSplit.carbsGrams === 225, `Carbs target: 45% of 2000 kcal / 4 = 225g (got ${macroSplit.carbsGrams}g)`);
assert(macroSplit.fatGrams === 67, `Fat target: 30% of 2000 kcal / 9 = 67g (got ${macroSplit.fatGrams}g)`);
assert(macroSplit.fiberGrams === 28, `Fiber target: 14g per 1000 kcal = 28g (got ${macroSplit.fiberGrams}g)`);

// 8. Portion scaling and daily totals
const meal1 = {
  totalCalories: 360,
  totalProteinG: 6.2,
  totalCarbsG: 52.0,
  totalFatG: 14.5,
  totalFiberG: 4.8,
};
const meal2 = {
  totalCalories: 580,
  totalProteinG: 31.0,
  totalCarbsG: 68.0,
  totalFatG: 20.5,
  totalFiberG: 4.2,
};
const daily = recalculateDailyTotals([meal1, meal2]);
assert(daily.totalCaloriesConsumed === 940, `Daily calories summed correctly (360 + 580 = 940, got ${daily.totalCaloriesConsumed})`);
assert(daily.totalProteinG === 37.2, `Daily protein summed correctly (6.2 + 31.0 = 37.2, got ${daily.totalProteinG})`);

console.log(`\n======================================================`);
console.log(`  SUMMARY: ${passed} TESTS PASSED, ${failed} FAILED`);
console.log('======================================================\n');

process.exit(failed > 0 ? 1 : 0);
