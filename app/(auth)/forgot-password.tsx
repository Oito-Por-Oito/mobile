import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity,
  KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useSupabaseAuth } from '@/lib/auth-context';
import { ScreenContainer } from '@/components/screen-container';

export default function ForgotPasswordScreen() {
  const router = useRouter();
  const { resetPassword } = useSupabaseAuth();
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleReset = async () => {
    if (!email) { setError('Digite seu email.'); return; }
    setLoading(true);
    setError('');
    const { error: resetError } = await resetPassword(email.trim());
    setLoading(false);
    if (resetError) {
      setError(resetError.message || 'Erro ao enviar email.');
    } else {
      setSuccess(true);
    }
  };

  return (
    <ScreenContainer containerClassName="bg-background" edges={['top', 'left', 'right', 'bottom']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={{ flex: 1, justifyContent: 'center', padding: 24 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginBottom: 24 }}>
            <Text style={{ color: '#9a9a9a', fontSize: 16 }}>← Voltar</Text>
          </TouchableOpacity>

          <View style={{
            backgroundColor: '#2c2c2c', borderRadius: 20,
            borderWidth: 1, borderColor: '#4a4a4a', padding: 24,
          }}>
            <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#d4a843', marginBottom: 8, textAlign: 'center' }}>
              Recuperar Senha
            </Text>
            <Text style={{ color: '#9a9a9a', textAlign: 'center', marginBottom: 24, lineHeight: 20 }}>
              Digite seu email e enviaremos um link para redefinir sua senha.
            </Text>

            {success ? (
              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: 40, marginBottom: 12 }}>📧</Text>
                <Text style={{ color: '#4ade80', textAlign: 'center', fontSize: 15, lineHeight: 22 }}>
                  Email enviado! Verifique sua caixa de entrada.
                </Text>
              </View>
            ) : (
              <>
                {error ? (
                  <View style={{
                    backgroundColor: 'rgba(239,68,68,0.15)', borderRadius: 10,
                    borderWidth: 1, borderColor: 'rgba(239,68,68,0.4)', padding: 12, marginBottom: 16,
                  }}>
                    <Text style={{ color: '#f87171', textAlign: 'center', fontSize: 14 }}>{error}</Text>
                  </View>
                ) : null}

                <TextInput
                  value={email}
                  onChangeText={setEmail}
                  placeholder="seu@email.com"
                  placeholderTextColor="#666"
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={{
                    backgroundColor: '#3a3a3a', borderRadius: 12,
                    borderWidth: 1, borderColor: '#4a4a4a',
                    padding: 14, color: '#f0f0f0', fontSize: 16, marginBottom: 20,
                  }}
                  returnKeyType="done"
                  onSubmitEditing={handleReset}
                />

                <TouchableOpacity
                  onPress={handleReset}
                  disabled={loading}
                  style={{
                    backgroundColor: '#d4a843', borderRadius: 12,
                    padding: 16, alignItems: 'center',
                    opacity: loading ? 0.7 : 1,
                  }}
                >
                  {loading ? (
                    <ActivityIndicator color="#1e1e1e" />
                  ) : (
                    <Text style={{ color: '#1e1e1e', fontWeight: 'bold', fontSize: 16 }}>Enviar Email</Text>
                  )}
                </TouchableOpacity>
              </>
            )}
          </View>
        </View>
      </KeyboardAvoidingView>
    </ScreenContainer>
  );
}
