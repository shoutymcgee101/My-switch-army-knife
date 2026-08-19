diff --git a/src/App.jsx b/src/App.jsx
index 9113928..4c2e9b1 100644
--- a/src/App.jsx
+++ b/src/App.jsx
@@ -1,6 +1,6 @@
 import React, { useState, useEffect, useRef, useCallback } from "react";
 import { createClient } from "@supabase/supabase-js";
-import { CheckSquare, Square, Plus, Trash2, StickyNote, Wallet, ListChecks } from "lucide-react";
+import { CheckSquare, Square, Plus, Trash2, StickyNote, Wallet, ListChecks, Shirt, Filter } from "lucide-react";
 
 // ---- Supabase setup ----
 // Replace these two values with your own Project URL and anon public key
@@ -19,6 +19,8 @@ const GREEN = "#2E5A48";
 const GREEN_DIM = "#5C7F70";
 const RUST = "#A8462F";
 
+const CLOTHES_CATEGORIES = ["Shirt", "Pants", "Shoes", "Jacket", "Outerwear", "Dress", "Accessories", "Other"];
+
 const uid = () => Math.random().toString(36).slice(2, 10);
 
 const todayStamp = () => {
@@ -27,7 +29,7 @@ const todayStamp = () => {
 };
 
 function useLedgerData() {
-  const [data, setData] = useState({ tasks: [], notes: [], budget: [] });
+  const [data, setData] = useState({ tasks: [], notes: [], budget: [], clothes: [] });
   const [status, setStatus] = useState("loading"); // loading | ready | saving | error
   const saveTimer = useRef(null);
 
@@ -47,6 +49,7 @@ function useLedgerData() {
           tasks: row.data.tasks || [],
           notes: row.data.notes || [],
           budget: row.data.budget || [],
+          clothes: row.data.clothes || [],
         });
       }
       setStatus("ready");
@@ -303,6 +306,298 @@ function BudgetTab({ budget, setBudget }) {
   );
 }
 
+function ClothesTab({ clothes, setClothes }) {
+  const [name, setName] = useState("");
+  const [brand, setBrand] = useState("");
+  const [category, setCategory] = useState(CLOTHES_CATEGORIES[0]);
+  const [listingPrice, setListingPrice] = useState("");
+  const [retailPrice, setRetailPrice] = useState("");
+  const [notes, setNotes] = useState("");
+
+  const [showFilter, setShowFilter] = useState(false);
+  const [filterCategory, setFilterCategory] = useState("All");
+  const [filterStatus, setFilterStatus] = useState("All");
+
+  const add = () => {
+    const v = name.trim();
+    if (!v) return;
+    setClothes([
+      {
+        id: uid(),
+        name: v,
+        brand: brand.trim(),
+        category,
+        listingPrice: listingPrice === "" ? null : parseFloat(listingPrice),
+        retailPrice: retailPrice === "" ? null : parseFloat(retailPrice),
+        notes: notes.trim(),
+        sold: false,
+        ts: Date.now(),
+      },
+      ...clothes,
+    ]);
+    setName("");
+    setBrand("");
+    setListingPrice("");
+    setRetailPrice("");
+    setNotes("");
+  };
+
+  const remove = (id) => setClothes(clothes.filter((c) => c.id !== id));
+  const toggleSold = (id) => setClothes(clothes.map((c) => (c.id === id ? { ...c, sold: !c.sold } : c)));
+
+  const filtered = clothes.filter((c) => {
+    const categoryMatch = filterCategory === "All" || c.category === filterCategory;
+    const statusMatch = filterStatus === "All" || (filterStatus === "Sold" ? c.sold : !c.sold);
+    return categoryMatch && statusMatch;
+  });
+
+  const activeFilterCount = (filterCategory !== "All" ? 1 : 0) + (filterStatus !== "All" ? 1 : 0);
+
+  return (
+    <div>
+      <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: 14 }}>
+        <button
+          onClick={() => setShowFilter((s) => !s)}
+          style={{
+            display: "flex",
+            alignItems: "center",
+            gap: 6,
+            border: `1px solid ${PAPER_LINE}`,
+            background: showFilter || activeFilterCount > 0 ? INK : "transparent",
+            color: showFilter || activeFilterCount > 0 ? PAPER : INK_FAINT,
+            padding: "7px 12px",
+            cursor: "pointer",
+            fontFamily: "ui-monospace, monospace",
+            fontSize: 12,
+            letterSpacing: "0.03em",
+            borderRadius: 2,
+          }}
+        >
+          <Filter size={13} />
+          Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ""}
+        </button>
+      </div>
+
+      {showFilter && (
+        <div style={{ border: `1px solid ${PAPER_LINE}`, background: "#FFFEFB", padding: 14, marginBottom: 18 }}>
+          <div style={{ marginBottom: 10 }}>
+            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.08em", color: INK_FAINT, marginBottom: 6 }}>
+              CATEGORY
+            </div>
+            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
+              {["All", ...CLOTHES_CATEGORIES].map((cat) => (
+                <button
+                  key={cat}
+                  onClick={() => setFilterCategory(cat)}
+                  style={{
+                    border: `1px solid ${PAPER_LINE}`,
+                    background: filterCategory === cat ? GREEN : "transparent",
+                    color: filterCategory === cat ? "#fff" : INK_FAINT,
+                    padding: "5px 10px",
+                    cursor: "pointer",
+                    fontFamily: "ui-monospace, monospace",
+                    fontSize: 11,
+                    borderRadius: 2,
+                  }}
+                >
+                  {cat}
+                </button>
+              ))}
+            </div>
+          </div>
+          <div>
+            <div style={{ fontFamily: "ui-monospace, monospace", fontSize: 10.5, letterSpacing: "0.08em", color: INK_FAINT, marginBottom: 6 }}>
+              STATUS
+            </div>
+            <div style={{ display: "flex", gap: 6 }}>
+              {["All", "Active", "Sold"].map((s) => (
+                <button
+                  key={s}
+                  onClick={() => setFilterStatus(s)}
+                  style={{
+                    border: `1px solid ${PAPER_LINE}`,
+                    background: filterStatus === s ? GREEN : "transparent",
+                    color: filterStatus === s ? "#fff" : INK_FAINT,
+                    padding: "5px 10px",
+                    cursor: "pointer",
+                    fontFamily: "ui-monospace, monospace",
+                    fontSize: 11,
+                    borderRadius: 2,
+                  }}
+                >
+                  {s}
+                </button>
+              ))}
+            </div>
+          </div>
+          {activeFilterCount > 0 && (
+            <button
+              onClick={() => {
+                setFilterCategory("All");
+                setFilterStatus("All");
+              }}
+              style={{
+                marginTop: 12,
+                background: "none",
+                border: "none",
+                color: RUST,
+                cursor: "pointer",
+                fontFamily: "ui-monospace, monospace",
+                fontSize: 11,
+                padding: 0,
+              }}
+            >
+              Clear filters
+            </button>
+          )}
+        </div>
+      )}
+
+      <div style={{ marginBottom: 20, border: `1px solid ${PAPER_LINE}`, padding: 14, background: "#FFFEFB" }}>
+        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
+          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Item name…" style={{ ...inputStyle, flex: 2 }} />
+          <input value={brand} onChange={(e) => setBrand(e.target.value)} placeholder="Brand…" style={{ ...inputStyle, flex: 1 }} />
+        </div>
+        <div style={{ display: "flex", gap: 8, marginBottom: 8 }}>
+          <select value={category} onChange={(e) => setCategory(e.target.value)} style={{ ...inputStyle, flex: 1 }}>
+            {CLOTHES_CATEGORIES.map((c) => (
+              <option key={c} value={c}>
+                {c}
+              </option>
+            ))}
+          </select>
+          <input
+            value={listingPrice}
+            onChange={(e) => setListingPrice(e.target.value)}
+            placeholder="Listing $"
+            inputMode="decimal"
+            style={{ ...inputStyle, flex: 1 }}
+          />
+          <input
+            value={retailPrice}
+            onChange={(e) => setRetailPrice(e.target.value)}
+            placeholder="Retail $"
+            inputMode="decimal"
+            style={{ ...inputStyle, flex: 1 }}
+          />
+        </div>
+        <textarea
+          value={notes}
+          onChange={(e) => setNotes(e.target.value)}
+          placeholder="Notes…"
+          rows={2}
+          style={{ ...inputStyle, width: "100%", resize: "vertical", fontFamily: "Georgia, serif", marginBottom: 8 }}
+        />
+        <div style={{ display: "flex", justifyContent: "flex-end" }}>
+          <button onClick={add} style={{ ...addBtnStyle, width: "auto", padding: "8px 16px" }}>
+            Add item
+          </button>
+        </div>
+      </div>
+
+      {filtered.length === 0 && (
+        <EmptyRow>
+          {clothes.length === 0 ? "No clothes logged yet. Add your first item above." : "Nothing matches the current filter."}
+        </EmptyRow>
+      )}
+
+      {filtered.map((c) => (
+        <ClothesRow key={c.id} item={c} onDelete={() => remove(c.id)} onToggleSold={() => toggleSold(c.id)} />
+      ))}
+    </div>
+  );
+}
+
+function ClothesRow({ item, onDelete, onToggleSold }) {
+  const [hover, setHover] = useState(false);
+  return (
+    <div
+      onMouseEnter={() => setHover(true)}
+      onMouseLeave={() => setHover(false)}
+      style={{ padding: "13px 4px", borderBottom: `1px solid ${PAPER_LINE}`, opacity: item.sold ? 0.55 : 1 }}
+    >
+      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: 10 }}>
+        <div style={{ flex: 1 }}>
+          <div style={{ display: "flex", alignItems: "center", gap: 8, flexWrap: "wrap" }}>
+            <span style={{ fontFamily: "Georgia, serif", fontSize: 15, color: INK, textDecoration: item.sold ? "line-through" : "none" }}>
+              {item.name}
+            </span>
+            {item.brand && <span style={{ fontFamily: "ui-monospace, monospace", fontSize: 11, color: INK_FAINT }}>— {item.brand}</span>}
+            <span
+              style={{
+                fontFamily: "ui-monospace, monospace",
+                fontSize: 10,
+                letterSpacing: "0.05em",
+                color: GREEN_DIM,
+                border: `1px solid ${PAPER_LINE}`,
+                padding: "1px 6px",
+                borderRadius: 2,
+              }}
+            >
+              {item.category.toUpperCase()}
+            </span>
+            {item.sold && (
+              <span
+                style={{
+                  fontFamily: "ui-monospace, monospace",
+                  fontSize: 10,
+                  letterSpacing: "0.05em",
+                  color: RUST,
+                  border: `1px solid ${RUST}`,
+                  padding: "1px 6px",
+                  borderRadius: 2,
+                }}
+              >
+                SOLD
+              </span>
+            )}
+          </div>
+
+          <div style={{ display: "flex", gap: 14, marginTop: 6, fontFamily: "ui-monospace, monospace", fontSize: 12.5, color: INK_FAINT }}>
+            {item.listingPrice != null && !isNaN(item.listingPrice) && <span>Listing: ${item.listingPrice.toFixed(2)}</span>}
+            {item.retailPrice != null && !isNaN(item.retailPrice) && <span>Retail: ${item.retailPrice.toFixed(2)}</span>}
+          </div>
+
+          {item.notes && (
+            <div style={{ fontFamily: "Georgia, serif", fontSize: 13, color: INK_FAINT, fontStyle: "italic", marginTop: 6, whiteSpace: "pre-wrap" }}>
+              {item.notes}
+            </div>
+          )}
+        </div>
+
+        <div style={{ display: "flex", alignItems: "center", gap: 6, flexShrink: 0 }}>
+          <button
+            onClick={onToggleSold}
+            style={{
+              display: "flex",
+              alignItems: "center",
+              gap: 4,
+              border: `1px solid ${item.sold ? GREEN : PAPER_LINE}`,
+              background: item.sold ? GREEN : "transparent",
+              color: item.sold ? "#fff" : INK_FAINT,
+              padding: "5px 10px",
+              cursor: "pointer",
+              fontFamily: "ui-monospace, monospace",
+              fontSize: 11,
+              borderRadius: 2,
+            }}
+          >
+            {item.sold ? <CheckSquare size={12} /> : <Square size={12} />}
+            {item.sold ? "Sold" : "Mark sold"}
+          </button>
+          <button
+            onClick={onDelete}
+            aria-label="Delete"
+            style={{ background: "none", border: "none", cursor: "pointer", opacity: hover ? 1 : 0.25, transition: "opacity 0.15s", padding: 4 }}
+          >
+            <Trash2 size={14} color={INK_FAINT} />
+          </button>
+        </div>
+      </div>
+    </div>
+  );
+}
+
 function Row({ children, onDelete, align = "center" }) {
   const [hover, setHover] = useState(false);
   return (
@@ -385,6 +680,7 @@ const TABS = [
   { key: "tasks", label: "Tasks", icon: ListChecks },
   { key: "notes", label: "Notes", icon: StickyNote },
   { key: "budget", label: "Budget", icon: Wallet },
+  { key: "clothes", label: "Clothes", icon: Shirt },
 ];
 
 export default function App() {
@@ -394,6 +690,7 @@ export default function App() {
   const setTasks = (tasks) => persist({ ...data, tasks });
   const setNotes = (notes) => persist({ ...data, notes });
   const setBudget = (budget) => persist({ ...data, budget });
+  const setClothes = (clothes) => persist({ ...data, clothes });
 
   return (
     <div
@@ -455,6 +752,7 @@ export default function App() {
             {tab === "tasks" && <TasksTab tasks={data.tasks} setTasks={setTasks} />}
             {tab === "notes" && <NotesTab notes={data.notes} setNotes={setNotes} />}
             {tab === "budget" && <BudgetTab budget={data.budget} setBudget={setBudget} />}
+            {tab === "clothes" && <ClothesTab clothes={data.clothes} setClothes={setClothes} />}
           </>
         )}
 
