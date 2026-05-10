// Loans Screen - LendFlow Namibia
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl, ScrollView } from 'react-native';
import { useLoansStore, useBorrowersStore } from '../../stores';
import { colors, spacing, borderRadius, typography } from '../../utils/designTokens';

export default function LoansScreen() {
  const { loans, isLoading, fetchLoans, createLoan } = useLoansStore();
  const { borrowers, fetchBorrowers } = useBorrowersStore();
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [formData, setFormData] = useState({
    borrowerId: '',
    principal: '',
    annualRate: '',
    interestType: 'simple' as 'simple' | 'compound',
    termMonths: '6',
  });
  const [preview, setPreview] = useState<any>(null);
  
  useEffect(() => {
    fetchLoans();
    fetchBorrowers();
  }, []);
  
  const calculatePreview = () => {
    const principal = parseFloat(formData.principal);
    const annualRate = parseFloat(formData.annualRate) / 100;
    const termMonths = parseInt(formData.termMonths) || 6;
    
    if (isNaN(principal) || isNaN(annualRate)) {
      setPreview(null);
      return;
    }
    
    const monthlyRate = annualRate / 12;
    let totalInterest: number;
    
    if (formData.interestType === 'simple') {
      totalInterest = principal * annualRate * (termMonths / 12);
    } else {
      totalInterest = principal * (Math.pow(1 + monthlyRate, termMonths) - 1);
    }
    
    const totalRepayment = principal + totalInterest;
    const monthlyPayment = totalRepayment / termMonths;
    
    setPreview({
      totalInterest: totalInterest.toFixed(2),
      totalRepayment: totalRepayment.toFixed(2),
      monthlyPayment: monthlyPayment.toFixed(2),
    });
  };
  
  useEffect(() => {
    calculatePreview();
  }, [formData.principal, formData.annualRate, formData.termMonths, formData.interestType]);
  
  const handleCreateLoan = async () => {
    try {
      await createLoan({
        borrowerId: formData.borrowerId,
        principal: parseFloat(formData.principal),
        annualRate: parseFloat(formData.annualRate) / 100,
        interestType: formData.interestType,
        termMonths: parseInt(formData.termMonths),
        startDate: new Date().toISOString(),
      });
      setShowCreateForm(false);
      setFormData({ borrowerId: '', principal: '', annualRate: '', interestType: 'simple', termMonths: '6' });
    } catch (err) {
      console.error('Failed to create loan:', err);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return colors.success;
      case 'pending': return colors.warning;
      case 'overdue': return colors.danger;
      case 'completed': return colors.info;
      default: return colors.textSecondary;
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Loans</Text>
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowCreateForm(!showCreateForm)}
        >
          <Text style={styles.addButtonText}>{showCreateForm ? '✕' : '+ New Loan'}</Text>
        </TouchableOpacity>
      </View>
      
      {showCreateForm && (
        <ScrollView style={styles.form}>
          <Text style={styles.formTitle}>Create New Loan</Text>
          
          <Text style={styles.label}>Select Borrower *</Text>
          <View style={styles.borrowerPicker}>
            {borrowers.map(b => (
              <TouchableOpacity
                key={b.id}
                style={[
                  styles.borrowerOption,
                  formData.borrowerId === b.id && styles.borrowerOptionSelected
                ]}
                onPress={() => setFormData({ ...formData, borrowerId: b.id })}
              >
                <Text style={[
                  styles.borrowerOptionText,
                  formData.borrowerId === b.id && styles.borrowerOptionTextSelected
                ]}>{b.fullName}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.label}>Loan Amount (N$) *</Text>
          <TextInput
            style={styles.input}
            placeholder="5000"
            placeholderTextColor={colors.textSecondary}
            value={formData.principal}
            onChangeText={(text) => setFormData({ ...formData, principal: text })}
            keyboardType="numeric"
          />
          
          <Text style={styles.label}>Annual Interest Rate (%) *</Text>
          <TextInput
            style={styles.input}
            placeholder="24"
            placeholderTextColor={colors.textSecondary}
            value={formData.annualRate}
            onChangeText={(text) => setFormData({ ...formData, annualRate: text })}
            keyboardType="numeric"
          />
          
          <Text style={styles.label}>Term (Months) *</Text>
          <View style={styles.termPicker}>
            {['1', '3', '6', '12', '24', '36'].map(term => (
              <TouchableOpacity
                key={term}
                style={[
                  styles.termOption,
                  formData.termMonths === term && styles.termOptionSelected
                ]}
                onPress={() => setFormData({ ...formData, termMonths: term })}
              >
                <Text style={[
                  styles.termOptionText,
                  formData.termMonths === term && styles.termOptionTextSelected
                ]}>{term}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <Text style={styles.label}>Interest Type</Text>
          <View style={styles.typePicker}>
            <TouchableOpacity
              style={[styles.typeOption, formData.interestType === 'simple' && styles.typeOptionSelected]}
              onPress={() => setFormData({ ...formData, interestType: 'simple' })}
            >
              <Text style={[styles.typeOptionText, formData.interestType === 'simple' && styles.typeOptionTextSelected]}>Simple</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeOption, formData.interestType === 'compound' && styles.typeOptionSelected]}
              onPress={() => setFormData({ ...formData, interestType: 'compound' })}
            >
              <Text style={[styles.typeOptionText, formData.interestType === 'compound' && styles.typeOptionTextSelected]}>Compound</Text>
            </TouchableOpacity>
          </View>
          
          {preview && (
            <View style={styles.preview}>
              <Text style={styles.previewTitle}>Loan Preview</Text>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>You lend:</Text>
                <Text style={styles.previewValue}>N$ {parseFloat(formData.principal).toLocaleString()}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Total Interest:</Text>
                <Text style={styles.previewValueAccent}>N$ {preview.totalInterest}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Total Repayment:</Text>
                <Text style={styles.previewValue}>N$ {preview.totalRepayment}</Text>
              </View>
              <View style={styles.previewRow}>
                <Text style={styles.previewLabel}>Monthly Installment:</Text>
                <Text style={styles.previewValueHighlight}>N$ {preview.monthlyPayment}</Text>
              </View>
            </View>
          )}
          
          <TouchableOpacity 
            style={styles.submitButton} 
            onPress={handleCreateLoan}
            disabled={!formData.borrowerId || !formData.principal || !formData.annualRate}
          >
            <Text style={styles.submitButtonText}>Approve & Generate Schedule</Text>
          </TouchableOpacity>
        </ScrollView>
      )}
      
      <FlatList
        data={loans}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => fetchLoans()} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.loanCard}>
            <View style={styles.loanHeader}>
              <Text style={styles.loanBorrower}>{item.borrowerId}</Text>
              <View style={[styles.statusBadge, { backgroundColor: getStatusColor(item.status) }]}>
                <Text style={styles.statusText}>{item.status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={styles.loanDetails}>
              <View style={styles.loanAmount}>
                <Text style={styles.loanAmountLabel}>Principal</Text>
                <Text style={styles.loanAmountValue}>N$ {Number(item.principalAmount).toLocaleString()}</Text>
              </View>
              <View style={styles.loanAmount}>
                <Text style={styles.loanAmountLabel}>Next Payment</Text>
                <Text style={styles.loanAmountValue}>{item.endDate}</Text>
              </View>
            </View>
            <Text style={styles.loanRate}>{Number(item.interestRate * 100).toFixed(0)}% {item.interestType}</Text>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyState}>
            {isLoading ? 'Loading...' : 'No loans yet. Create your first loan.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.lg,
  },
  title: {
    fontSize: typography.fontSize.xl,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
  },
  addButtonText: { color: colors.background, fontWeight: 'bold' },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
    maxHeight: 500,
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  label: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginBottom: spacing.xs,
    marginTop: spacing.sm,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    fontFamily: typography.fontFamily.mono,
  },
  borrowerPicker: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  borrowerOption: {
    backgroundColor: colors.background,
    padding: spacing.sm,
    borderRadius: borderRadius.sm,
    borderWidth: 1,
    borderColor: colors.border,
  },
  borrowerOptionSelected: { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
  borrowerOptionText: { color: colors.textSecondary, fontSize: typography.fontSize.sm },
  borrowerOptionTextSelected: { color: colors.accent },
  termPicker: { flexDirection: 'row', gap: spacing.xs },
  termOption: {
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
  },
  termOptionSelected: { borderColor: colors.accent, backgroundColor: colors.accent + '20' },
  termOptionText: { color: colors.textSecondary },
  termOptionTextSelected: { color: colors.accent },
  typePicker: { flexDirection: 'row', gap: spacing.sm },
  typeOption: {
    flex: 1,
    backgroundColor: colors.background,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: 'center',
  },
  typeOptionSelected: { borderColor: colors.accent },
  typeOptionText: { color: colors.textSecondary },
  typeOptionTextSelected: { color: colors.accent },
  preview: {
    backgroundColor: colors.surfaceElevated,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    marginTop: spacing.lg,
    borderWidth: 1,
    borderColor: colors.accent,
  },
  previewTitle: {
    fontSize: typography.fontSize.sm,
    color: colors.accent,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  previewRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xs },
  previewLabel: { color: colors.textSecondary },
  previewValue: { color: colors.textPrimary },
  previewValueAccent: { color: colors.warning },
  previewValueHighlight: { color: colors.accent, fontWeight: 'bold', fontFamily: typography.fontFamily.mono },
  submitButton: {
    backgroundColor: colors.accent,
    padding: spacing.lg,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.lg,
  },
  submitButtonText: { color: colors.background, fontWeight: 'bold' },
  list: { padding: spacing.md },
  loanCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
  },
  loanHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  loanBorrower: { fontSize: typography.fontSize.base, fontWeight: 'bold', color: colors.textPrimary },
  statusBadge: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  statusText: { fontSize: typography.fontSize.xs, color: colors.background, fontWeight: 'bold' },
  loanDetails: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm },
  loanAmount: {},
  loanAmountLabel: { fontSize: typography.fontSize.xs, color: colors.textSecondary },
  loanAmountValue: { fontSize: typography.fontSize.base, color: colors.textPrimary, fontFamily: typography.fontFamily.mono },
  loanRate: { fontSize: typography.fontSize.sm, color: colors.textSecondary },
  emptyState: { color: colors.textSecondary, textAlign: 'center', padding: spacing.xl },
});