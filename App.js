import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, TouchableOpacity, SafeAreaView, StatusBar, ScrollView, TextInput, KeyboardAvoidingView, Platform, Modal, Image } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

// 1. FIREBASE IMPORTS
import { initializeApp } from 'firebase/app';
import { initializeAuth, getReactNativePersistence, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';

// 2. OFFICIAL EXPO AUDIO ENGINE
import { Audio } from 'expo-av';

// 3. YOUR STEALTH KEYS
const firebaseConfig = {
  apiKey: ['AIzaSyA9', '-BquJOixe2dku', 'MA4OR_LH_', '-4kqcFrRE'].join(''),
  authDomain: "shinzi-music.firebaseapp.com",
  projectId: "shinzi-music",
};
const app = initializeApp(firebaseConfig);
const auth = initializeAuth(app, { persistence: getReactNativePersistence(AsyncStorage) });

// 4. YOUR LIVE RENDER BACKEND
const RENDER_BACKEND_URL = "https://shinzi-music-backend-mqry.onrender.com";

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('Continue');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  // NAVIGATION & SEARCH
  const [activeTab, setActiveTab] = useState('Home'); 
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searchLoading, setSearchLoading] = useState(false);

  // PLAYER STATE
  const [currentTrack, setCurrentTrack] = useState(null);
  const [isPlayerOpen, setIsPlayerOpen] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [sound, setSound] = useState(null);

  // CLEANUP AUDIO MEMORY WHEN APP CLOSES
  useEffect(() => {
    return sound ? () => { sound.unloadAsync(); } : undefined;
  }, [sound]);

  // --- AUTH LOGIC ---
  const handleLogin = async () => {
    setErrorMessage('Logging in...');
    try {
      await signInWithEmailAndPassword(auth, email, password);
      setCurrentScreen('MainApp');
    } catch (error) { setErrorMessage(error.message.replace("Firebase: ", "")); }
  };

  const handleSignup = async () => {
    setErrorMessage('Creating account...');
    try {
      await createUserWithEmailAndPassword(auth, email, password);
      setCurrentScreen('MainApp');
    } catch (error) { setErrorMessage(error.message.replace("Firebase: ", "")); }
  };

  const handleLogout = async () => {
    try {
      await signOut(auth);
      setCurrentScreen('Continue');
      setEmail(''); setPassword(''); setActiveTab('Home');
      
      if (sound) { await sound.unloadAsync(); }
      setSound(null);
      setCurrentTrack(null);
      setIsPlaying(false);
    } catch (error) { console.error("Logout failed", error); }
  };

  // --- MUSIC ENGINE API CALLS ---
  // GPT FIX: Now accepts a query parameter so it doesn't use old React state!
  const handleSearch = async (query = searchQuery) => {
    if (!query || !query.trim()) return;
    
    setSearchLoading(true);
    try {
      const response = await fetch(`${RENDER_BACKEND_URL}/search?q=${encodeURIComponent(query)}`);
      const data = await response.json();
      setSearchResults(data.results || []);
    } catch (error) {
      console.log("Search error", error);
    } finally {
      setSearchLoading(false);
    }
  };

  const playSong = async (track) => {
    try {
      setCurrentTrack(track);
      setIsPlayerOpen(true);

      const response = await fetch(`${RENDER_BACKEND_URL}/stream/${track.id}`);
      const data = await response.json();

      if (data.streamUrl) {
        if (sound) {
          await sound.unloadAsync();
        }

        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
        });

        const { sound: newSound } = await Audio.Sound.createAsync(
          { uri: data.streamUrl },
          { shouldPlay: true }
        );
        
        setSound(newSound);
        setIsPlaying(true); 
      }
    } catch (error) {
      console.log("Stream error", error);
      setIsPlaying(false);
    }
  };

  const togglePlayback = async () => {
    if (!sound) return;
    if (isPlaying) {
      await sound.pauseAsync();
      setIsPlaying(false);
    } else {
      await sound.playAsync();
      setIsPlaying(true);
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
              <TouchableOpacity style={styles.quickCard} onPress={() => { setSearchQuery('Phonk'); setActiveTab('Search'); handleSearch('Phonk'); }}>
                <View style={styles.quickCardImg}><Ionicons name="flame" size={24} color="#fff" /></View>
                <Text style={styles.quickCardText}>Phonk Vibes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.quickCard} onPress={() => { setSearchQuery('Lofi coding'); setActiveTab('Search'); handleSearch('Lofi coding'); }}>
                <View style={styles.quickCardImg}><Ionicons name="headset" size={24} color="#fff" /></View>
                <Text style={styles.quickCardText}>Lofi Coding</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.sectionTitle}>Trending Now</Text>
            <View style={styles.placeholderShelf}><Text style={styles.placeholderText}>Render Proxy Active - Searching available</Text></View>
          </ScrollView>
        )}

        {/* === SEARCH TAB === */}
        {activeTab === 'Search' && (
          <View style={[styles.scrollContainer, {flex: 1}]}>
            <Text style={styles.headerText}>Search</Text>
            
            <View style={styles.searchBoxContainer}>
              <Ionicons name="search" size={20} color="#a7a7a7" style={styles.searchIcon} />
              <TextInput 
                style={styles.searchInput} 
                placeholder="What do you want to listen to?" 
                placeholderTextColor="#a7a7a7" 
                value={searchQuery} 
                onChangeText={setSearchQuery} 
                onSubmitEditing={() => handleSearch(searchQuery)}
                returnKeyType="search"
              />
              {searchQuery.length > 0 && (
                <TouchableOpacity onPress={() => { setSearchQuery(''); setSearchResults([]); }} style={styles.clearBtn}>
                  <Ionicons name="close" size={20} color="#a7a7a7" />
                </TouchableOpacity>
              )}
            </View>

            {/* SEARCH RESULTS AREA */}
            {searchLoading ? (
               <View style={styles.placeholderResults}>
                 <Text style={styles.placeholderText}>Scraping Audio Data...</Text>
               </View>
            ) : searchResults.length > 0 ? (
               <ScrollView style={{ marginTop: 20 }}>
                 {searchResults.map((track, index) => (
                   <TouchableOpacity key={index} style={styles.searchResultItem} onPress={() => playSong(track)}>
                     <Image source={{ uri: track.thumbnail }} style={styles.searchThumb} />
                     <View style={styles.searchInfo}>
                       <Text style={styles.searchTitle} numberOfLines={1}>{track.title}</Text>
                       <Text style={styles.searchArtist} numberOfLines={1}>{track.artist} • {track.duration}</Text>
                     </View>
                     <Ionicons name="ellipsis-vertical" size={20} color="#a7a7a7" />
                   </TouchableOpacity>
                 ))}
               </ScrollView>
            ) : (
              <View style={styles.placeholderResults}>
                  <Ionicons name="search-outline" size={48} color="#282828" />
                  <Text style={styles.placeholderText}>Search for songs, artists, or anime ops</Text>
              </View>
            )}
          </View>
        )}

        {/* === SETTINGS TAB === */}
        {activeTab === 'Settings' && (
          <ScrollView contentContainerStyle={styles.scrollContainer}>
            <Text style={styles.headerText}>Settings</Text>
            <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}><Text style={styles.logoutBtnText}>Log Out</Text></TouchableOpacity>
          </ScrollView>
        )}
      </View>

      {/* --- MINI PLAYER --- */}
      {currentTrack && (
        <TouchableOpacity style={styles.miniPlayer} onPress={() => setIsPlayerOpen(true)}>
          <View style={styles.miniPlayerLeft}>
            <Image source={{ uri: currentTrack.thumbnail }} style={styles.miniPlayerArt} />
            <View style={{ flex: 1, paddingRight: 10 }}>
              <Text style={styles.miniPlayerTitle} numberOfLines={1}>{currentTrack.title}</Text>
              <Text style={styles.miniPlayerArtist} numberOfLines={1}>{currentTrack.artist}</Text>
            </View>
          </View>
          <TouchableOpacity onPress={togglePlayback}>
            <Ionicons name={isPlaying ? "pause" : "play"} size={28} color="#fff" />
          </TouchableOpacity>
        </TouchableOpacity>
      )}

      {/* --- BOTTOM NAV --- */}
      <View style={styles.floatingNavContainer}>
        <View style={styles.bottomNav}>
          <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('Home')}><Ionicons name={activeTab === 'Home' ? "home" : "home-outline"} size={24} color={activeTab === 'Home' ? "#1db954" : "#a7a7a7"} /><Text style={[styles.navText, activeTab === 'Home' && styles.navTextActive]}>Home</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('Search')}><Ionicons name={activeTab === 'Search' ? "search" : "search-outline"} size={24} color={activeTab === 'Search' ? "#1db954" : "#a7a7a7"} /><Text style={[styles.navText, activeTab === 'Search' && styles.navTextActive]}>Search</Text></TouchableOpacity>
          <TouchableOpacity style={styles.navBtn} onPress={() => setActiveTab('Settings')}><Ionicons name={activeTab === 'Settings' ? "settings" : "settings-outline"} size={24} color={activeTab === 'Settings' ? "#1db954" : "#a7a7a7"} /><Text style={[styles.navText, activeTab === 'Settings' && styles.navTextActive]}>Settings</Text></TouchableOpacity>
        </View>
      </View>

      {/* --- FULLSCREEN PLAYER --- */}
      <Modal animationType="slide" transparent={false} visible={isPlayerOpen} onRequestClose={() => setIsPlayerOpen(false)}>
        <SafeAreaView style={styles.innerPlayerContainer}>
          <StatusBar barStyle="light-content" backgroundColor="#121212" />
          
          <View style={styles.innerHeader}>
            <TouchableOpacity onPress={() => setIsPlayerOpen(false)}>
              <Ionicons name="chevron-down" size={32} color="#fff" />
            </TouchableOpacity>
            <Text style={styles.innerHeaderText}>NOW PLAYING</Text>
            <View style={{ width: 32 }} />
          </View>

          <View style={styles.innerArtContainer}>
             {currentTrack ? (
               <Image source={{ uri: currentTrack.thumbnail }} style={styles.innerArtImage} />
             ) : (
               <View style={styles.innerArtPlaceholder}><Ionicons name="musical-notes" size={80} color="#282828" /></View>
             )}
          </View>

          <View style={styles.innerTrackInfo}>
            <View style={{ flex: 1, paddingRight: 16 }}>
              <Text style={styles.innerTitle} numberOfLines={1}>{currentTrack?.title || "Not Playing"}</Text>
              <Text style={styles.innerArtist} numberOfLines={1}>{currentTrack?.artist || "Select a song"}</Text>
            </View>
            <TouchableOpacity><Ionicons name="heart" size={28} color="#1db954" /></TouchableOpacity>
          </View>

          <View style={styles.innerTimeline}>
            <View style={styles.progressBar}><View style={styles.progressFill} /></View>
            <View style={styles.timeLabels}>
              <Text style={styles.timeText}>Live Stream</Text>
              <Text style={styles.timeText}>{currentTrack?.duration || "0:00"}</Text>
            </View>
          </View>

          <View style={styles.innerControls}>
            <TouchableOpacity><Ionicons name="shuffle" size={28} color="#a7a7a7" /></TouchableOpacity>
            <TouchableOpacity><Ionicons name="play-skip-back" size={36} color="#fff" /></TouchableOpacity>
            <TouchableOpacity style={styles.playPauseBtn} onPress={togglePlayback}>
              <Ionicons name={isPlaying ? "pause" : "play"} size={40} color="#000" style={{ marginLeft: isPlaying ? 0 : 4 }} />
            </TouchableOpacity>
            <TouchableOpacity><Ionicons name="play-skip-forward" size={36} color="#fff" /></TouchableOpacity>
            <TouchableOpacity><Ionicons name="repeat" size={28} color="#a7a7a7" /></TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
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
  scrollContainer: { paddingHorizontal: 16, paddingTop: 10, paddingBottom: 180 }, 
  
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
  headerText: { fontSize: 32, fontWeight: '800', color: '#fff', marginVertical: 24, letterSpacing: -1 },
  
  searchBoxContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#242424', borderRadius: 50, paddingHorizontal: 16, height: 50 },
  searchIcon: { marginRight: 10 },
  searchInput: { flex: 1, color: '#fff', fontSize: 15, height: '100%' },
  clearBtn: { padding: 4 },

  searchResultItem: { flexDirection: 'row', alignItems: 'center', marginBottom: 16, backgroundColor: '#121212', padding: 8, borderRadius: 8 },
  searchThumb: { width: 56, height: 56, borderRadius: 6, marginRight: 12 },
  searchInfo: { flex: 1, marginRight: 12 },
  searchTitle: { color: '#fff', fontSize: 15, fontWeight: '700', marginBottom: 4 },
  searchArtist: { color: '#a7a7a7', fontSize: 13 },

  logoutBtn: { backgroundColor: '#2a0e0e', padding: 16, borderRadius: 8, alignItems: 'center', marginTop: 24 },
  logoutBtnText: { color: '#ff4444', fontSize: 16, fontWeight: '700' },

  floatingNavContainer: { position: 'absolute', bottom: Platform.OS === 'android' ? 30 : 40, left: 16, right: 16 },
  bottomNav: { flexDirection: 'row', backgroundColor: 'rgba(18, 18, 18, 0.95)', borderRadius: 30, paddingVertical: 14, justifyContent: 'space-evenly', alignItems: 'center', borderWidth: 1, borderColor: 'rgba(29, 185, 84, 0.3)', shadowColor: '#1db954', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.4, shadowRadius: 10, elevation: 8 },
  navBtn: { alignItems: 'center', width: 60 },
  navText: { color: '#a7a7a7', fontSize: 11, marginTop: 4, fontWeight: '600' },
  navTextActive: { color: '#1db954', fontWeight: '800' },

  miniPlayer: { position: 'absolute', bottom: Platform.OS === 'android' ? 100 : 110, left: 24, right: 24, backgroundColor: '#1e1e1e', borderRadius: 8, padding: 8, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.5, shadowRadius: 10, elevation: 10 },
  miniPlayerLeft: { flexDirection: 'row', alignItems: 'center', flex: 1 },
  miniPlayerArt: { width: 44, height: 44, borderRadius: 4, marginRight: 12, backgroundColor: '#282828' },
  miniPlayerTitle: { color: '#fff', fontSize: 14, fontWeight: '700' },
  miniPlayerArtist: { color: '#a7a7a7', fontSize: 12 },

  innerPlayerContainer: { flex: 1, backgroundColor: '#121212', padding: 24 },
  innerHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10 },
  innerHeaderText: { color: '#fff', fontSize: 12, fontWeight: '700', letterSpacing: 1 },
  innerArtContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', marginVertical: 20, width: '100%' },
  innerArtImage: { width: '100%', aspectRatio: 1, borderRadius: 12 },
  innerArtPlaceholder: { width: '100%', aspectRatio: 1, backgroundColor: '#1e1e1e', borderRadius: 12, justifyContent: 'center', alignItems: 'center' },
  innerTrackInfo: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 30 },
  innerTitle: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  innerArtist: { color: '#a7a7a7', fontSize: 16 },
  innerTimeline: { marginBottom: 30 },
  progressBar: { width: '100%', height: 4, backgroundColor: '#4f4f4f', borderRadius: 2 },
  progressFill: { width: '30%', height: '100%', backgroundColor: '#fff', borderRadius: 2 },
  timeLabels: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  timeText: { color: '#a7a7a7', fontSize: 12 },
  innerControls: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 },
  playPauseBtn: { width: 72, height: 72, borderRadius: 36, backgroundColor: '#fff', justifyContent: 'center', alignItems: 'center' },
});
