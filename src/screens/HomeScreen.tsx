import React, { useState } from 'react';
import {
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme/colors';
import { DailyLog, MealItem, MealLog, MealType, Mood, UserProfile } from '../types';
import { CalorieRing } from '../components/CalorieRing';
import { MacroBar } from '../components/MacroBar';
import { MealCard } from '../components/MealCard';
import { AddFoodModal } from '../components/AddFoodModal';
import {
  addOrUpdateMeal,
  deleteMeal,
  getDailyLog,
  getTodayDateString,
  updateWaterIntake,
  updateWellness,
} from '../utils/storage';

interface HomeScreenProps {
  profile: UserProfile;
  dailyLog: DailyLog;
  onRefreshData: () => Promise<void>;
  onNavigateToScan: () => void;
  onNavigateToLog: () => void;
}

const MOODS: { key: Mood; emoji: string; label: string }[] = [
  { key: 'great', emoji: '🤩', label: 'Great' },
  { key: 'good', emoji: '😊', label: 'Good' },
  { key: 'neutral', emoji: '😐', label: 'Okay' },
  { key: 'tired', emoji: '🥱', label: 'Tired' },
  { key: 'stressed', emoji: '😓', label: 'Stressed' },
];

export const HomeScreen: React.FC<HomeScreenProps> = ({
  profile,
  dailyLog,
  onRefreshData,
  onNavigateToScan,
  onNavigateToLog,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [modalVisible, setModalVisible] = useState(false);
  const [activeMealType, setActiveMealType] = useState<MealType>('breakfast');

  const todayStr = getTodayDateString();

  const handleRefresh = async () => {
    setRefreshing(true);
    await onRefreshData();
    setRefreshing(false);
  };

  const handleOpenAdd = (mealType: MealType) => {
    setActiveMealType(mealType);
    setModalVisible(true);
  };

  const handleSaveMealItem = async (mealType: MealType, item: MealItem) => {
    // Find or create meal for this mealType
    const existingMeal = dailyLog.meals.find((m) => m.mealType === mealType);
    const nowTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    let updatedMeal: MealLog;
    if (existingMeal) {
      const updatedItems = [...existingMeal.items, item];
      updatedMeal = {
        ...existingMeal,
        items: updatedItems,
        totalCalories: existingMeal.totalCalories + item.effectiveCalories,
        totalProteinG: Math.round((existingMeal.totalProteinG + item.effectiveProteinG) * 10) / 10,
        totalCarbsG: Math.round((existingMeal.totalCarbsG + item.effectiveCarbsG) * 10) / 10,
        totalFatG: Math.round((existingMeal.totalFatG + item.effectiveFatG) * 10) / 10,
        totalFiberG: Math.round((existingMeal.totalFiberG + item.effectiveFiberG) * 10) / 10,
      };
    } else {
      updatedMeal = {
        id: `meal_${mealType}_${Date.now()}`,
        date: todayStr,
        mealType,
        time: nowTime,
        items: [item],
        totalCalories: item.effectiveCalories,
        totalProteinG: item.effectiveProteinG,
        totalCarbsG: item.effectiveCarbsG,
        totalFatG: item.effectiveFatG,
        totalFiberG: item.effectiveFiberG,
      };
    }

    await addOrUpdateMeal(todayStr, updatedMeal);
    await onRefreshData();
  };

  const handleDeleteMeal = async (mealId: string) => {
    await deleteMeal(todayStr, mealId);
    await onRefreshData();
  };

  const handleWaterDelta = async (delta: number) => {
    await updateWaterIntake(todayStr, delta);
    await onRefreshData();
  };

  const handleMoodSelect = async (mood: Mood) => {
    await updateWellness(todayStr, { mood });
    await onRefreshData();
  };

  // Group meals by mealType
  const breakfast = dailyLog.meals.find((m) => m.mealType === 'breakfast');
  const lunch = dailyLog.meals.find((m) => m.mealType === 'lunch');
  const dinner = dailyLog.meals.find((m) => m.mealType === 'dinner');
  const snack = dailyLog.meals.find((m) => m.mealType === 'snack');

  const waterGlasses = dailyLog.wellness?.waterGlasses || 0;
  const waterGoal = dailyLog.wellness?.waterGoalGlasses || 8;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
          />
        }
      >
        {/* Calorie Ring Component */}
        <CalorieRing
          consumed={dailyLog.totalCaloriesConsumed}
          target={profile.dailyCalorieTarget}
        />

        {/* Macronutrient Progress Bar */}
        <MacroBar
          proteinG={dailyLog.totalProteinG}
          carbsG={dailyLog.totalCarbsG}
          fatG={dailyLog.totalFatG}
          fiberG={dailyLog.totalFiberG}
          targets={profile.macroTargets}
        />

        {/* Quick Action Food Scan Hero Banner */}
        <TouchableOpacity
          style={styles.scanBannerCard}
          onPress={onNavigateToScan}
          activeOpacity={0.85}
        >
          <View style={styles.scanBannerIcon}>
            <Ionicons name="scan" size={24} color={Colors.surface} />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.scanBannerTitle}>Scan Your Meal with AI</Text>
            <Text style={styles.scanBannerSub}>
              Snap a thali, biryani, or homemade plate for instant food recognition
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color={Colors.surface} />
        </TouchableOpacity>

        {/* Water Tracker Card */}
        <View style={styles.waterCard}>
          <View style={styles.waterHeader}>
            <View style={styles.waterHeaderLeft}>
              <Ionicons name="water" size={20} color="#0284C7" />
              <Text style={styles.waterTitle}>Hydration Tracker</Text>
            </View>
            <Text style={styles.waterStatsText}>
              <Text style={styles.waterStatsValue}>{waterGlasses}</Text> / {waterGoal} glasses ({waterGlasses * 250} ml)
            </Text>
          </View>

          {/* Water Glass Icons */}
          <View style={styles.glassesRow}>
            {Array.from({ length: waterGoal }).map((_, idx) => {
              const isFilled = idx < waterGlasses;
              return (
                <TouchableOpacity
                  key={idx}
                  onPress={() => handleWaterDelta(isFilled ? -1 : 1)}
                  style={[styles.glassIconBox, isFilled && styles.glassIconBoxFilled]}
                >
                  <Ionicons
                    name="water"
                    size={16}
                    color={isFilled ? '#0284C7' : Colors.border}
                  />
                </TouchableOpacity>
              );
            })}
          </View>

          <View style={styles.waterButtonsRow}>
            <TouchableOpacity
              style={styles.waterAdjustButton}
              onPress={() => handleWaterDelta(-1)}
              disabled={waterGlasses <= 0}
            >
              <Ionicons name="remove" size={16} color={Colors.textSecondary} />
              <Text style={styles.waterAdjustText}>-1 Glass</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.waterAdjustButton, styles.waterAdjustAdd]}
              onPress={() => handleWaterDelta(1)}
            >
              <Ionicons name="add" size={16} color="#0369A1" />
              <Text style={[styles.waterAdjustText, { color: '#0369A1', fontWeight: '700' }]}>
                +1 Glass (250ml)
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Today's Meals Section */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionHeading}>Today's Meals</Text>
          <TouchableOpacity onPress={onNavigateToLog}>
            <Text style={styles.viewLogLink}>View Journal</Text>
          </TouchableOpacity>
        </View>

        <MealCard
          mealType="breakfast"
          title="Breakfast"
          meal={breakfast}
          onAddFood={handleOpenAdd}
          onDeleteMeal={handleDeleteMeal}
        />

        <MealCard
          mealType="lunch"
          title="Lunch"
          meal={lunch}
          onAddFood={handleOpenAdd}
          onDeleteMeal={handleDeleteMeal}
        />

        <MealCard
          mealType="dinner"
          title="Dinner"
          meal={dinner}
          onAddFood={handleOpenAdd}
          onDeleteMeal={handleDeleteMeal}
        />

        <MealCard
          mealType="snack"
          title="Snacks"
          meal={snack}
          onAddFood={handleOpenAdd}
          onDeleteMeal={handleDeleteMeal}
        />

        {/* Wellness & Daily Check-In */}
        <View style={styles.wellnessCard}>
          <Text style={styles.wellnessTitle}>Daily Wellness & Mood</Text>
          <Text style={styles.wellnessSub}>How are you feeling today?</Text>

          <View style={styles.moodRow}>
            {MOODS.map((m) => {
              const isSelected = dailyLog.wellness?.mood === m.key;
              return (
                <TouchableOpacity
                  key={m.key}
                  style={[styles.moodItem, isSelected && styles.moodItemSelected]}
                  onPress={() => handleMoodSelect(m.key)}
                >
                  <Text style={styles.moodEmoji}>{m.emoji}</Text>
                  <Text style={[styles.moodLabel, isSelected && styles.moodLabelSelected]}>
                    {m.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Activity summary pills */}
          <View style={styles.activityStatsRow}>
            <View style={styles.activityStatBox}>
              <Ionicons name="footsteps" size={16} color="#D97706" />
              <Text style={styles.activityStatValue}>
                {dailyLog.wellness?.steps?.toLocaleString() || '6,400'}
              </Text>
              <Text style={styles.activityStatLabel}>Steps</Text>
            </View>

            <View style={styles.activityStatBox}>
              <Ionicons name="bed" size={16} color="#6366F1" />
              <Text style={styles.activityStatValue}>
                {dailyLog.wellness?.sleepHours || '7.5'}h
              </Text>
              <Text style={styles.activityStatLabel}>Sleep</Text>
            </View>

            <View style={styles.activityStatBox}>
              <Ionicons name="flame" size={16} color={Colors.primary} />
              <Text style={styles.activityStatValue}>
                {dailyLog.wellness?.activeCalories || '280'}
              </Text>
              <Text style={styles.activityStatLabel}>Active kcal</Text>
            </View>
          </View>
        </View>
      </ScrollView>

      {/* Add Food Modal */}
      <AddFoodModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        defaultMealType={activeMealType}
        onSaveMealItem={handleSaveMealItem}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  scrollContent: {
    paddingBottom: Spacing.xxl,
  },
  scanBannerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.xs,
    gap: Spacing.md,
    ...Shadows.elevated,
  },
  scanBannerIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scanBannerTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.surface,
  },
  scanBannerSub: {
    fontSize: 11,
    color: 'rgba(255,255,255,0.9)',
    marginTop: 2,
    lineHeight: 15,
  },
  waterCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  waterHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  waterHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  waterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  waterStatsText: {
    fontSize: 12,
    color: Colors.textSecondary,
  },
  waterStatsValue: {
    fontWeight: '800',
    color: '#0284C7',
  },
  glassesRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginVertical: Spacing.sm,
  },
  glassIconBox: {
    width: 32,
    height: 36,
    borderRadius: 6,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  glassIconBoxFilled: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  waterButtonsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
    gap: Spacing.sm,
  },
  waterAdjustButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 7,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.surfaceAlt,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  waterAdjustAdd: {
    backgroundColor: '#E0F2FE',
    borderColor: '#BAE6FD',
  },
  waterAdjustText: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.base,
    marginTop: Spacing.md,
    marginBottom: Spacing.xs,
  },
  sectionHeading: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  viewLogLink: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.primary,
  },
  wellnessCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginTop: Spacing.md,
    marginBottom: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  wellnessTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  wellnessSub: {
    fontSize: 12,
    color: Colors.textMuted,
    marginTop: 2,
    marginBottom: Spacing.sm,
  },
  moodRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  moodItem: {
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceAlt,
  },
  moodItemSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primarySoft,
  },
  moodEmoji: {
    fontSize: 20,
  },
  moodLabel: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.textSecondary,
    marginTop: 2,
  },
  moodLabelSelected: {
    color: Colors.primary,
    fontWeight: '700',
  },
  activityStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  activityStatBox: {
    alignItems: 'center',
  },
  activityStatValue: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  activityStatLabel: {
    fontSize: 10,
    color: Colors.textMuted,
  },
});
