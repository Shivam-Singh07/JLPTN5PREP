"""
Extraction and Structured Generation for JLPT N5 Learning Platform
"""
import fitz
import re
import json
import os

ROMAJI_TO_HIRAGANA = {
    "a": "あ", "i": "い", "u": "う", "e": "え", "o": "お",
    "ka": "か", "ki": "き", "ku": "く", "ke": "け", "ko": "こ",
    "sa": "さ", "shi": "し", "si": "し", "su": "す", "se": "せ", "so": "そ",
    "ta": "た", "chi": "ち", "ti": "ち", "tsu": "つ", "tu": "つ", "te": "て", "to": "と",
    "na": "な", "ni": "に", "nu": "ぬ", "ne": "ね", "no": "の",
    "ha": "は", "hi": "ひ", "fu": "ふ", "hu": "ふ", "he": "へ", "ho": "ほ",
    "ma": "ま", "mi": "み", "mu": "む", "me": "め", "mo": "も",
    "ya": "や", "yu": "ゆ", "yo": "よ",
    "ra": "ら", "ri": "り", "ru": "る", "re": "れ", "ro": "ろ",
    "wa": "わ", "wo": "を", "n": "ん",
    "ga": "が", "gi": "ぎ", "gu": "ぐ", "ge": "げ", "go": "ご",
    "za": "ざ", "ji": "じ", "zi": "じ", "zu": "ず", "ze": "ぜ", "zo": "ぞ",
    "da": "だ", "di": "ぢ", "du": "づ", "de": "デ", "do": "ど",
    "ba": "ば", "bi": "び", "bu": "ぶ", "be": "べ", "bo": "ぼ",
    "pa": "ぱ", "pi": "ぴ", "pu": "ぷ", "pe": "ぺ", "po": "ぽ",
    "kya": "きゃ", "kyu": "きゅ", "kyo": "きょ",
    "sha": "しゃ", "shu": "しゅ", "sho": "しょ",
    "cha": "ちゃ", "chu": "ちゅ", "cho": "ちょ",
    "nya": "にゃ", "nyu": "にゅ", "nyo": "にょ",
    "hya": "ひゃ", "hyu": "ひゅ", "hyo": "ひょ",
    "mya": "みゃ", "myu": "みゅ", "myo": "みょ",
    "rya": "りゃ", "ryu": "りゅ", "ryo": "りょ",
    "gya": "ぎゃ", "gyu": "ぎゅ", "gyo": "ぎょ",
    "ja": "じゃ", "ju": "じゅ", "jo": "じょ",
    "bya": "びゃ", "byu": "びゅ", "byo": "びょ",
    "pya": "ぴゃ", "pyu": "ぴゅ", "pyo": "ぴょ"
}

def romaji_to_kana(text):
    if not text:
        return ""
    # if already contains kana or kanji
    if any('\u3040' <= c <= '\u30ff' or '\u4e00' <= c <= '\u9fff' for c in text):
        return text
    text = text.lower().strip()
    text = text.replace("ō", "ou").replace("ū", "uu").replace("ā", "aa").replace("ē", "ee").replace("ī", "ii")
    
    keys = sorted(ROMAJI_TO_HIRAGANA.keys(), key=lambda x: -len(x))
    res = ""
    i = 0
    n = len(text)
    while i < n:
        if i + 1 < n and text[i] == text[i+1] and text[i] not in 'aeioun ':
            res += "っ"
            i += 1
            continue
        matched = False
        for k in keys:
            if text[i:i+len(k)] == k:
                res += ROMAJI_TO_HIRAGANA[k]
                i += len(k)
                matched = True
                break
        if not matched:
            res += text[i]
            i += 1
    return res

def clean_text(t):
    return re.sub(r'\s+', ' ', t).strip()

def parse_basic1(doc):
    chapters = []
    # Basic 1 chapters:
    # Ch 1: p8-15
    # Ch 2: p16-20
    # Ch 3: p21-26
    # Ch 4: p27-33
    # Ch 5: p34-38
    # Ch 6: p39-43
    # Ch 7: p44-49
    # Ch 8: p50-54
    # Ch 9: p55-58
    # Ch 10: p59-64
    # Ch 11: p65-69
    ch_info = [
        (1, 8, 15, "Self Introduction (自己紹介)"),
        (2, 16, 20, "Let’s Count (数え方・数字)"),
        (3, 21, 26, "Time & Days (時間・曜日)"),
        (4, 27, 33, "This & That (これ・それ・あれ)"),
        (5, 34, 38, "Basic Adjectives (基本の形容詞)"),
        (6, 39, 43, "Verbs (基本の動詞)"),
        (7, 44, 49, "My Family & Daily Life (家族・日常)"),
        (8, 50, 54, "Tele-Conference & Transport (電話・交通)"),
        (9, 55, 58, "Travel & Places (旅行・場所)"),
        (10, 59, 64, "Give and Take (授受表現・あげる・もらう)"),
        (11, 65, 69, "Question Answers (質問と答え・総復習)"),
    ]
    
    for ch_num, start_p, end_p, title in ch_info:
        ch_text = ""
        for p in range(start_p - 1, end_p):
            ch_text += doc[p].get_text() + "\n"
        
        # Extract vocab lines
        vocab_list = []
        lines = ch_text.splitlines()
        for line in lines:
            line_str = line.strip()
            if not line_str or 'www.nihongomax' in line_str or 'Page |' in line_str:
                continue
            # Look for patterns with dots: word.......meaning
            m = re.search(r'^(\d+\.\s*)?([A-Za-zōūāēī\s/\(\)\'\-]+?)\s*[…\.]{2,}\s*(.+)$', line_str)
            if m:
                word_jp = m.group(2).strip()
                meaning = m.group(3).strip()
                if len(word_jp) > 1 and len(meaning) > 0 and not meaning.startswith('…'):
                    # skip header-like lines
                    if 'Let’s' not in word_jp and 'Chapter' not in word_jp and 'Page' not in word_jp:
                        kana = romaji_to_kana(word_jp)
                        vocab_list.append({
                            "id": f"b1_c{ch_num}_{len(vocab_list)+1}",
                            "chapter": ch_num,
                            "chapterTitle": title,
                            "romaji": word_jp,
                            "kana": kana,
                            "english": meaning,
                            "source": "Basic 1"
                        })
        
        # Extract listening sentences
        listening_items = []
        if 'Listening sentences for home practice:' in ch_text:
            l_part = ch_text.split('Listening sentences for home practice:')[1]
            if 'Video ' in l_part:
                l_part = l_part.split('Video ')[0]
            if 'Practice Exercise' in l_part:
                l_part = l_part.split('Practice Exercise')[0]
            
            # Find numbered items
            num_blocks = re.findall(r'(\d+)\.\s*([^\d]+?)(?=\n\s*\d+\.|\Z)', l_part)
            for num, content in num_blocks:
                content_clean = clean_text(content)
                if content_clean:
                    listening_items.append({
                        "id": f"l_b1_c{ch_num}_{num}",
                        "number": int(num),
                        "japanese": content_clean,
                        "kana": romaji_to_kana(content_clean),
                        "romaji": content_clean
                    })
        
        chapters.append({
            "chapter": ch_num,
            "title": title,
            "vocab": vocab_list,
            "listening": listening_items,
            "rawTextSample": ch_text[:400]
        })
    return chapters

b1 = fitz.open('resouces/basic 1 book pdf.pdf')
res = parse_basic1(b1)
for c in res:
    print(f"Basic 1 Ch {c['chapter']}: {len(c['vocab'])} vocab words, {len(c['listening'])} listening items")

