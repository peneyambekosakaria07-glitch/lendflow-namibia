import React from 'react';
import { useRouter, Link } from 'expo-router';
import { View, Text, TextInput, Button, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');

  const handleLogin = () => {
    // TODO: Implement actual auth
    router.replace('/(app)/dashboard');
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>LendFlow</Text>
        <Text style={styles.subtitle}>Namibia</Text>
        
        <View style={styles.form}>
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
            placeholder="Password"
            placeholderTextColor="#A0A0A0"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
          
          <Button
            title="Sign In"
            onPress={handleLogin}
            color="#CCFF00"
          />
        </View>
        
        <Link href="/(auth)/register" style={styles.link}>
          <Text style={styles.linkText}>Don't have an account? Register</Text>
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
    fontSize: 48,
    fontWeight: 'bold',
    color: '#CCFF00',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 18,
    color: '#A0A0A0',
    textAlign: 'center',
    marginBottom: 48,
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
