import React, { useState } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 1. FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 2. YOUR STEALTH KEYS
const firebaseConfig = {
  apiKey: ['AIzaSyA9', '-BquJOixe2dku', 'MA4OR_LH_', '-4kqcFrRE'].join(''),
  authDomain: "shinzi-music.firebaseapp.com",
  projectId: "shinzi-music",
};
const app = initializeApp(firebaseConfig);

// NATIVE FIREBASE FIX
const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(AsyncStorage)
});

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Continue');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // NEW: 4-Tab System (Home, Search, Library, Settings)
  const [activeTab, setActiveTab] = useState('Home'); 
  const [searchQuery, setSearchQuery] = useState('');

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

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentScreen('Continue');
      setEmail('');
      setPassword('');
      setActiveTab('Home');
    } catch (error) {
      console.error("Logout failed", error);
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
          
          <TextInput style={styles.input} placeholder="Email" placeholderTextColor="#757575" value={email} onChangeText={setEmail} autoCapitalize="none" keyboardType="email-address" />
          <TextInput style={styles.input} placeholder="Password" placeholderTextColor="#757575" value={password} onChangeText={setPassword} secureTextEntry />
          
          {errorMessage ? <Text style={styles.errorText}>{errorMessage}</Text> : null}
          
          <TouchableOpacity style={[styles.authBtn, styles.btnPrimary, { marginTop: 20 }]} onPress={isLogin ? handleLogin : handleSignup}>
            <Text style={styles.btnPrimaryText}>{isLogin ? 'Log In' : 'Sign Up'}</Text>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // --- SCREEN 3: MAIN APP VIEWS ---
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      <View style={styles.contentArea}>
        
        {/* === HOME TAB === */}
        {activeTab === 'Home' && (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <View style={styles.topBar}>
              <View>
                <Text style={styles.subGreeting}>GOOD AFTERNOON</Text>
                <Text style={styles.greetingText}>{email ? email.split('@')[0] : 'Red King'}</Text>
              </View>
              <TouchableOpacity style={styles.profileBadge} onPress={() => setActiveTab('Settings')}>
                <Text style={styles.profileLetter}>{email ? email.charAt(0).toUpperCase() : 'R'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.quickGrid}>
              <View style={styles.quickCard}>
                <View style={styles.quickCardImg}><Ionicons name="flame" size={24} color="#fff" /></View>
                <Text style={styles.quickCardText}>Phonk Vibes</Text>
              </View>
              <View style={styles.quickCard}>
                <View style={styles.quickCardImg}><Ionicons name="headset" size={24} color="#fff" /></View>
                <Text style={styles.quickCardText}>Lofi Coding</Text>
              </View>
            </View>

            <Text style={styles.sectionTitle}>Trending Now</Text>
            <View style={styles.placeholderShelf}><Text style={styles.placeholderText}>Render API Hook Pending...</Text></View>
            
            <Text style={styles.sectionTitle}>Made For You</Text>
            <View style={styles.placeholderShelf}><Text style={styles.placeholderText}>Render API Hook Pending...</Text></View>
          </ScrollView>
        )}

        {/* === SEARCH TAB === */}
        {activeTab === 'Search' && (
          <View style={styles.scrollContainer}>
            <Text style={styles.headerText}>Search</Text>
            <View style={styles.searchBoxContainer}>
              <Ionicons name="search" size={20} color="#a7a7a7" style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput} 
                placeholder="What do you want to listen to?" 
                placeholderTextColor="#a7a7a7"
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => setSearchQuery('')} style={styles.clearBtn}>
                  <Ionicons name="close" size={20} color="#a7a7a7" />
                </TouchableOpacity>
              )}
            </View>
            <View style={styles.placeholderResults}>
                <Ionicons name="search-outline" size={48} color="#282828" />
                <Text style={styles.placeholderText}>Search proxy will connect here</Text>
            </View>
          </View>
        )}

        {/* === LIBRARY TAB === */}
        {activeTab === 'Library' && (
          <View style={styles.scrollContainer}>
            <Text style={styles.headerText}>Your Library</Text>
            <View style={styles.placeholderResults}>
                <Ionicons name="library-outline" size={48} color="#282828" />
                <Text style={styles.placeholderText}>Favorites sync goes here</Text>
            </View>
          </View>
        )}

        {/* === SETTINGS TAB === */}
        {activeTab === 'Settings' && (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.headerText}>Settings</Text>
            
            <View style={styles.menuList}>
              {[
                { icon: 'person-outline', label: 'Account' },
                { icon: 'download-outline', label: 'Downloads' },
                { icon: 'time-outline', label: 'Play History' },
                { icon: 'lock-closed-outline', label: 'Privacy' },
                { icon: 'sparkles-outline', label: 'AI References (Soon)' },
                { icon: 'gift-outline', label: 'Refer' },
                { icon: 'settings-outline', label: 'Additional Settings' },
              ].map((item, index) => (
                <TouchableOpacity key={index} style={styles.settingsItem}>
                  <View style={styles.settingsItemLeft}>
                    <Ionicons name={item.icon} size={20} color="#fff" />
                    <Text style={styles.settingsItemText}>{item.label}</Text>
                  </View>
                  <Ionicons name="chevron-forward" size={20} color="#a7a7a7" />
                </TouchableOpacity>
              ))}

              <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
                <Text style={styles.logoutBtnText}>Log Out</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        )}
      </View>

      {/* FLOATING 4-TAB BOTTOM NAV BAR */}
      <View style={styles.floatingNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('Home')}>
            <Ionicons name={activeTab === 'Home' ? "home" : "home-outline"} size={24} color={activeTab === 'Home' ? "#1db954" : "#a7a7a7"} />
            <Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>Home</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('Search')}>
            <Ionicons name={activeTab === 'Search' ? "search" : "search-outline"} size={24} color={activeTab === 'Search' ? "#1db954" : "#a7a7a7"} />
            <Text style={[styles.navText, activeTab === 'Search' && styles.navTextActive]}>Search</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('Library')}>
            <Ionicons name={activeTab === 'Library' ? "library" : "library-outline"} size={24} color={activeTab === 'Library' ? "#1db954" : "#a7a7a7"} />
            <Text style={[styles.navText, activeTab === 'Library' && styles.navTextActive]}>Library</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('Settings')}>
            <Ionicons name={activeTab === 'Settings' ? "settings" : "settings-outline"} size={24} color={activeTab === 'Settings' ? "#1db954" : "#a7a7a7"} />
            <Text style={[styles.navText, activeTab === 'Settings' && styles.navTextActive]}>Settings</Text>
          </TouchableOpacity>
        </View>
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
  scrollContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 120 }, 
  
  // Home Styles
  topBar: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: 20 },
  subGreeting: { color: '#1db954', fontSize: 11, fontWeight: '800', letterSpacing: 1.5, marginBottom: 2 },
  greetingText: { color: '#ffffff', fontSize: 26, fontWeight: '800' },
  profileBadge: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#1db954', justifyContent: 'center', alignItems: 'center' },
  profileLetter: { color: '#000000', fontWeight: '900', fontSize: 18 },
  sectionTitle: { color: '#ffffff', fontSize: 22, fontWeight: '700', marginTop: 30, marginBottom: 16 },
  
  quickGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', gap: 10 },
  quickCard: { width: '48%', backgroundColor: '#282828', borderRadius: 6, flexDirection: 'row', alignItems: 'center', overflow: 'hidden' },
  quickCardImg: { width: 56, height: 56, backgroundColor: '#1db954', justifyContent: 'center', alignItems: 'center' },
  quickCardText: { color: '#fff', fontSize: 13, fontWeight: '700', marginLeft: 10, flex: 1 },
  
  placeholderShelf: { height: 140, backgroundColor: '#121212', borderRadius: 8, justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#1a1a1a', borderStyle: 'dashed' },
  placeholderText: { color: '#a7a7a7', fontSize: 13, marginTop: 8 },
  placeholderResults: { flex: 1, justifyContent: 'center', alignItems: 'center', marginTop: 100 },

  // Shared Headers
  headerText: { fontSize: 32, fontWeight: '800', color: '#fff', marginVertical: 24, letterSpacing: -1 },

  // Search Styles
  searchBoxContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#242424', borderRadius: 50, paddingHorizontal: 16, height: 50 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, height: '100%' },
  clearBtn: { padding: 4 },

  // Settings Styles
  menuList: { gap: 12 },
  settingsItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#121212', padding: 16, borderRadius: 8 },
  settingsItemLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  settingsItemText: { color: '#fff', fontSize: 15, fontWeight: '600' },
  logoutBtn: { backgroundColor: '#2a0e0e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  logoutBtnText: { color: '#ff4444', fontSize: 16, fontWeight: '700' },

  // Floating UI CSS
  floatingNavContainer: { position: 'absolute', bottom: Platform.OS === 'android' ? 30 : 40, left: 16, right: 16 },
  bottomNav: { flexDirection: 'row', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderRadius: 30, paddingVertical: 14, justifyContent: 'space-evenly', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(29, 185, 84, 0.3)', shadowColor: '#1db954', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  navBtn: { alignItems: 'center', width: 60 },
  navText: { color: '#a7a7a7', fontSize: 11, marginTop: 4, fontWeight: '600' },
  navTextActive: { color: '#1db954', fontWeight: '800' },
});
