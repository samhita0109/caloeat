import {
  calculateBMR,
  calculateDailyCalorieTarget,
  calculateKatchMcArdleBMR,
  calculateMacroTargets,
  calculateMifflinStJeorBMR,
  calculateTDEE,
} from '../utils/metabolic';
import { recalculateDailyTotals, createEmptyDailyLog } from '../utils/storage';
import { MealItem, MealLog } from '../types';

export function runAllVerificationTests() {
  console.log('=== STARTING CALOEAT CORE VERIFICATION SUITE ===\n');
  let passed = 0;
  let failed = 0;

  function assert(condition: boolean, testName: string) {
    if (condition) {
      console.log(`✅ PASS: ${testName}`);
      passed++;
    } else {
      console.error(`❌ FAIL: ${testName}`);
      failed++;
    }
  }

  // 1. Mifflin-St Jeor Male Test
  // Male 70kg, 175cm, 22yo
  // BMR = 10 * 70 + 6.25 * 175 - 5 * 22 + 5 = 700 + 1093.75 - 110 + 5 = 1688.75 -> 1689
  const bmrMale = calculateMifflinStJeorBMR(70, 175, 22, 'male');
  assert(bmrMale === 1689, `Mifflin-St Jeor Male calculation matches (expected 1689, got ${bmrMale})`);

  // 2. Mifflin-St Jeor Female Test
  // Female 60kg, 165cm, 24yo
  // BMR = 10 * 60 + 6.25 * 165 - 5 * 24 - 161 = 600 + 1031.25 - 120 - 161 = 1350.25 -> 1350
  const bmrFemale = calculateMifflinStJeorBMR(60, 165, 24, 'female');
  assert(bmrFemale === 1350, `Mifflin-St Jeor Female calculation matches (expected 1350, got ${bmrFemale})`);

  // 3. Katch-McArdle Equation with Body Fat %
  // 70kg, 15% body fat -> LBM = 70 * (1 - 0.15) = 59.5kg
  // BMR = 370 + 21.6 * 59.5 = 370 + 1285.2 = 1655.2 -> 1655
  const bmrKatch = calculateKatchMcArdleBMR(70, 15);
  assert(bmrKatch === 1655, `Katch-McArdle LBM calculation matches (expected 1655, got ${bmrKatch})`);

  // 4. BMR selector preference
  const bmrWithFat = calculateBMR(70, 175, 22, 'male', 15);
  assert(
    bmrWithFat.formulaUsed === 'Katch-McArdle' && bmrWithFat.bmr === 1655,
    'calculateBMR chooses Katch-McArdle when valid body fat is provided'
  );

  const bmrWithoutFat = calculateBMR(70, 175, 22, 'male');
  assert(
    bmrWithoutFat.formulaUsed === 'Mifflin-St Jeor' && bmrWithoutFat.bmr === 1689,
    'calculateBMR falls back to Mifflin-St Jeor when body fat is absent'
  );

  // 5. TDEE Multipliers
  // Moderately active = 1.55
  const tdee = calculateTDEE(1689, 'moderately_active');
  assert(tdee === Math.round(1689 * 1.55), `TDEE multiplier works (expected ${Math.round(1689 * 1.55)}, got ${tdee})`);

  // 6. Safe Deficit & Safety Floor
  // Deficit: -400 kcal
  const targetLose = calculateDailyCalorieTarget(2618, 'lose', 'male', 22);
  assert(targetLose.target === 2218 && targetLose.adjustment === -400, 'Weight loss goal applies -400 kcal safe deficit');

  // Safety floor enforcement (e.g. female with low TDEE)
  const targetFloor = calculateDailyCalorieTarget(1300, 'lose', 'female', 25);
  assert(targetFloor.target === 1200, `Female safety floor enforced at 1200 kcal (got ${targetFloor.target})`);

  // Minor warning
  const targetMinor = calculateDailyCalorieTarget(2200, 'lose', 'female', 16);
  assert(!!targetMinor.warning, 'Safety warning triggered for minor (<18)');

  // 7. Macro Targets (4/4/9 kcal/g)
  const macros = calculateMacroTargets(2000);
  assert(macros.proteinGrams === 125, `Protein target (25% of 2000 kcal / 4 = 125g, got ${macros.proteinGrams})`);
  assert(macros.carbsGrams === 225, `Carbs target (45% of 2000 kcal / 4 = 225g, got ${macros.carbsGrams})`);
  assert(macros.fatGrams === 67, `Fat target (30% of 2000 kcal / 9 = 67g, got ${macros.fatGrams})`);
  assert(macros.fiberGrams === 28, `Fiber target (14g/1000 kcal = 28g, got ${macros.fiberGrams})`);

  // 8. Daily Log Recalculation & Portion Scaling
  const sampleLog = createEmptyDailyLog('2026-10-05');
  const testMealItem: MealItem = {
    id: 'test_item_1',
    name: 'Steamed Rice',
    cuisine: 'Indian',
    servingSize: '1 cup',
    servingUnit: 'cup',
    servingWeightG: 150,
    calories: 200,
    proteinG: 4.0,
    carbsG: 44.0,
    fatG: 1.0,
    fiberG: 2.0,
    isVeg: true,
    source: 'IFCT',
    portionMultiplier: 1.5,
    effectiveCalories: 300,
    effectiveProteinG: 6.0,
    effectiveCarbsG: 66.0,
    effectiveFatG: 1.5,
    effectiveFiberG: 3.0,
  };

  const testMeal: MealLog = {
    id: 'meal_test',
    date: '2026-10-05',
    mealType: 'lunch',
    time: '12:30',
    items: [testMealItem],
    totalCalories: 300,
    totalProteinG: 6.0,
    totalCarbsG: 66.0,
    totalFatG: 1.5,
    totalFiberG: 3.0,
  };

  sampleLog.meals.push(testMeal);
  const updatedLog = recalculateDailyTotals(sampleLog);
  assert(updatedLog.totalCaloriesConsumed === 300, 'Daily totals recalculate calories correctly');
  assert(updatedLog.totalProteinG === 6.0, 'Daily totals recalculate protein correctly');
  assert(updatedLog.totalCarbsG === 66.0, 'Daily totals recalculate carbs correctly');

  console.log(`\n=== TEST SUITE RESULTS: ${passed} PASSED, ${failed} FAILED ===\n`);
  return { passed, failed };
}

