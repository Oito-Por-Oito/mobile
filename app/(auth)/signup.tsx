import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSupabaseAuth } from '@/lib/auth-context';
import { ScreenContainer } from '@/components/screen-container';

export default function SignupScreen() {
  const router = useRouter();
  const { signUp } = useSupabaseAuth();
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleSignup = async () => {
    if (!username || !email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    if (username.length < 3) {
      setError('Username deve ter pelo menos 3 caracteres.');
      return;
    }
    if (password.length < 6) {
      setError('Senha deve ter pelo menos 6 caracteres.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: signUpError } = await signUp(email.trim(), password, {
      username: username.trim(),
      display_name: username.trim(),
    });
    setLoading(false);
    if (signUpError) {
      setError(signUpError.message || 'Erro ao criar conta.');
    } else {
      setSuccess(true);
    }
  };

  if (success) {
    return (
      <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
        <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: 24 }}>
          <Text style={{ fontSize: 48, marginBottom: 16 }}>📧</Text>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#d4a843', marginBottom: 12, textAlign: 'center' }}>
            Verifique seu Email
          </Text>
          <Text style={{ color: '#9a9a9a', textAlign: 'center', marginBottom: 24, lineHeight: 22 }}>
            Enviamos um link de confirmação para{' '}
            <Text style={{ color: '#d4a843' }}>{email}</Text>.{'\n'}
            Clique no link para ativar sua conta.
          </Text>
          <TouchableOpacity
            onPress={() => router.replace('/(auth)/login' as any)}
            style={{
              backgroundColor: '#3a3a3a', borderRadius: 12,
              padding: 16, alignItems: 'center', width: '100%',
              borderWidth: 1, borderColor: '#4a4a4a',
            }}
          >
            <Text style={{ color: '#f0f0f0', fontWeight: '600', fontSize: 16 }}>Voltar ao Login</Text>
          </TouchableOpacity>
        </View>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 32 }}>
            <View style={{
              width: 72, height: 72, borderRadius: 36,
              backgroundColor: '#2c2c2c', borderWidth: 2, borderColor: '#d4a843',
              alignItems: 'center', justifyContent: 'center', marginBottom: 12,
            }}>
              <Text style={{ fontSize: 32 }}>♟</Text>
            </View>
            <Text style={{ fontSize: 24, fontWeight: 'bold', color: '#d4a843' }}>Criar Conta</Text>
          </View>

          {/* Card */}
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 20,
            borderWidth: 1, borderColor: '#4a4a4a', padding: 24,
          }}>
            {error ? (
              <View style={{
                backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10,
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', padding: 12, marginBottom: 16,
              }}>
                <Text style={{ color: '#f87171', textAlign: 'center', fontSize: 14 }}>{error}</Text>
              </View>
            ) : null}

            {/* Username */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 6 }}>Username</Text>
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="seunome123"
                placeholderTextColor="#666"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: '#3a3a3a', borderRadius: 12,
                  borderWidth: 1, borderColor: '#4a4a4a',
                  padding: 14, color: '#f0f0f0', fontSize: 16,
                }}
              />
            </View>

            {/* Email */}
            <View style={{ marginBottom: 14 }}>
              <Text style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 6 }}>Email</Text>
              <TextInput
                value={email}
                onChangeText={setEmail}
                placeholder="seu@email.com"
                placeholderTextColor="#666"
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                style={{
                  backgroundColor: '#3a3a3a', borderRadius: 12,
                  borderWidth: 1, borderColor: '#4a4a4a',
                  padding: 14, color: '#f0f0f0', fontSize: 16,
                }}
              />
            </View>

            {/* Password */}
            <View style={{ marginBottom: 24 }}>
              <Text style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 6 }}>Senha (mín. 6 caracteres)</Text>
              <View style={{ position: 'relative' }}>
                <TextInput
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Sua senha"
                  placeholderTextColor="#666"
                  secureTextEntry={!showPassword}
                  style={{
                    backgroundColor: '#3a3a3a', borderRadius: 12,
                    borderWidth: 1, borderColor: '#4a4a4a',
                    padding: 14, paddingRight: 50, color: '#f0f0f0', fontSize: 16,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleSignup}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: 14 }}
                >
                  <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Signup Button */}
            <TouchableOpacity
              onPress={handleSignup}
              disabled={loading}
              style={{
                backgroundColor: '#d4a843', borderRadius: 12,
                padding: 16, alignItems: 'center', marginBottom: 16,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#1e1e1e" />
              ) : (
                <Text style={{ color: '#1e1e1e', fontWeight: 'bold', fontSize: 16 }}>Criar Conta</Text>
              )}
            </TouchableOpacity>

            {/* Login Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Text style={{ color: '#9a9a9a', fontSize: 14 }}>Já tem conta? </Text>
              <TouchableOpacity onPress={() => router.replace('/(auth)/login' as any)}>
                <Text style={{ color: '#d4a843', fontWeight: '600', fontSize: 14 }}>Entrar</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
