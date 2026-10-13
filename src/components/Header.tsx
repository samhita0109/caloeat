import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { BorderRadius, Colors, Shadows, Spacing } from '../theme/colors';

interface HeaderProps {
  userName: string;
  formattedDate: string;
  streakDays: number;
  onProfilePress?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  userName,
  formattedDate,
  streakDays,
  onProfilePress,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.leftCol}>
        <View style={styles.brandRow}>
          <View style={styles.logoBadge}>
            <Ionicons name="nutrition" size={16} color={Colors.surface} />
          </View>
          <Text style={styles.brandName}>Calo<Text style={styles.brandAccent}>Eat</Text></Text>
        </View>
        <Text style={styles.greeting}>Hi, {userName || 'Friend'} 👋</Text>
        <Text style={styles.dateSubtext}>{formattedDate}</Text>
      </View>

      <View style={styles.rightCol}>
        {/* Streak Badge */}
        <View style={styles.streakBadge}>
          <Ionicons name="flame" size={18} color="#EA580C" />
          <Text style={styles.streakText}>{streakDays}d</Text>
        </View>

        {/* Profile Avatar Button */}
        {onProfilePress && (
          <TouchableOpacity
            style={styles.avatarButton}
            onPress={onProfilePress}
            activeOpacity={0.8}
            accessibilityLabel="Open profile"
          >
            <Ionicons name="person-circle-outline" size={32} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.base,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
  },
  leftCol: {
    flex: 1,
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  logoBadge: {
    backgroundColor: Colors.primary,
    width: 24,
    height: 24,
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  brandName: {
    fontSize: 16,
    fontWeight: '800',
    color: Colors.textPrimary,
    letterSpacing: -0.5,
  },
  brandAccent: {
    color: Colors.primary,
  },
  greeting: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.textPrimary,
    marginTop: 2,
  },
  dateSubtext: {
    fontSize: 12,
    color: Colors.textMuted,
    fontWeight: '500',
    marginTop: 1,
  },
  rightCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  streakBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEDD5',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: BorderRadius.full,
    gap: 3,
  },
  streakText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#C2410C',
  },
  avatarButton: {
    marginLeft: 4,
  },
});
