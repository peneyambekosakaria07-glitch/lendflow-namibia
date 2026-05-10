// Payments Screen - LendFlow Namibia
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, RefreshControl, TextInput, Alert } from 'react-native';
import { usePaymentsStore } from '../../stores';
import { colors, spacing, borderRadius, typography } from '../../utils/designTokens';

export default function PaymentsScreen() {
  const { payments, pendingPayments, isLoading, fetchPayments, fetchPending, decision } = usePaymentsStore();
  const [activeTab, setActiveTab] = useState<'all' | 'pending'>('all');
  
  useEffect(() => {
    fetchPayments();
    fetchPending();
  }, []);
  
  const handleDecision = async (id: string, action: 'approve' | 'reject', amount?: number) => {
    try {
      await decision(id, { 
        decision: action, 
        ...(action === 'approve' ? { verifiedAmount: amount || 0 } : { rejectionReason: 'Verification failed' })
      });
      Alert.alert('Success', `Payment ${action === 'approve' ? 'approved' : 'rejected'}`);
    } catch (err) {
      Alert.alert('Error', 'Failed to process payment decision');
    }
  };
  
  const formatCurrency = (amount: number) => 
    `N$ ${amount.toLocaleString('en-Na', { minimumFractionDigits: 2 })}`;
  
  return (
    <View style={styles.container}>
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'all' && styles.tabActive]}
          onPress={() => setActiveTab('all')}
        >
          <Text style={[styles.tabText, activeTab === 'all' && styles.tabTextActive]}>
            All Payments
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'pending' && styles.tabActive]}
          onPress={() => setActiveTab('pending')}
        >
          <Text style={[styles.tabText, activeTab === 'pending' && styles.tabTextActive]}>
            Pending Review {pendingPayments.length > 0 && `(${pendingPayments.length})`}
          </Text>
        </TouchableOpacity>
      </View>
      
      {activeTab === 'all' ? (
        <FlatList
          data={payments}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchPayments} tintColor={colors.accent} />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.paymentCard}>
              <View style={styles.paymentInfo}>
                <Text style={styles.paymentAmount}>{formatCurrency(Number(item.amount))}</Text>
                <Text style={styles.paymentDate}>
                  {item.paidAt ? new Date(item.paidAt).toLocaleDateString() : '—'}
                </Text>
                <View style={[styles.statusBadge, { 
                  backgroundColor: item.status === 'verified' ? colors.success : 
                                   item.status === 'pending' ? colors.warning : colors.danger 
                }]}>
                  <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
                </View>
              </View>
              {item.referenceNumber && (
                <Text style={styles.reference}>Ref: {item.referenceNumber}</Text>
              )}
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyState}>
              {isLoading ? 'Loading...' : 'No payments recorded yet.'}
            </Text>
          }
        />
      ) : (
        <FlatList
          data={pendingPayments}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isLoading} onRefresh={fetchPending} tintColor={colors.accent} />
          }
          contentContainerStyle={styles.list}
          renderItem={({ item }) => (
            <View style={styles.pendingCard}>
              <View style={styles.pendingHeader}>
                <Text style={styles.pendingTitle}>Payment Proof Received</Text>
                <Text style={styles.pendingAmount}>{formatCurrency(Number(item.amount))}</Text>
              </View>
              
              {item.depositSlipUrl && (
                <View style={styles.depositSlipPreview}>
                  <Text style={styles.depositSlipLabel}>📎 Deposit Slip Attached</Text>
                  <Text style={styles.depositSlipUrl}>{item.depositSlipUrl}</Text>
                </View>
              )}
              
              <TextInput
                style={styles.amountInput}
                placeholder="Enter verified amount"
                placeholderTextColor={colors.textSecondary}
                keyboardType="numeric"
                defaultValue={item.amount?.toString()}
              />
              
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton]}
                  onPress={() => handleDecision(item.id, 'approve')}
                >
                  <Text style={styles.approveButtonText}>✓ Approve</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton]}
                  onPress={() => handleDecision(item.id, 'reject')}
                >
                  <Text style={styles.rejectButtonText}>✕ Reject</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={styles.emptyState}>
              {isLoading ? 'Loading...' : 'No pending payments to review.'}
            </Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  tabs: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    padding: spacing.xs,
  },
  tab: {
    flex: 1,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderRadius: borderRadius.md,
  },
  tabActive: { backgroundColor: colors.accent },
  tabText: { color: colors.textSecondary, fontWeight: '600' },
  tabTextActive: { color: colors.background },
  list: { padding: spacing.md },
  paymentCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  paymentInfo: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  paymentAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.mono,
  },
  paymentDate: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  statusBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
  },
  statusText: { fontSize: typography.fontSize.xs, color: colors.background, fontWeight: 'bold' },
  reference: { color: colors.textSecondary, fontSize: typography.fontSize.xs, marginTop: spacing.xs },
  pendingCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.warning,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  pendingHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md },
  pendingTitle: { color: colors.warning, fontWeight: 'bold' },
  pendingAmount: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.mono,
  },
  depositSlipPreview: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginBottom: spacing.md,
  },
  depositSlipLabel: { color: colors.info, marginBottom: spacing.xs },
  depositSlipUrl: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  amountInput: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    marginBottom: spacing.md,
    fontFamily: typography.fontFamily.mono,
  },
  actionButtons: { flexDirection: 'row', gap: spacing.md },
  actionButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  approveButton: { backgroundColor: colors.success },
  rejectButton: { backgroundColor: colors.danger },
  approveButtonText: { color: colors.background, fontWeight: 'bold' },
  rejectButtonText: { color: colors.background, fontWeight: 'bold' },
  emptyState: { color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
});