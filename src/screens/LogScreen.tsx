import React, { useState } from 'react';
import {
  Alert,
  FlatList,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme/colors';
import { DailyLog, MealLog, MealType, UserProfile } from '../types';
import { deleteMeal, getDailyLog } from '../utils/storage';

interface LogScreenProps {
  profile: UserProfile;
  activeDailyLog: DailyLog;
  onRefreshData: () => Promise<void>;
  onOpenAddModal: (mealType: MealType) => void;
}

export const LogScreen: React.FC<LogScreenProps> = ({
  profile,
  activeDailyLog,
  onRefreshData,
  onOpenAddModal,
}) => {
  const [filterType, setFilterType] = useState<MealType | 'all'>('all');

  const filteredMeals =
    filterType === 'all'
      ? activeDailyLog.meals
      : activeDailyLog.meals.filter((m) => m.mealType === filterType);

  const handleDelete = (mealId: string, mealTitle: string) => {
    Alert.alert('Delete Meal', `Are you sure you want to remove ${mealTitle}?`, [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          await deleteMeal(activeDailyLog.date, mealId);
          await onRefreshData();
        },
      },
    ]);
  };

  return (
    <SafeAreaView style={styles.safeContainer}>
      <View style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <Text style={styles.title}>Meal Journal</Text>
          <Text style={styles.dateSub}>{activeDailyLog.date}</Text>
        </View>

        {/* Nutritional Summary Banner */}
        <View style={styles.summaryBanner}>
          <View style={styles.summaryItem}>
            <Text style={styles.summaryValue}>{activeDailyLog.totalCaloriesConsumed}</Text>
            <Text style={styles.summaryLabel}>Total kcal</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.protein }]}>
              {activeDailyLog.totalProteinG}g
            </Text>
            <Text style={styles.summaryLabel}>Protein</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: '#B45309' }]}>
              {activeDailyLog.totalCarbsG}g
            </Text>
            <Text style={styles.summaryLabel}>Carbs</Text>
          </View>
          <View style={styles.verticalDivider} />
          <View style={styles.summaryItem}>
            <Text style={[styles.summaryValue, { color: Colors.fat }]}>
              {activeDailyLog.totalFatG}g
            </Text>
            <Text style={styles.summaryLabel}>Fat</Text>
          </View>
        </View>

        {/* Filter Chips */}
        <View style={styles.filterRow}>
          {(['all', 'breakfast', 'lunch', 'dinner', 'snack'] as const).map((type) => (
            <TouchableOpacity
              key={type}
              style={[styles.filterChip, filterType === type && styles.filterChipActive]}
              onPress={() => setFilterType(type)}
            >
              <Text
                style={[
                  styles.filterChipText,
                  filterType === type && styles.filterChipTextActive,
                ]}
              >
                {type === 'all' ? 'All Meals' : type.charAt(0).toUpperCase() + type.slice(1)}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Meal Logs List */}
        {filteredMeals.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="restaurant-outline" size={48} color={Colors.textMuted} />
            <Text style={styles.emptyTitle}>No meals logged for this category</Text>
            <Text style={styles.emptySub}>
              Use the Scan button or tap below to record what you ate.
            </Text>
            <TouchableOpacity
              style={styles.emptyAddButton}
              onPress={() => onOpenAddModal('lunch')}
            >
              <Ionicons name="add" size={18} color={Colors.surface} />
              <Text style={styles.emptyAddButtonText}>Add Food Entry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <FlatList
            data={filteredMeals}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={styles.logCard}>
                <View style={styles.logCardHeader}>
                  <View style={styles.logCardHeaderLeft}>
                    <View style={styles.mealBadge}>
                      <Text style={styles.mealBadgeText}>{item.mealType.toUpperCase()}</Text>
                    </View>
                    <Text style={styles.mealTimeText}>{item.time}</Text>
                    {item.isScanned && (
                      <View style={styles.scannedPill}>
                        <Ionicons name="sparkles" size={10} color={Colors.primary} />
                        <Text style={styles.scannedPillText}>AI Scanned</Text>
                      </View>
                    )}
                  </View>

                  <View style={styles.logCardHeaderRight}>
                    <Text style={styles.logCardCal}>{item.totalCalories} kcal</Text>
                    <TouchableOpacity
                      onPress={() => handleDelete(item.id, item.mealType)}
                      style={styles.deleteIconButton}
                    >
                      <Ionicons name="trash-outline" size={16} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Items in this meal */}
                <View style={styles.logItemsList}>
                  {item.items.map((food, idx) => (
                    <View key={`${food.id}_${idx}`} style={styles.logItemRow}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.foodTitle}>{food.name}</Text>
                        <Text style={styles.foodSub}>
                          {food.portionMultiplier}x portion ({food.servingSize})
                        </Text>
                      </View>
                      <View style={{ alignItems: 'flex-end' }}>
                        <Text style={styles.foodCal}>{food.effectiveCalories} kcal</Text>
                        <Text style={styles.foodMacroLine}>
                          P: {food.effectiveProteinG}g • C: {food.effectiveCarbsG}g • F:{' '}
                          {food.effectiveFatG}g
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>

                {/* AI Insight if available */}
                {item.aiInsight && (
                  <View style={styles.aiInsightRow}>
                    <Ionicons name="sparkles" size={13} color={Colors.primary} />
                    <Text style={styles.aiInsightText}>{item.aiInsight}</Text>
                  </View>
                )}
              </View>
            )}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  container: {
    flex: 1,
    paddingHorizontal: Spacing.base,
  },
  header: {
    marginTop: Spacing.sm,
    marginBottom: Spacing.md,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  dateSub: {
    fontSize: 13,
    color: Colors.textMuted,
    marginTop: 2,
    fontWeight: '500',
  },
  summaryBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    backgroundColor: Colors.surface,
    padding: Spacing.md,
    borderRadius: BorderRadius.lg,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
    marginBottom: Spacing.md,
  },
  summaryItem: {
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  summaryLabel: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '600',
    marginTop: 2,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderLight,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 6,
    marginBottom: Spacing.md,
  },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  filterChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterChipTextActive: {
    color: Colors.surface,
  },
  listContent: {
    paddingBottom: Spacing.xxl,
  },
  logCard: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginBottom: Spacing.md,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.subtle,
  },
  logCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  logCardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  mealBadge: {
    backgroundColor: Colors.surfaceAlt,
    paddingVertical: 3,
    paddingHorizontal: 8,
    borderRadius: BorderRadius.sm,
  },
  mealBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: Colors.textSecondary,
  },
  mealTimeText: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  scannedPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    paddingVertical: 2,
    paddingHorizontal: 6,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  scannedPillText: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.primaryDark,
  },
  logCardHeaderRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  logCardCal: {
    fontSize: 15,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  deleteIconButton: {
    padding: 4,
  },
  logItemsList: {
    marginTop: Spacing.sm,
  },
  logItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 5,
  },
  foodTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  foodSub: {
    fontSize: 11,
    color: Colors.textMuted,
  },
  foodCal: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  foodMacroLine: {
    fontSize: 10,
    color: Colors.textMuted,
  },
  aiInsightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primarySoft,
    padding: Spacing.sm,
    borderRadius: BorderRadius.sm,
    marginTop: Spacing.sm,
    gap: 6,
  },
  aiInsightText: {
    fontSize: 11,
    color: Colors.primaryDark,
    lineHeight: 15,
    flex: 1,
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: Spacing.md,
  },
  emptySub: {
    fontSize: 12,
    color: Colors.textMuted,
    textAlign: 'center',
    marginTop: 4,
    marginBottom: Spacing.lg,
    paddingHorizontal: Spacing.xl,
  },
  emptyAddButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: BorderRadius.full,
    gap: 6,
    ...Shadows.elevated,
  },
  emptyAddButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.surface,
  },
});
