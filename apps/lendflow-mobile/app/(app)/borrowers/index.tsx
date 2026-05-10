// Borrowers Screen - LendFlow Namibia
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, RefreshControl } from 'react-native';
import { useBorrowersStore } from '../../stores';
import { colors, spacing, borderRadius, typography } from '../../utils/designTokens';

export default function BorrowersScreen() {
  const { borrowers, isLoading, error, fetchBorrowers, createBorrower } = useBorrowersStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    nationalId: '',
    email: '',
    employerName: '',
  });
  
  useEffect(() => {
    fetchBorrowers();
  }, []);
  
  const handleSearch = () => {
    fetchBorrowers({ search: searchQuery });
  };
  
  const handleAddBorrower = async () => {
    try {
      await createBorrower(formData);
      setShowAddForm(false);
      setFormData({ fullName: '', phone: '', nationalId: '', email: '', employerName: '' });
    } catch (err) {
      console.error('Failed to add borrower:', err);
    }
  };
  
  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search borrowers..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity 
          style={styles.addButton}
          onPress={() => setShowAddForm(!showAddForm)}
        >
          <Text style={styles.addButtonText}>{showAddForm ? '✕' : '+ Add'}</Text>
        </TouchableOpacity>
      </View>
      
      {showAddForm && (
        <View style={styles.form}>
          <Text style={styles.formTitle}>New Borrower</Text>
          <TextInput
            style={styles.input}
            placeholder="Full Name *"
            placeholderTextColor={colors.textSecondary}
            value={formData.fullName}
            onChangeText={(text) => setFormData({ ...formData, fullName: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Phone (081xxxxxxx) *"
            placeholderTextColor={colors.textSecondary}
            value={formData.phone}
            onChangeText={(text) => setFormData({ ...formData, phone: text })}
            keyboardType="phone-pad"
          />
          <TextInput
            style={styles.input}
            placeholder="National ID"
            placeholderTextColor={colors.textSecondary}
            value={formData.nationalId}
            onChangeText={(text) => setFormData({ ...formData, nationalId: text })}
          />
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor={colors.textSecondary}
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
          />
          <TextInput
            style={styles.input}
            placeholder="Employer Name"
            placeholderTextColor={colors.textSecondary}
            value={formData.employerName}
            onChangeText={(text) => setFormData({ ...formData, employerName: text })}
          />
          <TouchableOpacity style={styles.submitButton} onPress={handleAddBorrower}>
            <Text style={styles.submitButtonText}>Add Borrower</Text>
          </TouchableOpacity>
        </View>
      )}
      
      {error && <Text style={styles.error}>{error}</Text>}
      
      <FlatList
        data={borrowers}
        keyExtractor={(item) => item.id}
        refreshControl={
          <RefreshControl refreshing={isLoading} onRefresh={() => fetchBorrowers()} tintColor={colors.accent} />
        }
        contentContainerStyle={styles.list}
        renderItem={({ item }) => (
          <TouchableOpacity style={styles.borrowerCard}>
            <View style={styles.borrowerInfo}>
              <Text style={styles.borrowerName}>{item.fullName}</Text>
              <Text style={styles.borrowerPhone}>{item.phone}</Text>
              {item.employerName && (
                <Text style={styles.borrowerEmployer}>{item.employerName}</Text>
              )}
            </View>
            <View style={styles.borrowerActions}>
              <Text style={styles.viewButton}>View →</Text>
            </View>
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <Text style={styles.emptyState}>
            {isLoading ? 'Loading...' : 'No borrowers yet. Add your first borrower.'}
          </Text>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    padding: spacing.md,
    gap: spacing.md,
  },
  searchInput: {
    flex: 1,
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
  },
  addButton: {
    backgroundColor: colors.accent,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
  },
  addButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  form: {
    backgroundColor: colors.surface,
    padding: spacing.lg,
    margin: spacing.md,
    borderRadius: borderRadius.lg,
  },
  formTitle: {
    fontSize: typography.fontSize.lg,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: spacing.md,
  },
  input: {
    backgroundColor: colors.background,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
  },
  submitButton: {
    backgroundColor: colors.accent,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitButtonText: {
    color: colors.background,
    fontWeight: 'bold',
  },
  error: {
    color: colors.danger,
    padding: spacing.md,
  },
  list: {
    padding: spacing.md,
  },
  borrowerCard: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: borderRadius.lg,
    padding: spacing.lg,
    marginBottom: spacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  borrowerInfo: {
    flex: 1,
  },
  borrowerName: {
    fontSize: typography.fontSize.base,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  borrowerPhone: {
    fontSize: typography.fontSize.sm,
    color: colors.textSecondary,
    marginTop: spacing.xs,
  },
  borrowerEmployer: {
    fontSize: typography.fontSize.xs,
    color: colors.info,
    marginTop: spacing.xs,
  },
  borrowerActions: {
    marginLeft: spacing.md,
  },
  viewButton: {
    color: colors.accent,
    fontWeight: 'bold',
  },
  emptyState: {
    color: colors.textSecondary,
    textAlign: 'center',
    padding: spacing.xl,
  },
});