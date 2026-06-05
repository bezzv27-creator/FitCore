import React, { useState, useEffect, useRef } from "react";

/* ============================================================
   FITCORE 3.0 — BLOCCO 6 (FINALE)
   + SEZIONE SONNO (ore+minuti, no decimali)
   + SEZIONE RECOVERY (Fitbit Air + Google Health)
   App completa: 6 sezioni operative
   ============================================================ */

const COL = {
  bg: "#0d0d0f", panel: "#16161a", panel2: "#1d1d22",
  border: "#2c2c33", borderHard: "#3a3a42",
  text: "#e8e8ea", dim: "#8b8b94",
  workout: "#39ff14", nutrition: "#ff9500", supp: "#ffd000",
  sleep: "#a855f7", bio: "#ef4444", recovery: "#38bdf8",
};

const SECTIONS = [
  { id: "workout", label: "ALLENAMENTO", short: "ALLEN", color: COL.workout, icon: "▣" },
  { id: "nutrition", label: "NUTRIZIONE", short: "NUTRI", color: COL.nutrition, icon: "◷" },
  { id: "supplements", label: "INTEGRATORI", short: "INTEG", color: COL.supp, icon: "◆" },
  { id: "sleep", label: "SONNO", short: "SONNO", color: COL.sleep, icon: "☾" },
  { id: "bio", label: "BIOMETRICA", short: "BIO", color: COL.bio, icon: "⬡" },
  { id: "recovery", label: "RECOVERY", short: "RECOV", color: COL.recovery, icon: "⊞" },
];

// ---- Opzioni Allenamento ----
const ATTREZZI = ["GymPal", "Pesi", "Elastici"];
const TERMINALI = ["Bilanciere", "Maniglie", "Cavigliere", "Corda tricipiti"];
const MODALITA = ["Standard", "Eccentric Overload", "Costante", "Chains"];
const TECNICHE = ["Standard", "Superset", "Drop Set", "Rest-Pause", "Iso-Hold", "Bands", "Eccentric", "Paused"];

// ---- Integratori preimpostati ----
const SUPP_PRESETS = [
  { name: "Whey", unit: "g", defDose: "30" },
  { name: "Creatina Monoidrato", unit: "g", defDose: "5" },
  { name: "Omega-3", unit: "cps", defDose: "2" },
  { name: "D3-K2", unit: "cps", defDose: "1" },
  { name: "Turkesterone", unit: "cps", defDose: "1" },
  { name: "Ecdisterone", unit: "cps", defDose: "1" },
  { name: "Pre-WO", unit: "g", defDose: "15", needName: true },
  { name: "Citrullina", unit: "g", defDose: "7" },
  { name: "Glicerolo", unit: "g", defDose: "5" },
  { name: "Collagene + Vit C", unit: "g", defDose: "15" },
  { name: "Elettroliti", unit: "cps", defDose: "1" },
  { name: "Magnesio Bisglicinato", unit: "cps", defDose: "2" },
  { name: "Zinco Bisglicinato", unit: "cps", defDose: "1" },
];

// ---- Nutrizione ----
const MEAL_TYPES = ["Colazione", "Spuntino", "Pranzo", "Pre-Workout", "Post-Workout", "Cena", "Altro"];
const FOOD_UNITS = ["g", "ml", "pz", "porzione", "fetta", "cucchiaio", "tazza"];

// ---- Biometrica: parametri MorphoScan ----
const BIO_PARAMS = [
  { key: "peso", label: "Peso", unit: "kg" },
  { key: "bmi", label: "BMI", unit: "" },
  { key: "bmr", label: "BMR", unit: "kcal" },
  { key: "tdee", label: "TDEE", unit: "kcal" },
  { key: "bodyFat", label: "Grasso corporeo", unit: "%" },
  { key: "fatMass", label: "Massa grassa", unit: "kg" },
  { key: "leanMass", label: "Massa magra (FFM)", unit: "kg" },
  { key: "muscleMass", label: "Massa muscolare", unit: "kg" },
  { key: "skeletalMuscle", label: "Massa musc. scheletrica", unit: "kg" },
  { key: "boneMass", label: "Massa ossea", unit: "kg" },
  { key: "proteinPct", label: "Massa proteica", unit: "kg" },
  { key: "bodyWater", label: "Acqua corporea", unit: "kg" },
  { key: "visceralFat", label: "Grasso viscerale", unit: "" },
  { key: "subcutFat", label: "Grasso sottocutaneo", unit: "%" },
  { key: "smi", label: "SMI", unit: "kg/m²" },
  { key: "whr", label: "WHR (vita/fianchi)", unit: "" },
  { key: "metabolicAge", label: "Età metabolica", unit: "anni" },
  { key: "bodyScore", label: "Punteggio corporeo", unit: "/100" },
];

// ---- Circonferenze (Renpho Tape) ----
const BIO_CIRC = [
  { key: "neck", label: "Collo" },
  { key: "shoulder", label: "Spalle" },
  { key: "chest", label: "Petto" },
  { key: "waist", label: "Vita" },
  { key: "hips", label: "Fianchi" },
  { key: "leftArm", label: "Braccio SX" },
  { key: "rightArm", label: "Braccio DX" },
  { key: "leftThigh", label: "Coscia SX" },
  { key: "rightThigh", label: "Coscia DX" },
  { key: "leftCalf", label: "Polpaccio SX" },
  { key: "rightCalf", label: "Polpaccio DX" },
];

const todayStr = () => new Date().toISOString().slice(0, 10);

const emptyDay = () => ({
  workoutId: null,
  workoutLog: null,
  nutrition: { meals: [], acqua: "", note: "" },
  supplements: [],
  sleep: {},
  bio: {},
  recovery: {},
});

const newSet = () => ({ reps: "", weight: "", weightEcc: "", rir: "", rest: "", tut: "", spotter: false });
const newExercise = () => ({
  id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
  name: "", muscle: "",
  attrezzo: "GymPal", terminale: "Bilanciere", modalita: "Standard",
  technique: "Standard", supersetWith: "", note: "",
  sets: [newSet()],
});

// ---- Recovery (Fitbit Air) ----
const RECOVERY_KEY = [
  { key: "hrv", label: "HRV", unit: "ms", hint: "Variabilità battito — semaforo recupero" },
  { key: "rhr", label: "FC a riposo", unit: "bpm", hint: "Trend recupero/affaticamento" },
  { key: "readiness", label: "Prontezza", unit: "", hint: "Readiness Score Fitbit" },
  { key: "steps", label: "Passi", unit: "", hint: "NEAT — attività non da allenamento" },
];
const RECOVERY_SEC = [
  { key: "spo2", label: "SpO2", unit: "%", hint: "Ossigenazione" },
  { key: "activeCal", label: "Energia bruciata (TDEE giorno)", unit: "cal", hint: "Totale Google Health — confronta con le kcal mangiate per il bilancio" },
];

export default function App() {
  const [active, setActive] = useState("workout");
  const [date, setDate] = useState(todayStr());
  const [logs, setLogs] = useState({});
  const [protocols, setProtocols] = useState([]);
  const [loaded, setLoaded] = useState(false);
  const [toast, setToast] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("fitcore_data");
      if (raw) {
        const d = JSON.parse(raw);
        setLogs(d.logs || {});
        setProtocols(d.protocols || []);
      }
    } catch (e) { console.error(e); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded) return;
    try {
      localStorage.setItem("fitcore_data",
        JSON.stringify({ exportDate: new Date().toISOString(), logs, protocols }));
    } catch (e) { console.error(e); }
  }, [logs, protocols, loaded]);

  const showToast = (m) => { setToast(m); setTimeout(() => setToast(""), 2600); };

  const day = logs[date] || emptyDay();
  const updateDay = (patch) =>
    setLogs((prev) => ({ ...prev, [date]: { ...emptyDay(), ...prev[date], ...patch } }));

  const handleImport = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const d = JSON.parse(ev.target.result);
        const normLogs = {};
        Object.keys(d.logs || {}).forEach((k) => {
          normLogs[k] = { ...emptyDay(), ...d.logs[k] };
        });
        setLogs(normLogs);
        setProtocols(d.protocols || []);
        showToast(`✓ Importati ${Object.keys(normLogs).length} giorni`);
      } catch (err) { showToast("✗ Errore: file non valido"); }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleExport = () => {
    const blob = new Blob(
      [JSON.stringify({ exportDate: new Date().toISOString(), logs, protocols }, null, 2)],
      { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `fitcore_${todayStr()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast("✓ Backup JSON esportato");
  };

  const activeSection = SECTIONS.find((s) => s.id === active);
  const dayCount = Object.keys(logs).length;

  return (
    <div style={st.root}>
      <style>{css}</style>

      <header style={st.topbar}>
        <div style={st.brandRow}>
          <div style={st.brandMark}>▰▰</div>
          <div>
            <div style={st.brandName}>FITCORE</div>
            <div style={st.brandSub}>BEASTMODE 2.1 · LEAN BULK</div>
          </div>
          <div style={{ flex: 1 }} />
          <div style={st.dataChip}>{dayCount} GIORNI</div>
        </div>
        <div style={st.dateRow}>
          <button style={st.dateNav} onClick={() => { const d = new Date(date); d.setDate(d.getDate() - 1); setDate(d.toISOString().slice(0, 10)); }}>◀</button>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} style={st.dateInput} />
          <button style={st.dateNav} onClick={() => { const d = new Date(date); d.setDate(d.getDate() + 1); setDate(d.toISOString().slice(0, 10)); }}>▶</button>
          <button style={st.todayBtn} onClick={() => setDate(todayStr())}>OGGI</button>
        </div>
      </header>

      <main style={st.main}>
        <div style={st.sectionHead}>
          <span style={{ ...st.sectionBar, background: activeSection.color }} />
          <span style={st.sectionTitle}>{activeSection.label}</span>
          <span style={{ ...st.sectionIcon, color: activeSection.color }}>{activeSection.icon}</span>
        </div>

        {active === "workout" ? (
          <WorkoutSection
            day={day} updateDay={updateDay}
            protocols={protocols} setProtocols={setProtocols}
            showToast={showToast}
          />
        ) : active === "supplements" ? (
          <SupplementsSection day={day} updateDay={updateDay} showToast={showToast} />
        ) : active === "nutrition" ? (
          <NutritionSection day={day} updateDay={updateDay} showToast={showToast} />
        ) : active === "bio" ? (
          <BioSection day={day} updateDay={updateDay} />
        ) : active === "sleep" ? (
          <SleepSection day={day} updateDay={updateDay} />
        ) : active === "recovery" ? (
          <RecoverySection day={day} updateDay={updateDay} />
        ) : (
          <Placeholder section={activeSection} date={date} />
        )}

        <div style={st.dataPanel}>
          <div style={st.dataPanelTitle}>// GESTIONE DATI</div>
          <div style={st.dataBtnRow}>
            <button style={st.dataBtn} onClick={() => fileRef.current?.click()}>⬇ IMPORTA JSON</button>
            <button style={st.dataBtn} onClick={handleExport}>⬆ ESPORTA JSON</button>
          </div>
          <input ref={fileRef} type="file" accept="application/json" onChange={handleImport} style={{ display: "none" }} />
          <div style={st.dataHint}>Importa il tuo backup per caricare i giorni già loggati.</div>
        </div>
      </main>

      <nav style={st.bottomnav}>
        {SECTIONS.map((s) => (
          <button key={s.id} onClick={() => setActive(s.id)}
            style={{ ...st.navBtn, ...(active === s.id ? { color: s.color, borderTop: `2px solid ${s.color}` } : {}) }}>
            <span style={st.navIcon}>{s.icon}</span>
            <span style={st.navLabel}>{s.short}</span>
          </button>
        ))}
      </nav>

      {toast && <div style={st.toast}>{toast}</div>}
    </div>
  );
}

/* ============================================================
   SEZIONE ALLENAMENTO
   ============================================================ */
function WorkoutSection({ day, updateDay, protocols, setProtocols, showToast }) {
  const [mode, setMode] = useState("log"); // "log" | "templates"
  const log = day.workoutLog;

  // applica una scheda al giorno (deep copy + nuovi campi)
  const applyProtocol = (p) => {
    const copy = JSON.parse(JSON.stringify(p));
    copy.exercises = copy.exercises.map((ex) => ({
      ...newExercise(),
      ...ex,
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      sets: (ex.sets || [newSet()]).map((s) => ({ ...newSet(), ...s })),
    }));
    updateDay({ workoutId: p.id, workoutLog: copy });
    showToast(`✓ Scheda "${p.name}" caricata`);
  };

  const clearLog = () => { updateDay({ workoutId: null, workoutLog: null }); showToast("Log allenamento svuotato"); };

  // ---- modifica esercizio nel log ----
  const updateEx = (exId, patch) => {
    const copy = JSON.parse(JSON.stringify(log));
    const ex = copy.exercises.find((e) => e.id === exId);
    Object.assign(ex, patch);
    updateDay({ workoutLog: copy });
  };
  const updateSet = (exId, si, patch) => {
    const copy = JSON.parse(JSON.stringify(log));
    const ex = copy.exercises.find((e) => e.id === exId);
    Object.assign(ex.sets[si], patch);
    updateDay({ workoutLog: copy });
  };
  const addSet = (exId) => {
    const copy = JSON.parse(JSON.stringify(log));
    const ex = copy.exercises.find((e) => e.id === exId);
    const last = ex.sets[ex.sets.length - 1] || newSet();
    ex.sets.push({ ...newSet(), reps: last.reps, weight: last.weight, weightEcc: last.weightEcc, rest: last.rest, tut: last.tut });
    updateDay({ workoutLog: copy });
  };
  const removeSet = (exId, si) => {
    const copy = JSON.parse(JSON.stringify(log));
    const ex = copy.exercises.find((e) => e.id === exId);
    ex.sets.splice(si, 1);
    if (ex.sets.length === 0) ex.sets.push(newSet());
    updateDay({ workoutLog: copy });
  };
  const addExercise = () => {
    const copy = log ? JSON.parse(JSON.stringify(log)) : { id: `${Date.now()}`, name: "Sessione libera", exercises: [] };
    copy.exercises.push(newExercise());
    updateDay({ workoutId: day.workoutId, workoutLog: copy });
  };
  const removeExercise = (exId) => {
    const copy = JSON.parse(JSON.stringify(log));
    copy.exercises = copy.exercises.filter((e) => e.id !== exId);
    updateDay({ workoutLog: copy });
  };

  // volume totale (per eccentric overload usa media CON/ECC)
  const setWeight = (ex, s) => {
    const con = parseFloat(s.weight) || 0;
    const isEcc = ex.attrezzo === "GymPal" && ex.modalita === "Eccentric Overload";
    if (isEcc) {
      const ecc = parseFloat(s.weightEcc) || 0;
      if (con && ecc) return (con + ecc) / 2;
      return con || ecc;
    }
    return con;
  };
  const volume = log?.exercises?.reduce((tot, ex) =>
    tot + ex.sets.reduce((t, s) => t + setWeight(ex, s) * (parseInt(s.reps) || 0), 0), 0) || 0;
  const totalSets = log?.exercises?.reduce((t, ex) => t + ex.sets.length, 0) || 0;

  return (
    <div>
      {/* toggle log/templates */}
      <div style={st.toggle}>
        <button style={{ ...st.toggleBtn, ...(mode === "log" ? st.toggleOn : {}) }} onClick={() => setMode("log")}>LOG DEL GIORNO</button>
        <button style={{ ...st.toggleBtn, ...(mode === "templates" ? st.toggleOn : {}) }} onClick={() => setMode("templates")}>SCHEDE</button>
      </div>

      {mode === "templates" && (
        <div>
          <div style={st.hint}>Tocca una scheda per applicarla al {"giorno selezionato"}.</div>
          {protocols.length === 0 && <div style={st.empty}>Nessuna scheda salvata. Importa il backup o creane una.</div>}
          {protocols.map((p) => (
            <div key={p.id} style={st.protoCard} onClick={() => applyProtocol(p)}>
              <div>
                <div style={st.protoName}>{p.name}</div>
                <div style={st.protoMeta}>{p.exercises?.length || 0} esercizi</div>
              </div>
              <span style={st.protoApply}>APPLICA ▸</span>
            </div>
          ))}
        </div>
      )}

      {mode === "log" && (
        <div>
          {!log && (
            <div style={st.empty}>
              Nessun allenamento per questo giorno.<br />
              Vai su <b style={{ color: COL.workout }}>SCHEDE</b> per applicarne una, oppure
              <button style={st.linkBtn} onClick={addExercise}> + aggiungi esercizio libero</button>
            </div>
          )}

          {log && (
            <>
              <div style={st.logHead}>
                <span style={st.logName}>{log.name || "SESSIONE"}</span>
                <button style={st.clearBtn} onClick={clearLog}>✕ SVUOTA</button>
              </div>

              {log.exercises.map((ex, ei) => (
                <ExerciseCard key={ex.id} ex={ex} idx={ei}
                  updateEx={updateEx} updateSet={updateSet}
                  addSet={addSet} removeSet={removeSet} removeExercise={removeExercise} />
              ))}

              <button style={st.addExBtn} onClick={addExercise}>+ AGGIUNGI ESERCIZIO</button>

              {/* riepilogo volume */}
              <div style={st.volPanel}>
                <div style={st.volItem}><div style={st.volNum}>{Math.round(volume)}</div><div style={st.volLbl}>VOLUME kg·reps</div></div>
                <div style={st.volItem}><div style={st.volNum}>{totalSets}</div><div style={st.volLbl}>SET TOTALI</div></div>
                <div style={st.volItem}><div style={st.volNum}>{log.exercises.length}</div><div style={st.volLbl}>ESERCIZI</div></div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ExerciseCard({ ex, idx, updateEx, updateSet, addSet, removeSet, removeExercise }) {
  const [open, setOpen] = useState(true);
  const isGymPal = ex.attrezzo === "GymPal";
  const isEcc = isGymPal && ex.modalita === "Eccentric Overload";

  return (
    <div style={st.exCard}>
      <div style={st.exHead} onClick={() => setOpen(!open)}>
        <span style={st.exNum}>{String(idx + 1).padStart(2, "0")}</span>
        <div style={{ flex: 1 }}>
          <input style={st.exNameInput} value={ex.name} placeholder="Nome esercizio"
            onClick={(e) => e.stopPropagation()} onChange={(e) => updateEx(ex.id, { name: e.target.value })} />
          <input style={st.exMuscleInput} value={ex.muscle} placeholder="Muscolo target"
            onClick={(e) => e.stopPropagation()} onChange={(e) => updateEx(ex.id, { muscle: e.target.value })} />
        </div>
        <span style={st.exToggle}>{open ? "▾" : "▸"}</span>
      </div>

      {open && (
        <div style={st.exBody}>
          {/* Attrezzo */}
          <div style={st.fieldRow}>
            <span style={st.fieldLbl}>ATTREZZO</span>
            <div style={st.segGroup}>
              {ATTREZZI.map((a) => (
                <button key={a} style={{ ...st.seg, ...(ex.attrezzo === a ? st.segOn : {}) }}
                  onClick={() => updateEx(ex.id, { attrezzo: a })}>{a}</button>
              ))}
            </div>
          </div>

          {/* Sotto-menù GymPal */}
          {isGymPal && (
            <div style={st.gympalBox}>
              <div style={st.fieldRow}>
                <span style={st.fieldLbl}>TERMINALE</span>
                <div style={st.segGroupWrap}>
                  {TERMINALI.map((t) => (
                    <button key={t} style={{ ...st.segS, ...(ex.terminale === t ? st.segOn : {}) }}
                      onClick={() => updateEx(ex.id, { terminale: t })}>{t}</button>
                  ))}
                </div>
              </div>
              <div style={st.fieldRow}>
                <span style={st.fieldLbl}>MODALITÀ</span>
                <div style={st.segGroupWrap}>
                  {MODALITA.map((m) => (
                    <button key={m} style={{ ...st.segS, ...(ex.modalita === m ? st.segOn : {}) }}
                      onClick={() => updateEx(ex.id, { modalita: m })}>{m}</button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Tecnica */}
          <div style={st.fieldRow}>
            <span style={st.fieldLbl}>TECNICA</span>
            <select style={st.select} value={ex.technique || "Standard"}
              onChange={(e) => updateEx(ex.id, { technique: e.target.value })}>
              {TECNICHE.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
          </div>

          {/* Header serie */}
          <div style={st.setHeader}>
            <span style={{ width: 24 }}>#</span>
            <span style={{ flex: 1 }}>REPS</span>
            {isEcc ? (
              <>
                <span style={{ flex: 1 }}>KG CON</span>
                <span style={{ flex: 1 }}>KG ECC</span>
              </>
            ) : (
              <span style={{ flex: 1 }}>KG</span>
            )}
            <span style={{ flex: 1 }}>RIR</span>
            <span style={{ flex: 1.4 }}>TUT</span>
            <span style={{ width: 30 }}>SPOT</span>
            <span style={{ width: 22 }} />
          </div>

          {ex.sets.map((s, si) => (
            <div key={si} style={st.setRow}>
              <span style={st.setIdx}>{si + 1}</span>
              <input style={st.setInput} value={s.reps} placeholder="—" inputMode="numeric"
                onChange={(e) => updateSet(ex.id, si, { reps: e.target.value })} />
              <input style={st.setInput} value={s.weight} placeholder="—" inputMode="decimal"
                onChange={(e) => updateSet(ex.id, si, { weight: e.target.value })} />
              {isEcc && (
                <input style={{ ...st.setInput, borderColor: COL.workout }} value={s.weightEcc} placeholder="—" inputMode="decimal"
                  onChange={(e) => updateSet(ex.id, si, { weightEcc: e.target.value })} />
              )}
              <input style={st.setInput} value={s.rir} placeholder="—" inputMode="numeric"
                onChange={(e) => updateSet(ex.id, si, { rir: e.target.value })} />
              <input style={{ ...st.setInput, flex: 1.4 }} value={s.tut} placeholder="3-1-1"
                onChange={(e) => updateSet(ex.id, si, { tut: e.target.value })} />
              <button
                style={{ ...st.spotBtn, ...(s.spotter ? st.spotOn : {}) }}
                onClick={() => updateSet(ex.id, si, { spotter: !s.spotter })}
                title="Spotter Mode (assistenza GymPal)">S</button>
              <button style={st.setDel} onClick={() => removeSet(ex.id, si)}>✕</button>
            </div>
          ))}

          <div style={st.exActions}>
            <button style={st.addSetBtn} onClick={() => addSet(ex.id)}>+ SERIE</button>
            <button style={st.delExBtn} onClick={() => removeExercise(ex.id)}>ELIMINA ESERCIZIO</button>
          </div>
        </div>
      )}
    </div>
  );
}

/* ============================================================
   SEZIONE NUTRIZIONE
   ============================================================ */
const N = COL.nutrition;

function NutritionSection({ day, updateDay, showToast }) {
  const nutrition = day.nutrition || { meals: [], acqua: "", note: "" };
  const meals = nutrition.meals || [];

  const setNutrition = (patch) =>
    updateDay({ nutrition: { ...nutrition, ...patch } });

  const addMeal = (type) => {
    const meal = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      type, time: "", calories: "", protein: "", carbs: "", fat: "",
      foods: [], note: "",
    };
    setNutrition({ meals: [...meals, meal] });
  };

  const updateMeal = (id, patch) =>
    setNutrition({ meals: meals.map((m) => (m.id === id ? { ...m, ...patch } : m)) });
  const removeMeal = (id) =>
    setNutrition({ meals: meals.filter((m) => m.id !== id) });

  const addFood = (mealId) => {
    const m = meals.find((x) => x.id === mealId);
    const food = { id: `${Date.now()}_${Math.random().toString(36).slice(2, 5)}`, name: "", qty: "", unit: "g", time: "" };
    updateMeal(mealId, { foods: [...(m.foods || []), food] });
  };
  const updateFood = (mealId, fid, patch) => {
    const m = meals.find((x) => x.id === mealId);
    updateMeal(mealId, { foods: m.foods.map((f) => (f.id === fid ? { ...f, ...patch } : f)) });
  };
  const removeFood = (mealId, fid) => {
    const m = meals.find((x) => x.id === mealId);
    updateMeal(mealId, { foods: m.foods.filter((f) => f.id !== fid) });
  };

  // totali macro
  const tot = meals.reduce((acc, m) => {
    acc.kcal += parseFloat(m.calories) || 0;
    acc.p += parseFloat(m.protein) || 0;
    acc.c += parseFloat(m.carbs) || 0;
    acc.f += parseFloat(m.fat) || 0;
    return acc;
  }, { kcal: 0, p: 0, c: 0, f: 0 });

  // target da BeastMode 2.1 (giorno ON di riferimento)
  const TARGET = { kcal: 3200, p: 155, c: 435, f: 90 };
  const pct = (v, t) => Math.min(100, Math.round((v / t) * 100));

  return (
    <div>
      {/* Riepilogo macro totali */}
      <div style={st.macroPanel}>
        <div style={st.macroTotRow}>
          <span style={st.macroKcal}>{Math.round(tot.kcal)}</span>
          <span style={st.macroKcalLbl}>KCAL / {TARGET.kcal}</span>
        </div>
        <div style={st.macroBars}>
          {[
            { lbl: "P", v: tot.p, t: TARGET.p, c: N },
            { lbl: "C", v: tot.c, t: TARGET.c, c: COL.recovery },
            { lbl: "G", v: tot.f, t: TARGET.f, c: COL.supp },
          ].map((mb) => (
            <div key={mb.lbl} style={st.macroBarItem}>
              <div style={st.macroBarTop}>
                <span style={{ color: mb.c, fontFamily: cond, fontSize: 14 }}>{mb.lbl}</span>
                <span style={st.macroBarVal}>{Math.round(mb.v)}<span style={{ color: COL.dim }}>/{mb.t}g</span></span>
              </div>
              <div style={st.macroTrack}>
                <div style={{ ...st.macroFill, width: `${pct(mb.v, mb.t)}%`, background: mb.c }} />
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Acqua */}
      <div style={st.waterRow}>
        <span style={st.waterLbl}>💧 ACQUA</span>
        <input style={st.waterInput} value={nutrition.acqua} placeholder="0.0" inputMode="decimal"
          onChange={(e) => setNutrition({ acqua: e.target.value })} />
        <span style={st.waterUnit}>L</span>
      </div>

      {/* Pasti */}
      {meals.map((m) => (
        <MealCard key={m.id} meal={m}
          updateMeal={updateMeal} removeMeal={removeMeal}
          addFood={addFood} updateFood={updateFood} removeFood={removeFood} />
      ))}

      {/* Aggiungi pasto */}
      <div style={st.addMealWrap}>
        <div style={st.suppHint}>// AGGIUNGI PASTO</div>
        <div style={st.chipWrap}>
          {MEAL_TYPES.map((t) => (
            <button key={t} style={st.mealChip} onClick={() => addMeal(t)}>+ {t}</button>
          ))}
        </div>
      </div>
    </div>
  );
}

function MealCard({ meal, updateMeal, removeMeal, addFood, updateFood, removeFood }) {
  const [open, setOpen] = useState(true);
  const isSnack = meal.type === "Spuntino" || meal.type === "Altro";

  return (
    <div style={st.mealCard}>
      <div style={st.mealHead} onClick={() => setOpen(!open)}>
        <div style={{ flex: 1 }}>
          <span style={st.mealType}>{meal.type}</span>
          {meal.calories && <span style={st.mealKcal}> · {meal.calories} kcal</span>}
        </div>
        {!isSnack && (
          <input type="time" style={st.mealTime} value={meal.time}
            onClick={(e) => e.stopPropagation()}
            onChange={(e) => updateMeal(meal.id, { time: e.target.value })} />
        )}
        <span style={st.exToggle}>{open ? "▾" : "▸"}</span>
      </div>

      {open && (
        <div style={st.mealBody}>
          {/* Macro del pasto (da Yazio) */}
          <div style={st.mealMacroRow}>
            <MacroInput lbl="KCAL" val={meal.calories} onChange={(v) => updateMeal(meal.id, { calories: v })} />
            <MacroInput lbl="P" val={meal.protein} onChange={(v) => updateMeal(meal.id, { protein: v })} />
            <MacroInput lbl="C" val={meal.carbs} onChange={(v) => updateMeal(meal.id, { carbs: v })} />
            <MacroInput lbl="G" val={meal.fat} onChange={(v) => updateMeal(meal.id, { fat: v })} />
          </div>

          {/* Alimenti */}
          <div style={st.foodsLbl}>ALIMENTI</div>
          {(meal.foods || []).map((f) => (
            <div key={f.id} style={st.foodRow}>
              <input style={st.foodName} value={f.name} placeholder="alimento"
                onChange={(e) => updateFood(meal.id, f.id, { name: e.target.value })} />
              <input style={st.foodQty} value={f.qty} placeholder="qty" inputMode="decimal"
                onChange={(e) => updateFood(meal.id, f.id, { qty: e.target.value })} />
              <select style={st.foodUnit} value={f.unit}
                onChange={(e) => updateFood(meal.id, f.id, { unit: e.target.value })}>
                {FOOD_UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
              </select>
              {isSnack && (
                <input type="time" style={st.foodTime} value={f.time || ""}
                  onChange={(e) => updateFood(meal.id, f.id, { time: e.target.value })} />
              )}
              <button style={st.setDel} onClick={() => removeFood(meal.id, f.id)}>✕</button>
            </div>
          ))}

          <div style={st.exActions}>
            <button style={st.addSetBtnN} onClick={() => addFood(meal.id)}>+ ALIMENTO</button>
            <button style={st.delExBtn} onClick={() => removeMeal(meal.id)}>ELIMINA PASTO</button>
          </div>
        </div>
      )}
    </div>
  );
}

function MacroInput({ lbl, val, onChange }) {
  return (
    <div style={st.macroInWrap}>
      <span style={st.macroInLbl}>{lbl}</span>
      <input style={st.macroInInput} value={val} placeholder="—" inputMode="decimal"
        onChange={(e) => onChange(e.target.value)} />
    </div>
  );
}

/* ============================================================
   SEZIONE INTEGRATORI
   ============================================================ */
const S = COL.supp;

function SupplementsSection({ day, updateDay, showToast }) {
  const supps = day.supplements || [];
  const [customName, setCustomName] = useState("");

  const addSupp = (preset) => {
    const item = {
      id: `${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      name: preset.name,
      subName: "",
      dose: preset.defDose || "",
      unit: preset.unit || "g",
      time: "",
      taken: true,
      needName: !!preset.needName,
    };
    updateDay({ supplements: [...supps, item] });
  };

  const addCustom = () => {
    if (!customName.trim()) return;
    addSupp({ name: customName.trim(), unit: "g", defDose: "" });
    setCustomName("");
    showToast(`✓ ${customName.trim()} aggiunto`);
  };

  const updateSupp = (id, patch) =>
    updateDay({ supplements: supps.map((s) => (s.id === id ? { ...s, ...patch } : s)) });
  const removeSupp = (id) =>
    updateDay({ supplements: supps.filter((s) => s.id !== id) });

  // preset non ancora aggiunti oggi (per evitare doppioni nei chip)
  const addedNames = supps.map((s) => s.name);

  const takenCount = supps.filter((s) => s.taken).length;

  return (
    <div>
      {/* Chip preset rapidi */}
      <div style={st.suppHint}>// TOCCA PER AGGIUNGERE AL GIORNO</div>
      <div style={st.chipWrap}>
        {SUPP_PRESETS.map((p) => {
          const added = addedNames.includes(p.name);
          return (
            <button key={p.name} onClick={() => addSupp(p)}
              style={{ ...st.chip, ...(added ? st.chipAdded : {}) }}>
              {added ? "✓ " : "+ "}{p.name}
            </button>
          );
        })}
      </div>

      {/* Custom */}
      <div style={st.customRow}>
        <input style={st.customInput} value={customName} placeholder="Altro integratore..."
          onChange={(e) => setCustomName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCustom()} />
        <button style={st.customBtn} onClick={addCustom}>+ AGGIUNGI</button>
      </div>

      {/* Lista integratori del giorno */}
      {supps.length === 0 && (
        <div style={st.empty}>Nessun integratore registrato per questo giorno.</div>
      )}

      {supps.length > 0 && (
        <div style={st.suppCounter}>
          <span style={{ color: S, fontFamily: cond, fontSize: 20 }}>{takenCount}</span>
          <span style={{ color: COL.dim, fontSize: 10 }}> / {supps.length} PRESI</span>
        </div>
      )}

      {supps.map((s) => (
        <div key={s.id} style={{ ...st.suppCard, opacity: s.taken ? 1 : 0.55 }}>
          <button style={{ ...st.checkBtn, ...(s.taken ? st.checkOn : {}) }}
            onClick={() => updateSupp(s.id, { taken: !s.taken })}>
            {s.taken ? "✓" : ""}
          </button>

          <div style={{ flex: 1 }}>
            <div style={st.suppName}>{s.name}</div>
            {s.needName && (
              <input style={st.suppSubName} value={s.subName || ""} placeholder="quale? (es. Thor Stim-free)"
                onChange={(e) => updateSupp(s.id, { subName: e.target.value })} />
            )}
            <div style={st.suppControls}>
              {/* dose */}
              <input style={st.doseInput} value={s.dose} placeholder="dose" inputMode="decimal"
                onChange={(e) => updateSupp(s.id, { dose: e.target.value })} />
              {/* unità toggle */}
              <button style={st.unitBtn}
                onClick={() => updateSupp(s.id, { unit: s.unit === "g" ? "cps" : "g" })}>
                {s.unit}
              </button>
              {/* orario */}
              <input type="time" style={st.timeInput} value={s.time}
                onChange={(e) => updateSupp(s.id, { time: e.target.value })} />
            </div>
          </div>

          <button style={st.suppDel} onClick={() => removeSupp(s.id)}>✕</button>
        </div>
      ))}
    </div>
  );
}

/* ============================================================
   SEZIONE BIOMETRICA
   ============================================================ */
const B = COL.bio;

function BioSection({ day, updateDay }) {
  const bio = day.bio || {};
  const [tab, setTab] = useState("scan"); // scan | circ

  const setBio = (key, val) => updateDay({ bio: { ...bio, [key]: val } });

  return (
    <div>
      <div style={st.toggle}>
        <button style={{ ...st.toggleBtn, ...(tab === "scan" ? st.toggleOnBio : {}) }} onClick={() => setTab("scan")}>MORPHOSCAN</button>
        <button style={{ ...st.toggleBtn, ...(tab === "circ" ? st.toggleOnBio : {}) }} onClick={() => setTab("circ")}>CIRCONFERENZE</button>
      </div>

      {tab === "scan" && (
        <div style={st.bioGrid}>
          {BIO_PARAMS.map((p) => (
            <div key={p.key} style={st.bioCell}>
              <span style={st.bioLbl}>{p.label}</span>
              <div style={st.bioInputRow}>
                <input style={st.bioInput} value={bio[p.key] || ""} placeholder="—" inputMode="decimal"
                  onChange={(e) => setBio(p.key, e.target.value)} />
                {p.unit && <span style={st.bioUnit}>{p.unit}</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === "circ" && (
        <div style={st.bioGrid}>
          {BIO_CIRC.map((p) => (
            <div key={p.key} style={st.bioCell}>
              <span style={st.bioLbl}>{p.label}</span>
              <div style={st.bioInputRow}>
                <input style={st.bioInput} value={bio[p.key] || ""} placeholder="—" inputMode="decimal"
                  onChange={(e) => setBio(p.key, e.target.value)} />
                <span style={st.bioUnit}>cm</span>
              </div>
            </div>
          ))}
        </div>
      )}

      <div style={st.bioNoteWrap}>
        <span style={st.fieldLbl}>NOTE</span>
        <textarea style={st.bioNote} value={bio.note || ""} placeholder="Note misurazione (es. a digiuno, post-bagno)..."
          onChange={(e) => setBio("note", e.target.value)} />
      </div>
    </div>
  );
}

/* ============================================================
   SEZIONE SONNO  (ore + minuti, no decimali)
   ============================================================ */
const SL = COL.sleep;

function SleepSection({ day, updateDay }) {
  const sleep = day.sleep || {};
  const setSleep = (patch) => updateDay({ sleep: { ...sleep, ...patch } });

  // ricava ore/min dal totale: preferisce totalMin, fallback al vecchio "total" decimale
  let initMin = 0;
  if (sleep.totalMin != null && sleep.totalMin !== "") initMin = parseInt(sleep.totalMin) || 0;
  else if (sleep.total) initMin = Math.round((parseFloat(sleep.total) || 0) * 60);
  const hh = Math.floor(initMin / 60);
  const mm = initMin % 60;

  const setTotal = (h, m) => {
    const totalMin = (parseInt(h) || 0) * 60 + (parseInt(m) || 0);
    setSleep({ totalMin: String(totalMin), total: (totalMin / 60).toFixed(2) });
  };

  // somma fasi (controllo coerenza)
  const phases = ["deep", "light", "rem", "awake"];
  const phaseSum = phases.reduce((t, k) => t + (parseInt(sleep[k]) || 0), 0);

  return (
    <div>
      {/* Totale ore+minuti */}
      <div style={st.sleepTotalPanel}>
        <span style={st.fieldLbl}>DURATA TOTALE</span>
        <div style={st.sleepHMRow}>
          <input style={st.sleepHM} value={hh || ""} placeholder="0" inputMode="numeric"
            onChange={(e) => setTotal(e.target.value, mm)} />
          <span style={st.sleepHMu}>h</span>
          <input style={st.sleepHM} value={mm || ""} placeholder="00" inputMode="numeric"
            onChange={(e) => setTotal(hh, e.target.value)} />
          <span style={st.sleepHMu}>min</span>
          <div style={{ flex: 1 }} />
          <div style={st.sleepBig}>{initMin > 0 ? `${hh}h ${String(mm).padStart(2, "0")}min` : "—"}</div>
        </div>
      </div>

      {/* Orari */}
      <div style={st.sleepRow2}>
        <div style={st.sleepField}>
          <span style={st.fieldLbl}>A LETTO</span>
          <input type="time" style={st.bioInput} value={sleep.bedtime || ""}
            onChange={(e) => setSleep({ bedtime: e.target.value })} />
        </div>
        <div style={st.sleepField}>
          <span style={st.fieldLbl}>SVEGLIA</span>
          <input type="time" style={st.bioInput} value={sleep.wakeup || ""}
            onChange={(e) => setSleep({ wakeup: e.target.value })} />
        </div>
      </div>

      {/* Fasi (in minuti) */}
      <div style={st.fieldLbl}>FASI (minuti)</div>
      <div style={st.bioGrid}>
        {[["deep", "Profondo"], ["light", "Leggero"], ["rem", "REM"], ["awake", "Veglia"]].map(([k, lbl]) => (
          <div key={k} style={{ ...st.bioCell, borderLeftColor: SL }}>
            <span style={st.bioLbl}>{lbl}</span>
            <div style={st.bioInputRow}>
              <input style={st.bioInput} value={sleep[k] || ""} placeholder="—" inputMode="numeric"
                onChange={(e) => setSleep({ [k]: e.target.value })} />
              <span style={st.bioUnit}>min</span>
            </div>
          </div>
        ))}
      </div>
      {phaseSum > 0 && (
        <div style={st.phaseSum}>
          Somma fasi: <b style={{ color: SL }}>{Math.floor(phaseSum / 60)}h {String(phaseSum % 60).padStart(2, "0")}min</b> ({phaseSum} min)
        </div>
      )}

      {/* Score + vitali */}
      <div style={st.bioGrid}>
        <div style={{ ...st.bioCell, borderLeftColor: SL }}>
          <span style={st.bioLbl}>Sleep Score</span>
          <input style={st.bioInput} value={sleep.score || ""} placeholder="—" inputMode="numeric"
            onChange={(e) => setSleep({ score: e.target.value })} />
        </div>
        <div style={{ ...st.bioCell, borderLeftColor: SL }}>
          <span style={st.bioLbl}>SpO2 %</span>
          <input style={st.bioInput} value={sleep.spo2 || ""} placeholder="—" inputMode="numeric"
            onChange={(e) => setSleep({ spo2: e.target.value })} />
        </div>
        <div style={{ ...st.bioCell, borderLeftColor: SL }}>
          <span style={st.bioLbl}>FC media notte</span>
          <input style={st.bioInput} value={sleep.hrAvg || ""} placeholder="—" inputMode="numeric"
            onChange={(e) => setSleep({ hrAvg: e.target.value })} />
        </div>
        <div style={{ ...st.bioCell, borderLeftColor: SL }}>
          <span style={st.bioLbl}>FC minima</span>
          <input style={st.bioInput} value={sleep.hrMin || ""} placeholder="—" inputMode="numeric"
            onChange={(e) => setSleep({ hrMin: e.target.value })} />
        </div>
      </div>

      <div style={st.bioNoteWrap}>
        <span style={st.fieldLbl}>NOTE</span>
        <textarea style={st.bioNote} value={sleep.note || ""} placeholder="Note sonno..."
          onChange={(e) => setSleep({ note: e.target.value })} />
      </div>
    </div>
  );
}

/* ============================================================
   SEZIONE RECOVERY (Fitbit Air)
   ============================================================ */
const R = COL.recovery;

function RecoverySection({ day, updateDay }) {
  const rec = day.recovery || {};
  const setRec = (key, val) => updateDay({ recovery: { ...rec, [key]: val } });

  return (
    <div>
      <div style={st.recHint}>// METRICHE CHIAVE</div>
      <div style={st.bioGrid}>
        {RECOVERY_KEY.map((m) => (
          <div key={m.key} style={{ ...st.recCellKey }}>
            <span style={st.recLbl}>{m.label}</span>
            <div style={st.bioInputRow}>
              <input style={{ ...st.bioInput, fontSize: 16 }} value={rec[m.key] || ""} placeholder="—" inputMode="numeric"
                onChange={(e) => setRec(m.key, e.target.value)} />
              {m.unit && <span style={st.bioUnit}>{m.unit}</span>}
            </div>
            <span style={st.recTip}>{m.hint}</span>
          </div>
        ))}
      </div>

      <div style={st.recHint}>// SECONDARIE</div>
      <div style={st.bioGrid}>
        {RECOVERY_SEC.map((m) => (
          <div key={m.key} style={{ ...st.bioCell, borderLeftColor: R }}>
            <span style={st.bioLbl}>{m.label}</span>
            <div style={st.bioInputRow}>
              <input style={st.bioInput} value={rec[m.key] || ""} placeholder="—" inputMode="numeric"
                onChange={(e) => setRec(m.key, e.target.value)} />
              {m.unit && <span style={st.bioUnit}>{m.unit}</span>}
            </div>
            <span style={st.recTip}>{m.hint}</span>
          </div>
        ))}
      </div>

      <div style={st.bioNoteWrap}>
        <span style={st.fieldLbl}>NOTE</span>
        <textarea style={st.bioNote} value={rec.note || ""} placeholder="Note recovery..."
          onChange={(e) => setRec("note", e.target.value)} />
      </div>
    </div>
  );
}

function Placeholder({ section, date }) {
  return (
    <div style={st.placeholder}>
      <div style={{ ...st.phIcon, color: section.color }}>{section.icon}</div>
      <div style={st.phTitle}>SEZIONE {section.label}</div>
      <div style={st.phText}>Modulo in costruzione — Blocco successivo.</div>
      <div style={st.phData}>DATA ATTIVA: <b style={{ color: section.color }}>{date}</b></div>
    </div>
  );
}

/* ============================================================ STILI ============================================================ */
const mono = "'JetBrains Mono','Courier New',monospace";
const cond = "'Oswald','Arial Narrow',sans-serif";
const W = COL.workout;

const st = {
  root: { minHeight: "100vh", background: COL.bg, color: COL.text, fontFamily: mono, display: "flex", flexDirection: "column", paddingBottom: 70 },
  topbar: { background: COL.panel, borderBottom: `2px solid ${COL.borderHard}`, padding: "12px 14px 10px", position: "sticky", top: 0, zIndex: 10 },
  brandRow: { display: "flex", alignItems: "center", gap: 10 },
  brandMark: { color: W, fontSize: 18, letterSpacing: -2 },
  brandName: { fontFamily: cond, fontWeight: 700, fontSize: 20, letterSpacing: 3, lineHeight: 1 },
  brandSub: { fontSize: 8, color: COL.dim, letterSpacing: 2, marginTop: 2 },
  dataChip: { fontSize: 9, color: W, border: `1px solid ${COL.border}`, padding: "4px 8px", letterSpacing: 1, background: COL.bg },
  dateRow: { display: "flex", alignItems: "center", gap: 6, marginTop: 12 },
  dateNav: { background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, width: 34, height: 34, fontSize: 12, cursor: "pointer" },
  dateInput: { flex: 1, background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "8px 10px", fontFamily: mono, fontSize: 13, letterSpacing: 1 },
  todayBtn: { background: COL.bg, color: COL.dim, border: `1px solid ${COL.border}`, padding: "8px 10px", fontSize: 10, letterSpacing: 1, cursor: "pointer", fontFamily: mono },
  main: { flex: 1, padding: 14 },
  sectionHead: { display: "flex", alignItems: "center", gap: 10, marginBottom: 16 },
  sectionBar: { width: 4, height: 22, display: "block" },
  sectionTitle: { fontFamily: cond, fontSize: 18, letterSpacing: 4, fontWeight: 600 },
  sectionIcon: { marginLeft: "auto", fontSize: 18 },

  // toggle
  toggle: { display: "flex", gap: 0, marginBottom: 14, border: `1px solid ${COL.border}` },
  toggleBtn: { flex: 1, background: COL.panel, color: COL.dim, border: "none", padding: "11px 8px", fontSize: 11, letterSpacing: 1.5, cursor: "pointer", fontFamily: mono },
  toggleOn: { background: COL.panel2, color: W, boxShadow: `inset 0 -2px 0 ${W}` },

  hint: { fontSize: 10, color: COL.dim, marginBottom: 10, letterSpacing: 0.5 },
  empty: { border: `1px dashed ${COL.borderHard}`, padding: "26px 16px", textAlign: "center", fontSize: 11, color: COL.dim, lineHeight: 1.8, background: COL.panel },
  linkBtn: { background: "none", border: "none", color: W, cursor: "pointer", fontFamily: mono, fontSize: 11, textDecoration: "underline", padding: 0 },

  // protocols
  protoCard: { display: "flex", alignItems: "center", justifyContent: "space-between", background: COL.panel, border: `1px solid ${COL.border}`, borderLeft: `3px solid ${W}`, padding: "14px 14px", marginBottom: 8, cursor: "pointer" },
  protoName: { fontFamily: cond, fontSize: 15, letterSpacing: 2, fontWeight: 600 },
  protoMeta: { fontSize: 9, color: COL.dim, letterSpacing: 1, marginTop: 3 },
  protoApply: { fontSize: 10, color: W, letterSpacing: 1 },

  // log
  logHead: { display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 },
  logName: { fontFamily: cond, fontSize: 16, letterSpacing: 2, color: W },
  clearBtn: { background: COL.bg, color: COL.dim, border: `1px solid ${COL.border}`, padding: "5px 9px", fontSize: 9, letterSpacing: 1, cursor: "pointer", fontFamily: mono },

  exCard: { border: `1px solid ${COL.border}`, background: COL.panel, marginBottom: 8 },
  exHead: { display: "flex", alignItems: "center", gap: 8, padding: "10px 12px", cursor: "pointer", borderLeft: `3px solid ${W}` },
  exNum: { fontFamily: cond, fontSize: 16, color: W, minWidth: 22 },
  exNameInput: { width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${COL.border}`, color: COL.text, fontSize: 13, fontFamily: mono, padding: "2px 0", outline: "none" },
  exMuscleInput: { width: "100%", background: "transparent", border: "none", color: COL.dim, fontSize: 9, fontFamily: mono, padding: "3px 0 0", outline: "none", letterSpacing: 0.5 },
  exToggle: { color: COL.dim, fontSize: 14 },
  exBody: { padding: "4px 12px 12px", borderTop: `1px solid ${COL.border}` },

  fieldRow: { marginTop: 10 },
  fieldLbl: { fontSize: 9, color: COL.dim, letterSpacing: 1.5, display: "block", marginBottom: 5 },
  segGroup: { display: "flex", gap: 0, border: `1px solid ${COL.border}` },
  seg: { flex: 1, background: COL.panel2, color: COL.dim, border: "none", borderRight: `1px solid ${COL.border}`, padding: "9px 4px", fontSize: 10, letterSpacing: 1, cursor: "pointer", fontFamily: mono },
  segGroupWrap: { display: "flex", flexWrap: "wrap", gap: 5 },
  segS: { background: COL.panel2, color: COL.dim, border: `1px solid ${COL.border}`, padding: "7px 10px", fontSize: 10, letterSpacing: 0.5, cursor: "pointer", fontFamily: mono },
  segOn: { background: W, color: COL.bg, fontWeight: 700 },
  gympalBox: { border: `1px solid ${COL.borderHard}`, borderLeft: `3px solid ${W}`, background: COL.bg, padding: "4px 10px 10px", marginTop: 10 },
  select: { width: "100%", background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "9px 8px", fontFamily: mono, fontSize: 11, letterSpacing: 0.5 },

  setHeader: { display: "flex", alignItems: "center", gap: 5, marginTop: 14, marginBottom: 4, fontSize: 8, color: COL.dim, letterSpacing: 1 },
  setRow: { display: "flex", alignItems: "center", gap: 5, marginBottom: 5 },
  setIdx: { width: 24, fontSize: 11, color: W, fontFamily: cond, textAlign: "center" },
  setInput: { flex: 1, width: "100%", background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "8px 4px", fontFamily: mono, fontSize: 12, textAlign: "center", outline: "none" },
  spotBtn: { width: 30, height: 32, background: COL.panel2, color: COL.dim, border: `1px solid ${COL.border}`, fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: mono },
  spotOn: { background: COL.recovery, color: COL.bg, borderColor: COL.recovery },
  setDel: { width: 22, background: "transparent", color: COL.dim, border: "none", fontSize: 11, cursor: "pointer" },

  exActions: { display: "flex", gap: 8, marginTop: 12 },
  addSetBtn: { flex: 1, background: COL.panel2, color: W, border: `1px solid ${COL.border}`, padding: "10px", fontSize: 10, letterSpacing: 1, cursor: "pointer", fontFamily: mono },
  delExBtn: { background: COL.bg, color: COL.bio, border: `1px solid ${COL.border}`, padding: "10px 12px", fontSize: 9, letterSpacing: 1, cursor: "pointer", fontFamily: mono },

  addExBtn: { width: "100%", background: COL.panel2, color: W, border: `1px solid ${COL.borderHard}`, padding: "13px", fontSize: 11, letterSpacing: 1.5, cursor: "pointer", fontFamily: mono, marginTop: 4 },

  volPanel: { display: "flex", border: `1px solid ${COL.borderHard}`, borderLeft: `3px solid ${W}`, marginTop: 14, background: COL.panel },
  volItem: { flex: 1, padding: "12px 6px", textAlign: "center", borderRight: `1px solid ${COL.border}` },
  volNum: { fontFamily: cond, fontSize: 22, color: W, fontWeight: 700 },
  volLbl: { fontSize: 8, color: COL.dim, letterSpacing: 1, marginTop: 3 },

  // NUTRIZIONE
  macroPanel: { border: `1px solid ${COL.borderHard}`, borderLeft: `3px solid ${N}`, background: COL.panel, padding: "14px", marginBottom: 12 },
  macroTotRow: { display: "flex", alignItems: "baseline", gap: 8, marginBottom: 12 },
  macroKcal: { fontFamily: cond, fontSize: 30, fontWeight: 700, color: N },
  macroKcalLbl: { fontSize: 10, color: COL.dim, letterSpacing: 1 },
  macroBars: { display: "flex", flexDirection: "column", gap: 9 },
  macroBarItem: {},
  macroBarTop: { display: "flex", justifyContent: "space-between", alignItems: "baseline", marginBottom: 3 },
  macroBarVal: { fontSize: 11, color: COL.text },
  macroTrack: { height: 6, background: COL.panel2, border: `1px solid ${COL.border}` },
  macroFill: { height: "100%", transition: "width 0.3s" },
  waterRow: { display: "flex", alignItems: "center", gap: 10, background: COL.panel, border: `1px solid ${COL.border}`, padding: "10px 14px", marginBottom: 14 },
  waterLbl: { fontSize: 11, color: COL.recovery, letterSpacing: 1, flex: 1 },
  waterInput: { width: 70, background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "8px", fontFamily: mono, fontSize: 14, textAlign: "center", outline: "none" },
  waterUnit: { fontSize: 12, color: COL.dim },
  mealCard: { border: `1px solid ${COL.border}`, background: COL.panel, marginBottom: 8 },
  mealHead: { display: "flex", alignItems: "center", gap: 8, padding: "11px 12px", cursor: "pointer", borderLeft: `3px solid ${N}` },
  mealType: { fontFamily: cond, fontSize: 15, letterSpacing: 1.5, color: COL.text },
  mealKcal: { fontSize: 11, color: N },
  mealTime: { background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "5px 6px", fontFamily: mono, fontSize: 11, outline: "none" },
  mealBody: { padding: "10px 12px 12px", borderTop: `1px solid ${COL.border}` },
  mealMacroRow: { display: "flex", gap: 6, marginBottom: 12 },
  macroInWrap: { flex: 1, textAlign: "center" },
  macroInLbl: { fontSize: 8, color: COL.dim, letterSpacing: 1, display: "block", marginBottom: 3 },
  macroInInput: { width: "100%", background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "8px 2px", fontFamily: mono, fontSize: 12, textAlign: "center", outline: "none" },
  foodsLbl: { fontSize: 9, color: COL.dim, letterSpacing: 1.5, marginBottom: 6 },
  foodRow: { display: "flex", gap: 5, marginBottom: 5, alignItems: "center" },
  foodName: { flex: 1, background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "8px", fontFamily: mono, fontSize: 11, outline: "none" },
  foodQty: { width: 48, background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "8px 4px", fontFamily: mono, fontSize: 11, textAlign: "center", outline: "none" },
  foodUnit: { width: 64, background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "8px 2px", fontFamily: mono, fontSize: 10, outline: "none" },
  foodTime: { width: 70, background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "7px 4px", fontFamily: mono, fontSize: 10, outline: "none" },
  addSetBtnN: { flex: 1, background: COL.panel2, color: N, border: `1px solid ${COL.border}`, padding: "10px", fontSize: 10, letterSpacing: 1, cursor: "pointer", fontFamily: mono },
  addMealWrap: { marginTop: 14 },
  mealChip: { background: COL.panel2, color: COL.dim, border: `1px solid ${COL.border}`, padding: "8px 10px", fontSize: 10, letterSpacing: 0.5, cursor: "pointer", fontFamily: mono },

  // SUPPLEMENTI
  suppHint: { fontSize: 9, color: COL.dim, letterSpacing: 1.5, marginBottom: 8 },
  chipWrap: { display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 14 },
  chip: { background: COL.panel2, color: COL.dim, border: `1px solid ${COL.border}`, padding: "8px 10px", fontSize: 10, letterSpacing: 0.5, cursor: "pointer", fontFamily: mono },
  chipAdded: { borderColor: S, color: S },
  customRow: { display: "flex", gap: 6, marginBottom: 16 },
  customInput: { flex: 1, background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "10px", fontFamily: mono, fontSize: 12, outline: "none" },
  customBtn: { background: COL.panel2, color: S, border: `1px solid ${COL.borderHard}`, padding: "10px 12px", fontSize: 10, letterSpacing: 1, cursor: "pointer", fontFamily: mono },
  suppCounter: { marginBottom: 10, letterSpacing: 1 },
  suppCard: { display: "flex", alignItems: "center", gap: 10, background: COL.panel, border: `1px solid ${COL.border}`, borderLeft: `3px solid ${S}`, padding: "10px 12px", marginBottom: 8 },
  checkBtn: { width: 30, height: 30, minWidth: 30, background: COL.panel2, color: COL.bg, border: `1px solid ${COL.borderHard}`, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: mono },
  checkOn: { background: S, color: COL.bg, borderColor: S },
  suppName: { fontSize: 13, color: COL.text, letterSpacing: 0.5 },
  suppSubName: { width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${COL.border}`, color: S, fontSize: 10, fontFamily: mono, padding: "3px 0", marginTop: 4, outline: "none" },
  suppControls: { display: "flex", gap: 6, marginTop: 7, alignItems: "center" },
  doseInput: { width: 60, background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "6px 8px", fontFamily: mono, fontSize: 12, textAlign: "center", outline: "none" },
  unitBtn: { width: 46, background: COL.bg, color: S, border: `1px solid ${COL.border}`, padding: "6px 4px", fontSize: 11, cursor: "pointer", fontFamily: mono },
  timeInput: { background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "6px 8px", fontFamily: mono, fontSize: 12, outline: "none" },
  suppDel: { width: 22, background: "transparent", color: COL.dim, border: "none", fontSize: 12, cursor: "pointer" },

  // BIOMETRICA
  toggleOnBio: { background: COL.panel2, color: B, boxShadow: `inset 0 -2px 0 ${B}` },
  bioGrid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 8, marginBottom: 14 },
  bioCell: { background: COL.panel, border: `1px solid ${COL.border}`, borderLeft: `3px solid ${B}`, padding: "9px 10px" },
  bioLbl: { fontSize: 9, color: COL.dim, letterSpacing: 0.5, display: "block", marginBottom: 5, lineHeight: 1.2, minHeight: 22 },
  bioInputRow: { display: "flex", alignItems: "baseline", gap: 4 },
  bioInput: { flex: 1, width: "100%", background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "8px 6px", fontFamily: mono, fontSize: 14, textAlign: "center", outline: "none" },
  bioUnit: { fontSize: 9, color: COL.dim, minWidth: 20 },
  bioNoteWrap: { marginTop: 4 },
  bioNote: { width: "100%", minHeight: 60, background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "10px", fontFamily: mono, fontSize: 12, outline: "none", resize: "vertical", marginTop: 5 },

  // SONNO
  sleepTotalPanel: { background: COL.panel, border: `1px solid ${COL.borderHard}`, borderLeft: `3px solid ${SL}`, padding: "12px 14px", marginBottom: 12 },
  sleepHMRow: { display: "flex", alignItems: "center", gap: 6, marginTop: 6 },
  sleepHM: { width: 56, background: COL.panel2, color: COL.text, border: `1px solid ${COL.border}`, padding: "10px 6px", fontFamily: mono, fontSize: 18, textAlign: "center", outline: "none" },
  sleepHMu: { fontSize: 12, color: COL.dim },
  sleepBig: { fontFamily: cond, fontSize: 22, color: SL, fontWeight: 700 },
  sleepRow2: { display: "flex", gap: 8, marginBottom: 14 },
  sleepField: { flex: 1 },
  phaseSum: { fontSize: 10, color: COL.dim, margin: "8px 0 14px", letterSpacing: 0.5 },

  // RECOVERY
  recHint: { fontSize: 9, color: COL.dim, letterSpacing: 1.5, marginBottom: 8, marginTop: 4 },
  recCellKey: { background: COL.panel, border: `1px solid ${COL.borderHard}`, borderLeft: `3px solid ${R}`, padding: "10px 10px", marginBottom: 0 },
  recLbl: { fontSize: 11, color: R, letterSpacing: 0.5, display: "block", marginBottom: 6, fontFamily: cond },
  recTip: { fontSize: 8, color: COL.dim, lineHeight: 1.3, display: "block", marginTop: 5 },

  // placeholder + data
  placeholder: { border: `1px dashed ${COL.borderHard}`, background: COL.panel, padding: "40px 20px", textAlign: "center", marginBottom: 16 },
  phIcon: { fontSize: 42, marginBottom: 12 },
  phTitle: { fontFamily: cond, fontSize: 15, letterSpacing: 3, marginBottom: 8 },
  phText: { fontSize: 11, color: COL.dim, lineHeight: 1.7 },
  phData: { marginTop: 18, fontSize: 11, color: COL.dim, letterSpacing: 1 },

  dataPanel: { border: `1px solid ${COL.border}`, background: COL.panel, padding: 14, marginTop: 16 },
  dataPanelTitle: { fontSize: 10, color: COL.dim, letterSpacing: 2, marginBottom: 10 },
  dataBtnRow: { display: "flex", gap: 8 },
  dataBtn: { flex: 1, background: COL.panel2, color: COL.text, border: `1px solid ${COL.borderHard}`, padding: "12px 8px", fontSize: 11, letterSpacing: 1, cursor: "pointer", fontFamily: mono },
  dataHint: { fontSize: 9, color: COL.dim, marginTop: 10 },

  bottomnav: { position: "fixed", bottom: 0, left: 0, right: 0, height: 62, background: COL.panel, borderTop: `2px solid ${COL.borderHard}`, display: "flex", zIndex: 10 },
  navBtn: { flex: 1, background: "transparent", border: "none", borderTop: "2px solid transparent", color: COL.dim, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 3, cursor: "pointer", fontFamily: mono },
  navIcon: { fontSize: 16 },
  navLabel: { fontSize: 8, letterSpacing: 1 },
  toast: { position: "fixed", bottom: 78, left: "50%", transform: "translateX(-50%)", background: COL.borderHard, color: COL.text, padding: "10px 18px", fontSize: 11, letterSpacing: 1, border: `1px solid ${COL.dim}`, zIndex: 20, fontFamily: mono },
};

const css = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;600;700&family=Oswald:wght@500;600;700&display=swap');
  * { box-sizing: border-box; margin: 0; }
  body { background: ${COL.bg}; }
  input[type="date"]::-webkit-calendar-picker-indicator { filter: invert(0.7); }
  select { -webkit-appearance: none; appearance: none; }
  button:active { opacity: 0.7; }
`;