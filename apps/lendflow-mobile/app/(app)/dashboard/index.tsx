// Dashboard Screen - LendFlow Namibia
import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl } from 'react-native';
import { useDashboardStore } from '../../stores';
import { colors, spacing, borderRadius, typography } from '../../utils/designTokens';

export default function DashboardScreen() {
  const { metrics, isLoading, error, fetchMetrics } = useDashboardStore();
  
  useEffect(() => {
    fetchMetrics();
  }, []);
  
  const formatCurrency = (amount: number) => 
    `N$ ${amount.toLocaleString('en-Na', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  
  const formatPercent = (value: number) => 
    `${value.toFixed(1)}%`;
  
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.content}
      refreshControl={
        <RefreshControl refreshing={isLoading} onRefresh={fetchMetrics} tintColor={colors.accent} />
      }
    >
      <Text style={styles.greeting}>Good Morning</Text>
      <Text style={styles.subtitle}>Here's your portfolio overview</Text>
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      <View style={styles.metricsGrid}>
        <MetricCard
          title="Capital at Risk"
          value={metrics ? formatCurrency(metrics.capitalAtRisk) : '—'}
          change={metrics?.capitalAtRiskChange}
          variant={metrics?.capitalAtRisk > 10000 ? 'danger' : 'default'}
        />
        
        <MetricCard
          title="Expected Collections"
          value={metrics ? formatCurrency(metrics.expectedCollectionsThisMonth) : '—'}
          change={metrics?.collectionRateChange}
          variant="success"
        />
        
        <MetricCard
          title="Late Payment Ratio"
          value={metrics ? formatPercent(metrics.latePaymentRatio) : '—'}
          change={metrics?.latePaymentRatioChange}
          variant={metrics?.latePaymentRatio > 10 ? 'warning' : 'default'}
        />
        
        <MetricCard
          title="Active Borrowers"
          value={metrics?.activeBorrowers?.toString() || '—'}
        />
        
        <MetricCard
          title="Active Loans"
          value={metrics?.activeLoans?.toString() || '—'}
        />
        
        <MetricCard
          title="Avg Loan Size"
          value={metrics ? formatCurrency(metrics.averageLoanSize) : '—'}
        />
      </View>
      
      <View style={styles.quickActions}>
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.actionGrid}>
          <ActionButton label="+ New Loan" icon="📋" />
          <ActionButton label="+ Add Borrower" icon="👤" />
          <ActionButton label="📂 Documents" icon="📁" />
          <ActionButton label="💬 Messages" icon="💬" />
        </View>
      </View>
      
      <View style={styles.recentActivity}>
        <Text style={styles.sectionTitle}>Recent Activity</Text>
        <Text style={styles.emptyState}>No recent activity</Text>
      </View>
    </ScrollView>
  );
}

interface MetricCardProps {
  title: string;
  value: string;
  change?: number;
  variant?: 'default' | 'success' | 'warning' | 'danger';
}

function MetricCard({ title, value, change, variant = 'default' }: MetricCardProps) {
  const valueColor = {
    default: colors.textPrimary,
    success: colors.success,
    warning: colors.warning,
    danger: colors.danger,
  }[variant];
  
  return (
    <View style={styles.metricCard}>
      <Text style={styles.metricTitle}>{title}</Text>
      <Text style={[styles.metricValue, { color: valueColor }]}>{value}</Text>
      {change !== undefined && change !== 0 && (
        <Text style={[styles.metricChange, { color: change > 0 ? colors.success : colors.danger }]}>
          {change > 0 ? '+' : ''}{change}% from last month
        </Text>
      )}
    </View>
  );
}

function ActionButton({ label, icon }: { label: string; icon: string }) {
  return (
    <View style={styles.actionButton}>
      <Text style={styles.actionIcon}>{icon}</Text>
      <Text style={styles.actionLabel}>{label}</Text>
    </View>
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
  greeting: {
    fontSize: typography.fontSize.xxl,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.heading,
  },
  subtitle: {
    fontSize: typography.fontSize.base,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  metricCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.xl,
    padding: spacing.lg,
    width: '47%',
  },
  metricTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    textTransform: 'uppercase',
    marginBottom: spacing.xs,
  },
  metricValue: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    fontFamily: typography.fontFamily.mono,
  },
  metricChange: {
    fontSize: typography.fontSize.xs,
    marginTop: spacing.xs,
  },
  quickActions: {
    marginTop: spacing.xl,
  },
  sectionTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  actionGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  actionButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    width: '47%',
    alignItems: 'center',
  },
  actionIcon: {
    fontSize: 24,
    marginBottom: spacing.xs,
  },
  actionLabel: {
    fontSize: typography.fontSize.sm,
    color: colors.textPrimary,
  },
  recentActivity: {
    marginTop: spacing.xl,
  },
  emptyState: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});