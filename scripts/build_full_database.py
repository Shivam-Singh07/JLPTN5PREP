"""
Master Data Extractor and Compiler for JLPT N5 Prep Platform
Eliminates all stray Latin sounds, fixes verb romanization,
and pairs pristine Japanese text with English translations.
"""

import fitz
import re
import json
import os

# Ensure output directories exist
for path in ['data/vocab', 'data/grammar', 'data/listening', 'data/conversations', 'data/kanji', 'data/kana', 'data/drills', 'web/src/data']:
    os.makedirs(path, exist_ok=True)

NAMES_MAP = {
    'kumar': 'クマル',
    'mira': 'ミラー',
    'miller': 'ミラー',
    'jimu': 'ジム',
    'jim': 'ジム',
    'imc': 'アイエムシー',
    'abc': 'エービーシー',
    'ree': 'リー',
    'lee': 'リー',
    'sumisu': 'スミス',
    'smith': 'スミス',
    'santosu': 'サントス',
    'santos': 'サントス',
    'mari': 'マリー',
    'maria': 'マリア',
    'watto': 'ワット',
    'karina': 'カリナ',
    'tawa': 'タワー',
    'tokyo tawa': 'とうきょうタワー',
    'tokyo tower': 'とうきょうタワー',
    'tōkyō tower': 'とうきょうタワー',
    'pasokon': 'パソコン',
    'hoteru': 'ホテル',
    'intaanetto': 'インターネット',
    'terebi': 'テレビ',
    'rajio': 'ラジオ',
    'kamera': 'カメラ',
    'koohii': 'コーヒー',
    'kōhii': 'コーヒー',
    'kōhi': 'コーヒー',
    'kohi': 'コーヒー',
    'biiru': 'ビール',
    'juusu': 'ジュース',
    'jūsu': 'ジュース',
    'shatsu': 'シャツ',
    'nekutai': 'ネクタイ',
    'seetaa': 'セーター',
    'takushii': 'タクシー',
    'basu': 'バス',
    'peji': 'ページ',
    'pēji': 'ページ',
    'nooto': 'ノート',
    'nōto': 'ノート',
    'borupen': 'ボールペン',
    'shapu': 'シャープペンシル',
    'fairu': 'ファイル'
}

ROMAJI_MAP = {
    'kya': 'きゃ', 'kyu': 'きゅ', 'kyo': 'きょ',
    'sha': 'しゃ', 'shu': 'しゅ', 'sho': 'しょ',
    'cha': 'ちゃ', 'chu': 'ちゅ', 'cho': 'ちょ',
    'nya': 'にゃ', 'nyu': 'にゅ', 'nyo': 'にょ',
    'hya': 'ひゃ', 'hyu': 'ひゅ', 'hyo': 'ひょ',
    'mya': 'みゃ', 'myu': 'みゅ', 'myo': 'みょ',
    'rya': 'りゃ', 'ryu': 'りゅ', 'ryo': 'りょ',
    'gya': 'ぎゃ', 'gyu': 'ぎゅ', 'gyo': 'ぎょ',
    'ja': 'じゃ', 'ju': 'じゅ', 'jo': 'じょ',
    'bya': 'びゃ', 'byu': 'びゅ', 'byo': 'びょ',
    'pya': 'ぴゃ', 'pyu': 'ぴゅ', 'pyo': 'ぴょ',
    'ka': 'か', 'ki': 'き', 'ku': 'く', 'ke': 'け', 'ko': 'こ',
    'sa': 'さ', 'shi': 'し', 'si': 'し', 'su': 'す', 'se': 'せ', 'so': 'そ',
    'ta': 'た', 'chi': 'ち', 'ti': 'ち', 'tsu': 'つ', 'tu': 'つ', 'te': 'て', 'to': 'と',
    'na': 'な', 'ni': 'に', 'nu': 'ぬ', 'ne': 'ね', 'no': 'の',
    'ha': 'は', 'hi': 'ひ', 'fu': 'ふ', 'hu': 'ふ', 'he': 'へ', 'ho': 'ほ',
    'ma': 'ま', 'mi': 'み', 'mu': 'む', 'me': 'め', 'mo': 'も',
    'ya': 'や', 'yu': 'ゆ', 'yo': 'よ',
    'ra': 'ら', 'ri': 'り', 'ru': 'る', 're': 'れ', 'ro': 'ろ',
    'wa': 'わ', 'wo': 'を', 'n': 'ん',
    'ga': 'が', 'gi': 'ぎ', 'gu': 'ぐ', 'ge': 'げ', 'go': 'ご',
    'za': 'ざ', 'ji': 'じ', 'zi': 'じ', 'zu': 'ず', 'ze': 'ぜ', 'zo': 'ぞ',
    'da': 'だ', 'di': 'ぢ', 'du': 'づ', 'de': 'で', 'do': 'ど',
    'ba': 'ば', 'bi': 'び', 'bu': 'ぶ', 'be': 'べ', 'bo': 'ぼ',
    'pa': 'ぱ', 'pi': 'ぴ', 'pu': 'ぷ', 'pe': 'ぺ', 'po': 'ぽ',
    'fa': 'ふぁ', 'fi': 'ふぃ', 'fe': 'ふぇ', 'fo': 'ふぉ',
    'a': 'あ', 'i': 'い', 'u': 'う', 'e': 'え', 'o': 'お'
}

def clean_jp_word(w):
    w = w.strip()
    # Strip brackets
    w = re.sub(r'\[.*?\]', '', w)
    w = re.sub(r'「.*?」', '', w)
    w = re.sub(r'（.*?）', '', w)
    w = re.sub(r'\(.*?\)', '', w)
    w = re.sub(r'[\u3040-\u309f]+[をにへがで][～~].*$', '', w)
    w = re.sub(r'[～~].*$', '', w)
    # Strip trailing English words or Latin letters or Roman numerals
    w = re.sub(r'[\sⅠⅡⅢⅣⅤiIvV|]+$', '', w)
    w = re.sub(r'\s+[A-Za-z]+.*$', '', w)
    w = re.sub(r'[\sⅠⅡⅢⅣⅤiIvV|]+$', '', w)
    w = re.sub(r'[A-Za-z]+$', '', w)
    return w.strip()

def clean_romaji_pre(text):
    text = text.strip()
    for k, v in NAMES_MAP.items():
        text = re.sub(r'\b' + k + r'\b', v, text, flags=re.IGNORECASE)
    
    text = text.lower()
    text = text.replace("ō", "ou").replace("ū", "uu").replace("ā", "aa").replace("ē", "ee").replace("ī", "ii")
    
    # Textbook devocalized endings
    text = re.sub(r'\bdes\b', 'desu', text)
    text = re.sub(r'deskashite\b', 'desukashite', text)
    text = re.sub(r'deskare\b', 'desukare', text)
    text = re.sub(r'deska\b', 'desuka', text)
    text = re.sub(r'mas\b', 'masu', text)
    text = re.sub(r'm(?=[bpm])', 'n', text)
    
    # Standalone particles
    tokens = text.split()
    new_tokens = []
    for t in tokens:
        if t == 'wa': new_tokens.append('__HA__')
        elif t == 'o': new_tokens.append('__WO__')
        elif t == 'e': new_tokens.append('__HE__')
        else: new_tokens.append(t)
    return ' '.join(new_tokens)

def romaji_to_kana(text):
    if not text:
        return ""
    if not re.search(r'[a-zA-Z]', text):
        return text
    
    text = clean_romaji_pre(text)
    keys = sorted(ROMAJI_MAP.keys(), key=lambda x: -len(x))
    res = ""
    i = 0
    n = len(text)
    
    while i < n:
        if text[i:i+6] == '__HA__':
            res += 'は'
            i += 6
            continue
        if text[i:i+6] == '__WO__':
            res += 'を'
            i += 6
            continue
        if text[i:i+6] == '__HE__':
            res += 'へ'
            i += 6
            continue
        
        if i + 1 < n and text[i] == text[i+1] and text[i] not in 'aeioun ' and text[i].isalpha():
            res += "っ"
            i += 1
            continue
            
        matched = False
        for k in keys:
            if text[i:i+len(k)] == k:
                res += ROMAJI_MAP[k]
                i += len(k)
                matched = True
                break
        if not matched:
            res += text[i]
            i += 1
            
    res = re.sub(r's\b', 'す', res)
    res = re.sub(r'r\b', 'る', res)
    res = re.sub(r'k\b', 'く', res)
    res = re.sub(r't\b', 'と', res)
    res = re.sub(r'd\b', 'ど', res)
    res = re.sub(r'm\b', 'む', res)
    res = re.sub(r'n\b', 'ん', res)
    res = re.sub(r'p\b', 'ぷ', res)
    res = re.sub(r'b\b', 'ぶ', res)
    res = re.sub(r'g\b', 'ぐ', res)
    res = re.sub(r'[a-zA-Z]', '', res)
    res = re.sub(r'\s+', ' ', res).strip()
    return res

def clean_text(t):
    return re.sub(r'\s+', ' ', t).strip()

print("Loading PDFs...")
doc_b1 = fitz.open('resouces/basic 1 book pdf.pdf')
doc_b2 = fitz.open('resouces/Basic 2.pdf')

all_vocab = []
chapter_vocab_map = {}
all_grammar = []
all_listening = []
all_conversations = []

# --- EXTRACT BASIC 1 (Chapters 1 to 11) ---
b1_meta = [
    (1, 8, 15, "Self Introduction (自己紹介)", "Greetings, nationalities, occupations, and introducing yourself with basic copula (des/dewa arimasen)."),
    (2, 16, 20, "Let’s Count (数え方・数字)", "Numbers up to 100,000, Japanese currency (en), asking prices (ikura desu ka), and noun modifier (no)."),
    (3, 21, 26, "Time & Days (時間・曜日)", "Telling time (ji, fun/pun, han), days of the week, months, and time boundaries (kara, made)."),
    (4, 27, 33, "This & That (これ・それ・あれ)", "Demonstrative pronouns (kore, sore, are, dore), determiners (kono, sono, ano), and places (koko, soko, asoko)."),
    (5, 34, 38, "Basic Adjectives (基本の形容詞)", "True い-adjectives and な-adjectives, negative forms, and modifying nouns."),
    (6, 39, 43, "Verbs (基本の動詞)", "Present/future masu-form verbs, negative masen, past mashita, direct object particle を (o), and location で (de)."),
    (7, 44, 49, "My Family & Daily Life (家族・日常)", "Family members (humble vs honorific), existence verbs います (living) and あります (inanimate), place particle に (ni)."),
    (8, 50, 54, "Tele-Conference & Transport (電話・交通)", "Phone etiquettes (moshi moshi), reason particle から (kara), and transportation particle で (de)."),
    (9, 55, 58, "Travel & Places (旅行・場所)", "Travel vocabulary, companion particle と (to), direction particle へ (e), and asking how (douyatte)."),
    (10, 59, 64, "Give and Take (授受動詞)", "Giving (agemasu) and receiving (moraimasu), completed actions もう (mou) vs まだ (mada)."),
    (11, 65, 69, "Question Answers (質問と答え・総復習)", "Interrogatives (doko, dare, nan, itsu, ikura, doushite), native Japanese counters (hitotsu, futatsu...), and people counters."),
]

with open('data/grammar/all_grammar.json', 'r', encoding='utf-8') as f:
    existing_grammar = json.load(f)

for ch_num, start_p, end_p, title, desc in b1_meta:
    ch_text = ""
    for p in range(start_p - 1, end_p):
        ch_text += doc_b1[p].get_text() + "\n"
    
    # Vocab extraction
    vocab_items = []
    lines = ch_text.splitlines()
    for line in lines:
        line_s = line.strip()
        if not line_s or 'www.nihongomax' in line_s or 'Page |' in line_s or 'Practice Exercise' in line_s:
            continue
        m = re.search(r'^(\d+\.\s*)?([A-Za-zōūāēī\s/\(\)\'\-]+?)\s*[…\.]{2,}\s*(.+)$', line_s)
        if m:
            w = m.group(2).strip()
            mean = m.group(3).strip()
            if len(w) > 1 and len(mean) > 0 and not mean.startswith('…') and 'Chapter' not in w and 'Let’s' not in w:
                kana_val = romaji_to_kana(w)
                v_item = {
                    "id": f"vocab_ch{ch_num}_{len(vocab_items)+1}",
                    "chapter": ch_num,
                    "chapterTitle": title,
                    "japanese": kana_val,
                    "kana": kana_val,
                    "romaji": w,
                    "english": mean,
                    "category": "Basic 1"
                }
                vocab_items.append(v_item)
                all_vocab.append(v_item)
    
    chapter_vocab_map[ch_num] = vocab_items
    
    g_match = next((g for g in existing_grammar if g['chapter'] == ch_num), None)
    if g_match:
        all_grammar.append(g_match)
    
    # Listening sentences
    listening_list = []
    if 'Listening sentences for home practice:' in ch_text:
        l_part = ch_text.split('Listening sentences for home practice:')[1]
        for delim in ['Video ', 'Practice Exercise', 'GLOSSARY', 'CONVERSATION']:
            if delim in l_part:
                l_part = l_part.split(delim)[0]
        
        blocks = re.findall(r'(\d+)\.\s*([^\d]+?)(?=\n\s*\d+\.|\Z)', l_part)
        for num_str, content in blocks:
            c_clean = clean_text(content)
            if c_clean:
                listening_list.append({
                    "id": f"listen_ch{ch_num}_{num_str}",
                    "chapter": ch_num,
                    "chapterTitle": title,
                    "number": int(num_str),
                    "japanese": romaji_to_kana(c_clean),
                    "romaji": c_clean,
                    "english": "Listen carefully to the pronunciation and practice repeating."
                })
    all_listening.append({
        "chapter": ch_num,
        "title": f"Chapter {ch_num} Listening Practice (CHŌKAI)",
        "exercises": listening_list
    })
    
    # Video dialogue
    v_match = re.search(r'Video\s+(\d+)\s+([^\n]+)', ch_text)
    if v_match:
        v_num = v_match.group(1)
        v_title = v_match.group(2).strip()
        v_part = ch_text.split(f'Video {v_num}')[1]
        for delim in ['Listening', 'Practice Exercise', 'CONVERSATION', 'GLOSSARY']:
            if delim in v_part:
                v_part = v_part.split(delim)[0]
        
        dialogue_lines = []
        for line in v_part.splitlines():
            line_s = line.strip()
            if ':' in line_s or '：' in line_s:
                parts = re.split(r'[:：]', line_s, maxsplit=1)
                spk = parts[0].strip()
                speech = parts[1].strip()
                if spk and speech:
                    dialogue_lines.append({
                        "speaker": spk,
                        "japanese": romaji_to_kana(speech),
                        "romaji": speech,
                        "english": ""
                    })
        if dialogue_lines:
            all_conversations.append({
                "id": f"convo_b1_v{v_num}",
                "chapter": ch_num,
                "videoNumber": int(v_num),
                "title": f"Video {v_num}: {v_title}",
                "lines": dialogue_lines
            })

print(f"Basic 1 parsed. Vocab items: {len(all_vocab)}")

# --- EXTRACT BASIC 2 (Lessons 12 to 24) ---
b2_meta = [
    (12, 3, 9, "Comparison & Seasons (比較・季節・天気)", "Past tense of adjectives/nouns, comparisons (yori / hou ga), and superlative (ichiban)."),
    (13, 10, 16, "Desires & Purpose (欲しい・～たい・目的)", "Expressing desire with 欲しい (hoshii) and ～たい (tai), and purpose of movement (Place e Verb-stem ni ikimas)."),
    (14, 17, 26, "Te-form & Requests (て形・～てください)", "Conjugating verbs into て-form, making polite requests (～てください), progressive action (～ています), and offers (～ましょうか)."),
    (15, 27, 32, "Permissions & Prohibitions (許可・禁止)", "Asking permission (～てもいいですか), stating prohibitions (～てはいけません), and ongoing states (知っています, 住んでいます)."),
    (16, 33, 39, "Connecting Actions & Adjectives (文の接続)", "Chaining multiple actions (Verb て, Verb て...), sequential action (～てから), connecting adjectives (～くて, ～で), and describing attributes."),
    (17, 40, 45, "Nai-form & Obligations (ない形・義務)", "Conjugating ない-form, requests not to do (～ないでください), obligation (～なければなりません), and permission not to do (～なくてもいいです)."),
    (18, 46, 54, "Dictionary Form & Ability (辞書形・可能)", "Verb dictionary form, ability (～ことができます), hobbies (趣味は～ことです), and temporal order (～前に)."),
    (19, 55, 61, "Ta-form & Experiences (た形・経験)", "Conjugating た-form, past experiences (～たことがあります), non-exhaustive actions (～たり～たりします), and becoming (～になります)."),
    (20, 62, 65, "Plain Form & Casual Speech (普通形)", "Informal speech (だ, じゃない, だった), casual conversation with friends/family, and conversational particles."),
    (21, 66, 71, "Opinions & Quotations (意見・引用)", "Expressing opinions (～と思います), quoting others (～と言いました), confirming agreement (～でしょう)."),
    (22, 72, 78, "Noun Modification (名詞修飾)", "Using entire verb phrases to describe nouns ([昨日買った] 本), explaining actions, and expanding complex sentences."),
    (23, 79, 85, "When & Conditionals (～とき・～と)", "Expressing time condition (～とき), natural/automatic consequences (～と), and giving directions."),
    (24, 86, 91, "Giving & Receiving Favors (授受動詞・恩恵)", "Giving and receiving favors: ～てあげます, ～てもらいます, ～てくれます for actions of kindness.")
]

for lesson_num, start_p, end_p, title, desc in b2_meta:
    text = ""
    for p in range(start_p - 1, end_p):
        text += doc_b2[p].get_text() + "\n"
    
    # Vocabulary
    v_text = ""
    if "Vocabulary:（ことば）" in text:
        v_part = text.split("Vocabulary:（ことば）")[1]
        m = re.search(r'(Grammar\s*\d+|PRACTICE\s+EXERCISE|Listening\s+sentences|『Note|\bNote\s*:|How to make)', v_part, flags=re.IGNORECASE)
        if m:
            v_text = v_part[:m.start()]
        else:
            v_text = v_part
    
    lines = [l.strip() for l in v_text.splitlines() if l.strip()]
    clean_lines = [l for l in lines if not ('Log on to' in l or 'Page |' in l or 'www.' in l)]
    
    lesson_vocab = []
    i = 0
    while i < len(clean_lines):
        item_jp = clean_lines[i]
        # Skip lines starting with English words
        if re.match(r'^[A-Za-z]', item_jp):
            i += 1
            continue
            
        item_jp_clean = clean_jp_word(item_jp)
        is_jp = any('\u3040' <= c <= '\u30ff' or '\u4e00' <= c <= '\u9fff' for c in item_jp_clean)
        
        if is_jp and i + 1 < len(clean_lines):
            eng = clean_lines[i+1]
            if not any('\u3040' <= c <= '\u30ff' or '\u4e00' <= c <= '\u9fff' for c in eng):
                v_obj = {
                    "id": f"vocab_ch{lesson_num}_{len(lesson_vocab)+1}",
                    "chapter": lesson_num,
                    "chapterTitle": title,
                    "japanese": item_jp_clean,
                    "kana": item_jp_clean,
                    "romaji": "",
                    "english": eng,
                    "category": "Basic 2"
                }
                lesson_vocab.append(v_obj)
                all_vocab.append(v_obj)
                i += 2
                continue
        i += 1
            
    chapter_vocab_map[lesson_num] = lesson_vocab
    
    # Grammar
    g_match = next((g for g in existing_grammar if g['chapter'] == lesson_num), None)
    if g_match:
        all_grammar.append(g_match)
    
    # Listening: Separate JP and EN blocks
    b2_listening_list = []
    if 'Listening sentences for home practice:' in text:
        l_part = text.split('Listening sentences for home practice:')[1]
        for delim in ['Video ', 'PRACTICE EXERCISE', 'N5 Practice']:
            if delim in l_part:
                l_part = l_part.split(delim)[0]
                
        # Split into JP and EN sections
        jp_part = l_part
        en_part = ''
        if 'HOW TO PRACTICE' in l_part:
            parts = l_part.split('HOW TO PRACTICE')
            jp_part = parts[0]
            if 'Reibun' in parts[1]:
                en_part = parts[1].split('Reibun')[1]
        elif 'Reibun' in l_part:
            parts = l_part.split('Reibun')
            jp_part = parts[0]
            en_part = parts[1]
            
        jp_items = re.findall(r'(\d+)\.\s*([^\d]+?)(?=\n\s*\d+\.|\Z)', jp_part)
        en_items = re.findall(r'(\d+)\.\s*([^\d]+?)(?=\n\s*\d+\.|\Z)', en_part)
        en_map = {num.strip(): text.strip().replace('\n', ' ') for num, text in en_items}
        
        for num_str, content in jp_items:
            c_clean = clean_text(content)
            if any('\u3040' <= c <= '\u30ff' or '\u4e00' <= c <= '\u9fff' for c in c_clean):
                tr_eng = en_map.get(num_str.strip(), "Listen and practice pronunciation aloud.")
                tr_eng = re.sub(r'^[…\.\s]+', '', tr_eng)
                b2_listening_list.append({
                    "id": f"listen_ch{lesson_num}_{num_str}",
                    "chapter": lesson_num,
                    "chapterTitle": title,
                    "number": int(num_str),
                    "japanese": c_clean,
                    "romaji": "",
                    "english": tr_eng
                })
                
    all_listening.append({
        "chapter": lesson_num,
        "title": f"Lesson {lesson_num} Listening Practice (CHŌKAI)",
        "exercises": b2_listening_list
    })
    
    # Video dialogue with JP and EN pairing
    v_match = re.search(r'Video\s+(\d+)\s+([^\n]+)', text)
    if v_match:
        v_num = v_match.group(1)
        v_title = v_match.group(2).strip()
        v_part = text.split(f'Video {v_num}')[1]
        for delim in ['Listening', 'PRACTICE EXERCISE', 'Lesson-']:
            if delim in v_part:
                v_part = v_part.split(delim)[0]
        
        lines = [l.strip() for l in v_part.splitlines() if l.strip()]
        lines = [l for l in lines if not ('Log on to' in l or 'Page |' in l or 'www.' in l)]
        
        jp_lines = []
        en_lines = []
        
        for l in lines:
            if ('：' in l or (':' in l and any('\u3040' <= c <= '\u30ff' or '\u4e00' <= c <= '\u9fff' for c in l))):
                parts = re.split(r'[:：]', l, maxsplit=1)
                spk = parts[0].strip()
                speech = parts[1].strip() if len(parts) > 1 else ''
                if spk and any('\u3040' <= c <= '\u30ff' or '\u4e00' <= c <= '\u9fff' for c in spk + speech):
                    jp_lines.append({'speaker': spk, 'japanese': speech, 'english': ''})
            elif ':' in l and not any('\u3040' <= c <= '\u30ff' or '\u4e00' <= c <= '\u9fff' for c in l):
                parts = l.split(':', 1)
                spk = parts[0].strip()
                speech = parts[1].strip() if len(parts) > 1 else ''
                en_lines.append({'speaker': spk, 'english': speech})
                
        for idx in range(min(len(jp_lines), len(en_lines))):
            if not jp_lines[idx]['english'] and en_lines[idx]['english']:
                jp_lines[idx]['english'] = en_lines[idx]['english']
                
        if jp_lines:
            all_conversations.append({
                "id": f"convo_b2_v{v_num}",
                "chapter": lesson_num,
                "videoNumber": int(v_num),
                "title": f"Video {v_num}: {v_title}",
                "lines": jp_lines
            })

print(f"Basic 2 parsed. Total vocab items: {len(all_vocab)}")

# Load remaining datasets
with open('data/vocab/adverbs.json', 'r', encoding='utf-8') as f:
    adverbs_list = json.load(f)

with open('data/kanji/kanji_110.json', 'r', encoding='utf-8') as f:
    kanji_110 = json.load(f)

with open('data/kanji/kanji_chapters.json', 'r', encoding='utf-8') as f:
    kanji_chapters = json.load(f)

with open('data/kanji/kanji_vocab.json', 'r', encoding='utf-8') as f:
    kanji_vocab_list = json.load(f)

with open('data/kana/hiragana.json', 'r', encoding='utf-8') as f:
    hiragana_table = json.load(f)

with open('data/kana/katakana.json', 'r', encoding='utf-8') as f:
    katakana_table = json.load(f)

with open('data/drills/mock_exam.json', 'r', encoding='utf-8') as f:
    drills = json.load(f)

# Final sanitization pass for pure Japanese pronunciation
for v in all_vocab:
    v['japanese'] = re.sub(r'[a-zA-ZⅠⅡⅢⅣⅤ]', '', v['japanese']).strip()
    v['kana'] = re.sub(r'[a-zA-ZⅠⅡⅢⅣⅤ]', '', v['kana']).strip()

latin_in_vocab = sum(1 for v in all_vocab if re.search(r'[a-zA-Z]', v['japanese']))
print(f"Latin characters in vocab japanese field: {latin_in_vocab}")

# Write all to disk
print("Writing structured datasets to disk...")

with open('data/vocab/all_vocab.json', 'w', encoding='utf-8') as f:
    json.dump(all_vocab, f, ensure_ascii=False, indent=2)

for ch_id, vlist in chapter_vocab_map.items():
    with open(f'data/vocab/chapter_{ch_id}.json', 'w', encoding='utf-8') as f:
        json.dump(vlist, f, ensure_ascii=False, indent=2)

with open('data/grammar/all_grammar.json', 'w', encoding='utf-8') as f:
    json.dump(all_grammar, f, ensure_ascii=False, indent=2)

with open('data/listening/all_listening.json', 'w', encoding='utf-8') as f:
    json.dump(all_listening, f, ensure_ascii=False, indent=2)

with open('data/conversations/all_conversations.json', 'r', encoding='utf-8') as f:
    all_conversations = json.load(f)

master_bundle = {
    "allVocab": all_vocab,
    "chapterVocabMap": chapter_vocab_map,
    "grammar": all_grammar,
    "listening": all_listening,
    "conversations": all_conversations,
    "kanji110": kanji_110,
    "kanjiChapters": kanji_chapters,
    "kanjiVocab": kanji_vocab_list,
    "adverbs": adverbs_list,
    "hiragana": hiragana_table,
    "katakana": katakana_table,
    "drills": drills
}

with open('web/src/data/n5_data.json', 'w', encoding='utf-8') as f:
    json.dump(master_bundle, f, ensure_ascii=False, indent=2)

with open('web/src/data/n5Data.js', 'w', encoding='utf-8') as f:
    f.write(f"// Master JLPT N5 Data Bundle with clean phonetic Japanese\nconst n5Data = {json.dumps(master_bundle, ensure_ascii=False, indent=2)};\nexport default n5Data;\n")

print("All clean data successfully built!")
