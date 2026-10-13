import { ActivityLevel, MacroTargets, Sex, WeightGoal } from '../types';

export const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, { multiplier: number; label: string; description: string }> = {
  sedentary: {
    multiplier: 1.2,
    label: 'Sedentary',
    description: 'Little or no exercise, desk job',
  },
  lightly_active: {
    multiplier: 1.375,
    label: 'Lightly Active',
    description: 'Light exercise or sports 1–3 days/week',
  },
  moderately_active: {
    multiplier: 1.55,
    label: 'Moderately Active',
    description: 'Moderate exercise or sports 3–5 days/week',
  },
  very_active: {
    multiplier: 1.725,
    label: 'Very Active',
    description: 'Hard exercise or sports 6–7 days/week',
  },
  extra_active: {
    multiplier: 1.9,
    label: 'Extra Active',
    description: 'Very hard exercise, physical job or 2x training',
  },
};

/**
 * Calculates Basal Metabolic Rate (BMR) using Mifflin-St Jeor equation.
 * Male: 10 * weight (kg) + 6.25 * height (cm) - 5 * age + 5
 * Female: 10 * weight (kg) + 6.25 * height (cm) - 5 * age - 161
 */
export function calculateMifflinStJeorBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex
): number {
  if (weightKg <= 0 || heightCm <= 0 || age <= 0) return 0;
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age;
  return sex === 'male' ? Math.round(base + 5) : Math.round(base - 161);
}

/**
 * Optional Katch-McArdle equation when body fat % is provided and valid.
 * BMR = 370 + 21.6 * (Lean Body Mass in kg)
 */
export function calculateKatchMcArdleBMR(
  weightKg: number,
  bodyFatPercentage: number
): number {
  if (weightKg <= 0 || bodyFatPercentage <= 0 || bodyFatPercentage >= 70) return 0;
  const leanBodyMassKg = weightKg * (1 - bodyFatPercentage / 100);
  return Math.round(370 + 21.6 * leanBodyMassKg);
}

/**
 * Calculates BMR choosing Katch-McArdle if valid body fat % is provided,
 * otherwise falling back to Mifflin-St Jeor.
 */
export function calculateBMR(
  weightKg: number,
  heightCm: number,
  age: number,
  sex: Sex,
  bodyFatPercentage?: number
): { bmr: number; formulaUsed: 'Mifflin-St Jeor' | 'Katch-McArdle' } {
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

/**
 * Calculates Total Daily Energy Expenditure (TDEE).
 * TDEE = BMR * Activity Multiplier
 */
export function calculateTDEE(bmr: number, activityLevel: ActivityLevel): number {
  const multiplier = ACTIVITY_MULTIPLIERS[activityLevel]?.multiplier || 1.2;
  return Math.round(bmr * multiplier);
}

/**
 * Calculates safe daily calorie target according to goal.
 * - Deficit: -400 kcal (safe, sustainable fat loss, ~0.4 kg/week)
 * - Maintenance: 0 kcal adjustment
 * - Surplus: +350 kcal (clean lean mass surplus)
 *
 * Enforces health guardrails: minimum 1200 kcal (female) / 1500 kcal (male).
 */
export function calculateDailyCalorieTarget(
  tdee: number,
  goal: WeightGoal,
  sex: Sex,
  age: number
): { target: number; adjustment: number; warning?: string } {
  let adjustment = 0;
  if (goal === 'lose') {
    adjustment = -400;
  } else if (goal === 'gain') {
    adjustment = 350;
  }

  let target = tdee + adjustment;

  // Minimum safety floor
  const minSafeFloor = sex === 'male' ? 1500 : 1200;
  let warning: string | undefined;

  if (age < 18) {
    warning = 'Notice: Standard adult metabolic equations and caloric deficits are not suitable for minors. Please consult a qualified paediatric healthcare professional.';
  } else if (target < minSafeFloor) {
    target = minSafeFloor;
    warning = `Goal-adjusted intake fell below safe physiological threshold. Target adjusted to safe minimum of ${minSafeFloor} kcal/day.`;
  }

  return { target: Math.round(target), adjustment, warning };
}

/**
 * Computes macronutrient targets based on daily calories:
 * - Protein: ~25% of calories (4 kcal/g)
 * - Carbs: ~45% of calories (4 kcal/g)
 * - Fat: ~30% of calories (9 kcal/g)
 * - Fiber: ~14g per 1000 kcal consumed (minimum 25g)
 */
export function calculateMacroTargets(dailyCalories: number): MacroTargets {
  const proteinKcal = dailyCalories * 0.25;
  const carbsKcal = dailyCalories * 0.45;
  const fatKcal = dailyCalories * 0.30;

  return {
    proteinGrams: Math.round(proteinKcal / 4),
    carbsGrams: Math.round(carbsKcal / 4),
    fatGrams: Math.round(fatKcal / 9),
    fiberGrams: Math.max(25, Math.round((dailyCalories / 1000) * 14)),
  };
}

// Unit conversion helpers
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10;
}

export function lbsToKg(lbs: number): number {
  return Math.round((lbs / 2.20462) * 10) / 10;
}

export function cmToFeetInches(cm: number): { feet: number; inches: number } {
  const totalInches = cm / 2.54;
  const feet = Math.floor(totalInches / 12);
  const inches = Math.round(totalInches % 12);
  return { feet, inches };
}

export function feetInchesToCm(feet: number, inches: number): number {
  return Math.round((feet * 12 + inches) * 2.54);
}
