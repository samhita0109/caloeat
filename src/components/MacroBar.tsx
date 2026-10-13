import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme/colors';
import { MacroTargets } from '../types';

interface MacroBarProps {
  proteinG: number;
  carbsG: number;
  fatG: number;
  fiberG: number;
  targets: MacroTargets;
}

interface MacroItemProps {
  label: string;
  consumed: number;
  target: number;
  unit?: string;
  barColor: string;
  bgColor: string;
  kcalFactor: number;
  totalCalories: number;
}

const MacroItem: React.FC<MacroItemProps> = ({
  label,
  consumed,
  target,
  unit = 'g',
  barColor,
  bgColor,
  kcalFactor,
  totalCalories,
}) => {
  const percentageOfTarget = target > 0 ? Math.min(100, Math.round((consumed / target) * 100)) : 0;
  const progressRatio = target > 0 ? Math.min(1, consumed / target) : 0;
  const macroKcal = consumed * kcalFactor;
  const calorieSharePercent = totalCalories > 0 ? Math.round((macroKcal / totalCalories) * 100) : 0;

  return (
    <View style={styles.macroItemContainer}>
      <View style={styles.macroHeaderRow}>
        <View style={styles.labelCol}>
          <View style={[styles.colorDot, { backgroundColor: barColor }]} />
          <Text style={styles.macroLabel}>{label}</Text>
          {totalCalories > 0 && kcalFactor > 0 && (
            <Text style={styles.shareTag}>{calorieSharePercent}% cal</Text>
          )}
        </View>

        <Text style={styles.macroStatsText}>
          <Text style={styles.consumedText}>{consumed}</Text>
          <Text style={styles.targetText}> / {target}{unit}</Text>
        </Text>
      </View>

      {/* Progress Track */}
      <View style={[styles.progressTrack, { backgroundColor: bgColor }]}>
        <View
          style={[
            styles.progressFill,
            {
              width: `${Math.round(progressRatio * 100)}%`,
              backgroundColor: barColor,
            },
          ]}
        />
      </View>
    </View>
  );
};

export const MacroBar: React.FC<MacroBarProps> = ({
  proteinG,
  carbsG,
  fatG,
  fiberG,
  targets,
}) => {
  const totalMacroCalories = Math.round(proteinG * 4 + carbsG * 4 + fatG * 9);

  return (
    <View style={styles.card}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Macronutrients</Text>
        <Text style={styles.totalMacroCal}>{totalMacroCalories} kcal from macros</Text>
      </View>

      <MacroItem
        label="Protein"
        consumed={proteinG}
        target={targets.proteinGrams}
        barColor={Colors.protein}
        bgColor={Colors.proteinSoft}
        kcalFactor={4}
        totalCalories={totalMacroCalories}
      />

      <MacroItem
        label="Carbs"
        consumed={carbsG}
        target={targets.carbsGrams}
        barColor={Colors.carbs}
        bgColor={Colors.carbsSoft}
        kcalFactor={4}
        totalCalories={totalMacroCalories}
      />

      <MacroItem
        label="Healthy Fat"
        consumed={fatG}
        target={targets.fatGrams}
        barColor={Colors.fat}
        bgColor={Colors.fatSoft}
        kcalFactor={9}
        totalCalories={totalMacroCalories}
      />

      <MacroItem
        label="Dietary Fiber"
        consumed={fiberG}
        target={targets.fiberGrams}
        barColor={Colors.fiber}
        bgColor={Colors.fiberSoft}
        kcalFactor={0}
        totalCalories={totalMacroCalories}
      />

      <Text style={styles.disclaimerText}>
        Macro split calculated with 4/4/9 kcal per gram. Minor variance may occur due to rounding & dietary fiber.
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.base,
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  totalMacroCal: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.textMuted,
  },
  macroItemContainer: {
    marginTop: Spacing.sm,
  },
  macroHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  labelCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  colorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  macroLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.textPrimary,
  },
  shareTag: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.textMuted,
    backgroundColor: Colors.surfaceAlt,
    paddingHorizontal: 6,
    paddingVertical: 1,
    borderRadius: 4,
  },
  macroStatsText: {
    fontSize: 13,
  },
  consumedText: {
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  targetText: {
    fontWeight: '500',
    color: Colors.textMuted,
  },
  progressTrack: {
    height: 7,
    borderRadius: BorderRadius.full,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: BorderRadius.full,
  },
  disclaimerText: {
    fontSize: 10,
    color: Colors.textMuted,
    marginTop: Spacing.md,
    lineHeight: 14,
  },
});
