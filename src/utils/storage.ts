import AsyncStorage from '@react-native-async-storage/async-storage';
import { DailyLog, MealLog, UserProfile, WellnessData } from '../types';
import { calculateBMR, calculateDailyCalorieTarget, calculateMacroTargets, calculateTDEE } from './metabolic';
import { FOOD_DATABASE } from '../data/foodDatabase';

const STORAGE_KEYS = {
  USER_PROFILE: '@caloeat_user_profile',
  DAILY_LOG_PREFIX: '@caloeat_daily_log_',
  LOG_DATES_INDEX: '@caloeat_log_dates_index',
};

export const DEFAULT_PROFILE: UserProfile = (() => {
  const age = 22;
  const sex = 'male';
  const weightKg = 70;
  const heightCm = 175;
  const activityLevel = 'moderately_active';
  const goal = 'maintain';

  const { bmr } = calculateBMR(weightKg, heightCm, age, sex);
  const tdee = calculateTDEE(bmr, activityLevel);
  const { target } = calculateDailyCalorieTarget(tdee, goal, sex, age);
  const macroTargets = calculateMacroTargets(target);

  return {
    id: 'user_default_1',
    name: 'College Explorer',
    age,
    sex,
    heightCm,
    weightKg,
    unitPreference: 'metric',
    activityLevel,
    goal,
    dietaryPreference: 'vegetarian',
    allergies: [],
    isOnboardingCompleted: false,
    calculatedBMR: bmr,
    calculatedTDEE: tdee,
    dailyCalorieTarget: target,
    macroTargets,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
})();

export function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export async function getUserProfile(): Promise<UserProfile> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.USER_PROFILE);
    if (!raw) {
      return DEFAULT_PROFILE;
    }
    return JSON.parse(raw);
  } catch (err) {
    console.error('Error reading profile from AsyncStorage:', err);
    return DEFAULT_PROFILE;
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<boolean> {
  try {
    profile.updatedAt = new Date().toISOString();
    await AsyncStorage.setItem(STORAGE_KEYS.USER_PROFILE, JSON.stringify(profile));
    return true;
  } catch (err) {
    console.error('Error saving profile to AsyncStorage:', err);
    return false;
  }
}

export function createEmptyDailyLog(date: string): DailyLog {
  return {
    date,
    meals: [],
    wellness: {
      waterGlasses: 4,
      waterGoalGlasses: 8,
      sleepHours: 7.5,
      steps: 6400,
      activeCalories: 280,
      mood: 'good',
    },
    totalCaloriesConsumed: 0,
    totalProteinG: 0,
    totalCarbsG: 0,
    totalFatG: 0,
    totalFiberG: 0,
  };
}

export function recalculateDailyTotals(log: DailyLog): DailyLog {
  let totalCalories = 0;
  let totalProtein = 0;
  let totalCarbs = 0;
  let totalFat = 0;
  let totalFiber = 0;

  for (const meal of log.meals) {
    totalCalories += meal.totalCalories;
    totalProtein += meal.totalProteinG;
    totalCarbs += meal.totalCarbsG;
    totalFat += meal.totalFatG;
    totalFiber += meal.totalFiberG;
  }

  return {
    ...log,
    totalCaloriesConsumed: Math.round(totalCalories),
    totalProteinG: Math.round(totalProtein * 10) / 10,
    totalCarbsG: Math.round(totalCarbs * 10) / 10,
    totalFatG: Math.round(totalFat * 10) / 10,
    totalFiberG: Math.round(totalFiber * 10) / 10,
  };
}

export async function getDailyLog(date: string): Promise<DailyLog> {
  try {
    const raw = await AsyncStorage.getItem(`${STORAGE_KEYS.DAILY_LOG_PREFIX}${date}`);
    if (!raw) {
      // Create empty log
      const empty = createEmptyDailyLog(date);
      return empty;
    }
    const log: DailyLog = JSON.parse(raw);
    return recalculateDailyTotals(log);
  } catch (err) {
    console.error(`Error reading daily log for ${date}:`, err);
    return createEmptyDailyLog(date);
  }
}

export async function saveDailyLog(log: DailyLog): Promise<boolean> {
  try {
    const updated = recalculateDailyTotals(log);
    await AsyncStorage.setItem(
      `${STORAGE_KEYS.DAILY_LOG_PREFIX}${updated.date}`,
      JSON.stringify(updated)
    );

    // Update dates index
    const indexRaw = await AsyncStorage.getItem(STORAGE_KEYS.LOG_DATES_INDEX);
    const dates: string[] = indexRaw ? JSON.parse(indexRaw) : [];
    if (!dates.includes(updated.date)) {
      dates.push(updated.date);
      dates.sort();
      await AsyncStorage.setItem(STORAGE_KEYS.LOG_DATES_INDEX, JSON.stringify(dates));
    }

    return true;
  } catch (err) {
    console.error(`Error saving daily log for ${log.date}:`, err);
    return false;
  }
}

export async function addOrUpdateMeal(date: string, meal: MealLog): Promise<DailyLog> {
  const currentLog = await getDailyLog(date);
  const existingIndex = currentLog.meals.findIndex((m) => m.id === meal.id);

  if (existingIndex >= 0) {
    currentLog.meals[existingIndex] = meal;
  } else {
    currentLog.meals.push(meal);
  }

  const updatedLog = recalculateDailyTotals(currentLog);
  await saveDailyLog(updatedLog);
  return updatedLog;
}

export async function deleteMeal(date: string, mealId: string): Promise<DailyLog> {
  const currentLog = await getDailyLog(date);
  currentLog.meals = currentLog.meals.filter((m) => m.id !== mealId);
  const updatedLog = recalculateDailyTotals(currentLog);
  await saveDailyLog(updatedLog);
  return updatedLog;
}

export async function updateWaterIntake(date: string, delta: number): Promise<DailyLog> {
  const currentLog = await getDailyLog(date);
  const currentGlasses = currentLog.wellness.waterGlasses || 0;
  const newGlasses = Math.max(0, Math.min(20, currentGlasses + delta));
  currentLog.wellness.waterGlasses = newGlasses;
  await saveDailyLog(currentLog);
  return currentLog;
}

export async function updateWellness(date: string, wellness: Partial<WellnessData>): Promise<DailyLog> {
  const currentLog = await getDailyLog(date);
  currentLog.wellness = {
    ...currentLog.wellness,
    ...wellness,
  };
  await saveDailyLog(currentLog);
  return currentLog;
}

export async function getAllLoggedDates(): Promise<string[]> {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEYS.LOG_DATES_INDEX);
    return raw ? JSON.parse(raw) : [];
  } catch (err) {
    return [];
  }
}

/**
 * Seed sample data if the app is launched for the first time.
 * Provides a realistic sample day with breakfast, lunch, and snack.
 */
export async function seedInitialDataIfEmpty(): Promise<void> {
  try {
    const today = getTodayDateString();
    const existing = await AsyncStorage.getItem(`${STORAGE_KEYS.DAILY_LOG_PREFIX}${today}`);
    if (existing) return; // already has data

    const idliFood = FOOD_DATABASE.find((f) => f.id === 'food_idli_sambar')!;
    const rotiFood = FOOD_DATABASE.find((f) => f.id === 'food_roti_chapati')!;
    const dalFood = FOOD_DATABASE.find((f) => f.id === 'food_dal_tadka')!;
    const bhurjiFood = FOOD_DATABASE.find((f) => f.id === 'food_paneer_butter_masala')!;

    const sampleMeals: MealLog[] = [
      {
        id: 'sample_breakfast',
        date: today,
        mealType: 'breakfast',
        time: '08:30',
        items: [
          {
            ...idliFood,
            portionMultiplier: 1.0,
            effectiveCalories: idliFood.calories,
            effectiveProteinG: idliFood.proteinG,
            effectiveCarbsG: idliFood.carbsG,
            effectiveFatG: idliFood.fatG,
            effectiveFiberG: idliFood.fiberG,
            confidence: 'High',
          },
        ],
        totalCalories: idliFood.calories,
        totalProteinG: idliFood.proteinG,
        totalCarbsG: idliFood.carbsG,
        totalFatG: idliFood.fatG,
        totalFiberG: idliFood.fiberG,
        isScanned: true,
        aiInsight: 'High complex carbs with gentle digestive fermentation. Excellent sustained morning energy.',
      },
      {
        id: 'sample_lunch',
        date: today,
        mealType: 'lunch',
        time: '13:15',
        items: [
          {
            ...rotiFood,
            portionMultiplier: 1.0,
            effectiveCalories: rotiFood.calories,
            effectiveProteinG: rotiFood.proteinG,
            effectiveCarbsG: rotiFood.carbsG,
            effectiveFatG: rotiFood.fatG,
            effectiveFiberG: rotiFood.fiberG,
            confidence: 'High',
          },
          {
            ...dalFood,
            portionMultiplier: 1.0,
            effectiveCalories: dalFood.calories,
            effectiveProteinG: dalFood.proteinG,
            effectiveCarbsG: dalFood.carbsG,
            effectiveFatG: dalFood.fatG,
            effectiveFiberG: dalFood.fiberG,
            confidence: 'High',
          },
          {
            ...bhurjiFood,
            portionMultiplier: 0.75,
            effectiveCalories: Math.round(bhurjiFood.calories * 0.75),
            effectiveProteinG: Math.round(bhurjiFood.proteinG * 0.75 * 10) / 10,
            effectiveCarbsG: Math.round(bhurjiFood.carbsG * 0.75 * 10) / 10,
            effectiveFatG: Math.round(bhurjiFood.fatG * 0.75 * 10) / 10,
            effectiveFiberG: Math.round(bhurjiFood.fiberG * 0.75 * 10) / 10,
            confidence: 'High',
          },
        ],
        totalCalories: 160 + 180 + Math.round(bhurjiFood.calories * 0.75),
        totalProteinG: 5.6 + 9.2 + Math.round(bhurjiFood.proteinG * 0.75 * 10) / 10,
        totalCarbsG: 32 + 25 + Math.round(bhurjiFood.carbsG * 0.75 * 10) / 10,
        totalFatG: 1.2 + 4.5 + Math.round(bhurjiFood.fatG * 0.75 * 10) / 10,
        totalFiberG: 4.8 + 5.5 + Math.round(bhurjiFood.fiberG * 0.75 * 10) / 10,
        isScanned: true,
        aiInsight: 'Well-balanced meal pairing whole grains with plant & dairy protein. Good dietary fiber intake.',
      },
    ];

    const initialLog: DailyLog = {
      date: today,
      meals: sampleMeals,
      wellness: {
        waterGlasses: 5,
        waterGoalGlasses: 8,
        sleepHours: 7.2,
        steps: 7120,
        activeCalories: 310,
        mood: 'great',
        notes: 'Walked to university classes and had hydration on track.',
      },
      totalCaloriesConsumed: 0,
      totalProteinG: 0,
      totalCarbsG: 0,
      totalFatG: 0,
      totalFiberG: 0,
    };

    await saveDailyLog(initialLog);
  } catch (err) {
    console.error('Error seeding initial data:', err);
  }
}

export async function clearAllLocalData(): Promise<void> {
  try {
    await AsyncStorage.clear();
  } catch (err) {
    console.error('Error clearing AsyncStorage:', err);
  }
}
