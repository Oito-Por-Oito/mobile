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
  Alert,
  Image,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSupabaseAuth } from '@/lib/auth-context';
import { ScreenContainer } from '@/components/screen-container';
import { LinearGradient } from 'expo-linear-gradient';

export default function LoginScreen() {
  const router = useRouter();
  const { signIn } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Por favor, preencha todos os campos.');
      return;
    }
    setLoading(true);
    setError('');
    const { error: signInError } = await signIn(email.trim(), password);
    setLoading(false);
    if (signInError) {
      setError(signInError.message || 'Erro ao fazer login. Verifique suas credenciais.');
    } else {
      router.replace('/(tabs)');
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView
          contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', padding: 24 }}
          keyboardShouldPersistTaps="handled"
        >
          {/* Logo */}
          <View style={{ alignItems: 'center', marginBottom: 40 }}>
            <View style={{
              width: 80, height: 80, borderRadius: 40,
              backgroundColor: '#2c2c2c', borderWidth: 2, borderColor: '#d4a843',
              alignItems: 'center', justifyContent: 'center', marginBottom: 16,
            }}>
              <Text style={{ fontSize: 36 }}>♟</Text>
            </View>
            <Text style={{ fontSize: 28, fontWeight: 'bold', color: '#d4a843' }}>OitoPorOito</Text>
            <Text style={{ fontSize: 14, color: '#9a9a9a', marginTop: 4 }}>Plataforma de Xadrez</Text>
          </View>

          {/* Card */}
          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 20,
            borderWidth: 1, borderColor: '#4a4a4a', padding: 24,
          }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#f0f0f0', marginBottom: 20, textAlign: 'center' }}>
              Entrar
            </Text>

            {error ? (
              <View style={{
                backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10,
                borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', padding: 12, marginBottom: 16,
              }}>
                <Text style={{ color: '#f87171', textAlign: 'center', fontSize: 14 }}>{error}</Text>
              </View>
            ) : null}

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
            <View style={{ marginBottom: 20 }}>
              <Text style={{ color: '#9a9a9a', fontSize: 13, marginBottom: 6 }}>Senha</Text>
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
                  onSubmitEditing={handleLogin}
                />
                <TouchableOpacity
                  onPress={() => setShowPassword(!showPassword)}
                  style={{ position: 'absolute', right: 14, top: 14 }}
                >
                  <Text style={{ fontSize: 18 }}>{showPassword ? '🙈' : '👁️'}</Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Login Button */}
            <TouchableOpacity
              onPress={handleLogin}
              disabled={loading}
              style={{
                backgroundColor: '#d4a843', borderRadius: 12,
                padding: 16, alignItems: 'center', marginBottom: 12,
                opacity: loading ? 0.7 : 1,
              }}
            >
              {loading ? (
                <ActivityIndicator color="#1e1e1e" />
              ) : (
                <Text style={{ color: '#1e1e1e', fontWeight: 'bold', fontSize: 16 }}>Entrar</Text>
              )}
            </TouchableOpacity>

            {/* Forgot Password */}
            <TouchableOpacity
              onPress={() => router.push('/(auth)/forgot-password' as any)}
              style={{ alignItems: 'center', marginBottom: 16 }}
            >
              <Text style={{ color: '#d4a843', fontSize: 14 }}>Esqueceu a senha?</Text>
            </TouchableOpacity>

            {/* Divider */}
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 16 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: '#4a4a4a' }} />
              <Text style={{ color: '#9a9a9a', marginHorizontal: 12, fontSize: 13 }}>OU</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: '#4a4a4a' }} />
            </View>

            {/* Sign Up Link */}
            <View style={{ flexDirection: 'row', justifyContent: 'center' }}>
              <Text style={{ color: '#9a9a9a', fontSize: 14 }}>Não tem conta? </Text>
              <TouchableOpacity onPress={() => router.push('/(auth)/signup' as any)}>
                <Text style={{ color: '#d4a843', fontWeight: '600', fontSize: 14 }}>Criar conta</Text>
              </TouchableOpacity>
            </View>
          </View>

          {/* Back to Home */}
          <TouchableOpacity
            onPress={() => router.replace('/(tabs)')}
            style={{ alignItems: 'center', marginTop: 20 }}
          >
            <Text style={{ color: '#9a9a9a', fontSize: 14 }}>← Voltar ao início</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
