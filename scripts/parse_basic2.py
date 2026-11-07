"""
Basic 2 Parser Test
"""
import fitz
import re

b2 = fitz.open('resouces/Basic 2.pdf')

lesson_info = [
    (12, 3, 9, "Comparison & Seasons (比較・季節・天気)"),
    (13, 10, 16, "Desires & Purpose of Movement (欲しい・～たい・目的)"),
    (14, 17, 26, "Te-form & Requests (て形・～てください・～ています)"),
    (15, 27, 32, "Permissions & Prohibitions (～てもいい・～てはいけません)"),
    (16, 33, 39, "Chaining Actions & After (～てから・～くて・特徴)"),
    (17, 40, 45, "Nai-form & Obligations (ない形・～なければなりません)"),
    (18, 46, 54, "Dictionary Form & Ability (辞書形・～ことができます・趣味)"),
    (19, 55, 61, "Ta-form & Experiences (た形・～たことがあります・たりたり)"),
    (20, 62, 65, "Plain Form & Casual Speech (普通形・日常会話)"),
    (21, 66, 71, "Opinions & Quotations (～と思います・～と言いました)"),
    (22, 72, 78, "Noun Modification (名詞修飾・連体修飾)"),
    (23, 79, 85, "When & Conditionals (～とき・～と・道案内)"),
    (24, 86, 91, "Giving & Receiving Favors (授受動詞・～てあげる・～てもらう・～てくれる)"),
]

for lesson_num, start_p, end_p, title in lesson_info:
    text = ""
    for p in range(start_p - 1, end_p):
        text += b2[p].get_text() + "\n"
    
    # Vocabulary section
    v_text = ""
    if "Vocabulary:（ことば）" in text:
        v_part = text.split("Vocabulary:（ことば）")[1]
        # Ends when Grammar or PRACTICE or Listening starts
        end_markers = ["Grammar 1", "PRACTICE EXERCISE", "Listening sentences"]
        first_end = len(v_part)
        for em in end_markers:
            idx = v_part.find(em)
            if idx != -1 and idx < first_end:
                first_end = idx
        v_text = v_part[:first_end]
    
    lines = [l.strip() for l in v_text.splitlines() if l.strip()]
    # filter out header lines
    clean_lines = [l for l in lines if not ('Log on to' in l or 'Page |' in l or 'www.' in l)]
    
    # Group pairs: Japanese line followed by English line
    vocab_items = []
    i = 0
    while i < len(clean_lines):
        item_jp = clean_lines[i]
        # Check if item_jp contains Japanese characters
        is_jp = any('\u3040' <= c <= '\u30ff' or '\u4e00' <= c <= '\u9fff' for c in item_jp)
        if is_jp and i + 1 < len(clean_lines):
            eng = clean_lines[i+1]
            # Verify eng is primarily english
            vocab_items.append((item_jp, eng))
            i += 2
        else:
            i += 1
            
    print(f"Lesson {lesson_num} ({title[:15]}...): {len(vocab_items)} vocab items")

