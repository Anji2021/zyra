import { registerRootComponent } from "expo";
import * as SplashScreen from "expo-splash-screen";

// Prefer explicit hide from App.tsx after bootstrap (prevents indefinite native splash).
void SplashScreen.preventAutoHideAsync().catch(() => {});

import App from "./App";

registerRootComponent(App);
