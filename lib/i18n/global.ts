/** Global locale primitives. Translation catalogs can be added per locale without
 * changing commerce logic. We deliberately fall back to English/Arabic instead
 * of pretending untranslated text is translated. */
export type Language = { tag: string; englishName: string; nativeName: string; dir: 'ltr' | 'rtl' };

export const GLOBAL_LANGUAGES: Language[] = [
  ['ar','Arabic','العربية','rtl'],['en','English','English','ltr'],['fr','French','Français','ltr'],['es','Spanish','Español','ltr'],['de','German','Deutsch','ltr'],['it','Italian','Italiano','ltr'],['pt','Portuguese','Português','ltr'],['nl','Dutch','Nederlands','ltr'],['pl','Polish','Polski','ltr'],['tr','Turkish','Türkçe','ltr'],['ru','Russian','Русский','ltr'],['uk','Ukrainian','Українська','ltr'],['zh-CN','Chinese (Simplified)','简体中文','ltr'],['zh-TW','Chinese (Traditional)','繁體中文','ltr'],['ja','Japanese','日本語','ltr'],['ko','Korean','한국어','ltr'],['hi','Hindi','हिन्दी','ltr'],['bn','Bengali','বাংলা','ltr'],['ur','Urdu','اردو','rtl'],['fa','Persian','فارسی','rtl'],['he','Hebrew','עברית','rtl'],['id','Indonesian','Bahasa Indonesia','ltr'],['ms','Malay','Bahasa Melayu','ltr'],['th','Thai','ไทย','ltr'],['vi','Vietnamese','Tiếng Việt','ltr'],['fil','Filipino','Filipino','ltr'],['sw','Swahili','Kiswahili','ltr'],['am','Amharic','አማርኛ','ltr'],['yo','Yoruba','Yorùbá','ltr'],['ig','Igbo','Igbo','ltr'],['ha','Hausa','Hausa','ltr'],['so','Somali','Soomaali','ltr'],['zu','Zulu','isiZulu','ltr'],['xh','Xhosa','isiXhosa','ltr'],['af','Afrikaans','Afrikaans','ltr'],['sv','Swedish','Svenska','ltr'],['no','Norwegian','Norsk','ltr'],['da','Danish','Dansk','ltr'],['fi','Finnish','Suomi','ltr'],['is','Icelandic','Íslenska','ltr'],['cs','Czech','Čeština','ltr'],['sk','Slovak','Slovenčina','ltr'],['hu','Hungarian','Magyar','ltr'],['ro','Romanian','Română','ltr'],['bg','Bulgarian','Български','ltr'],['sr','Serbian','Српски','ltr'],['hr','Croatian','Hrvatski','ltr'],['sl','Slovenian','Slovenščina','ltr'],['el','Greek','Ελληνικά','ltr'],['ca','Catalan','Català','ltr'],['eu','Basque','Euskara','ltr'],['gl','Galician','Galego','ltr'],['et','Estonian','Eesti','ltr'],['lv','Latvian','Latviešu','ltr'],['lt','Lithuanian','Lietuvių','ltr'],['sq','Albanian','Shqip','ltr'],['mk','Macedonian','Македонски','ltr'],['bs','Bosnian','Bosanski','ltr'],['hy','Armenian','Հայերեն','ltr'],['ka','Georgian','ქართული','ltr'],['az','Azerbaijani','Azərbaycan','ltr'],['kk','Kazakh','Қазақша','ltr'],['uz','Uzbek','O‘zbek','ltr'],['mn','Mongolian','Монгол','ltr'],['ne','Nepali','नेपाली','ltr'],['si','Sinhala','සිංහල','ltr'],['ta','Tamil','தமிழ்','ltr'],['te','Telugu','తెలుగు','ltr'],['mr','Marathi','मराठी','ltr'],['gu','Gujarati','ગુજરાતી','ltr'],['kn','Kannada','ಕನ್ನಡ','ltr'],['ml','Malayalam','മലയാളം','ltr'],['pa','Punjabi','ਪੰਜਾਬੀ','ltr'],['my','Burmese','မြန်မာ','ltr'],['km','Khmer','ខ្មែរ','ltr'],['lo','Lao','ລາວ','ltr'],['jv','Javanese','Basa Jawa','ltr'],['su','Sundanese','Basa Sunda','ltr'],['tl','Tagalog','Tagalog','ltr'],['sw','Swahili','Kiswahili','ltr'],['fa-AF','Dari','دری','rtl'],['ps','Pashto','پښتو','rtl'],['ku','Kurdish','Kurdî','rtl'],['dv','Dhivehi','ދިވެހި','rtl'],['mt','Maltese','Malti','ltr'],['ga','Irish','Gaeilge','ltr'],['cy','Welsh','Cymraeg','ltr'],['eo','Esperanto','Esperanto','ltr'],
].map(([tag, englishName, nativeName, dir]) => ({tag, englishName, nativeName, dir: dir as 'ltr' | 'rtl'}));

export const LANGUAGE_BY_TAG = new Map(GLOBAL_LANGUAGES.map(x => [x.tag.toLowerCase(), x]));

export function resolveLanguage(input?: string | null): Language {
  const key = String(input ?? '').trim().toLowerCase();
  return LANGUAGE_BY_TAG.get(key) ?? LANGUAGE_BY_TAG.get(key.split('-')[0]) ?? LANGUAGE_BY_TAG.get('en')!;
}

export function isRtlLocale(locale: string): boolean { return resolveLanguage(locale).dir === 'rtl'; }

export function formatNumber(value: number, locale: string): string {
  return new Intl.NumberFormat(locale || 'en', { maximumFractionDigits: 2 }).format(value);
}
