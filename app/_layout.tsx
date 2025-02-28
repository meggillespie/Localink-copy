// app/_layout.tsx

import { NativeBaseProvider } from 'native-base';
import customTheme from '../theme';
import { Slot } from 'expo-router';
import NavigationBar from './components/NavigationBar';

export default function Layout() {
  return (
      <NativeBaseProvider theme={customTheme}>
          {/* Your page content */}
          <Slot />
          {/* Navigation bar always visible at the bottom */}
          <NavigationBar />
      </NativeBaseProvider>
  );
}
