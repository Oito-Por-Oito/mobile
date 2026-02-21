import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, Switch, Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ScreenContainer } from '@/components/screen-container';
import { useSupabaseAuth } from '@/lib/auth-context';

export default function SettingsScreen() {
  const router = useRouter();
  const { user, signOut } = useSupabaseAuth();
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [notificationsEnabled, setNotificationsEnabled] = useState(true);
  const [autoPromote, setAutoPromote] = useState(true);
  const [showCoordinates, setShowCoordinates] = useState(true);
  const [boardTheme, setBoardTheme] = useState<'classic' | 'green' | 'blue' | 'brown'>('green');

  const BOARD_THEMES = [
    { id: 'classic', name: 'Clássico', light: '#f0d9b5', dark: '#b58863' },
    { id: 'green', name: 'Verde', light: '#eeeed2', dark: '#769656' },
    { id: 'blue', name: 'Azul', light: '#dee3e6', dark: '#8ca2ad' },
    { id: 'brown', name: 'Marrom', light: '#f0d9b5', dark: '#946f51' },
  ];

  return (
    <ScreenContainer containerClassName="bg-background">
      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Header */}
        <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 24, paddingTop: 8 }}>
          <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
            <Text style={{ color: '#9a9a9a', fontSize: 24 }}>←</Text>
          </TouchableOpacity>
          <Text style={{ fontSize: 22, fontWeight: 'bold', color: '#f0f0f0' }}>⚙️ Configurações</Text>
        </View>

        {/* Game Settings */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Jogo
        </Text>
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16, marginBottom: 20,
          borderWidth: 1, borderColor: '#4a4a4a', overflow: 'hidden',
        }}>
          {[
            { label: 'Sons', description: 'Sons de lances e notificações', value: soundEnabled, onChange: setSoundEnabled },
            { label: 'Animações', description: 'Animações de peças no tabuleiro', value: animationsEnabled, onChange: setAnimationsEnabled },
            { label: 'Auto-promover Peão', description: 'Promover automaticamente para Dama', value: autoPromote, onChange: setAutoPromote },
            { label: 'Mostrar Coordenadas', description: 'Exibir letras e números no tabuleiro', value: showCoordinates, onChange: setShowCoordinates },
          ].map((setting, idx, arr) => (
            <View
              key={setting.label}
              style={{
                flexDirection: 'row', alignItems: 'center', padding: 16,
                borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                borderBottomColor: '#3a3a3a',
              }}
            >
              <View style={{ flex: 1 }}>
                <Text style={{ color: '#f0f0f0', fontSize: 15, fontWeight: '500' }}>{setting.label}</Text>
                <Text style={{ color: '#9a9a9a', fontSize: 12, marginTop: 2 }}>{setting.description}</Text>
              </View>
              <Switch
                value={setting.value}
                onValueChange={setting.onChange}
                trackColor={{ false: '#3a3a3a', true: '#d4a843' }}
                thumbColor={setting.value ? '#fff' : '#9a9a9a'}
              />
            </View>
          ))}
        </View>

        {/* Board Theme */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Tema do Tabuleiro
        </Text>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 20 }}>
          {BOARD_THEMES.map((theme) => (
            <TouchableOpacity
              key={theme.id}
              onPress={() => setBoardTheme(theme.id as any)}
              style={{
                flex: 1, alignItems: 'center',
                borderWidth: 2,
                borderColor: boardTheme === theme.id ? '#d4a843' : 'transparent',
                borderRadius: 12, padding: 4,
              }}
            >
              {/* Mini board preview */}
              <View style={{ width: '100%', aspectRatio: 1, borderRadius: 8, overflow: 'hidden' }}>
                {[0, 1, 2, 3].map((row) => (
                  <View key={row} style={{ flex: 1, flexDirection: 'row' }}>
                    {[0, 1, 2, 3].map((col) => (
                      <View
                        key={col}
                        style={{
                          flex: 1,
                          backgroundColor: (row + col) % 2 === 0 ? theme.light : theme.dark,
                        }}
                      />
                    ))}
                  </View>
                ))}
              </View>
              <Text style={{
                color: boardTheme === theme.id ? '#d4a843' : '#9a9a9a',
                fontSize: 11, marginTop: 6, fontWeight: boardTheme === theme.id ? '600' : '400',
              }}>
                {theme.name}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Notifications */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Notificações
        </Text>
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16, marginBottom: 20,
          borderWidth: 1, borderColor: '#4a4a4a', overflow: 'hidden',
        }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', padding: 16 }}>
            <View style={{ flex: 1 }}>
              <Text style={{ color: '#f0f0f0', fontSize: 15, fontWeight: '500' }}>Notificações Push</Text>
              <Text style={{ color: '#9a9a9a', fontSize: 12, marginTop: 2 }}>Alertas de partidas e desafios</Text>
            </View>
            <Switch
              value={notificationsEnabled}
              onValueChange={setNotificationsEnabled}
              trackColor={{ false: '#3a3a3a', true: '#d4a843' }}
              thumbColor={notificationsEnabled ? '#fff' : '#9a9a9a'}
            />
          </View>
        </View>

        {/* About */}
        <Text style={{ color: '#d4a843', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
          Sobre
        </Text>
        <View style={{
          backgroundColor: '#2c2c2c', borderRadius: 16, marginBottom: 20,
          borderWidth: 1, borderColor: '#4a4a4a', overflow: 'hidden',
        }}>
          {[
            { label: 'Versão', value: '1.0.0' },
            { label: 'Plataforma', value: 'OitoPorOito' },
            { label: 'Suporte', value: 'contato@oitoporoito.com.br' },
          ].map((info, idx, arr) => (
            <View
              key={info.label}
              style={{
                flexDirection: 'row', justifyContent: 'space-between',
                alignItems: 'center', padding: 16,
                borderBottomWidth: idx < arr.length - 1 ? 1 : 0,
                borderBottomColor: '#3a3a3a',
              }}
            >
              <Text style={{ color: '#9a9a9a', fontSize: 14 }}>{info.label}</Text>
              <Text style={{ color: '#f0f0f0', fontSize: 14 }}>{info.value}</Text>
            </View>
          ))}
        </View>

        {/* Danger Zone */}
        {user && (
          <>
            <Text style={{ color: '#ef4444', fontSize: 14, fontWeight: '600', marginBottom: 12, textTransform: 'uppercase', letterSpacing: 1 }}>
              Zona de Perigo
            </Text>
            <View style={{
              backgroundColor: '#2c2c2c', borderRadius: 16, marginBottom: 20,
              borderWidth: 1, borderColor: 'rgba(239,68,68,0.3)', overflow: 'hidden',
            }}>
              <TouchableOpacity
                onPress={() => {
                  Alert.alert(
                    'Sair da Conta',
                    'Tem certeza que deseja sair?',
                    [
                      { text: 'Cancelar', style: 'cancel' },
                      { text: 'Sair', style: 'destructive', onPress: signOut },
                    ]
                  );
                }}
                style={{ padding: 16, flexDirection: 'row', alignItems: 'center' }}
              >
                <Text style={{ color: '#ef4444', fontSize: 15, fontWeight: '500', flex: 1 }}>
                  Sair da Conta
                </Text>
                <Text style={{ color: '#ef4444', fontSize: 18 }}>›</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
      </ScrollView>
    </ScreenContainer>
  );
}
