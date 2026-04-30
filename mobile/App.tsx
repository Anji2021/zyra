import { StatusBar } from "expo-status-bar";
import * as Linking from "expo-linking";
import { NavigationContainer, DefaultTheme } from "@react-navigation/native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { useEffect, useMemo, useState } from "react";
import { SafeAreaView, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from "react-native";
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
  Insights: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<TabParamList>();

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

const AUTH_REDIRECT_TO = process.env.EXPO_PUBLIC_AUTH_REDIRECT_TO ?? "zyra://auth/callback";
const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL ?? "";

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
  apiOptions,
}: {
  apiOptions?: { baseUrl: string; headers?: Record<string, string> };
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
      const dm = await generateDoctorMatch({ symptoms: cleanSymptoms }, apiOptions);
      setPattern(dm.recommendation.pattern || "No pattern available yet.");
      setSpecialist(dm.recommendation.specialist || "Specialist recommendation unavailable.");

      const specialistType = inferSpecialistTypeFromDoctorMatch(dm.recommendation);
      const search = await searchNearbySpecialists(
        {
          location: cleanLocation,
          specialistType,
        },
        apiOptions,
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

function InsightsScreen() {
  const [cycles, setCycles] = useState<CycleRow[]>([]);
  const [symptoms, setSymptoms] = useState<SymptomRow[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return;
      const [c, s] = await Promise.all([
        supabase.from("cycles").select("id,user_id,start_date,end_date,notes,created_at").eq("user_id", user.id).order("start_date", { ascending: false }).limit(5),
        supabase.from("symptoms").select("id,user_id,symptom,severity,logged_date,notes,created_at").eq("user_id", user.id).order("logged_date", { ascending: false }).limit(5),
      ]);
      if (c.error) setError(c.error.message);
      if (s.error) setError(s.error.message);
      setCycles((c.data ?? []) as CycleRow[]);
      setSymptoms((s.data ?? []) as SymptomRow[]);
    }
    void load();
  }, []);

  const commonSymptom = useMemo(() => {
    if (symptoms.length === 0) return null;
    const counts = new Map<string, number>();
    for (const s of symptoms) counts.set(s.symptom, (counts.get(s.symptom) ?? 0) + 1);
    return [...counts.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
  }, [symptoms]);

  return (
    <SafeAreaView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.scrollPad}>
        {cardWrap(
          <>
            <Text style={styles.cardTitle}>Insights</Text>
            <Text style={styles.cardSub}>Simple recent patterns from your logs.</Text>
            <View style={styles.row}><Text style={styles.rowLabel}>Cycles logged</Text><Text style={styles.rowValue}>{cycles.length}</Text></View>
            <View style={styles.row}><Text style={styles.rowLabel}>Symptoms logged</Text><Text style={styles.rowValue}>{symptoms.length}</Text></View>
            <View style={styles.rowLast}><Text style={styles.rowLabel}>Most common symptom</Text><Text style={styles.rowValue}>{commonSymptom ?? "-"}</Text></View>
            {error ? <Text style={styles.errorText}>{error}</Text> : null}
          </>,
        )}
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
  apiOptions,
}: {
  onSignOut: () => Promise<void>;
  apiOptions?: { baseUrl: string; headers?: Record<string, string> };
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
  loading,
  error,
}: {
  mode: "signin" | "signup";
  onToggleMode: () => void;
  onSubmit: (email: string, password: string) => Promise<void>;
  loading: boolean;
  error: string | null;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const submitLabel = mode === "signin" ? "Sign in" : "Create account";

  return (
    <SafeAreaView style={styles.screen}>
      <View style={styles.centerWrap}>
        <View style={styles.card}>
          <Text style={styles.kicker}>ZYRA</Text>
          <Text style={styles.cardTitle}>{mode === "signin" ? "Welcome back" : "Create your account"}</Text>
          <Text style={styles.cardSub}>Use the same Supabase account as web.</Text>

          <TextInput
            placeholder="Email"
            placeholderTextColor="#9E8A99"
            autoCapitalize="none"
            keyboardType="email-address"
            value={email}
            onChangeText={setEmail}
            style={styles.input}
          />
          <TextInput
            placeholder="Password"
            placeholderTextColor="#9E8A99"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            style={styles.input}
          />

          <TouchableOpacity
            style={styles.primaryButton}
            activeOpacity={0.85}
            onPress={() => onSubmit(email.trim(), password)}
            disabled={loading}
          >
            <Text style={styles.primaryButtonText}>{loading ? "Please wait..." : submitLabel}</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.authSwitch} onPress={onToggleMode} disabled={loading}>
            <Text style={styles.authSwitchText}>
              {mode === "signin" ? "Need an account? Sign up" : "Already have an account? Sign in"}
            </Text>
          </TouchableOpacity>

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
  const apiOptions = useMemo(() => {
    const baseUrl = API_BASE_URL.trim();
    if (!baseUrl) return undefined;
    if (!session?.access_token) return { baseUrl };
    return {
      baseUrl,
      headers: {
        Authorization: `Bearer ${session.access_token}`,
      },
    };
  }, [session?.access_token]);

  useEffect(() => {
    let mounted = true;

    async function handleAuthRedirectUrl(url: string | null) {
      if (!url) return;
      if (!url.startsWith("zyra://auth/callback")) return;
      const params = extractParamsFromUrl(url);

      const code = params.get("code");
      const accessToken = params.get("access_token");
      const refreshToken = params.get("refresh_token");
      const type = params.get("type");
      const errorDescription = params.get("error_description");

      if (errorDescription) {
        setAuthError(decodeURIComponent(errorDescription));
        return;
      }

      try {
        if (code) {
          const { error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) throw error;
          return;
        }
        if (accessToken && refreshToken) {
          const { error } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (error) throw error;
          return;
        }
        if (type === "signup") {
          setAuthError("Email confirmed. Please sign in to continue.");
        }
      } catch (error) {
        setAuthError(error instanceof Error ? error.message : "Could not complete email confirmation.");
      }
    }

    supabase.auth.getSession().then(({ data, error }) => {
      if (!mounted) return;
      if (error) {
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

  async function handleAuthSubmit(email: string, password: string) {
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
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: AUTH_REDIRECT_TO,
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
    return (
      <AuthScreen
        mode={authMode}
        loading={authBusy}
        error={authError}
        onSubmit={handleAuthSubmit}
        onToggleMode={() => {
          setAuthError(null);
          setAuthMode((prev) => (prev === "signin" ? "signup" : "signin"));
        }}
      />
    );
  }

  return (
    <NavigationContainer theme={navTheme}>
      <Tab.Navigator
        screenOptions={{
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
        }}
      >
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Cycle" component={CycleScreen} />
        <Tab.Screen name="Health" component={HealthScreen} />
        <Tab.Screen name="DoctorMatch">
          {() => <DoctorMatchScreen apiOptions={apiOptions} />}
        </Tab.Screen>
        <Tab.Screen name="Insights" component={InsightsScreen} />
        <Tab.Screen name="Profile">
          {() => <ProfileScreen onSignOut={handleSignOut} apiOptions={apiOptions} />}
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
