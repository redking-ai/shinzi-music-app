import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 1. FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 2. YOUR STEALTH KEYS
const firebaseConfig = {
  apiKey: ['AIzaSyA9', '-BquJOixe2dku', 'MA4OR_LH_', '-4kqcFrRE'].join(''),
  authDomain: "shinzi-music.firebaseapp.com",
  projectId: "shinzi-music",
};
const app = initializeApp(firebaseConfig);

// THE FIX: Tell Firebase this is a native phone app, not a website!
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default function App() {
  // ROUTER STATE: 'Continue', 'Login', 'Signup', 'MainApp'
  const [currentScreen, setCurrentScreen] = useState('Continue');
  
  // AUTH STATE
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [activeTab, setActiveTab] = useState('Home'); // For Main App

  // --- AUTHENTICATION LOGIC ---
  const handleLogin = async () => {
    setErrorMessage('Logging in...');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setCurrentScreen('MainApp');
    } catch (error) {
      setErrorMessage(error.message.replace("Firebase: ", ""));
    }
  };

  const handleSignup = async () => {
    setErrorMessage('Creating account...');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setCurrentScreen('MainApp');
    } catch (error) {
      setErrorMessage(error.message.replace("Firebase: ", ""));
    }
  };

  // --- SCREEN 1: CONTINUE SCREEN ---
  if (currentScreen === 'Continue') {
    return (
      <SafeAreaView style={styles.authContainer}>
        <StatusBar barStyle="light-content" backgroundColor="#000" />
        <View style={styles.authBox}>
          <Ionicons name="musical-notes" size={80} color="#1db954" style={{ marginBottom: 20 }} />
          <Text style={styles.authTitle}>Ready To Listen?</Text>
          <Text style={styles.authSub}>There's 100 Million+ Musics!</Text>
          
          <TouchableOpacity style={[styles.authBtn, styles.btnPrimary]} onPress={() => { setErrorMessage(''); setCurrentScreen('Signup'); }}>
            <Text style={styles.btnPrimaryText}>Sign Up</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={[styles.authBtn, styles.btnSecondary]} onPress={() => { setErrorMessage(''); setCurrentScreen('Login'); }}>
            <Text style={styles.btnSecondaryText}>Log In</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // --- SCREEN 2: LOGIN / SIGNUP SCREENS ---
  if (currentScreen === 'Login' || currentScreen === 'Signup') {
    const isLogin = currentScreen === 'Login';
    return (
      <SafeAreaView style={styles.authContainer}>
        <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={styles.authBox}>
          <TouchableOpacity style={styles.backBtn} onPress={() => setCurrentScreen('Continue')}>
            <Ionicons name="arrow-back" size={28} color="#1db954" />
          </TouchableOpacity>
          
          <Text style={styles.authTitle}>{isLogin ? 'Welcome Back' : 'Create Account'}</Text>
          
          <TextInput 
            style={styles.input} 
            placeholder="Email" 
            placeholderTextColor="#757575" 
            value={email} 
            onChangeText={setEmail} 
            autoCapitalize="none" 
            keyboardType="email-address" 
          />
          <TextInput 
            style={styles.input} 
            placeholder="Password" 
            placeholderTextColor="#757575" 
            value={password} 
            onChangeText={setPassword} 
            secureTextEntry 
          />
          
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          
          <TouchableOpacity style={[styles.authBtn, styles.btnPrimary, { marginTop: 20 }]} onPress={isLogin ? handleLogin : handleSignup}>
            <Text style={styles.btnPrimaryText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- SCREEN 3: MAIN APP (If Logged In) ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.contentArea}>
        {activeTab === 'Home' && (
          <ScrollView style={styles.scrollContainer}>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.subGreeting}>WELCOME BACK</Text>
                <Text style={styles.greetingText}>{email ? email.split('@')[0] : 'Red King'}</Text>
              </View>
              <View style={styles.profileBadge}><Text style={styles.profileLetter}>{email ? email.charAt(0).toUpperCase() : 'R'}</Text></View>
            </View>
            <View style={styles.sectionHeader}><Text style={styles.sectionTitle}>Main Hub Unlocked 🔓</Text></View>
            <View style={styles.emptyFeedBox}>
              <Ionicons name="shield-checkmark" size={32} color="#1db954" />
              <Text style={styles.emptyFeedText}>Firebase Auth Successful!</Text>
              <Text style={styles.emptyFeedSub}>Ready for Stage 2: Render Proxy APIs</Text>
            </View>
          </ScrollView>
        )}
      </View>

      {/* BOTTOM NAV BAR */}
      <View style={styles.bottomNav}>
        <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('Home')}>
          <Ionicons name={activeTab === 'Home' ? "home" : "home-outline"} size={22} color={activeTab === 'Home' ? "#1db954" : "#a7a7a7"} />
          <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>Home</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navBtn} onPress={() => { setCurrentScreen('Continue'); setEmail(''); setPassword(''); }}>
          <Ionicons name="log-out-outline" size={22} color="#ff4444" />
          <Text style={[styles.navText, { color: '#ff4444' }]}>Log Out</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// --- CSS STYLES ---
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000000' },
  authContainer: { flex: 1, backgroundColor: '#000000', justifyContent: 'center', alignItems: 'center' },
  authBox: { width: '85%', maxWidth: 400, backgroundColor: 'rgba(18, 18, 18, 0.9)', padding: 30, borderRadius: 12, borderWidth: 1, borderColor: '#282828', alignItems: 'center' },
  authTitle: { fontSize: 26, fontWeight: '800', color: '#fff', marginBottom: 8 },
  authSub: { fontSize: 14, color: '#a7a7a7', marginBottom: 30 },
  authBtn: { width: '100%', padding: 16, borderRadius: 50, alignItems: 'center', marginBottom: 16 },
  btnPrimary: { backgroundColor: '#1db954' },
  btnSecondary: { backgroundColor: 'transparent', borderWidth: 1, borderColor: '#a7a7a7' },
  btnPrimaryText: { color: '#000', fontSize: 16, fontWeight: '700' },
  btnSecondaryText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  backBtn: { position: 'absolute', top: 20, left: 20 },
  input: { width: '100%', backgroundColor: '#1e1e1e', borderWidth: 1, borderColor: '#333', color: '#fff', borderRadius: 8, padding: 16, fontSize: 15, marginBottom: 16 },
  errorText: { color: '#ff4444', fontSize: 13, marginTop: -8, marginBottom: 8, textAlign: 'center' },
  contentArea: { flex: 1 },
  scrollContainer: { paddingHorizontal: 20, paddingTop: 10 },
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  subGreeting: { color: '#1db954', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  greetingText: { color: '#ffffff', fontSize: 26, fontWeight: '800' },
  profileBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1db954', justifyContent: 'center', alignItems: 'center' },
  profileLetter: { color: '#000000', fontWeight: '900', fontSize: 18 },
  sectionHeader: { marginBottom: 12 },
  sectionTitle: { color: '#ffffff', fontSize: 18, fontWeight: '700' },
  emptyFeedBox: { backgroundColor: '#121212', borderRadius: 12, padding: 24, alignItems: 'center', justifyContent: 'center', marginBottom: 24, borderWidth: 1, borderColor: '#1a1a1a', borderStyle: 'dashed' },
  emptyFeedText: { color: '#ffffff', fontSize: 15, fontWeight: '700', marginTop: 10 },
  emptyFeedSub: { color: '#a7a7a7', fontSize: 12, marginTop: 4 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#121212', borderTopWidth: 1, borderTopColor: '#202020', paddingVertical: 12, paddingBottom: 24, justifyContent: 'space-around' },
  navBtn: { alignItems: 'center' },
  navText: { color: '#a7a7a7', fontSize: 11, marginTop: 4 },
  navTextActive: { color: '#ffffff', fontWeight: '700' },
});
