"use client";

import { useEffect, useMemo, useState } from "react";
import { LEDGER_ISSUED_NUMBERS } from "./generated-ledger";

type Domain = "mixed" | "food" | "domestic" | "bureaucracy" | "transit" | "conversation";
type Strangeness = "restrained" | "peculiar" | "impossible";
type Register = "terrestrial" | "UIS";
type Reliability = "hard_canon" | "soft_canon" | "rumour" | "uncle_testimony";
type FieldKey = "number" | "title" | "rhythm" | "phrase" | "meaning" | "behaviour";

type Locks = Record<FieldKey, boolean>;

type Archetype = {
  id: string;
  domain: Exclude<Domain, "mixed">;
  titles: string[];
  phrase: string;
  gloss: string;
  mutations: [string, string, string];
  meanings: [string, string, string];
  behaviours: [string, string, string];
};

type Candidate = {
  templateId: string;
  number: number;
  title: string;
  baseRhythm: string;
  mutation: string;
  phrase: string;
  gloss: string;
  meaning: string;
  behaviour: string;
  generationSeed: string;
  status: "generated-draft" | "approved-candidate";
};

type ApprovalRecord = {
  number: number;
  title: string;
  approvedAt: string;
};

const LEDGER_ISSUED = [...LEDGER_ISSUED_NUMBERS] as number[];
const FIELD_KEYS: FieldKey[] = ["number", "title", "rhythm", "phrase", "meaning", "behaviour"];
const FIELD_LABELS: Record<FieldKey, string> = {
  number: "Number",
  title: "Title",
  rhythm: "Rhythm",
  phrase: "Phrase",
  meaning: "Meaning",
  behaviour: "Behaviour",
};

const DIGIT_READINGS: Record<string, string> = {
  "0": "ling",
  "1": "yat",
  "2": "yi",
  "3": "saam",
  "4": "sei",
  "5": "ng",
  "6": "luk",
  "7": "cat",
  "8": "baat",
  "9": "gau",
};

const archetypes: Archetype[] = [
  {
    id: "exact-change",
    domain: "bureaucracy",
    titles: ["Exact Change Uncle", "Coin Recounting Uncle"],
    phrase: "找續未明，交易照行",
    gloss: "change remains unverified; transaction proceeds",
    mutations: ["coin-coin-wait-correct", "count-again-same-different", "error-small-authority-large"],
    meanings: [
      "The amount becomes exact once both parties stop recounting it.",
      "A transaction is accurate when the final recount is delivered with sufficient confidence.",
      "Currency accepts the most recently declared total as a temporary law of arithmetic.",
    ],
    behaviours: [
      "Produces coins one at a time from several unrelated pockets. The cashier recounts them once, Uncle recounts them twice, and the receipt records the amount they are both least interested in disputing.",
      "Arranges coins into increasingly authoritative rows. Each row contains a different total, but the last arrangement is accompanied by a decisive nod. The queue accepts this as an audit outcome.",
      "Recounts the same handful of coins until their combined value changes out of administrative fatigue. The till updates itself to match. No discrepancy is recorded because the discrepancy has already left the premises.",
    ],
  },
  {
    id: "empty-chair",
    domain: "food",
    titles: ["Empty Chair Reservation Uncle", "Tissue Packet Seat Uncle"],
    phrase: "位空人未走",
    gloss: "the seat is empty; the person has not left",
    mutations: ["sit-not-sit-reserved", "tissue-down-table-obeys", "absence-present-chair-confirmed"],
    meanings: [
      "Physical absence does not terminate seating authority.",
      "A folded tissue constitutes continuous occupation in the absence of a body.",
      "Once claimed, a chair remembers its occupant more accurately than the surrounding witnesses do.",
    ],
    behaviours: [
      "Places a folded tissue on an unoccupied chair and leaves to order food. Other diners keep the seat clear without being able to identify him. His tea remains warm.",
      "Reserves one chair using a tissue packet and accidentally establishes control over the neighbouring table. Diners reorganize themselves around the expanding claim. Uncle returns carrying only chopsticks.",
      "Leaves a tissue on a chair before the restaurant opens. By lunchtime the entire row is treated as ancestral seating. Management cannot locate the original reservation but continues defending it.",
    ],
  },
  {
    id: "plastic-bag",
    domain: "domestic",
    titles: ["Plastic Bag Inventory Uncle", "Bag Inside Bag Uncle"],
    phrase: "袋中自有袋",
    gloss: "within every bag, a further bag has already been filed",
    mutations: ["bag-in-bag-still-one-bag", "keep-for-later-later-never", "last-bag-opens-first-bag"],
    meanings: [
      "Storage capacity increases when no container is acknowledged as final.",
      "A bag kept for an unnamed future purpose is already performing that purpose.",
      "The total number of bags remains constant because bags stored inside other bags cease to count individually.",
    ],
    behaviours: [
      "Carries one plastic bag containing several smaller bags, each reserved for a purpose he cannot name. The correct bag appears only after every incorrect bag has been inspected.",
      "Folds bags into one another according to a private hierarchy of future usefulness. When asked how many remain, he counts only the outermost bag. Inventory therefore stays at one.",
      "Removes bags from a bag for eleven minutes without reducing its contents. Eventually produces the original outer bag from somewhere near the middle. According to Uncle, nothing has moved.",
    ],
  },
  {
    id: "lift-door",
    domain: "transit",
    titles: ["Lift Door Authorization Uncle", "Hold-The-Lift Uncle"],
    phrase: "門未關，人先到",
    gloss: "before the door closes, the person has institutionally arrived",
    mutations: ["wait-wait-coming-now", "door-close-hand-says-no", "floor-delayed-person-approved"],
    meanings: [
      "Announced arrival takes precedence over measurable distance.",
      "A lift must remain available to anyone who has begun approaching it in good faith.",
      "Once Uncle says someone is coming, the building temporarily shortens the corridor on that person’s behalf.",
    ],
    behaviours: [
      "Holds the lift for a person who is still turning the corridor corner. Everyone waits. The approaching passenger thanks him before reaching the doors, validating the delay retroactively.",
      "Blocks the closing doors while announcing that somebody is coming. No footsteps are audible. After sufficient waiting, a stranger enters from another floor and is accepted as the intended passenger.",
      "Keeps the lift open for an absent passenger until the floor indicator begins reconsidering its own location. When the doors finally close, the lift arrives at the requested floor without travelling.",
    ],
  },
  {
    id: "remote-control",
    domain: "domestic",
    titles: ["Remote Control Authority Uncle", "Channel Jurisdiction Uncle"],
    phrase: "手握遙控，節目自明",
    gloss: "when the remote is held, the correct programme becomes self-evident",
    mutations: ["click-once-volume-twice", "news-news-other-news", "remote-held-room-settled"],
    meanings: [
      "Possession of the remote establishes temporary editorial authority.",
      "The correct channel is whichever one Uncle reaches after rejecting all available alternatives.",
      "Television schedules reorganize themselves around the hand currently holding the remote.",
    ],
    behaviours: [
      "Changes channels during every advertisement and returns after the programme has resumed. Nobody sees a complete scene, but Uncle maintains that nothing important was missed.",
      "Holds the remote without pressing anything for several minutes. Family members postpone all viewing preferences until his thumb moves. It does not move.",
      "Selects three channels in rapid succession and causes each to broadcast the same current-affairs panel. He declares the result independent confirmation and lowers the volume.",
    ],
  },
  {
    id: "queue-position",
    domain: "bureaucracy",
    titles: ["Queue Position Preservation Uncle", "I Was Here First Uncle"],
    phrase: "人可暫離，次序不動",
    gloss: "the person may leave temporarily; the order must not move",
    mutations: ["here-first-back-soon", "queue-move-position-stays", "absence-number-remains-ahead"],
    meanings: [
      "A declared place in line survives short-term physical departure.",
      "Queue position belongs to memory rather than location.",
      "Once witnesses acknowledge Uncle’s former position, the queue must bend around his future return.",
    ],
    behaviours: [
      "Asks the person behind him to remember his place, then leaves the queue. He returns beside a different witness and resumes the same position. Both witnesses apologize for the confusion.",
      "Temporarily exits a queue to inspect another queue. On returning, he stands three places ahead because the original reference person has moved. The arithmetic is accepted as procedural.",
      "Leaves before the office opens but claims a place based on where he would have stood. The completed queue inserts a gap for him. By noon, the gap is serving customers independently.",
    ],
  },
  {
    id: "thermos",
    domain: "food",
    titles: ["Thermos Temperature Uncle", "Still Hot Water Uncle"],
    phrase: "蓋未開，水仍熱",
    gloss: "while the lid remains closed, the water is still hot",
    mutations: ["hot-still-hot-dont-open", "yesterday-boiled-today-certified", "steam-not-seen-heat-confirmed"],
    meanings: [
      "Unobserved tea retains its most recently declared temperature.",
      "Opening the thermos creates cooling and is therefore discouraged as an inspection method.",
      "Water sealed under Uncle’s supervision remains hot until testimony to the contrary is formally accepted.",
    ],
    behaviours: [
      "Taps the thermos twice and announces that the water is still hot. Nobody opens it. Tea service proceeds using a separate kettle.",
      "Refuses a temperature check because opening the lid would interfere with the result. The thermos remains untouched through lunch and is listed as operational.",
      "Certifies yesterday’s water as freshly boiled on the basis that the lid has not been questioned. A faint rattling is classified as steam. The cups arrange themselves nearby.",
    ],
  },
  {
    id: "receipt-fold",
    domain: "bureaucracy",
    titles: ["Receipt Folding Uncle", "Proof of Purchase Uncle"],
    phrase: "單據摺好，交易完整",
    gloss: "once the receipt is folded properly, the transaction is complete",
    mutations: ["fold-fold-pocket-filed", "receipt-small-proof-large", "crease-made-purchase-final"],
    meanings: [
      "A transaction becomes official when its receipt fits inside Uncle’s wallet.",
      "Folding removes unnecessary uncertainty from proof of purchase.",
      "Each crease closes one possible interpretation of the transaction until only Uncle’s account remains.",
    ],
    behaviours: [
      "Folds a receipt into a precise rectangle before checking the total. Once it fits his wallet, he no longer considers the amount reviewable.",
      "Creases the receipt repeatedly until the disputed line item disappears inside the fold. The bill is then declared reconciled.",
      "Folds a receipt smaller than the printed date and files it among older receipts. The purchase immediately acquires a three-year warranty nobody remembers offering.",
    ],
  },
  {
    id: "group-chat",
    domain: "conversation",
    titles: ["Group Chat Silence Uncle", "Read Without Reply Uncle"],
    phrase: "已讀無言，意見照存",
    gloss: "read without reply; the opinion remains on file",
    mutations: ["seen-seen-no-comment", "typing-stop-decision-made", "silence-sent-message-complete"],
    meanings: [
      "Reading a message constitutes participation unless a reply creates evidence otherwise.",
      "Silence in the group chat is a complete response whose wording remains confidential.",
      "Once Uncle has seen the message, the conversation may proceed as though his detailed approval were attached.",
    ],
    behaviours: [
      "Reads every message immediately and replies to none. When the plan fails, he produces an opinion that was apparently present throughout the conversation.",
      "Begins typing long enough for the indicator to appear, then stops. The group interprets this as measured restraint and proceeds with the least convenient option.",
      "Sends no message for six months but remains the chat’s most frequently cited authority. His silence is forwarded into a second group for clarification.",
    ],
  },
  {
    id: "farewell",
    domain: "conversation",
    titles: ["Repeated Farewell Uncle", "Still Leaving Uncle"],
    phrase: "話別未完，離開照延",
    gloss: "the farewell is unfinished; departure is accordingly postponed",
    mutations: ["okay-going-one-more-thing", "bye-bye-still-here", "door-open-story-continues"],
    meanings: [
      "Departure begins only after the final additional topic has been completed.",
      "Each farewell authorizes one further conversation before leaving.",
      "Saying goodbye resets the remaining visit to its original duration.",
    ],
    behaviours: [
      "Announces that he is leaving, stands up, and begins a new story. He repeats this process at the doorway. Shoes remain unworn.",
      "Completes three farewells while moving less than two metres. Every goodbye introduces a person who must now also be discussed.",
      "Says goodbye so many times that the next visit begins before the current departure is complete. Tea is served again under a new date.",
    ],
  },
  {
    id: "condiment",
    domain: "food",
    titles: ["Condiment Redistribution Uncle", "Chilli Sauce Allocation Uncle"],
    phrase: "醬在桌上，眾人共享",
    gloss: "sauce placed on the table belongs to the collective",
    mutations: ["take-little-take-bottle", "sauce-here-table-balanced", "one-dish-all-dishes-authorized"],
    meanings: [
      "A condiment becomes communal once Uncle can reach it without standing.",
      "Table balance requires every sauce bottle to spend time near Uncle’s plate.",
      "Condiments migrate toward the diner with the strongest unspoken requirement.",
    ],
    behaviours: [
      "Moves the chilli sauce beside his plate for convenience. Other diners begin passing dishes toward him instead of requesting its return.",
      "Collects every condiment into one administratively central cluster. The cluster happens to be directly in front of him. Distribution is declared more efficient.",
      "Pulls one sauce bottle across the table and causes all other condiments to follow in order of viscosity. The lazy Susan rotates without assistance.",
    ],
  },
  {
    id: "wrong-floor",
    domain: "transit",
    titles: ["Wrong Floor Arrival Uncle", "This Floor Also Can Uncle"],
    phrase: "樓層有誤，到達無妨",
    gloss: "the floor is incorrect; arrival remains acceptable",
    mutations: ["wrong-floor-near-enough", "door-open-purpose-adjust", "arrived-first-destination-later"],
    meanings: [
      "Arrival may precede deciding where one intended to go.",
      "An incorrect floor becomes useful when Uncle exits with sufficient purpose.",
      "Buildings contain no wrong destinations, only destinations whose reasons have not yet been assigned.",
    ],
    behaviours: [
      "Exits the lift on the wrong floor, notices the error, and continues walking. Within seconds he identifies an unrelated errand that confirms the stop was intentional.",
      "Presses the wrong button but steps out before anyone can mention it. He inspects a fire extinguisher, nods, and returns to the lift with completed-business energy.",
      "Arrives on a floor absent from the directory and immediately acquires an appointment there. The lift removes the button after he returns.",
    ],
  },
];

const initialLocks: Locks = {
  number: false,
  title: false,
  rhythm: false,
  phrase: false,
  meaning: false,
  behaviour: false,
};

function hashString(value: string) {
  let hash = 2166136261;
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

function mulberry32(seed: number) {
  return () => {
    let value = (seed += 0x6d2b79f5);
    value = Math.imul(value ^ (value >>> 15), value | 1);
    value ^= value + Math.imul(value ^ (value >>> 7), value | 61);
    return ((value ^ (value >>> 14)) >>> 0) / 4294967296;
  };
}

function pick<T>(items: T[], random: () => number) {
  return items[Math.floor(random() * items.length)];
}

function strangenessIndex(value: Strangeness) {
  return value === "restrained" ? 0 : value === "peculiar" ? 1 : 2;
}

function digitRhythm(number: number) {
  return String(number)
    .split("")
    .map((digit) => DIGIT_READINGS[digit])
    .join("-");
}

function chooseNumber(random: () => number, forbidden: Set<number>) {
  for (let attempt = 0; attempt < 10050; attempt += 1) {
    const candidate = 10000 + Math.floor(random() * 10000);
    if (!forbidden.has(candidate)) return candidate;
  }
  throw new Error("No unissued five-digit numbers remain in the 1#### registry.");
}

function createCandidate({
  seed,
  counter,
  domain,
  strangeness,
  current,
  locks,
  forbidden,
}: {
  seed: string;
  counter: number;
  domain: Domain;
  strangeness: Strangeness;
  current?: Candidate;
  locks: Locks;
  forbidden: Set<number>;
}): Candidate {
  const generationSeed = `${seed.trim() || "UNCLE"}:${counter}`;
  const random = mulberry32(hashString(generationSeed));
  const pool = domain === "mixed" ? archetypes : archetypes.filter((item) => item.domain === domain);
  const keepPremise = Boolean(current && (locks.title || locks.behaviour));
  const currentTemplate = current ? archetypes.find((item) => item.id === current.templateId) : undefined;
  const template = keepPremise && currentTemplate ? currentTemplate : pick(pool, random);
  const level = strangenessIndex(strangeness);
  const number = current && locks.number ? current.number : chooseNumber(random, forbidden);

  return {
    templateId: template.id,
    number,
    title: current && locks.title ? current.title : pick(template.titles, random),
    baseRhythm: current && locks.rhythm ? current.baseRhythm : digitRhythm(number),
    mutation: current && locks.rhythm ? current.mutation : template.mutations[level],
    phrase: current && locks.phrase ? current.phrase : template.phrase,
    gloss: current && locks.phrase ? current.gloss : template.gloss,
    meaning: current && locks.meaning ? current.meaning : template.meanings[level],
    behaviour: current && locks.behaviour ? current.behaviour : template.behaviours[level],
    generationSeed,
    status: "generated-draft",
  };
}

function slugifyTitle(title: string) {
  return title
    .replace(/[^a-zA-Z0-9 ]/g, " ")
    .split(/\s+/)
    .filter(Boolean)
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join("");
}

function markdownFor(candidate: Candidate, register: Register, reliability: Reliability) {
  const date = new Date().toISOString().slice(0, 10);
  const registers = register === "UIS"
    ? '["Taxonomy of Gentlemen Uncles", "Uncles in Space"]'
    : '["Taxonomy of Gentlemen Uncles"]';

  return `---
taxonomy_number: ${candidate.number}
canonical_name: ${JSON.stringify(candidate.title)}
registers: ${registers}
status: ${candidate.status}
ledger_status: unreserved
reliability_level: ${reliability}
generation_seed: ${JSON.stringify(candidate.generationSeed)}
generated: ${date}
phrase_review_required: true
source: "Random Uncle Generator v1"
---

# ${candidate.title}

## Taxonomic Identity

**Candidate number:** Gentleman Uncle No.${candidate.number}  
**Candidate name:** ${candidate.title}

## Rhythmic Reading

*${candidate.baseRhythm}*, but mutated into rhythm:

*${candidate.mutation}*

「${candidate.phrase}」 = ${candidate.gloss}

## Meaning

> ${candidate.meaning}

## Observed Behaviour

${candidate.behaviour}

## Filing Note

This is an approved candidate, not canon. Recheck the Taxonomy Numbering Ledger
and reserve the number before filing the dossier. The Chinese working phrase
requires human language review before publication.
`;
}

function parseNumbers(value: string) {
  return Array.from(new Set((value.match(/\b1\d{4}\b/g) ?? []).map(Number)));
}

export function UncleGenerator() {
  const [seed, setSeed] = useState("UNCLE-2026-001");
  const [counter, setCounter] = useState(1);
  const [domain, setDomain] = useState<Domain>("mixed");
  const [strangeness, setStrangeness] = useState<Strangeness>("peculiar");
  const [register, setRegister] = useState<Register>("terrestrial");
  const [reliability, setReliability] = useState<Reliability>("soft_canon");
  const [locks, setLocks] = useState<Locks>(initialLocks);
  const [additionalIssued, setAdditionalIssued] = useState<number[]>([]);
  const [registryInput, setRegistryInput] = useState("");
  const [localApprovals, setLocalApprovals] = useState<ApprovalRecord[]>([]);
  const [notice, setNotice] = useState("Ready for provisional classification.");

  const issuedNumbers = useMemo(
    () => new Set([...LEDGER_ISSUED, ...additionalIssued, ...localApprovals.map((item) => item.number)]),
    [additionalIssued, localApprovals],
  );

  const [candidate, setCandidate] = useState<Candidate>(() =>
    createCandidate({
      seed: "UNCLE-2026-001",
      counter: 1,
      domain: "mixed",
      strangeness: "peculiar",
      locks: initialLocks,
      forbidden: new Set(LEDGER_ISSUED),
    }),
  );

  useEffect(() => {
    const timer = window.setTimeout(() => {
      try {
        const savedApprovals = JSON.parse(localStorage.getItem("uncle-generator-approvals") ?? "[]") as ApprovalRecord[];
        const savedExclusions = JSON.parse(localStorage.getItem("uncle-generator-exclusions") ?? "[]") as number[];
        setLocalApprovals(savedApprovals.filter((item) => /^1\d{4}$/.test(String(item.number))));
        setAdditionalIssued(savedExclusions.filter((number) => /^1\d{4}$/.test(String(number))));
        setRegistryInput(savedExclusions.join(", "));
      } catch {
        setNotice("Local registry data could not be read; canonical ledger numbers remain protected.");
      }
    }, 0);

    return () => window.clearTimeout(timer);
  }, []);

  function generate(customLocks = locks, field?: FieldKey) {
    const nextCounter = counter + 1;
    try {
      const next = createCandidate({
        seed,
        counter: nextCounter,
        domain,
        strangeness,
        current: candidate,
        locks: customLocks,
        forbidden: issuedNumbers,
      });
      setCandidate(next);
      setCounter(nextCounter);
      setNotice(field ? `${FIELD_LABELS[field]} rerolled; the remaining fields were preserved.` : "New provisional specimen generated.");
    } catch (error) {
      setNotice(error instanceof Error ? error.message : "Generation failed.");
    }
  }

  function rerollField(field: FieldKey) {
    const singleFieldLocks = Object.fromEntries(FIELD_KEYS.map((key) => [key, key !== field])) as Locks;
    generate(singleFieldLocks, field);
  }

  function toggleLock(field: FieldKey) {
    setLocks((current) => ({ ...current, [field]: !current[field] }));
  }

  function approveCandidate() {
    const hardCollision = LEDGER_ISSUED.includes(candidate.number) || additionalIssued.includes(candidate.number);
    if (hardCollision) {
      setNotice(`No.${candidate.number} is already excluded by the registry. Reroll the number before approval.`);
      return;
    }

    const approval: ApprovalRecord = {
      number: candidate.number,
      title: candidate.title,
      approvedAt: new Date().toISOString(),
    };
    const next = [...localApprovals.filter((item) => item.number !== candidate.number), approval];
    setLocalApprovals(next);
    localStorage.setItem("uncle-generator-approvals", JSON.stringify(next));
    setCandidate((current) => ({ ...current, status: "approved-candidate" }));
    setNotice(`No.${candidate.number} approved locally. The canonical ledger has not been modified.`);
  }

  function saveRegistryExclusions() {
    const parsed = parseNumbers(registryInput).filter((number) => !LEDGER_ISSUED.includes(number));
    setAdditionalIssued(parsed);
    setRegistryInput(parsed.join(", "));
    localStorage.setItem("uncle-generator-exclusions", JSON.stringify(parsed));
    setNotice(`${parsed.length} additional issued or withheld number${parsed.length === 1 ? "" : "s"} saved locally.`);
  }

  async function copyMarkdown() {
    try {
      await navigator.clipboard.writeText(markdownFor(candidate, register, reliability));
      setNotice("Markdown copied to the clipboard.");
    } catch {
      setNotice("Clipboard access was unavailable. Use Download Markdown instead.");
    }
  }

  function downloadMarkdown() {
    const content = markdownFor(candidate, register, reliability);
    const blob = new Blob([content], { type: "text/markdown;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `TAXO_No${candidate.number}-${slugifyTitle(candidate.title)}_v01.md`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
    setNotice("Markdown dossier downloaded. It remains non-canonical until the ledger is updated.");
  }

  const availableCount = Math.max(0, 10000 - issuedNumbers.size);
  const isApproved = candidate.status === "approved-candidate";

  return (
    <main className="app-shell">
      <header className="masthead">
        <div>
          <p className="eyebrow">Department of Provisional Classification</p>
          <h1>Random Uncle Generator</h1>
          <p className="intro">
            A controlled instrument for producing academically rigorous findings
            about matters that should not withstand examination.
          </p>
        </div>
        <div className="registry-badge" aria-label={`${issuedNumbers.size} unavailable registry numbers`}>
          <span>Registry range</span>
          <strong>1####</strong>
          <small>{issuedNumbers.size.toLocaleString()} unavailable · {availableCount.toLocaleString()} available</small>
        </div>
      </header>

      <div className="notice-bar" role="status">
        <span className={isApproved ? "status-dot approved" : "status-dot"} />
        {notice}
      </div>

      <section className="workspace">
        <article className={`specimen-card ${isApproved ? "is-approved" : ""}`} aria-live="polite">
          <div className="card-topline">
            <div className="specimen-number">Gentleman Uncle No.{candidate.number}</div>
            <div className="card-tags">
              <span>{register === "UIS" ? "UIS REGISTER" : "TERRESTRIAL"}</span>
              <span>LANGUAGE REVIEW</span>
            </div>
          </div>
          <p className="record-state">
            {isApproved ? "APPROVED CANDIDATE · LEDGER UNRESERVED" : "GENERATED DRAFT · NOT CANON"}
          </p>
          <div className="field-heading">
            <h2>{candidate.title}</h2>
            <button onClick={() => rerollField("title")} aria-label="Reroll title">Reroll</button>
          </div>

          <div className="record-section chant">
            <div className="section-label-row">
              <span>Rhythmic reading</span>
              <button onClick={() => rerollField("rhythm")}>Reroll</button>
            </div>
            <p><em>{candidate.baseRhythm}</em>, but mutated into rhythm:</p>
            <p className="mutation">{candidate.mutation}</p>
            <div className="phrase-block">
              <p className="phrase">「{candidate.phrase}」</p>
              <p className="gloss">= {candidate.gloss}</p>
              <button onClick={() => rerollField("phrase")}>Reroll phrase</button>
            </div>
          </div>

          <div className="record-section">
            <div className="section-label-row">
              <h3>Meaning</h3>
              <button onClick={() => rerollField("meaning")}>Reroll</button>
            </div>
            <blockquote>“{candidate.meaning}”</blockquote>
          </div>

          <div className="record-section observation">
            <div className="section-label-row">
              <h3>Observed Behaviour</h3>
              <button onClick={() => rerollField("behaviour")}>Reroll</button>
            </div>
            <p>{candidate.behaviour}</p>
          </div>

          <footer className="specimen-footer">
            <span>Seed {candidate.generationSeed}</span>
            <span>{reliability.replaceAll("_", " ")}</span>
          </footer>
        </article>

        <aside className="control-panel">
          <div>
            <p className="panel-label">Generation controls</p>
            <h2>Provisional desk</h2>
          </div>

          <label>
            Seed
            <input value={seed} onChange={(event) => setSeed(event.target.value)} />
          </label>

          <div className="control-grid">
            <label>
              Behaviour domain
              <select value={domain} onChange={(event) => setDomain(event.target.value as Domain)}>
                <option value="mixed">Mixed sample</option>
                <option value="food">Food and dining</option>
                <option value="domestic">Domestic systems</option>
                <option value="bureaucracy">Bureaucracy</option>
                <option value="transit">Transit and arrival</option>
                <option value="conversation">Conversation</option>
              </select>
            </label>
            <label>
              Strangeness
              <select value={strangeness} onChange={(event) => setStrangeness(event.target.value as Strangeness)}>
                <option value="restrained">Restrained</option>
                <option value="peculiar">Peculiar</option>
                <option value="impossible">Administratively impossible</option>
              </select>
            </label>
            <label>
              Register
              <select value={register} onChange={(event) => setRegister(event.target.value as Register)}>
                <option value="terrestrial">Terrestrial</option>
                <option value="UIS">Uncles in Space</option>
              </select>
            </label>
            <label>
              Reliability
              <select value={reliability} onChange={(event) => setReliability(event.target.value as Reliability)}>
                <option value="hard_canon">Hard Canon</option>
                <option value="soft_canon">Soft Canon</option>
                <option value="rumour">Rumour</option>
                <option value="uncle_testimony">Uncle Testimony</option>
              </select>
            </label>
          </div>

          <div>
            <p className="panel-label field-lock-label">Field locks and single rerolls</p>
            <div className="lock-list" aria-label="Field locks">
              {FIELD_KEYS.map((field) => (
                <div className="lock-row" key={field}>
                  <button
                    className={`lock-toggle ${locks[field] ? "locked" : ""}`}
                    aria-pressed={locks[field]}
                    onClick={() => toggleLock(field)}
                  >
                    {locks[field] ? "LOCKED" : "OPEN"}
                  </button>
                  <span>{FIELD_LABELS[field]}</span>
                  <button className="mini-reroll" onClick={() => rerollField(field)}>Reroll</button>
                </div>
              ))}
            </div>
          </div>

          <button className="generate-button" onClick={() => generate()}>
            Generate unlocked fields
          </button>

          <div className="approval-actions">
            <button className="approve-button" onClick={approveCandidate}>
              {isApproved ? "Re-approve amended candidate" : "Approve candidate locally"}
            </button>
            <div className="export-actions">
              <button onClick={copyMarkdown}>Copy Markdown</button>
              <button onClick={downloadMarkdown}>Download .md</button>
            </div>
          </div>

          <p className="approval-note">
            Local approval prevents reuse on this device. It does not reserve the
            number in the canonical ledger.
          </p>

          <details className="registry-drawer">
            <summary>Registry exclusions and approvals</summary>
            <label>
              Additional unavailable 1#### numbers
              <textarea
                value={registryInput}
                onChange={(event) => setRegistryInput(event.target.value)}
                placeholder="e.g. 10101, 15678"
                rows={3}
              />
            </label>
            <button onClick={saveRegistryExclusions}>Save exclusions locally</button>
            <p>Obsidian ledger synced at startup: {LEDGER_ISSUED.join(", ")}</p>
            {localApprovals.length > 0 && (
              <div className="approval-history">
                <strong>Locally approved</strong>
                {localApprovals.slice(-4).reverse().map((item) => (
                  <span key={item.number}>No.{item.number} · {item.title}</span>
                ))}
              </div>
            )}
          </details>
        </aside>
      </section>
    </main>
  );
}
