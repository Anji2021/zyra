import { StatusBar } from "expo-status-bar";
import * as AuthSession from "expo-auth-session";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import { createNavigationContainerRef, DefaultTheme, NavigationContainer } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import type { Session } from "@supabase/supabase-js";
import {
  ApiClientError,
  type CycleRow,
  type HealthProfile,
  type MedicineRow,
  type NearbySpecialist,
  type SaveHealthProfileInput,
  type SymptomRow,
  generateDoctorMatch,
  getHealthProfile,
  inferSpecialistTypeFromDoctorMatch,
  saveHealthProfile,
  searchNearbySpecialists,
} from "@zyra/shared";
import { supabase } from "./lib/supabase";

type TabParamList = {
  Home: undefined;
  Cycle: undefined;
  Health: undefined;
  DoctorMatch: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

const rootNavigationRef = createNavigationContainerRef<TabParamList>();

const colors = {
  bg: "#FFF9F2",
  card: "#FFF4EA",
  cardSoft: "#FDF0F4",
  accent: "#E96D9A",
  accentDark: "#C54A78",
  text: "#2F2530",
  muted: "#7A6675",
  border: "#F2DDE6",
};

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: colors.bg,
    card: "#FFFFFF",
    border: colors.border,
    text: colors.text,
    primary: colors.accent,
    notification: colors.accent,
  },
};

/** Email signup / magic-link confirmations (unchanged). Not used for Google OAuth redirect in Expo Go. */
const AUTH_REDIRECT_TO = "zyra://auth/callback";
const AUTH_RESET_REDIRECT_TO = process.env.EXPO_PUBLIC_AUTH_RESET_REDIRECT_TO ?? "zyra://auth/reset-password";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

/** Never use API base URL (e.g. Vercel) as Supabase OAuth redirect — Google must return to Expo / native app. */
const FORBIDDEN_GOOGLE_REDIRECT_MARKER = "zyra-gold.vercel.app";

WebBrowser.maybeCompleteAuthSession();

/** Set while a Google OAuth session is armed (Expo AuthSession URI may differ from zyra://). */
let googleOAuthRedirectToLatest: string | null = null;

function oauthUrlMatchesRedirect(candidateFullUrl: string, redirectBase: string): boolean {
  const base = redirectBase.replace(/\/+$/, "").toLowerCase();
  const c = candidateFullUrl.trim().toLowerCase();
  if (!base.length) return false;
  return c === base || c.startsWith(`${base}?`) || c.startsWith(`${base}#`);
}

/** Returns matched redirect anchor if URL is OAuth callback for email confirmations or recent Google OAuth. */
function oauthCallbackAnchorForIncomingUrl(candidate: string): string | null {
  if (oauthUrlMatchesRedirect(candidate, AUTH_REDIRECT_TO)) return AUTH_REDIRECT_TO;
  if (googleOAuthRedirectToLatest && oauthUrlMatchesRedirect(candidate, googleOAuthRedirectToLatest)) {
    return googleOAuthRedirectToLatest;
  }
  return null;
}

function armGoogleOAuthRedirect(redirectTo: string) {
  googleOAuthRedirectToLatest = redirectTo;
}

function endGoogleOAuthRedirectArm(timeoutMs = 15_000) {
  setTimeout(() => {
    googleOAuthRedirectToLatest = null;
  }, timeoutMs);
}

function authorizeRedirectToParam(authorizeSupabaseUrl: string): string | null {
  try {
    return new URL(authorizeSupabaseUrl).searchParams.get("redirect_to");
  } catch {
    return null;
  }
}

/** Avoid duplicate exchangeCodeForSession for the same authorization code (e.g. retry / race). */
const recentOAuthAuthorizationCodes = new Set<string>();

function trimOAuthCodesSet(max: number) {
  while (recentOAuthAuthorizationCodes.size > max) {
    const first = recentOAuthAuthorizationCodes.values().next().value as string | undefined;
    if (first === undefined) break;
    recentOAuthAuthorizationCodes.delete(first);
  }
}

type GoogleOAuthFlow = "code" | "token" | "none";

/** Parse callback with URL + handle code (query) vs token (hash) flow. Does not log tokens. */
async function finalizeGoogleOAuthRedirect(
  redirectUrl: string | null | undefined,
): Promise<{ session: Session | null; authErrorMessage?: string; flow: GoogleOAuthFlow }> {
  const oauthAnchor = redirectUrl ? oauthCallbackAnchorForIncomingUrl(redirectUrl) : null;
  if (!redirectUrl || !oauthAnchor) {
    return { session: null, flow: "none" };
  }

  let parsed: URL;
  try {
    parsed = new URL(redirectUrl);
  } catch {
    return { session: null, authErrorMessage: "Invalid callback URL.", flow: "none" };
  }

  const oauthErrRaw = parsed.searchParams.get("error_description") ?? parsed.searchParams.get("error");
  if (oauthErrRaw) {
    const msg = decodeURIComponent(oauthErrRaw.replace(/\+/g, " "));
    console.log("auth error message:", msg);
    return { session: null, authErrorMessage: msg, flow: "none" };
  }

  const code = parsed.searchParams.get("code");
  const hashBody = parsed.hash.startsWith("#") ? parsed.hash.slice(1) : parsed.hash;
  const hashParams = hashBody ? new URLSearchParams(hashBody) : new URLSearchParams();
  const accessInHash = parsed.hash.includes("access_token");
  const accessToken = accessInHash
    ? (hashParams.get("access_token") ?? "").trim()
    : (parsed.searchParams.get("access_token") ?? "").trim();
  const refreshToken = accessInHash
    ? (hashParams.get("refresh_token") ?? "").trim()
    : (parsed.searchParams.get("refresh_token") ?? "").trim();

  console.log("callback received");
  console.log("code exists:", Boolean(code));
  console.log("access_token exists:", Boolean(accessToken));

  let flow: GoogleOAuthFlow = "none";

  try {
    if (code) {
      flow = "code";
      if (recentOAuthAuthorizationCodes.has(code)) {
        const { data: repeat } = await supabase.auth.getSession();
        const session = repeat.session ?? null;
        console.log("session created:", Boolean(session));
        return { session, flow: "code" };
      }
      recentOAuthAuthorizationCodes.add(code);
      trimOAuthCodesSet(16);
      const exchangeRes = await supabase.auth.exchangeCodeForSession(code);
      if (exchangeRes.error) {
        console.log("exchange error message:", exchangeRes.error.message);
        return { session: null, authErrorMessage: exchangeRes.error.message, flow: "code" };
      }
      const { data: afterExchange } = await supabase.auth.getSession();
      console.log("session exists after exchange:", Boolean(afterExchange?.session));
    } else if (accessToken && refreshToken) {
      flow = "token";
      const { error } = await supabase.auth.setSession({
        access_token: accessToken,
        refresh_token: refreshToken,
      });
      if (error) {
        console.log("auth error message:", error.message);
        return { session: null, authErrorMessage: error.message, flow: "token" };
      }
    }

    const {
      data: { session },
      error: sessionErr,
    } = await supabase.auth.getSession();
    if (sessionErr) {
      console.log("auth error message:", sessionErr.message);
      return { session: null, authErrorMessage: sessionErr.message, flow };
    }
    const created = Boolean(session);
    console.log("session created:", created);
    return { session: session ?? null, flow: created ? flow : "none" };
  } catch (err) {
    const message = err instanceof Error ? err.message : "oauth finalize failed";
    console.log("auth error message:", message);
    return { session: null, authErrorMessage: message, flow };
  }
}

async function persistSessionIntoState(setSessionFn: (s: Session | null) => void): Promise<boolean> {
  const { data, error } = await supabase.auth.getSession();
  if (error) {
    console.log("auth error message:", error.message);
    return false;
  }
  const has = Boolean(data.session);
  console.log("session created:", has);
  if (has && data.session) setSessionFn(data.session);
  return has;
}

function extractParamsFromUrl(url: string): URLSearchParams {
  const params = new URLSearchParams();
  const queryIndex = url.indexOf("?");
  if (queryIndex >= 0) {
    const query = url.slice(queryIndex + 1).split("#")[0];
    const queryParams = new URLSearchParams(query);
    queryParams.forEach((value, key) => params.set(key, value));
  }
  const hashIndex = url.indexOf("#");
  if (hashIndex >= 0) {
    const hashParams = new URLSearchParams(url.slice(hashIndex + 1));
    hashParams.forEach((value, key) => params.set(key, value));
  }
  return params;
}

function formatDate(iso: string | null): string {
  if (!iso) return "-";
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(d);
}

function cardWrap(children: React.ReactNode) {
  return <View style={styles.card}>{children}</View>;
}

function HomeScreen() {
  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollPad}>
        <View style={styles.heroCard}>
          <Text style={styles.kicker}>ZYRA</Text>
          <Text style={styles.title}>Good morning</Text>
          <Text style={styles.subtitle}>What would you like to do today?</Text>

          <TouchableOpacity style={styles.primaryButton} activeOpacity={0.85}>
            <Text style={styles.primaryButtonText}>Log how you&apos;re feeling</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85}>
            <Text style={styles.secondaryButtonText}>Find specialist</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
      <StatusBar style="dark" />
    </SafeAreaView>
  );
}

function CycleScreen() {
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [note, setNote] = useState("");
  const [rows, setRows] = useState<CycleRow[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function loadCycles() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { data, error: qErr } = await supabase
      .from("cycles")
      .select("id,user_id,start_date,end_date,notes,created_at")
      .eq("user_id", user.id)
      .order("start_date", { ascending: false })
      .limit(8);
    if (qErr) setError(qErr.message);
    setRows((data ?? []) as CycleRow[]);
  }

  useEffect(() => {
    void loadCycles();
  }, []);

  async function addCycle() {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(startDate)) {
      setError("Start date must be YYYY-MM-DD.");
      return;
    }
    if (endDate && !/^\d{4}-\d{2}-\d{2}$/.test(endDate)) {
      setError("End date must be YYYY-MM-DD.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not signed in.");
      const { error: iErr } = await supabase.from("cycles").insert({
        user_id: user.id,
        start_date: startDate,
        end_date: endDate || null,
        notes: note.trim() || null,
      });
      if (iErr) throw iErr;
      setStartDate("");
      setEndDate("");
      setNote("");
      await loadCycles();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save cycle.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {cardWrap(
          <>
            <Text style={styles.cardTitle}>Cycle</Text>
            <Text style={styles.cardSub}>Log your period start/end dates.</Text>
            <TextInput placeholder="Start date (YYYY-MM-DD)" placeholderTextColor="#9E8A99" value={startDate} onChangeText={setStartDate} style={styles.input} />
            <TextInput placeholder="End date (optional)" placeholderTextColor="#9E8A99" value={endDate} onChangeText={setEndDate} style={styles.input} />
            <TextInput placeholder="Notes (optional)" placeholderTextColor="#9E8A99" value={note} onChangeText={setNote} style={styles.input} />
            <TouchableOpacity style={styles.primaryButton} onPress={addCycle} disabled={loading}>
              <Text style={styles.primaryButtonText}>{loading ? "Saving..." : "Save period"}</Text>
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>,
        )}

        {cardWrap(
          <>
            <Text style={styles.resultTitle}>Recent periods</Text>
            {rows.length === 0 ? (
              <Text style={styles.resultBody}>No cycles yet.</Text>
            ) : (
              rows.map((r) => (
                <View key={r.id} style={styles.nearbyRow}>
                  <Text style={styles.nearbyName}>{formatDate(r.start_date)}</Text>
                  <Text style={styles.nearbyMeta}>End: {formatDate(r.end_date)}</Text>
                </View>
              ))
            )}
          </>,
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function HealthScreen() {
  const [symptom, setSymptom] = useState("");
  const [severity, setSeverity] = useState("3");
  const [symptomDate, setSymptomDate] = useState("");
  const [medicine, setMedicine] = useState("");
  const [dosage, setDosage] = useState("");
  const [symptoms, setSymptoms] = useState<SymptomRow[]>([]);
  const [medicines, setMedicines] = useState<MedicineRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function loadHealth() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;

    const [symRes, medRes] = await Promise.all([
      supabase
        .from("symptoms")
        .select("id,user_id,symptom,severity,logged_date,notes,created_at")
        .eq("user_id", user.id)
        .order("logged_date", { ascending: false })
        .limit(6),
      supabase
        .from("medicines")
        .select("id,user_id,name,dosage,frequency,start_date,end_date,notes,created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(6),
    ]);

    if (symRes.error) setError(symRes.error.message);
    if (medRes.error) setError(medRes.error.message);

    setSymptoms((symRes.data ?? []) as SymptomRow[]);
    setMedicines((medRes.data ?? []) as MedicineRow[]);
  }

  useEffect(() => {
    void loadHealth();
  }, []);

  async function addSymptom() {
    if (!symptom.trim()) {
      setError("Please enter a symptom.");
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(symptomDate)) {
      setError("Symptom date must be YYYY-MM-DD.");
      return;
    }
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const sev = Math.round(Number(severity));
    const { error: iErr } = await supabase.from("symptoms").insert({
      user_id: user.id,
      symptom: symptom.trim(),
      severity: Number.isNaN(sev) ? null : Math.max(1, Math.min(5, sev)),
      logged_date: symptomDate,
      notes: null,
    });
    if (iErr) {
      setError(iErr.message);
      return;
    }
    setSymptom("");
    setSeverity("3");
    setSymptomDate("");
    await loadHealth();
  }

  async function addMedicine() {
    if (!medicine.trim()) {
      setError("Please enter a medicine name.");
      return;
    }
    setError(null);
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) return;
    const { error: iErr } = await supabase.from("medicines").insert({
      user_id: user.id,
      name: medicine.trim(),
      dosage: dosage.trim() || null,
    });
    if (iErr) {
      setError(iErr.message);
      return;
    }
    setMedicine("");
    setDosage("");
    await loadHealth();
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {cardWrap(
          <>
            <Text style={styles.cardTitle}>Health</Text>
            <Text style={styles.cardSub}>Log symptoms and medicines.</Text>
            <TextInput placeholder="Symptom" placeholderTextColor="#9E8A99" value={symptom} onChangeText={setSymptom} style={styles.input} />
            <TextInput placeholder="Severity (1-5)" placeholderTextColor="#9E8A99" value={severity} onChangeText={setSeverity} style={styles.input} />
            <TextInput placeholder="Date (YYYY-MM-DD)" placeholderTextColor="#9E8A99" value={symptomDate} onChangeText={setSymptomDate} style={styles.input} />
            <TouchableOpacity style={styles.primaryButton} onPress={addSymptom}>
              <Text style={styles.primaryButtonText}>Save symptom</Text>
            </TouchableOpacity>

            <View style={{ height: 12 }} />
            <TextInput placeholder="Medicine name" placeholderTextColor="#9E8A99" value={medicine} onChangeText={setMedicine} style={styles.input} />
            <TextInput placeholder="Dosage (optional)" placeholderTextColor="#9E8A99" value={dosage} onChangeText={setDosage} style={styles.input} />
            <TouchableOpacity style={styles.secondaryButton} onPress={addMedicine}>
              <Text style={styles.secondaryButtonText}>Save medicine</Text>
            </TouchableOpacity>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>,
        )}

        {cardWrap(
          <>
            <Text style={styles.resultTitle}>Recent symptoms</Text>
            {symptoms.length === 0 ? <Text style={styles.resultBody}>No symptoms yet.</Text> : symptoms.map((s) => (
              <View key={s.id} style={styles.nearbyRow}>
                <Text style={styles.nearbyName}>{s.symptom}</Text>
                <Text style={styles.nearbyMeta}>{formatDate(s.logged_date)} · Severity {s.severity ?? "-"}</Text>
              </View>
            ))}
          </>,
        )}

        {cardWrap(
          <>
            <Text style={styles.resultTitle}>Recent medicines</Text>
            {medicines.length === 0 ? <Text style={styles.resultBody}>No medicines yet.</Text> : medicines.map((m) => (
              <View key={m.id} style={styles.nearbyRow}>
                <Text style={styles.nearbyName}>{m.name}</Text>
                <Text style={styles.nearbyMeta}>{m.dosage ?? "No dosage"}</Text>
              </View>
            ))}
          </>,
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

function DoctorMatchScreen({
  getApiOptions,
}: {
  getApiOptions: () => Promise<{ baseUrl: string; headers?: Record<string, string> } | null>;
}) {
  const [symptoms, setSymptoms] = useState("");
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pattern, setPattern] = useState<string | null>(null);
  const [specialist, setSpecialist] = useState<string | null>(null);
  const [nearby, setNearby] = useState<NearbySpecialist[]>([]);

  async function handleGenerateMatch() {
    const cleanSymptoms = symptoms.trim();
    const cleanLocation = location.trim();
    if (!cleanSymptoms || !cleanLocation) {
      setError("Please add both symptoms and city/ZIP.");
      return;
    }

    setLoading(true);
    setError(null);
    try {
      const apiOptionsForDoctorMatch = await getApiOptions();
      if (!apiOptionsForDoctorMatch) {
        setError("Please sign in again.");
        return;
      }
      const dm = await generateDoctorMatch({ symptoms: cleanSymptoms }, apiOptionsForDoctorMatch);
      setPattern(dm.recommendation.pattern || "No pattern available yet.");
      setSpecialist(dm.recommendation.specialist || "Specialist recommendation unavailable.");

      const specialistType = inferSpecialistTypeFromDoctorMatch(dm.recommendation);
      const apiOptionsForSpecialists = await getApiOptions();
      if (!apiOptionsForSpecialists?.headers?.Authorization) {
        setError("Please sign in again.");
        return;
      }
      const search = await searchNearbySpecialists(
        {
          location: cleanLocation,
          specialistType,
        },
        apiOptionsForSpecialists,
      );
      setNearby(search.results);
    } catch (err) {
      const message =
        err instanceof ApiClientError ? err.message : "Could not generate a DoctorMatch right now.";
      setError(message);
      setNearby([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollPad}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>DoctorMatch</Text>
          <Text style={styles.cardSub}>Describe symptoms and location to generate a specialist match.</Text>

          <TextInput
            placeholder="Symptoms (e.g. irregular periods, fatigue)"
            placeholderTextColor="#9E8A99"
            multiline
            value={symptoms}
            onChangeText={setSymptoms}
            style={[styles.input, styles.textArea]}
          />

          <TextInput
            placeholder="Location (city or ZIP)"
            placeholderTextColor="#9E8A99"
            value={location}
            onChangeText={setLocation}
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={handleGenerateMatch}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? "Generating..." : "Generate match"}</Text>
          </TouchableOpacity>

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          {pattern || specialist ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Possible pattern</Text>
              <Text style={styles.resultBody}>{pattern ?? "-"}</Text>
              <Text style={[styles.resultTitle, { marginTop: 10 }]}>Recommended specialist</Text>
              <Text style={styles.resultBody}>{specialist ?? "-"}</Text>
            </View>
          ) : null}

          {nearby.length > 0 ? (
            <View style={styles.resultCard}>
              <Text style={styles.resultTitle}>Nearby results</Text>
              {nearby.slice(0, 5).map((item) => (
                <View key={item.placeId || `${item.name}-${item.address}`} style={styles.nearbyRow}>
                  <Text style={styles.nearbyName}>{item.name}</Text>
                  <Text style={styles.nearbyMeta}>{item.address}</Text>
                </View>
              ))}
            </View>
          ) : null}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const emptyHealthProfile: SaveHealthProfileInput = {
  known_conditions: [],
  current_concerns: [],
  cycle_regularity: "unsure",
  average_cycle_length: null,
  last_period_date: null,
  goals: [],
  baseline_symptoms: [],
  preferred_search_radius: 10,
};

function ProfileScreen({
  onSignOut,
  getApiOptions,
}: {
  onSignOut: () => Promise<void>;
  getApiOptions: () => Promise<{ baseUrl: string; headers?: Record<string, string> } | null>;
}) {
  const [profile, setProfile] = useState<HealthProfile | null>(null);
  const [editing, setEditing] = useState(false);
  const [knownConditions, setKnownConditions] = useState("");
  const [concerns, setConcerns] = useState("");
  const [goals, setGoals] = useState("");
  const [baselineSymptoms, setBaselineSymptoms] = useState("");
  const [cycleRegularity, setCycleRegularity] = useState<"regular" | "irregular" | "unsure">("unsure");
  const [avgCycleLength, setAvgCycleLength] = useState("");
  const [lastPeriodDate, setLastPeriodDate] = useState("");
  const [radius, setRadius] = useState("10");
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [passwordDraft, setPasswordDraft] = useState("");
  const [passwordMsg, setPasswordMsg] = useState<string | null>(null);
  const [passwordVisible, setPasswordVisible] = useState(false);

  function applyProfile(p: HealthProfile | null) {
    const x = p ?? ({ ...emptyHealthProfile, user_id: "" } as HealthProfile);
    setKnownConditions(x.known_conditions.join(", "));
    setConcerns(x.current_concerns.join(", "));
    setGoals(x.goals.join(", "));
    setBaselineSymptoms(x.baseline_symptoms.join(", "));
    setCycleRegularity(x.cycle_regularity);
    setAvgCycleLength(x.average_cycle_length != null ? String(x.average_cycle_length) : "");
    setLastPeriodDate(x.last_period_date ?? "");
    setRadius(String(x.preferred_search_radius ?? 10));
  }

  async function loadProfile() {
    try {
      setError(null);
      const apiOptions = await getApiOptions();
      if (!apiOptions) {
        setError("Please sign in again to load profile.");
        return;
      }
      const res = await getHealthProfile(apiOptions);
      setProfile(res.profile);
      applyProfile(res.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load profile.");
    }
  }

  useEffect(() => {
    void loadProfile();
  }, []);

  async function handleSave() {
    setSaving(true);
    setError(null);
    try {
      const apiOptions = await getApiOptions();
      if (!apiOptions) {
        setError("Please sign in again to save profile.");
        return;
      }
      const parsedAvg = avgCycleLength.trim() ? Math.round(Number(avgCycleLength)) : null;
      const payload: SaveHealthProfileInput = {
        known_conditions: knownConditions.split(",").map((s) => s.trim()).filter(Boolean),
        current_concerns: concerns.split(",").map((s) => s.trim()).filter(Boolean),
        cycle_regularity: cycleRegularity,
        average_cycle_length: Number.isNaN(parsedAvg ?? 0) ? null : parsedAvg,
        last_period_date: lastPeriodDate.trim() || null,
        goals: goals.split(",").map((s) => s.trim()).filter(Boolean),
        baseline_symptoms: baselineSymptoms.split(",").map((s) => s.trim()).filter(Boolean),
        preferred_search_radius: [5, 10, 25].includes(Number(radius)) ? Number(radius) : 10,
      };
      const res = await saveHealthProfile(payload, apiOptions);
      setProfile(res.profile);
      setEditing(false);
      applyProfile(res.profile);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save profile.");
    } finally {
      setSaving(false);
    }
  }

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await onSignOut();
    } finally {
      setSigningOut(false);
    }
  }

  async function handleSetPassword() {
    if (passwordDraft.length < 8) {
      setPasswordMsg("Password should be at least 8 characters.");
      return;
    }
    const { error } = await supabase.auth.updateUser({ password: passwordDraft });
    if (error) {
      setPasswordMsg(error.message);
      return;
    }
    setPasswordDraft("");
    setPasswordMsg("Password updated.");
  }

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollPad}>
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Profile</Text>
          <Text style={styles.cardSub}>{editing ? "Edit your health profile." : "Profile summary."}</Text>

          {editing ? (
            <>
              <TextInput placeholder="Known conditions (comma-separated)" placeholderTextColor="#9E8A99" value={knownConditions} onChangeText={setKnownConditions} style={styles.input} />
              <TextInput placeholder="Current concerns" placeholderTextColor="#9E8A99" value={concerns} onChangeText={setConcerns} style={styles.input} />
              <TextInput placeholder="Cycle regularity: regular/irregular/unsure" placeholderTextColor="#9E8A99" value={cycleRegularity} onChangeText={(v) => setCycleRegularity(v === "regular" || v === "irregular" ? v : "unsure")} style={styles.input} />
              <TextInput placeholder="Average cycle length" placeholderTextColor="#9E8A99" value={avgCycleLength} onChangeText={setAvgCycleLength} style={styles.input} />
              <TextInput placeholder="Last period date (YYYY-MM-DD)" placeholderTextColor="#9E8A99" value={lastPeriodDate} onChangeText={setLastPeriodDate} style={styles.input} />
              <TextInput placeholder="Goals" placeholderTextColor="#9E8A99" value={goals} onChangeText={setGoals} style={styles.input} />
              <TextInput placeholder="Baseline symptoms" placeholderTextColor="#9E8A99" value={baselineSymptoms} onChangeText={setBaselineSymptoms} style={styles.input} />
              <TextInput placeholder="Search radius (5/10/25)" placeholderTextColor="#9E8A99" value={radius} onChangeText={setRadius} style={styles.input} />

              <TouchableOpacity style={styles.primaryButton} onPress={handleSave} disabled={saving}>
                <Text style={styles.primaryButtonText}>{saving ? "Saving..." : "Save profile"}</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.secondaryButton} onPress={() => setEditing(false)}>
                <Text style={styles.secondaryButtonText}>Cancel</Text>
              </TouchableOpacity>
            </>
          ) : (
            <>
              <View style={styles.row}><Text style={styles.rowLabel}>Known conditions</Text><Text style={styles.rowValue}>{profile?.known_conditions.join(", ") || "-"}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Current concerns</Text><Text style={styles.rowValue}>{profile?.current_concerns.join(", ") || "-"}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Cycle regularity</Text><Text style={styles.rowValue}>{profile?.cycle_regularity ?? "-"}</Text></View>
              <View style={styles.row}><Text style={styles.rowLabel}>Avg cycle length</Text><Text style={styles.rowValue}>{profile?.average_cycle_length ?? "-"}</Text></View>
              <View style={styles.rowLast}><Text style={styles.rowLabel}>Last period</Text><Text style={styles.rowValue}>{formatDate(profile?.last_period_date ?? null)}</Text></View>
              <TouchableOpacity style={styles.primaryButton} onPress={() => setEditing(true)}>
                <Text style={styles.primaryButtonText}>Edit profile</Text>
              </TouchableOpacity>
            </>
          )}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <View style={styles.resultCard}>
            <Text style={styles.resultTitle}>Account security</Text>
            <Text style={styles.nearbyMeta}>Optional: set or change password for this account.</Text>
            <View style={styles.inputWrap}>
              <TextInput
                placeholder="New password"
                placeholderTextColor="#9E8A99"
                secureTextEntry={!passwordVisible}
                value={passwordDraft}
                onChangeText={setPasswordDraft}
                style={styles.inputWithIcon}
              />
              <TouchableOpacity style={styles.inputIconBtn} onPress={() => setPasswordVisible((v) => !v)}>
                <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
              </TouchableOpacity>
            </View>
            <TouchableOpacity style={styles.secondaryButton} onPress={handleSetPassword}>
              <Text style={styles.secondaryButtonText}>Set password</Text>
            </TouchableOpacity>
            {passwordMsg ? <Text style={styles.errorText}>{passwordMsg}</Text> : null}
          </View>

          <TouchableOpacity style={styles.secondaryButton} activeOpacity={0.85} onPress={handleSignOut} disabled={signingOut}>
            <Text style={styles.secondaryButtonText}>{signingOut ? "Signing out..." : "Sign out"}</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

function AuthScreen({
  mode,
  onToggleMode,
  onSubmit,
  onForgotPassword,
  onGoogle,
  loading,
  error,
}: {
  mode: "signin" | "signup";
  onToggleMode: () => void;
  onSubmit: (name: string, email: string, password: string) => Promise<void>;
  onForgotPassword: (email: string) => Promise<void>;
  onGoogle: () => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState(false);

  const submitLabel = mode === "signin" ? "Sign in" : "Create account";

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centerWrap}>
        <View style={styles.card}>
          <Text style={styles.kicker}>ZYRA</Text>
          <Text style={styles.cardTitle}>{mode === "signin" ? "Welcome back" : "Create your account"}</Text>
          <Text style={styles.cardSub}>Use the same Supabase account as web.</Text>

          {mode === "signup" ? (
            <TextInput
              placeholder="Full name"
              placeholderTextColor="#9E8A99"
              value={fullName}
              onChangeText={setFullName}
              style={styles.input}
            />
          ) : null}

          <TextInput
            placeholder="Email"
            placeholderTextColor="#9E8A99"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <View style={styles.inputWrap}>
            <TextInput
              placeholder="Password"
              placeholderTextColor="#9E8A99"
              secureTextEntry={!passwordVisible}
              value={password}
              onChangeText={setPassword}
              style={styles.inputWithIcon}
            />
            <TouchableOpacity style={styles.inputIconBtn} onPress={() => setPasswordVisible((v) => !v)}>
              <Ionicons name={passwordVisible ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => onSubmit(fullName.trim(), email.trim(), password)}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? "Please wait..." : submitLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.secondaryButton} onPress={onGoogle} disabled={loading}>
            <Text style={styles.secondaryButtonText}>Continue with Google</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.authSwitch} onPress={onToggleMode} disabled={loading}>
            <Text style={styles.authSwitchText}>
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>

          {mode === "signin" ? (
            <TouchableOpacity style={styles.authSwitch} onPress={() => onForgotPassword(email.trim())} disabled={loading}>
              <Text style={styles.authSwitchText}>Forgot password?</Text>
            </TouchableOpacity>
          ) : null}

          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </View>
      </View>
    </SafeAreaView>
  );
}

export default function App() {
  const [session, setSession] = useState<Session | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authBusy, setAuthBusy] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [authMode, setAuthMode] = useState<"signin" | "signup">("signin");
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [recoveryPassword, setRecoveryPassword] = useState("");
  const [recoveryPasswordVisible, setRecoveryPasswordVisible] = useState(false);
  async function getProtectedApiOptions(): Promise<{ baseUrl: string; headers?: Record<string, string>; getAuthHeaders: () => Promise<Record<string, string> | null> } | null> {
    const baseUrl = API_BASE_URL.trim();
    if (!baseUrl) return null;
    const getAuthHeaders = async (): Promise<Record<string, string> | null> => {
      const { data, error } = await supabase.auth.getSession();
      const sessionExists = Boolean(data.session);
      const accessTokenExists = Boolean(data.session?.access_token);
      if (error) {
        console.log("[mobile auth] session exists:", false);
        console.log("[mobile auth] access token exists:", false);
        console.log("[mobile auth] Authorization header exists:", false);
        return null;
      }
      console.log("[mobile auth] session exists:", sessionExists);
      console.log("[mobile auth] access token exists:", accessTokenExists);
      if (!data.session?.access_token) {
        console.log("[mobile auth] Authorization header exists:", false);
        return null;
      }
      const rawToken = String(data.session.access_token).trim();
      const token = rawToken.replace(/^Bearer\s+/i, "").trim();
      const tokenParts = token.split(".");
      console.log("[mobile auth] token has 3 parts:", tokenParts.length === 3);
      console.log("[mobile auth] token starts with eyJ:", token.startsWith("eyJ"));
      if (tokenParts.length !== 3 || !token.startsWith("eyJ")) {
        console.log("[mobile auth] Authorization header exists:", false);
        return null;
      }
      console.log("[mobile auth] Authorization header exists:", true);
      return {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      };
    };
    const authHeaders = await getAuthHeaders();
    if (!authHeaders) return null;
    return {
      baseUrl,
      headers: authHeaders,
      getAuthHeaders,
    };
  }

  useEffect(() => {
    let mounted = true;

    async function handleAuthRedirectUrl(url: string | null) {
      console.log("callback URL received:", Boolean(url));
      if (!url) return;
      const isReset = url.startsWith(AUTH_RESET_REDIRECT_TO);
      const oauthAnchor = oauthCallbackAnchorForIncomingUrl(url);
      if (!isReset && !oauthAnchor) return;

      /* Password-recovery deep link keeps existing behavior (not Google OAuth). */
      if (isReset) {
        const params = extractParamsFromUrl(url);
        const errorDescription = params.get("error_description");
        const accessToken = params.get("access_token");
        const refreshToken = params.get("refresh_token");
        const type = params.get("type");
        if (errorDescription) {
          setAuthError(decodeURIComponent(errorDescription.replace(/\+/g, " ")));
          return;
        }
        try {
          if (accessToken && refreshToken) {
            const { error } = await supabase.auth.setSession({
              access_token: accessToken,
              refresh_token: refreshToken,
            });
            if (error) throw error;
            await persistSessionIntoState(setSession);
            setRecoveryMode(true);
          }
        } catch (error) {
          console.log(error instanceof Error ? error.message : "unknown callback error");
          setAuthError(error instanceof Error ? error.message : "Could not complete email confirmation.");
        }
        return;
      }

      if (oauthAnchor) {
        const legacyParams = extractParamsFromUrl(url);
        const fin = await finalizeGoogleOAuthRedirect(url);
        if (fin.authErrorMessage) {
          setAuthError(fin.authErrorMessage);
          return;
        }
        if (fin.session) {
          setSession(fin.session);
          if (fin.flow !== "none") {
            console.log("oauth flow:", fin.flow);
          }
          if (legacyParams.get("type") === "recovery") {
            setRecoveryMode(true);
          }
          return;
        }
        const type = legacyParams.get("type");
        if (type === "signup") {
          setAuthError("Email confirmed. Please sign in to continue.");
        }
      }
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
        console.log("[mobile auth] session error:", error.message);
        setAuthError(error.message);
      }
      setSession(data.session ?? null);
      setAuthLoading(false);
    });

    Linking.getInitialURL().then((url: string | null) => {
      if (!mounted) return;
      void handleAuthRedirectUrl(url);
    });

    const deepLinkSubscription = Linking.addEventListener("url", ({ url }: { url: string }) => {
      if (!mounted) return;
      void handleAuthRedirectUrl(url);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return;
      setSession(nextSession ?? null);
    });

    return () => {
      mounted = false;
      deepLinkSubscription.remove();
      listener.subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (authLoading || !session) return;
    let cancelled = false;
    let attempts = 0;
    const maxAttempts = 45;
    function tryNavigateHome() {
      if (cancelled) return;
      if (rootNavigationRef.isReady()) {
        rootNavigationRef.navigate("Home");
        console.log("navigation triggered");
        return;
      }
      attempts += 1;
      if (attempts < maxAttempts) {
        requestAnimationFrame(tryNavigateHome);
      }
    }
    requestAnimationFrame(tryNavigateHome);
    return () => {
      cancelled = true;
    };
  }, [authLoading, session]);

  async function handleAuthSubmit(name: string, email: string, password: string) {
    if (!email || !password) {
      setAuthError("Please enter email and password.");
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    try {
      if (authMode === "signin") {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      } else {
        if (!name) {
          setAuthError("Please enter your name.");
          return;
        }
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: AUTH_REDIRECT_TO,
            data: {
              full_name: name,
            },
          },
        });
        if (error) throw error;
        setAuthError("Check your email to confirm your account, then return to the app.");
      }
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Authentication failed.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleForgotPassword(email: string) {
    if (!email) {
      setAuthError("Enter your email first, then tap Forgot password.");
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: AUTH_RESET_REDIRECT_TO,
      });
      if (error) throw error;
      setAuthError("Password reset email sent. Check your inbox.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not send reset email.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleGoogleAuth() {
    setAuthBusy(true);
    setAuthError(null);
    const afterCallbackDeadline = () => Date.now() + 5000;
    let googleRedirectArmed = false;
    try {
      const redirectTo = AuthSession.makeRedirectUri({
        scheme: "zyra",
        path: "auth/callback",
      });
      console.log("[mobile auth] redirectTo:", redirectTo);

      if (redirectTo.includes(FORBIDDEN_GOOGLE_REDIRECT_MARKER)) {
        console.log("[mobile auth] blocked web redirect_uri for native Google OAuth");
        throw new Error("Google OAuth must use an Expo/native redirect URI, not the web app.");
      }

      armGoogleOAuthRedirect(redirectTo);
      googleRedirectArmed = true;

      const { data, error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          skipBrowserRedirect: true,
          /* GoTrue skips forwarding skipBrowserRedirect into the URL query; include explicitly for native OAuth. */
          queryParams: { skip_http_redirect: "true" },
        },
      });
      if (error) {
        console.log("auth error message:", error.message);
        throw error;
      }
      console.log("Google auth started");
      if (!data?.url) throw new Error("Google auth URL is missing.");

      const fromUrl = authorizeRedirectToParam(data.url);
      console.log("[mobile auth] authorize redirect_to (from oauth url):", fromUrl ?? "(missing)");
      if (fromUrl && fromUrl !== redirectTo) {
        console.log("[mobile auth] warning: authorize redirect_to does not equal makeRedirectUri (check Supabase allowlist)");
      }
      if (fromUrl?.includes(FORBIDDEN_GOOGLE_REDIRECT_MARKER)) {
        console.log("[mobile auth] authorize URL still targets web callback — whitelist Expo redirectTo in Supabase");
      }

      WebBrowser.maybeCompleteAuthSession();

      const res = await WebBrowser.openAuthSessionAsync(data.url, redirectTo);
      console.log("openAuthSession result type:", res.type);
      const callbackUrl = res.type === "success" ? res.url ?? null : null;
      console.log("result url exists:", Boolean(callbackUrl));

      let fin = await finalizeGoogleOAuthRedirect(callbackUrl ?? undefined);
      if (fin.flow !== "none") {
        console.log("oauth flow:", fin.flow);
      }

      if (fin.authErrorMessage) {
        setAuthError(fin.authErrorMessage);
        return;
      }

      let sessionOut = fin.session;
      const deadline = afterCallbackDeadline();
      while (!sessionOut && Date.now() < deadline) {
        await new Promise((r) => setTimeout(r, 150));
        const { data: gd, error: gerr } = await supabase.auth.getSession();
        if (gerr) {
          console.log("auth error message:", gerr.message);
        }
        if (gd.session) {
          sessionOut = gd.session;
          break;
        }
      }

      if (sessionOut) {
        setSession(sessionOut);
        console.log("session created:", true);
      } else {
        console.log("session created:", false);
        setAuthError("Login failed, try again");
      }
    } catch (error) {
      const msg = error instanceof Error ? error.message : "Google auth error";
      console.log("auth error message:", msg);
      setAuthError(error instanceof Error ? error.message : "Google sign in failed.");
    } finally {
      if (googleRedirectArmed) {
        endGoogleOAuthRedirectArm(15_000);
      }
      setAuthBusy(false);
    }
  }

  async function handleSetRecoveryPassword() {
    if (recoveryPassword.length < 8) {
      setAuthError("New password should be at least 8 characters.");
      return;
    }
    setAuthBusy(true);
    setAuthError(null);
    try {
      const { error } = await supabase.auth.updateUser({ password: recoveryPassword });
      if (error) throw error;
      setRecoveryPassword("");
      setRecoveryMode(false);
      setAuthError("Password updated. You can continue in the app.");
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Could not update password.");
    } finally {
      setAuthBusy(false);
    }
  }

  async function handleSignOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      setAuthError(error.message);
    }
  }

  if (authLoading) {
    return (
      <SafeAreaView style={styles.screen}>
        <View style={styles.centerWrap}>
          <View style={styles.card}>
            <Text style={styles.cardTitle}>Loading Zyra...</Text>
            <Text style={styles.cardSub}>Checking your session.</Text>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  if (!session) {
    if (recoveryMode) {
      return (
        <SafeAreaView style={styles.screen}>
          <View style={styles.centerWrap}>
            <View style={styles.card}>
              <Text style={styles.kicker}>ZYRA</Text>
              <Text style={styles.cardTitle}>Set a new password</Text>
              <Text style={styles.cardSub}>Choose a new password to complete your reset.</Text>
              <View style={styles.inputWrap}>
                <TextInput
                  placeholder="New password"
                  placeholderTextColor="#9E8A99"
                  secureTextEntry={!recoveryPasswordVisible}
                  value={recoveryPassword}
                  onChangeText={setRecoveryPassword}
                  style={styles.inputWithIcon}
                />
                <TouchableOpacity style={styles.inputIconBtn} onPress={() => setRecoveryPasswordVisible((v) => !v)}>
                  <Ionicons name={recoveryPasswordVisible ? "eye-off-outline" : "eye-outline"} size={18} color={colors.muted} />
                </TouchableOpacity>
              </View>
              <TouchableOpacity style={styles.primaryButton} onPress={handleSetRecoveryPassword} disabled={authBusy}>
                <Text style={styles.primaryButtonText}>{authBusy ? "Saving..." : "Save new password"}</Text>
              </TouchableOpacity>
              {authError ? <Text style={styles.errorText}>{authError}</Text> : null}
            </View>
          </View>
        </SafeAreaView>
      );
    }

    return (
      <AuthScreen
        mode={authMode}
        loading={authBusy}
        error={authError}
        onSubmit={handleAuthSubmit}
        onForgotPassword={handleForgotPassword}
        onGoogle={handleGoogleAuth}
        onToggleMode={() => {
          setAuthError(null);
          setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"));
        }}
      />
    );
  }

  return (
    <NavigationContainer ref={rootNavigationRef} theme={navTheme}>
      <Tab.Navigator
        screenOptions={({ route }) => ({
          headerStyle: { backgroundColor: "#FFFDF9" },
          headerTitleStyle: { color: colors.text, fontWeight: "600" },
          tabBarStyle: {
            backgroundColor: "#FFFFFF",
            borderTopColor: colors.border,
            height: 64,
            paddingBottom: 8,
            paddingTop: 8,
          },
          tabBarLabelStyle: { fontSize: 12, fontWeight: "600" },
          tabBarActiveTintColor: colors.accentDark,
          tabBarInactiveTintColor: colors.muted,
          tabBarIcon: ({ color, size, focused }) => {
            const iconName =
              route.name === "Home"
                ? (focused ? "home" : "home-outline")
                : route.name === "Cycle"
                  ? (focused ? "calendar" : "calendar-outline")
                  : route.name === "Health"
                    ? (focused ? "heart" : "heart-outline")
                    : route.name === "DoctorMatch"
                      ? (focused ? "medkit" : "medkit-outline")
                      : (focused ? "person" : "person-outline");
            return <Ionicons name={iconName} size={size} color={color} />;
          },
        })}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Cycle" component={CycleScreen} />
        <Tab.Screen name="Health" component={HealthScreen} />
        <Tab.Screen name="DoctorMatch">
          {() => <DoctorMatchScreen getApiOptions={getProtectedApiOptions} />}
        </Tab.Screen>
        <Tab.Screen name="Profile">
          {() => <ProfileScreen onSignOut={handleSignOut} getApiOptions={getProtectedApiOptions} />}
        </Tab.Screen>
      </Tab.Navigator>
      <StatusBar style="dark" />
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.bg,
  },
  scrollPad: {
    padding: 16,
    gap: 12,
  },
  centerWrap: {
    flex: 1,
    padding: 16,
    justifyContent: "center",
  },
  heroCard: {
    backgroundColor: colors.cardSoft,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 20,
    padding: 18,
  },
  kicker: {
    fontSize: 11,
    letterSpacing: 1,
    color: colors.accentDark,
    fontWeight: "700",
  },
  title: {
    marginTop: 8,
    fontSize: 28,
    fontWeight: "700",
    color: colors.text,
  },
  subtitle: {
    marginTop: 6,
    marginBottom: 14,
    fontSize: 15,
    color: colors.muted,
  },
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 18,
    padding: 16,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: colors.text,
  },
  cardSub: {
    marginTop: 6,
    marginBottom: 14,
    color: colors.muted,
    fontSize: 14,
    lineHeight: 20,
  },
  input: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: colors.text,
    marginBottom: 10,
  },
  inputWrap: {
    position: "relative",
    marginBottom: 10,
  },
  inputWithIcon: {
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: 12,
    backgroundColor: "#FFFFFF",
    paddingHorizontal: 12,
    paddingVertical: 10,
    paddingRight: 42,
    fontSize: 14,
    color: colors.text,
  },
  inputIconBtn: {
    position: "absolute",
    right: 10,
    top: 0,
    bottom: 0,
    width: 28,
    alignItems: "center",
    justifyContent: "center",
  },
  textArea: {
    minHeight: 88,
    textAlignVertical: "top",
  },
  primaryButton: {
    backgroundColor: colors.accent,
    borderRadius: 999,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
    marginTop: 4,
  },
  primaryButtonText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "700",
  },
  secondaryButton: {
    marginTop: 10,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    borderRadius: 999,
    minHeight: 46,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 16,
  },
  secondaryButtonText: {
    color: colors.text,
    fontSize: 15,
    fontWeight: "600",
  },
  row: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLast: {
    paddingVertical: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  rowLabel: {
    color: colors.muted,
    fontSize: 14,
  },
  rowValue: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
    maxWidth: "58%",
    textAlign: "right",
  },
  errorText: {
    marginTop: 10,
    color: "#B4233C",
    fontSize: 13,
    fontWeight: "500",
  },
  resultCard: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#FFFFFF",
    borderRadius: 12,
    padding: 12,
  },
  resultTitle: {
    fontSize: 12,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 0.4,
    color: colors.muted,
  },
  resultBody: {
    marginTop: 4,
    color: colors.text,
    fontSize: 14,
    lineHeight: 20,
  },
  nearbyRow: {
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: 10,
  },
  nearbyName: {
    color: colors.text,
    fontSize: 14,
    fontWeight: "600",
  },
  nearbyMeta: {
    marginTop: 2,
    color: colors.muted,
    fontSize: 12,
  },
  authSwitch: {
    marginTop: 10,
    alignSelf: "center",
  },
  authSwitchText: {
    color: colors.accentDark,
    fontSize: 13,
    fontWeight: "600",
  },
});
