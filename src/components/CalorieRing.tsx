import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Svg, { Circle } from 'react-native-svg';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme/colors';

interface CalorieRingProps {
  consumed: number;
  target: number;
  size?: number;
  strokeWidth?: number;
}

export const CalorieRing: React.FC<CalorieRingProps> = ({
  consumed,
  target,
  size = 190,
  strokeWidth = 14,
}) => {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  
  const progressRatio = target > 0 ? Math.min(1.5, consumed / target) : 0;
  const strokeDashoffset = circumference - Math.min(1, progressRatio) * circumference;

  const remaining = Math.max(0, target - consumed);
  const isOver = consumed > target;

  return (
    <View style={styles.card}>
      <View style={[styles.ringContainer, { width: size, height: size }]}>
        <Svg width={size} height={size}>
          {/* Background Track Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={Colors.borderLight}
            strokeWidth={strokeWidth}
            fill="none"
          />
          {/* Progress Circle */}
          <Circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={isOver ? Colors.warning : Colors.primary}
            strokeWidth={strokeWidth}
            strokeDasharray={`${circumference} ${circumference}`}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            fill="none"
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
          />
        </Svg>

        {/* Center Ring Content */}
        <View style={styles.centerTextContainer}>
          <Text style={styles.consumedNumber}>{consumed}</Text>
          <Text style={styles.consumedLabel}>kcal eaten</Text>
          <View style={styles.divider} />
          <Text style={styles.targetSubtext}>Target {target} kcal</Text>
        </View>
      </View>

      {/* Summary Badge Below Ring */}
      <View style={styles.bottomStatsRow}>
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>REMAINING</Text>
          <Text style={[styles.statBoxValue, isOver && { color: Colors.warning }]}>
            {isOver ? `+${consumed - target}` : remaining}
            <Text style={styles.unitText}> kcal</Text>
          </Text>
        </View>
        <View style={styles.verticalDivider} />
        <View style={styles.statBox}>
          <Text style={styles.statBoxLabel}>DAILY GOAL</Text>
          <Text style={styles.statBoxValue}>
            {target}
            <Text style={styles.unitText}> kcal</Text>
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.surface,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    alignItems: 'center',
    marginHorizontal: Spacing.base,
    marginVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    ...Shadows.card,
  },
  ringContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  centerTextContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  consumedNumber: {
    fontSize: 34,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -1,
  },
  consumedLabel: {
    fontSize: 13,
    color: Colors.textSecondary,
    fontWeight: '600',
    marginTop: -2,
  },
  divider: {
    width: 24,
    height: 2,
    backgroundColor: Colors.border,
    marginVertical: 5,
    borderRadius: 1,
  },
  targetSubtext: {
    fontSize: 11,
    color: Colors.textMuted,
    fontWeight: '500',
  },
  bottomStatsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
    width: '100%',
    marginTop: Spacing.base,
    paddingTop: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  statBox: {
    alignItems: 'center',
    flex: 1,
  },
  statBoxLabel: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
    color: Colors.textMuted,
    marginBottom: 2,
  },
  statBoxValue: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.textPrimary,
  },
  unitText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.textSecondary,
  },
  verticalDivider: {
    width: 1,
    height: 24,
    backgroundColor: Colors.borderLight,
  },
});
