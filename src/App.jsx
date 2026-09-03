import React, { useState, useRef, useEffect } from "react";
import {
  PawPrint,
  Heart,
  Camera,
  Video,
  RotateCcw,
  Pencil,
  Check,
  X,
  Upload,
  Trash2,
  Home,
  Database,
  RefreshCw,
} from "lucide-react";
import {
  initDatabase,
  getAllPetsFromDB,
  addPetToDB,
  updatePetInDB,
  deletePetFromDB,
  resetDatabase,
} from "./sqliteService";

/* ------------------------------------------------------------------
   DESIGN TOKENS
   "Kennel tag / vet record" aesthetic: warm kraft-paper background,
   deep ink-navy type, a mustard accent, and a hand-stamped badge
   for status (green = available, red = adopted) — echoing the real
   ink stamps used on physical shelter intake cards.
------------------------------------------------------------------- */
const colors = {
  kraft: "#EEE3CC",
  kraftDark: "#E1D3AF",
  ink: "#1C2A44",
  inkSoft: "#4A5A78",
  mustard: "#E3A72F",
  mustardDark: "#B9821B",
  card: "#FFFCF4",
  stampGreen: "#2F6E4F",
  stampGreenBg: "#DEEEE4",
  stampRed: "#B23A24",
  stampRedBg: "#F4E2DA",
  line: "#D8C9A3",
};

const CATEGORIES = ["Dog", "Cat", "Bird", "Rabbit", "Other"];

const SEED_PETS = [
  {
    id: "PET-001",
    name: "Biscuit",
    category: "Dog",
    status: "available",
    description:
      "A gentle 2-year-old retriever mix who loves belly rubs and long walks. Great with kids and other dogs.",
    photo: "https://images.dog.ceo/breeds/labrador/n02099712_5787.jpg",
    video: null,
  },
  {
    id: "PET-002",
    name: "Nimbus",
    category: "Cat",
    status: "adopted",
    description:
      "A calm tabby who enjoys sunny windowsills and quiet evenings. Already found her forever home!",
    photo: "https://cataas.com/cat?width=600&height=450",
    video: null,
  },
  {
    id: "PET-003",
    name: "Scout",
    category: "Dog",
    status: "available",
    description:
      "An energetic beagle puppy, curious about absolutely everything. Needs an active family with a fenced yard.",
    photo: "https://images.dog.ceo/breeds/hound-blood/n02088466_7091.jpg",
    video: null,
  },
];

const emptyForm = {
  petName: "",
  petId: "",
  category: CATEGORIES[0],
  status: "available",
  description: "",
};

/* ------------------------------------------------------------------
   REUSABLE INFORMATION CARD
   Every pet — whether freshly submitted or already in the gallery —
   is rendered through this single component.
------------------------------------------------------------------- */
function PetCard({ pet, onEdit, onDelete, highlight }) {
  const isAvailable = pet.status === "available";

  return (
    <div
      className="relative rounded-2xl overflow-hidden flex flex-col"
      style={{
        backgroundColor: colors.card,
        border: `2px solid ${colors.line}`,
        boxShadow: highlight
          ? `0 12px 28px -8px rgba(28,42,68,0.35)`
          : `0 4px 14px -6px rgba(28,42,68,0.18)`,
      }}
    >
      {/* hole-punch, like a real hanging kennel tag */}
      <div
        className="absolute left-1/2 top-2 w-4 h-4 rounded-full z-10"
        style={{
          transform: "translateX(-50%)",
          backgroundColor: colors.kraft,
          boxShadow: "inset 0 2px 4px rgba(0,0,0,0.35)",
        }}
      />

      {/* photo */}
      <div className="relative w-full h-44 bg-slate-200 overflow-hidden">
        {pet.photo ? (
          <img
            src={pet.photo}
            alt={pet.name}
            className="w-full h-full object-cover"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ backgroundColor: colors.kraftDark }}
          >
            <PawPrint size={40} color={colors.inkSoft} />
          </div>
        )}

        {/* status stamp */}
        <div
          className="absolute top-3 right-3 px-3 py-1 rounded-full font-tag text-xs font-bold uppercase tracking-wide"
          style={{
            transform: "rotate(-8deg)",
            color: isAvailable ? colors.stampGreen : colors.stampRed,
            backgroundColor: isAvailable
              ? colors.stampGreenBg
              : colors.stampRedBg,
            border: `2px solid ${isAvailable ? colors.stampGreen : colors.stampRed}`,
          }}
        >
          {isAvailable ? "Available" : "Adopted"}
        </div>
      </div>

      {/* body */}
      <div className="p-5 pt-4 flex flex-col gap-2 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <h3
            className="font-display text-xl font-semibold leading-tight"
            style={{ color: colors.ink }}
          >
            {pet.name}
          </h3>
          <span
            className="font-tag text-xs"
            style={{ color: colors.inkSoft }}
          >
            {pet.id}
          </span>
        </div>

        <span
          className="self-start text-xs font-semibold px-2 py-0.5 rounded-md font-body"
          style={{ backgroundColor: colors.kraft, color: colors.inkSoft }}
        >
          {pet.category}
        </span>

        <p
          className="font-body text-sm leading-relaxed mt-1"
          style={{ color: colors.inkSoft }}
        >
          {pet.description}
        </p>

        {pet.video && (
          <video
            src={pet.video}
            controls
            className="w-full rounded-lg mt-2 border"
            style={{ borderColor: colors.line }}
          />
        )}

        {(onEdit || onDelete) && (
          <div
            className="flex gap-2 mt-3 pt-3"
            style={{ borderTop: `1px dashed ${colors.line}` }}
          >
            {onEdit && (
              <button
                onClick={() => onEdit(pet)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 hover:-translate-y-0.5"
                style={{ backgroundColor: colors.ink, color: colors.card }}
              >
                <Pencil size={13} /> Edit
              </button>
            )}
            {onDelete && (
              <button
                onClick={() => onDelete(pet.id)}
                className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 hover:-translate-y-0.5"
                style={{
                  backgroundColor: colors.stampRedBg,
                  color: colors.stampRed,
                }}
              >
                <Trash2 size={13} /> Remove
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default function PetAdoptionCenter() {
  /* ---------------- STATE ---------------- */
  const [activeTab, setActiveTab] = useState("browse"); // 'browse' | 'list'
  const [pets, setPets] = useState([]);
  const [isDbLoaded, setIsDbLoaded] = useState(false);
  const [filterCategory, setFilterCategory] = useState("All");

  const [petName, setPetName] = useState(emptyForm.petName);
  const [petId, setPetId] = useState(emptyForm.petId);
  const [category, setCategory] = useState(emptyForm.category);
  const [status, setStatus] = useState(emptyForm.status);
  const [description, setDescription] = useState(emptyForm.description);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [videoPreview, setVideoPreview] = useState(null);

  const [editingId, setEditingId] = useState(null);
  const [submittedPet, setSubmittedPet] = useState(null);
  const [error, setError] = useState("");

  const photoInputRef = useRef(null);
  const videoInputRef = useRef(null);

  /* ---------------- INITIALIZE SQLITE DB ---------------- */
  useEffect(() => {
    async function loadSQLiteDB() {
      try {
        await initDatabase(SEED_PETS);
        const data = getAllPetsFromDB();
        setPets(data);
        setIsDbLoaded(true);
      } catch (err) {
        console.error("Failed to load SQLite database:", err);
      }
    }
    loadSQLiteDB();
  }, []);

  /* ---------------- DERIVED ---------------- */
  const availableCount = pets.filter((p) => p.status === "available").length;
  const adoptedCount = pets.filter((p) => p.status === "adopted").length;
  const visiblePets =
    filterCategory === "All"
      ? pets
      : pets.filter((p) => p.category === filterCategory);

  /* ---------------- HANDLERS ---------------- */
  function handlePhotoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setPhotoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  }

  function handleVideoChange(e) {
    const file = e.target.files && e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setVideoPreview(reader.result);
      reader.readAsDataURL(file);
    }
  }

  function resetForm(alsoHideCard) {
    setPetName(emptyForm.petName);
    setPetId(emptyForm.petId);
    setCategory(emptyForm.category);
    setStatus(emptyForm.status);
    setDescription(emptyForm.description);
    setPhotoPreview(null);
    setVideoPreview(null);
    setEditingId(null);
    setError("");
    if (photoInputRef.current) photoInputRef.current.value = "";
    if (videoInputRef.current) videoInputRef.current.value = "";
    if (alsoHideCard) setSubmittedPet(null);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!petName.trim() || !petId.trim() || !description.trim()) {
      setError("Please fill in Name, ID/Code, and Description before submitting.");
      return;
    }
    setError("");

    const newPet = {
      id: petId.trim(),
      name: petName.trim(),
      category,
      status,
      description: description.trim(),
      photo: photoPreview,
      video: videoPreview,
    };

    if (editingId) {
      await updatePetInDB(newPet);
    } else {
      await addPetToDB(newPet);
    }

    const updatedPets = getAllPetsFromDB();
    setPets(updatedPets);
    setSubmittedPet(newPet);
  }

  function handleEdit(pet) {
    setActiveTab("list");
    setEditingId(pet.id);
    setPetName(pet.name);
    setPetId(pet.id);
    setCategory(pet.category);
    setStatus(pet.status);
    setDescription(pet.description);
    setPhotoPreview(pet.photo);
    setVideoPreview(pet.video);
    setSubmittedPet(null);
    setError("");
  }

  async function handleDelete(id) {
    await deletePetFromDB(id);
    const updatedPets = getAllPetsFromDB();
    setPets(updatedPets);
    if (submittedPet && submittedPet.id === id) setSubmittedPet(null);
  }

  async function handleResetDB() {
    if (window.confirm("Are you sure you want to reset the SQLite database to default seed pets?")) {
      await resetDatabase(SEED_PETS);
      const updatedPets = getAllPetsFromDB();
      setPets(updatedPets);
      resetForm(true);
    }
  }

  /* ---------------- RENDER ---------------- */
  return (
    <div
      className="min-h-screen w-full font-body"
      style={{ backgroundColor: colors.kraft, color: colors.ink }}
    >
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fredoka:wght@500;600;700&family=Inter:wght@400;500;600&family=Space+Mono:wght@400;700&display=swap');
        .font-display{ font-family:'Fredoka', sans-serif; }
        .font-body{ font-family:'Inter', sans-serif; }
        .font-tag{ font-family:'Space Mono', monospace; }
      `}</style>

      {/* ---------------- HEADER ---------------- */}
      <header
        className="px-6 md:px-12 py-5 flex flex-wrap items-center justify-between gap-4"
        style={{ borderBottom: `2px solid ${colors.line}` }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center"
            style={{ backgroundColor: colors.ink }}
          >
            <PawPrint size={22} color={colors.mustard} />
          </div>
          <div>
            <div className="font-display text-xl font-semibold leading-none">
              Second Chance
            </div>
            <div
              className="font-tag text-[11px] tracking-widest uppercase"
              style={{ color: colors.inkSoft }}
            >
              Adoption Center
            </div>
          </div>
        </div>

        {/* SQLite Database Connection Badge & Controls */}
        <div className="flex items-center gap-3">
          <div
            className="flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-tag font-semibold"
            style={{
              backgroundColor: isDbLoaded ? "#DEEEE4" : "#FEF3C7",
              color: isDbLoaded ? "#2F6E4F" : "#92400E",
              border: `1.5px solid ${isDbLoaded ? "#2F6E4F" : "#FDE68A"}`,
            }}
          >
            <Database size={14} className={isDbLoaded ? "text-emerald-700" : "animate-spin"} />
            <span>{isDbLoaded ? "SQLite (Wasm) Active" : "Connecting SQLite..."}</span>
          </div>

          <button
            onClick={handleResetDB}
            title="Reset SQLite Database to Defaults"
            className="flex items-center gap-1 text-xs font-semibold px-3 py-1.5 rounded-lg transition-all duration-150 hover:-translate-y-0.5 shadow-sm"
            style={{ backgroundColor: colors.kraftDark, color: colors.ink }}
          >
            <RefreshCw size={13} /> Reset DB
          </button>
        </div>

        {/* Navigation Tabs */}
        <nav className="flex gap-2">
          <button
            onClick={() => {
              setActiveTab("browse");
              resetForm(true);
            }}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-150"
            style={{
              backgroundColor:
                activeTab === "browse" ? colors.ink : "transparent",
              color: activeTab === "browse" ? colors.card : colors.inkSoft,
              border:
                activeTab === "browse" ? "none" : `1px solid ${colors.line}`,
            }}
          >
            <Home size={16} /> Browse
          </button>

          <button
            onClick={() => setActiveTab("list")}
            className="flex items-center gap-2 px-4 py-2 rounded-full font-semibold text-sm transition-all duration-150"
            style={{
              backgroundColor:
                activeTab === "list" ? colors.ink : "transparent",
              color: activeTab === "list" ? colors.card : colors.inkSoft,
              border:
                activeTab === "list" ? "none" : `1px solid ${colors.line}`,
            }}
          >
            <Pencil size={16} /> {editingId ? "Edit Pet" : "List a Pet"}
          </button>
        </nav>
      </header>

      {/* ---------------- HERO SECTION RESTORED ---------------- */}
      <section className="px-6 md:px-12 pt-14 pb-10 relative overflow-hidden">
        <div className="relative z-10 max-w-2xl">
          <div
            className="font-tag text-xs uppercase tracking-[0.2em] mb-3"
            style={{ color: colors.mustardDark }}
          >
            Every tag tells a story
          </div>
          <h1 className="font-display text-4xl md:text-5xl font-semibold leading-tight">
            Find a paw to hold, <br /> or help one find a home.
          </h1>
          <p
            className="font-body text-base mt-4 max-w-md"
            style={{ color: colors.inkSoft }}
          >
            Browse pets waiting for a family, or fill out a kennel card to
            list a pet you're rehoming. Add a photo and a short video so
            adopters get to know them before they even meet.
          </p>
          <div className="flex gap-3 mt-6">
            <button
              onClick={() => {
                setActiveTab("browse");
                resetForm(true);
              }}
              className="px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-150 hover:-translate-y-0.5"
              style={{ backgroundColor: colors.mustard, color: colors.ink }}
            >
              Browse pets
            </button>
            <button
              onClick={() => setActiveTab("list")}
              className="px-5 py-2.5 rounded-full font-semibold text-sm border-2 transition-all duration-150 hover:-translate-y-0.5"
              style={{ borderColor: colors.ink, color: colors.ink }}
            >
              List a pet
            </button>
          </div>

          {/* stats — real counts from SQLite database */}
          <div className="flex gap-8 mt-9">
            <div>
              <div className="font-display text-2xl font-semibold">
                {pets.length}
              </div>
              <div className="font-tag text-[11px] uppercase tracking-wide" style={{ color: colors.inkSoft }}>
                Total listed
              </div>
            </div>
            <div>
              <div
                className="font-display text-2xl font-semibold"
                style={{ color: colors.stampGreen }}
              >
                {availableCount}
              </div>
              <div className="font-tag text-[11px] uppercase tracking-wide" style={{ color: colors.inkSoft }}>
                Available
              </div>
            </div>
            <div>
              <div
                className="font-display text-2xl font-semibold"
                style={{ color: colors.stampRed }}
              >
                {adoptedCount}
              </div>
              <div className="font-tag text-[11px] uppercase tracking-wide" style={{ color: colors.inkSoft }}>
                Adopted
              </div>
            </div>
          </div>
        </div>

        {/* decorative paw trail */}
        <div className="hidden md:flex absolute right-10 top-16 flex-col gap-3 opacity-70">
          {[0, 1, 2, 3, 4].map((i) => (
            <PawPrint
              key={i}
              size={26 - i * 2}
              color={colors.mustardDark}
              style={{
                transform: `rotate(${i * 14 - 20}deg) translateX(${i * 14}px)`,
                opacity: 1 - i * 0.15,
              }}
            />
          ))}
        </div>
      </section>

      {/* ---------------- MAIN CONTENT ---------------- */}
      <main className="px-6 md:px-12 py-8 max-w-7xl mx-auto">
        {/* TAB 1: BROWSE GALLERY */}
        {activeTab === "browse" && (
          <section>
            {/* Stats & Title strip */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
              <div>
                <h2 className="font-display text-3xl font-bold tracking-tight">
                  Meet our residents
                </h2>
                <p className="font-body text-sm mt-1" style={{ color: colors.inkSoft }}>
                  Every card is stored in SQLite (Wasm) in your browser.
                </p>
              </div>

              <div className="flex items-center gap-3">
                <div
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    backgroundColor: colors.stampGreenBg,
                    color: colors.stampGreen,
                    border: `1px solid ${colors.stampGreen}`,
                  }}
                >
                  {availableCount} Available
                </div>
                <div
                  className="px-4 py-2 rounded-xl text-xs font-semibold"
                  style={{
                    backgroundColor: colors.stampRedBg,
                    color: colors.stampRed,
                    border: `1px solid ${colors.stampRed}`,
                  }}
                >
                  {adoptedCount} Adopted
                </div>
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-2 mb-6 overflow-x-auto pb-2">
              <span className="text-xs font-semibold uppercase tracking-wider font-tag mr-2" style={{ color: colors.inkSoft }}>
                Filter:
              </span>
              {["All", ...CATEGORIES].map((cat) => (
                <button
                  key={cat}
                  onClick={() => setFilterCategory(cat)}
                  className="px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-150 whitespace-nowrap"
                  style={{
                    backgroundColor:
                      filterCategory === cat ? colors.mustard : colors.card,
                    color:
                      filterCategory === cat ? colors.ink : colors.inkSoft,
                    border: `1px solid ${colors.line}`,
                  }}
                >
                  {cat}
                </button>
              ))}
            </div>

            {/* Pets Grid */}
            {visiblePets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {visiblePets.map((pet) => (
                  <PetCard
                    key={pet.id}
                    pet={pet}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            ) : (
              <div
                className="py-16 text-center rounded-2xl"
                style={{ border: `2px dashed ${colors.line}`, backgroundColor: colors.card }}
              >
                <PawPrint size={40} className="mx-auto mb-3" style={{ color: colors.inkSoft }} />
                <h3 className="font-display text-lg font-semibold">No pets found</h3>
                <p className="font-body text-sm mt-1" style={{ color: colors.inkSoft }}>
                  No pets in the "{filterCategory}" category right now.
                </p>
              </div>
            )}
          </section>
        )}

        {/* TAB 2: LIST / EDIT PET FORM */}
        {activeTab === "list" && (
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
            {/* FORM */}
            <div
              className="p-6 md:p-8 rounded-2xl"
              style={{ backgroundColor: colors.card, border: `2px solid ${colors.line}` }}
            >
              <h2 className="font-display text-2xl font-semibold mb-1">
                {editingId ? "Edit Pet Record" : "List a new pet"}
              </h2>
              <p className="font-body text-sm mb-6" style={{ color: colors.inkSoft }}>
                Changes are executed via SQL statements directly in SQLite.
              </p>

              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                {/* Pet Name */}
                <div>
                  <label className="block text-xs font-semibold uppercase font-tag mb-1" style={{ color: colors.inkSoft }}>
                    Pet Name *
                  </label>
                  <input
                    type="text"
                    value={petName}
                    onChange={(e) => setPetName(e.target.value)}
                    placeholder="e.g. Barnaby"
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm font-body outline-none"
                    style={{ border: `1.5px solid ${colors.line}`, backgroundColor: colors.card }}
                  />
                </div>

                {/* Pet ID */}
                <div>
                  <label className="block text-xs font-semibold uppercase font-tag mb-1" style={{ color: colors.inkSoft }}>
                    ID / Tag Code *
                  </label>
                  <input
                    type="text"
                    value={petId}
                    disabled={!!editingId}
                    onChange={(e) => setPetId(e.target.value)}
                    placeholder="e.g. PET-004"
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm font-body outline-none font-tag disabled:opacity-60"
                    style={{ border: `1.5px solid ${colors.line}`, backgroundColor: colors.card }}
                  />
                </div>

                {/* Category & Status Grid */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase font-tag mb-1" style={{ color: colors.inkSoft }}>
                      Species
                    </label>
                    <select
                      value={category}
                      onChange={(e) => setCategory(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm font-body outline-none"
                      style={{ border: `1.5px solid ${colors.line}`, backgroundColor: colors.card }}
                    >
                      {CATEGORIES.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase font-tag mb-1" style={{ color: colors.inkSoft }}>
                      Status
                    </label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value)}
                      className="w-full px-3.5 py-2.5 rounded-lg text-sm font-body outline-none"
                      style={{ border: `1.5px solid ${colors.line}`, backgroundColor: colors.card }}
                    >
                      <option value="available">Available</option>
                      <option value="adopted">Adopted</option>
                    </select>
                  </div>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-xs font-semibold uppercase font-tag mb-1" style={{ color: colors.inkSoft }}>
                    Description *
                  </label>
                  <textarea
                    rows={3}
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="Tell prospective adopters about this pet's personality..."
                    className="w-full px-3.5 py-2.5 rounded-lg text-sm font-body outline-none resize-none"
                    style={{ border: `1.5px solid ${colors.line}`, backgroundColor: colors.card }}
                  />
                </div>

                {/* Media Uploads */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <span className="block text-xs font-semibold uppercase font-tag mb-1" style={{ color: colors.inkSoft }}>
                      Photo
                    </span>
                    <label
                      className="flex items-center justify-center gap-2 h-24 rounded-lg cursor-pointer text-xs font-semibold overflow-hidden relative"
                      style={{ border: `1.5px dashed ${colors.line}`, backgroundColor: "#fff", color: colors.inkSoft }}
                    >
                      {photoPreview ? (
                        <img src={photoPreview} alt="Preview" className="w-full h-full object-cover" />
                      ) : (
                        <span className="flex flex-col items-center gap-1">
                          <Camera size={18} /> Upload photo
                        </span>
                      )}
                      <input ref={photoInputRef} type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                    </label>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold uppercase font-tag mb-1" style={{ color: colors.inkSoft }}>
                      Video
                    </span>
                    <label
                      className="flex items-center justify-center gap-2 h-24 rounded-lg cursor-pointer text-xs font-semibold overflow-hidden relative"
                      style={{ border: `1.5px dashed ${colors.line}`, backgroundColor: "#fff", color: colors.inkSoft }}
                    >
                      {videoPreview ? (
                        <video src={videoPreview} className="w-full h-full object-cover" muted />
                      ) : (
                        <span className="flex flex-col items-center gap-1">
                          <Video size={18} /> Upload video
                        </span>
                      )}
                      <input ref={videoInputRef} type="file" accept="video/*" onChange={handleVideoChange} className="hidden" />
                    </label>
                  </div>
                </div>

                {error && (
                  <div
                    className="text-xs font-semibold px-3 py-2 rounded-lg"
                    style={{ backgroundColor: colors.stampRedBg, color: colors.stampRed }}
                  >
                    {error}
                  </div>
                )}

                <div className="flex gap-3 pt-1">
                  <button
                    type="submit"
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm transition-all duration-150 hover:-translate-y-0.5"
                    style={{ backgroundColor: colors.ink, color: colors.card }}
                  >
                    <Check size={16} />
                    {editingId ? "Save changes" : "Submit"}
                  </button>
                  <button
                    type="button"
                    onClick={() => resetForm(true)}
                    className="flex items-center gap-2 px-5 py-2.5 rounded-full font-semibold text-sm border-2 transition-all duration-150 hover:-translate-y-0.5"
                    style={{ borderColor: colors.line, color: colors.inkSoft }}
                  >
                    <RotateCcw size={16} /> Reset
                  </button>
                </div>
              </form>
            </div>

            {/* -------- CARD PREVIEW (hidden until Submit) -------- */}
            <div className="flex flex-col">
              <h2 className="font-display text-2xl font-semibold mb-1">
                Card preview
              </h2>
              <p className="font-body text-sm mb-6" style={{ color: colors.inkSoft }}>
                {submittedPet
                  ? "Here's the kennel card stored in SQLite."
                  : "Submit the form to generate and persist this pet's card in SQLite."}
              </p>

              {submittedPet ? (
                <div className="max-w-sm">
                  <PetCard pet={submittedPet} highlight />
                </div>
              ) : (
                <div
                  className="max-w-sm h-72 rounded-2xl flex flex-col items-center justify-center gap-2"
                  style={{ border: `2px dashed ${colors.line}`, color: colors.inkSoft }}
                >
                  <PawPrint size={30} />
                  <span className="font-body text-sm">No card yet</span>
                </div>
              )}
            </div>
          </section>
        )}
      </main>

      {/* ---------------- FOOTER ---------------- */}
      <footer
        className="px-6 md:px-12 py-6 flex flex-wrap items-center justify-between gap-4 font-tag text-xs"
        style={{ borderTop: `2px solid ${colors.line}`, color: colors.inkSoft }}
      >
        <div className="flex items-center gap-2">
          <Heart size={13} color={colors.mustardDark} />
          Second Chance Adoption Center — Powered by SQLite (Wasm) & React
        </div>
        <div className="flex items-center gap-1.5 opacity-80">
          <Database size={13} /> SQLite Table: <code className="bg-amber-100/60 px-1.5 py-0.5 rounded">pets</code>
        </div>
      </footer>
    </div>
  );
}
