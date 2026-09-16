// ======================================================
// Cell — E2EE криптослой (WebCrypto, без внешних библиотек)
// ======================================================

const __enc = new TextEncoder();
const __dec = new TextDecoder();

// ---------- base64 <-> ArrayBuffer ----------
export function abToB64(buf) {
  const bytes = new Uint8Array(buf);
  let bin = "";
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
  return btoa(bin);
}

export function b64ToAb(b64) {
  const bin = atob(b64);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
  return bytes.buffer;
}

// ---------- Генерация ECDH P-256 ----------
export async function generateIdentityKeyPair() {
  const kp = await crypto.subtle.generateKey(
    { name: "ECDH", namedCurve: "P-256" },
    true,
    ["deriveKey", "deriveBits"]
  );
  const pubJwk = await crypto.subtle.exportKey("jwk", kp.publicKey);
  const privJwk = await crypto.subtle.exportKey("jwk", kp.privateKey);
  return { pubJwk, privJwk };
}

// ---------- KEK из пароля (PBKDF2-SHA256, 600k итераций) ----------
const PBKDF2_ITER = 600000;

export async function deriveKEK(password, saltB64) {
  const salt = saltB64
    ? new Uint8Array(b64ToAb(saltB64))
    : crypto.getRandomValues(new Uint8Array(16));

  const pwKey = await crypto.subtle.importKey(
    "raw", __enc.encode(password), "PBKDF2", false, ["deriveKey"]
  );
  const kek = await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: PBKDF2_ITER, hash: "SHA-256" },
    pwKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
  return { kek, saltB64: abToB64(salt) };
}

// ---------- AES-GCM encrypt/decrypt ----------
export async function encryptBlob(key, data) {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const ct = await crypto.subtle.encrypt({ name: "AES-GCM", iv }, key, data);
  return { iv: abToB64(iv), ct: abToB64(ct) };
}

export async function decryptBlob(key, ivB64, ctB64) {
  const iv = new Uint8Array(b64ToAb(ivB64));
  const ct = b64ToAb(ctB64);
  return await crypto.subtle.decrypt({ name: "AES-GCM", iv }, key, ct);
}

// ---------- Приватный ключ <-> зашифрованный blob ----------
export async function wrapPrivateKey(privJwk, kek) {
  const raw = __enc.encode(JSON.stringify(privJwk));
  return await encryptBlob(kek, raw);
}

export async function unwrapPrivateKey(kek, ivB64, ctB64) {
  const raw = await decryptBlob(kek, ivB64, ctB64);
  return JSON.parse(__dec.decode(raw));
}

// ---------- Общий ключ чата (ECDH) ----------
export async function deriveSharedKey(myPrivJwk, theirPubJwk) {
  const priv = await crypto.subtle.importKey(
    "jwk", myPrivJwk, { name: "ECDH", namedCurve: "P-256" }, false, ["deriveKey"]
  );
  const pub = await crypto.subtle.importKey(
    "jwk", theirPubJwk, { name: "ECDH", namedCurve: "P-256" }, false, []
  );
  return await crypto.subtle.deriveKey(
    { name: "ECDH", public: pub },
    priv,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ---------- Шифрование/расшифровка сообщения ----------
// Формат: "e1:<base64 iv>:<base64 ct>"
export async function encryptMessage(sharedKey, plaintext) {
  const { iv, ct } = await encryptBlob(sharedKey, __enc.encode(plaintext));
  return "e1:" + iv + ":" + ct;
}

export async function decryptMessage(sharedKey, payload) {
  if (!payload || typeof payload !== "string" || !payload.startsWith("e1:")) {
    return payload;
  }
  const parts = payload.split(":");
  if (parts.length !== 3) return payload;
  const [, iv, ct] = parts;
  const raw = await decryptBlob(sharedKey, iv, ct);
  return __dec.decode(raw);
}

// ---------- Recovery code (12 слов, словарик 256 слов) ----------
// ВАЖНО: это НЕ стандарт BIP39. Наш собственный формат для Cell.
const WORDLIST_256 = (
  "абрикос авиатор автобус агент адрес аквариум алмаз альбом ангел арбуз архив астра " +
  "бабочка багаж базальт байкал банан бархат батарея берег бетон библиотека билет бинокль " +
  "бирюза бисер бланк блокнот болото браслет бублик бугор букет бульвар бумага буран бутон " +
  "вагон ваза валун ванна варенье василёк веник верблюд ветер вешалка взгляд вишня вода воин " +
  "волна воробей воронка воротник восток вулкан вывод газон галактика гараж гвоздь герань " +
  "гитара глина глубина гнездо голос гора город горох гриб гром губка гудок гусли " +
  "дамба дверь дельфин деревня диван дикобраз диск добро дом доска дракон друг дуб дудка дым " +
  "еж ежик елка жабры жаворонок жажда жасмин желоб железо желудь жемчуг жеребенок жетон жилет " +
  "журнал забор завтрак зайка замок запад заряд звезда звонок зебра зелье зерно зима знамя " +
  "зонт зубр ива игла игра икра иней искра йод йогурт кабан кабина каблук казак какао калач " +
  "камень камыш канал капля карман каска катер каштан кедр кепка клен клетка ключ книга ковер " +
  "колбаса колесо колокол кольцо компас конверт копье корабль корень корона космос костер кофе " +
  "кошка краб край кран крепость кристалл кровать крокодил кролик крыло кубик кувшин кузнец " +
  "кукла культура купол куртка куст лабиринт лавина лагерь ладонь лампа ласточка лебедь лев " +
  "ледник лезвие лента леопард лестница лето лиана ливень лилия лимон линия липа лиса листок " +
  "лодка ложка лопата лось луна лупа лыжи люстра лягушка магнит мазь майка мак малина мамонт " +
  "манго мандарин марка мармелад маска масло матч маяк мебель медведь медаль мел метель метро " +
  "меч мешок микрофон миндаль минерал мишка мозаика молния молоко монах морж морковь мост мотор " +
  "мох музей муравей мышь награда надежда наушники небо нефрит нить новость нож ножницы носок " +
  "нота ночь оберег обжора облепиха облако обои обруч обувь огонь огурец одеяло ожерелье окно " +
  "олень олива орех оркестр оружие оса осень осьминог отель остров отвага охота очки павлин " +
  "пакет палатка палец палитра пальма память панда папка пара парик паровоз парус пасека паста " +
  "паук паутина паштет певец пейзаж пенал пепел перец перо песок петух печень пещера пиала пикник " +
  "пилот пингвин пион пирог письмо пицца плазма планета платок плащ плед плечо плитка плотина плот " +
  "победа повар погода подкова подушка поезд пожар поле полет полка полюс помидор пони поток потолок"
).split(/\s+/);

function bytesToWords(bytes, count) {
  const bits = [];
  for (const b of bytes) {
    for (let i = 7; i >= 0; i--) bits.push((b >> i) & 1);
  }
  const words = [];
  for (let i = 0; i < count; i++) {
    let v = 0;
    for (let j = 0; j < 8; j++) v = (v << 1) | (bits[i * 8 + j] || 0);
    words.push(WORDLIST_256[v]);
  }
  return words;
}

export function generateRecoveryCode() {
  const bytes = crypto.getRandomValues(new Uint8Array(12));
  return bytesToWords(bytes, 12);
}

export async function deriveRecoveryKEK(words) {
  const phrase = words.join(" ");
  const salt = __enc.encode("cell-recovery-v1:" + words.slice(0, 4).join(" "));
  const pwKey = await crypto.subtle.importKey(
    "raw", __enc.encode(phrase), "PBKDF2", false, ["deriveKey"]
  );
  return await crypto.subtle.deriveKey(
    { name: "PBKDF2", salt, iterations: 600000, hash: "SHA-256" },
    pwKey,
    { name: "AES-GCM", length: 256 },
    false,
    ["encrypt", "decrypt"]
  );
}

// ---------- Safety number ----------
export async function computeSafetyNumber(myPubJwk, theirPubJwk) {
  const a = JSON.stringify({ x: myPubJwk.x, y: myPubJwk.y });
  const b = JSON.stringify({ x: theirPubJwk.x, y: theirPubJwk.y });
  const [first, second] = [a, b].sort();
  const data = __enc.encode(first + "|" + second);
  const hash = await crypto.subtle.digest("SHA-256", data);
  const bytes = new Uint8Array(hash);
  let digits = "";
  for (let i = 0; i < 30; i++) {
    const n = ((bytes[i * 2] << 8) | bytes[i * 2 + 1]) % 100000;
    digits += String(n).padStart(5, "0");
  }
  return digits;
}
