import React from 'react';
import { useRouter, Link } from 'expo-router';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function RegisterScreen() {
  const router = useRouter();
  const [businessName, setBusinessName] = React.useState('');
  const [ownerName, setOwnerName] = React.useState('');
  const [email, setEmail] = React.useState('');
  const [phone, setPhone] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleRegister = () => {
    // TODO: Implement actual registration
    router.replace('/(app)/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join LendFlow Namibia</Text>
        
        <View style={styles.form}>
          <TextInput
            style={styles.input}
            placeholder="Business Name"
            placeholderTextColor="#A0A0A0"
            value={businessName}
            onChangeText={setBusinessName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Owner Name"
            placeholderTextColor="#A0A0A0"
            value={ownerName}
            onChangeText={setOwnerName}
          />
          
          <TextInput
            style={styles.input}
            placeholder="Email"
            placeholderTextColor="#A0A0A0"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Phone (0811234567)"
            placeholderTextColor="#A0A0A0"
            value={phone}
            onChangeText={setPhone}
            keyboardType="phone-pad"
          />
          
          <TextInput
            style={styles.input}
            placeholder="Password"
            placeholderTextColor="#A0A0A0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Button
            title="Create Account"
            onPress={handleRegister}
            color="#CCFF00"
          />
        </View>
        
        <Link href="/(auth)/login" style={styles.link}>
          <Text style={styles.linkText}>Already have an account? Sign In</Text>
        </Link>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'center',
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 32,
  },
  form: {
    gap: 16,
  },
  input: {
    backgroundColor: '#121212',
    borderWidth: 1,
    borderColor: '#222222',
    borderRadius: 12,
    padding: 16,
    color: '#FFFFFF',
    fontSize: 16,
  },
  link: {
    marginTop: 24,
    textAlign: 'center',
  },
  linkText: {
    color: '#00F0FF',
    fontSize: 14,
  },
});
