// Settings Screen - LendFlow Namibia
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Switch, Alert } from 'react-native';
import { useSettingsStore } from '../../stores';
import { colors, spacing, borderRadius, typography } from '../../utils/designTokens';

export default function SettingsScreen() {
  const { reminderConfig, isLoading, fetchConfig, updateConfig } = useSettingsStore();
  const [formData, setFormData] = useState({
    reminderDaysBefore: '3',
    reminderDayOf: true,
    reminderDaysAfter: '1',
    penaltyRate: '',
    gracePeriodDays: '',
  });
  
  useEffect(() => {
    fetchConfig();
  }, []);
  
  useEffect(() => {
    if (reminderConfig) {
      setFormData({
        reminderDaysBefore: reminderConfig.reminderDaysBefore?.toString() || '3',
        reminderDayOf: reminderConfig.reminderDayOf ?? true,
        reminderDaysAfter: reminderConfig.reminderDaysAfter?.toString() || '1',
        penaltyRate: reminderConfig.penaltyRate ? (reminderConfig.penaltyRate * 100).toString() : '',
        gracePeriodDays: reminderConfig.gracePeriodDays?.toString() || '',
      });
    }
  }, [reminderConfig]);
  
  const handleSave = async () => {
    try {
      await updateConfig({
        reminderDaysBefore: parseInt(formData.reminderDaysBefore),
        reminderDayOf: formData.reminderDayOf,
        reminderDaysAfter: parseInt(formData.reminderDaysAfter),
      });
      Alert.alert('Success', 'Settings saved successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to save settings');
    }
  };
  
  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.title}>Settings</Text>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>🔔 Reminder Schedule</Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Days Before Due Date</Text>
            <Text style={styles.settingDescription}>Send reminder X days before payment is due</Text>
          </View>
          <TextInput
            style={styles.numberInput}
            value={formData.reminderDaysBefore}
            onChangeText={(text) => setFormData({ ...formData, reminderDaysBefore: text })}
            keyboardType="numeric"
          />
        </View>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>On Due Date</Text>
            <Text style={styles.settingDescription}>Send reminder on the day payment is due</Text>
          </View>
          <Switch
            value={formData.reminderDayOf}
            onValueChange={(value) => setFormData({ ...formData, reminderDayOf: value })}
            trackColor={{ false: colors.border, true: colors.accent }}
            thumbColor={colors.textPrimary}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Days After Due Date</Text>
            <Text style={styles.settingDescription}>Send reminder if payment is overdue</Text>
          </View>
          <TextInput
            style={styles.numberInput}
            value={formData.reminderDaysAfter}
            onChangeText={(text) => setFormData({ ...formData, reminderDaysAfter: text })}
            keyboardType="numeric"
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>💰 Penalty Settings</Text>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Daily Penalty Rate (%)</Text>
            <Text style={styles.settingDescription}>Percentage charged per day overdue</Text>
          </View>
          <TextInput
            style={styles.numberInput}
            value={formData.penaltyRate}
            onChangeText={(text) => setFormData({ ...formData, penaltyRate: text })}
            keyboardType="numeric"
            placeholder="2"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
        
        <View style={styles.settingRow}>
          <View>
            <Text style={styles.settingLabel}>Grace Period (Days)</Text>
            <Text style={styles.settingDescription}>Days before penalty starts accruing</Text>
          </View>
          <TextInput
            style={styles.numberInput}
            value={formData.gracePeriodDays}
            onChangeText={(text) => setFormData({ ...formData, gracePeriodDays: text })}
            keyboardType="numeric"
            placeholder="3"
            placeholderTextColor={colors.textSecondary}
          />
        </View>
      </View>
      
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>📱 Notification Channel</Text>
        
        <View style={styles.channelOptions}>
          <TouchableOpacity style={[styles.channelOption, styles.channelSelected]}>
            <Text style={styles.channelIcon}>📱</Text>
            <Text style={styles.channelLabel}>WhatsApp</Text>
            <Text style={styles.channelCheck}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.channelOption}>
            <Text style={styles.channelIcon}>💬</Text>
            <Text style={styles.channelLabel}>SMS</Text>
            <Text style={styles.channelCheck}>○</Text>
          </TouchableOpacity>
        </View>
      </View>
      
      <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
        <Text style={styles.saveButtonText}>Save Settings</Text>
      </TouchableOpacity>
      
      <View style={styles.infoSection}>
        <Text style={styles.infoTitle}>NAMFISA Compliance</Text>
        <Text style={styles.infoText}>
          Default penalty rates and grace periods are set to comply with NAMFISA regulations.
          Changes to these settings should be verified against current microfinance regulations.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.xl,
  },
  section: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.lg,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  settingLabel: {
    fontSize: typography.fontSize.base,
    color: colors.textPrimary,
  },
  settingDescription: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  numberInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.sm,
    width: 60,
    textAlign: 'center',
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.mono,
  },
  channelOptions: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  channelOption: {
    flex: 1,
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.lg,
    alignItems: 'center',
  },
  channelSelected: {
    borderColor: colors.accent,
    backgroundColor: colors.accent + '20',
  },
  channelIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  channelLabel: {
    color: colors.textPrimary,
    fontSize: typography.fontSize.sm,
  },
  channelCheck: {
    color: colors.accent,
    marginTop: spacing.xs,
  },
  saveButton: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  saveButtonText: {
    color: colors.background,
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
  },
  infoSection: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.info,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
  },
  infoTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.info,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  infoText: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    lineHeight: 20,
  },
});