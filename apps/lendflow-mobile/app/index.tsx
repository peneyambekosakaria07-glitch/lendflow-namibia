import { Redirect } from 'expo-router';

export default function Index() {
  // Redirect to dashboard or login based on auth state
  // For now, redirect to login
  return <Redirect href="/(auth)/login" />;
}
