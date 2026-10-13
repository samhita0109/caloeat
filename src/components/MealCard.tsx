import React, { useState } from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme/colors';
import { MealLog, MealType } from '../types';

interface MealCardProps {
  mealType: MealType;
  title: string;
  meal?: MealLog;
  onAddFood: (mealType: MealType) => void;
  onDeleteMeal?: (mealId: string) => void;
}

const MEAL_META: Record<MealType, { icon: keyof typeof Ionicons.glyphMap; defaultTime: string }> = {
  breakfast: { icon: 'sunny-outline', defaultTime: '08:30' },
  lunch: { icon: 'restaurant-outline', defaultTime: '13:00' },
  dinner: { icon: 'moon-outline', defaultTime: '20:00' },
  snack: { icon: 'cafe-outline', defaultTime: '16:30' },
};

export const MealCard: React.FC<MealCardProps> = ({
  mealType,
  title,
  meal,
  onAddFood,
  onDeleteMeal,
}) => {
  const meta = MEAL_META[mealType];
  const [expanded, setExpanded] = useState(true);

  const hasItems = meal && meal.items && meal.items.length > 0;

  return (
    <View style={styles.card}>
      {/* Header Row */}
      <View style={styles.headerRow}>
        <View style={styles.headerLeft}>
          <View style={styles.iconCircle}>
            <Ionicons name={meta.icon} size={18} color={Colors.primary} />
          </View>
          <View>
            <Text style={styles.mealTitle}>{title}</Text>
            <Text style={styles.mealTime}>{meal?.time || meta.defaultTime}</Text>
          </View>
        </View>

        <View style={styles.headerRight}>
          <Text style={styles.caloriesNumber}>
            {meal?.totalCalories || 0}
            <Text style={styles.calUnit}> kcal</Text>
          </Text>

          {hasItems && (
            <TouchableOpacity
              onPress={() => setExpanded(!expanded)}
              style={styles.expandButton}
              accessibilityLabel="Toggle meal items"
            >
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={Colors.textMuted}
              />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Food Items List */}
      {hasItems && expanded && (
        <View style={styles.itemsList}>
          {meal!.items.map((item, idx) => (
            <View key={`${item.id}_${idx}`} style={styles.foodItemRow}>
              <View style={styles.foodItemLeft}>
                <View
                  style={[
                    styles.vegDot,
                    { borderColor: item.isVeg ? Colors.vegGreen : Colors.nonVegRed },
                  ]}
                >
                  <View
                    style={[
                      styles.vegInnerDot,
                      { backgroundColor: item.isVeg ? Colors.vegGreen : Colors.nonVegRed },
                    ]}
                  />
                </View>
                <View style={styles.foodTextGroup}>
                  <Text style={styles.foodName} numberOfLines={1}>
                    {item.name}
                  </Text>
                  <Text style={styles.servingSubtext}>
                    {item.portionMultiplier}x • {item.servingSize}
                  </Text>
                </View>
              </View>

              <View style={styles.foodItemRight}>
                <Text style={styles.itemCalories}>{item.effectiveCalories} kcal</Text>
                <Text style={styles.macroPill}>P: {item.effectiveProteinG}g</Text>
              </View>
            </View>
          ))}

          {/* AI Insight Pill */}
          {meal?.aiInsight && (
            <View style={styles.aiInsightBox}>
              <Ionicons name="sparkles" size={14} color={Colors.primary} />
              <Text style={styles.aiInsightText}>{meal.aiInsight}</Text>
            </View>
          )}

          {/* Delete Action */}
          {onDeleteMeal && meal && (
            <TouchableOpacity
              style={styles.deleteButton}
              onPress={() => onDeleteMeal(meal.id)}
            >
              <Ionicons name="trash-outline" size={14} color={Colors.error} />
              <Text style={styles.deleteButtonText}>Remove meal</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Add Food Button */}
      <TouchableOpacity
        style={styles.addFoodButton}
        onPress={() => onAddFood(mealType)}
        activeOpacity={0.7}
      >
        <Ionicons name="add-circle-outline" size={16} color={Colors.primary} />
        <Text style={styles.addFoodText}>Add {title} Item</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.primarySoft,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mealTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  mealTime: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  caloriesNumber: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
  },
  calUnit: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textMuted,
  },
  expandButton: {
    padding: 4,
  },
  itemsList: {
    marginTop: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  foodItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 7,
  },
  foodItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    flex: 1,
    paddingRight: Spacing.sm,
  },
  vegDot: {
    width: 14,
    height: 14,
    borderWidth: 1.5,
    borderRadius: 3,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vegInnerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  foodTextGroup: {
    flex: 1,
  },
  foodName: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  servingSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    marginTop: 1,
  },
  foodItemRight: {
    alignItems: 'flex-end',
  },
  itemCalories: {
    fontSize: 13,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  macroPill: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.protein,
    backgroundColor: Colors.proteinSoft,
    paddingHorizontal: 5,
    paddingVertical: 1,
    borderRadius: 3,
    marginTop: 2,
  },
  aiInsightBox: {
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
    fontWeight: '500',
    flex: 1,
    lineHeight: 15,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: 4,
    marginTop: Spacing.sm,
    paddingTop: Spacing.xs,
  },
  deleteButtonText: {
    fontSize: 11,
    color: Colors.error,
    fontWeight: '600',
  },
  addFoodButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: Spacing.md,
    paddingVertical: 8,
    backgroundColor: Colors.surfaceSubtle,
    borderRadius: BorderRadius.md,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  addFoodText: {
    fontSize: 12,
    fontWeight: '700',
    color: Colors.primary,
  },
});
