import streamlit as st
import time
import os
import re
import uuid
from datetime import datetime
from pinecone_rag_agent import PineconeBillingRagAgent

# Page configuration
st.set_page_config(
    page_title="AISteth | Neural Billing Core",
    page_icon="🧬",
    layout="wide",
    initial_sidebar_state="expanded"
)

# -----------------------------------------------------------------------------
# FUTURISTIC UI/UX DESIGN SYSTEM (V3.0)
# -----------------------------------------------------------------------------
st.markdown("""
<style>
    /* --------------------------------------------------------------------- */
    /* FONTS & GLOBAL THEME                                                  */
    /* --------------------------------------------------------------------- */
    @import url('https://fonts.googleapis.com/css2?family=Syncopate:wght@400;700&family=Space+Grotesk:wght@300;400;500;600;700&display=swap');

    :root {
        --primary: #00f2ff;
        --secondary: #7000ff;
        --accent: #ff0055;
        --bg-dark: #0a0e17;
        --text-main: #e0e6ed;
        --glass-border: rgba(0, 242, 255, 0.15);
    }

    .stApp {
        background-color: var(--bg-dark);
        background-image: 
            linear-gradient(rgba(10, 14, 23, 0.9), rgba(10, 14, 23, 0.95)),
            url("https://www.transparenttextures.com/patterns/cubes.png");
        font-family: 'Space Grotesk', sans-serif;
    }

    /* --------------------------------------------------------------------- */
    /* SIDEBAR STYLING (VS Code Style)                                      */
    /* --------------------------------------------------------------------- */
    [data-testid="stSidebar"] {
        background-color: #252526 !important;
        border-right: 1px solid #3e3e42 !important;
        min-width: 280px !important;
    }
    
    /* Force sidebar to be visible */
    [data-testid="stSidebar"][aria-expanded="false"] {
        display: block !important;
    }
    
    /* Ensure sidebar content is visible */
    [data-testid="stSidebar"] > div {
        display: block !important;
    }
    
    /* Sidebar toggle button styling */
    [data-testid="stSidebar"] button[kind="header"] {
        background-color: #252526 !important;
        color: #cccccc !important;
    }

    /* VS Code-style thread tree */
    .vscode-thread-item {
        display: flex;
        align-items: center;
        padding: 0.2rem 0.5rem;
        margin: 0;
        cursor: pointer;
        border-radius: 2px;
        transition: background-color 0.1s ease;
        color: #cccccc;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
        font-size: 0.85rem;
        user-select: none;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
    }

    .vscode-thread-item:hover {
        background-color: #2a2d2e;
    }

    .vscode-thread-item.active {
        background-color: #094771 !important;
        color: #ffffff !important;
        font-weight: 500;
    }

    .vscode-thread-icon {
        display: inline-block;
        width: 16px;
        margin-right: 0.3rem;
        text-align: center;
        font-size: 0.75rem;
    }

    /* Indentation levels */
    .vscode-level-0 { padding-left: 0.5rem; }
    .vscode-level-1 { padding-left: 1.8rem; }
    .vscode-level-2 { padding-left: 3.1rem; }
    .vscode-level-3 { padding-left: 4.4rem; }
    .vscode-level-4 { padding-left: 5.7rem; }
    
    /* Thread button styling - VS Code style */
    [data-testid="stButton"] button {
        text-align: left !important;
        font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
        font-size: 0.85rem !important;
        padding: 0.3rem 0.5rem !important;
        background: transparent !important;
        border: none !important;
        color: #cccccc !important;
        border-radius: 2px !important;
        width: 100% !important;
        justify-content: flex-start !important;
        display: flex !important;
        align-items: center !important;
        gap: 0.5rem !important;
    }
    
    [data-testid="stButton"] button:hover {
        background-color: #2a2d2e !important;
    }
    
    /* Emoji as profile picture/avatar */
    .thread-emoji {
        font-size: 1.2rem !important;
        width: 24px !important;
        height: 24px !important;
        display: inline-flex !important;
        align-items: center !important;
        justify-content: center !important;
        flex-shrink: 0 !important;
    }
    
    /* Indentation for thread levels */
    [data-testid="stButton"]:has(button[key*="thread_"]) {
        margin-left: 0 !important;
    }
    
    /* Apply indentation based on level */
    button[key*="thread_"] {
        padding-left: 0.5rem !important;
    }

    /* --------------------------------------------------------------------- */
    /* MAIN CHAT AREA                                                        */
    /* --------------------------------------------------------------------- */
    .breadcrumb {
        font-family: 'Syncopate', sans-serif;
        font-size: 0.8rem;
        color: var(--text-dim);
        margin-bottom: 1rem;
        padding: 0.5rem 1rem;
        background: rgba(0,0,0,0.3);
        border-radius: 20px;
        display: inline-block;
        border: 1px solid var(--glass-border);
    }

    .breadcrumb span {
        color: var(--primary);
    }

    /* Message Bubbles */
    [data-testid="stChatMessage"] {
        background: transparent !important;
    }

    [data-testid="stChatMessageContent"] {
        background: rgba(20, 27, 45, 0.7);
        backdrop-filter: blur(10px);
        border: 1px solid rgba(255, 255, 255, 0.08);
        border-radius: 12px;
        box-shadow: 0 4px 6px rgba(0,0,0,0.1);
    }

    /* Context Message (Parent History) */
    .context-msg {
        opacity: 0.6;
        border-left: 2px dashed var(--secondary);
        padding-left: 1rem;
        margin-bottom: 1rem;
    }

    /* --------------------------------------------------------------------- */
    /* SOURCE CARDS                                                          */
    /* --------------------------------------------------------------------- */
    .source-item {
        background: #0f1319;
        border: 1px solid var(--glass-border);
        border-radius: 6px;
        padding: 1rem;
        margin-top: 0.5rem;
    }
    
    .match-tag {
        background: rgba(0, 242, 255, 0.1);
        color: var(--primary);
        padding: 2px 6px;
        border-radius: 4px;
        font-size: 0.75rem;
        border: 1px solid var(--primary);
    }

    /* Hide Streamlit Elements */
    #MainMenu {visibility: hidden;}
    footer {visibility: hidden;}
    header {visibility: hidden;}
    
</style>
""", unsafe_allow_html=True)

# -----------------------------------------------------------------------------
# LOGIC & STATE MANAGEMENT
# -----------------------------------------------------------------------------

if "agent" not in st.session_state:
    try:
        with st.spinner("BOOTING NEURAL CORE..."):
            st.session_state.agent = PineconeBillingRagAgent()
    except Exception as e:
        st.error(f"CORE FAILURE: {e}")

# --- THREAD MANAGEMENT ---

def create_thread(name="New Consultation", parent_id=None, first_message=None):
    thread_id = str(uuid.uuid4())
    
    # Classify content if first message provided
    emoji = "🏥"
    color = "#64748b"
    if first_message and "agent" in st.session_state:
        classification = st.session_state.agent.classify_thread_content(first_message)
        emoji = classification['emoji']
        color = classification['color']
    
    st.session_state.threads[thread_id] = {
        "id": thread_id,
        "name": name,
        "messages": [], # Only stores messages unique to this thread
        "parent_id": parent_id,
        "created_at": datetime.now(),
        "emoji": emoji,
        "color": color
    }
    return thread_id

def get_full_context_messages(thread_id):
    """Recursively fetch messages from ancestor threads to build full context."""
    thread = st.session_state.threads.get(thread_id)
    if not thread:
        return []
    
    messages = []
    # If this is a subthread, get parent messages first (DYNAMIC LINKING)
    if thread['parent_id']:
        messages.extend(get_full_context_messages(thread['parent_id']))
    
    # Add current thread messages
    messages.extend(thread['messages'])
    return messages

def render_thread_recursive(thread_id, level=0, is_last_sibling=True):
    """Recursively render thread tree in VS Code file explorer style with collapsible functionality."""
    thread = st.session_state.threads.get(thread_id)
    if not thread:
        return
    
    is_active = thread_id == st.session_state.current_thread_id
    
    # Get emoji and color from thread metadata (default if not set)
    # Only show emoji for root threads (level 0), not subthreads
    emoji = thread.get('emoji', '🏥') if level == 0 else ""
    color = thread.get('color', '#64748b')
    
    # Clean thread name (remove prefixes for cleaner display)
    display_name = thread['name']
    if display_name.startswith("Sub: "):
        display_name = display_name[5:]
    if display_name.startswith("Sister: "):
        display_name = display_name[8:]
    
    # Check if this thread has children
    children = [t for t in st.session_state.threads.values() if t['parent_id'] == thread_id]
    has_children = len(children) > 0
    
    # Initialize expanded state for threads with children
    if "expanded_threads" not in st.session_state:
        st.session_state.expanded_threads = set()
    
    # Check if thread is expanded (default to expanded)
    is_expanded = thread_id in st.session_state.expanded_threads if has_children else True
    if has_children and thread_id not in st.session_state.expanded_threads:
        # Auto-expand threads with children by default
        st.session_state.expanded_threads.add(thread_id)
        is_expanded = True
    
    button_key = f"thread_{thread_id}"
    
    # Build tree connector prefix (no folder/file icons)
    tree_prefix = ""
    if level > 0:
        # Add tree lines for hierarchy
        if is_last_sibling:
            tree_prefix = "└─ "
        else:
            tree_prefix = "├─ "
    
    # Add expand/collapse icon for threads with children (VS Code style)
    expand_icon = "▼" if is_expanded else "▶"
    if has_children:
        tree_prefix = f"{expand_icon} {tree_prefix}" if level > 0 else f"{expand_icon} "
    
    # Create button label: Tree prefix + Emoji (only for root) + Name
    if level == 0 and emoji:
        button_label = f"{tree_prefix}{emoji} {display_name}"
    else:
        button_label = f"{tree_prefix}{display_name}"
    
    # Calculate indentation (VS Code uses ~1.2rem per level)
    indent_rem = 0.5 + (level * 1.2)
    
    # Create button - clicking expands/collapses if has children, otherwise selects thread
    if st.button(button_label, key=button_key, use_container_width=True):
        # If thread has children, toggle expansion
        if has_children:
            if thread_id in st.session_state.expanded_threads:
                st.session_state.expanded_threads.remove(thread_id)
            else:
                st.session_state.expanded_threads.add(thread_id)
        # Always select the thread
        st.session_state.current_thread_id = thread_id
        st.rerun()
        
        # Apply VS Code-style styling with proper indentation and minimal gaps
        st.markdown(f"""
            <style>
                button[data-testid*="{button_key}"] {{
                    text-align: left !important;
                    font-family: 'Consolas', 'Monaco', 'Courier New', monospace !important;
                    font-size: 0.85rem !important;
                    padding: 0.15rem 0.5rem !important;
                    padding-left: {indent_rem}rem !important;
                    background: {'#094771' if is_active else 'transparent'} !important;
                    color: {'#ffffff' if is_active else '#cccccc'} !important;
                    border: none !important;
                    border-radius: 2px !important;
                    display: flex !important;
                    align-items: center !important;
                    gap: 0.4rem !important;
                    margin-bottom: 0rem !important;
                    margin-top: 0rem !important;
                    line-height: 1.2 !important;
                }}
                button[data-testid*="{button_key}"]:hover {{
                    background-color: {'#094771' if is_active else '#2a2d2e'} !important;
                }}
            </style>
            {f'''<script>
                setTimeout(function() {{
                    const btn = document.querySelector('button[data-testid*="{button_key}"]');
                    if (btn) {{
                        const text = btn.textContent || btn.innerText;
                        // Extract emoji (look for common medical emojis) - only for root threads
                        const emojiRegex = /([❤️🧠🫁🦴🩹🚑💉👶⚡🔪👁️👂🫱🫀🏥])/u;
                        const match = text.match(emojiRegex);
                        if (match) {{
                            const emoji = match[1];
                            const parts = text.split(emoji);
                            if (parts.length === 2) {{
                                btn.innerHTML = parts[0] + '<span style="font-size: 1.4rem; display: inline-flex; align-items: center; justify-content: center; width: 26px; height: 26px; border-radius: 50%; background-color: {color}30; border: 1.5px solid {color}60; margin-right: 0.3rem; flex-shrink: 0;">' + emoji + '</span>' + parts[1];
                            }}
                        }}
                    }}
                }}, 100);
            </script>''' if level == 0 else ''}
        """, unsafe_allow_html=True)
    
    # Render children recursively (only if expanded)
    if is_expanded and has_children:
        children.sort(key=lambda x: x['created_at'], reverse=True)
        for idx, child in enumerate(children):
            is_last = (idx == len(children) - 1)
            render_thread_recursive(child['id'], level + 1, is_last)

if "threads" not in st.session_state:
    st.session_state.threads = {}
    initial_id = create_thread()
    st.session_state.current_thread_id = initial_id

# Ensure valid current thread
if st.session_state.current_thread_id not in st.session_state.threads:
    # If current thread was deleted or lost, reset to newest or create new
    if st.session_state.threads:
        st.session_state.current_thread_id = list(st.session_state.threads.keys())[0]
    else:
        new_id = create_thread()
        st.session_state.current_thread_id = new_id

# Ensure all threads have emoji/color (backfill for existing threads)
for thread_id, thread in st.session_state.threads.items():
    if 'emoji' not in thread:
        thread['emoji'] = '🏥'
    if 'color' not in thread:
        thread['color'] = '#64748b'
        
current_thread = st.session_state.threads[st.session_state.current_thread_id]

# -----------------------------------------------------------------------------
# SIDEBAR UI
# -----------------------------------------------------------------------------
with st.sidebar:
    st.markdown("""
        <div style="text-align:center; margin-bottom:1rem">
            <h1 style="font-family:'Syncopate'; font-size:1.8rem; margin:0; color:#00f2ff">AISteth</h1>
            <p style="font-family:'Space Grotesk'; font-size:0.7rem; letter-spacing:3px; color:#64748b">NEURAL BILLING V3.0</p>
        </div>
    """, unsafe_allow_html=True)

    # Thread Creation Buttons (Current thread is automatically selected)
    current_emoji = current_thread.get('emoji', '🏥')
    current_color = current_thread.get('color', '#cccccc')
    st.markdown("""
        <div style="padding: 0.5rem; background: #2d2d30; border-bottom: 1px solid #3e3e42; margin: -1rem -1rem 0.5rem -1rem;">
            <div style="font-size: 0.75rem; color: #858585; text-transform: uppercase; letter-spacing: 1px; margin-bottom: 0.3rem;">Current Thread</div>
            <div style="font-size: 0.9rem; color: {}; font-weight: 500;">{} {}</div>
        </div>
    """.format(current_color, current_emoji, current_thread['name']), unsafe_allow_html=True)
    
    st.markdown("""
        <div style="padding: 0.5rem; background: #2d2d30; border-bottom: 1px solid #3e3e42; margin: 0.5rem -1rem;">
            <div style="font-size: 0.75rem; color: #858585; text-transform: uppercase; letter-spacing: 1px;">Create Thread</div>
        </div>
    """, unsafe_allow_html=True)
    
    # Button 1: New Root Thread (no parent)
    btn1_key = "btn_new_thread"
    if st.button("🆕 NEW THREAD", key=btn1_key, use_container_width=True, help="Create a fresh thread with no parent"):
        new_id = create_thread()
        st.session_state.current_thread_id = new_id
        st.rerun()
    
    # Button 2: Sister Thread (same parent as current)
    btn2_key = "btn_sister_thread"
    if current_thread['parent_id']:
        if st.button("👯 SISTER THREAD", key=btn2_key, use_container_width=True, help=f"Create a sibling thread (same parent as '{current_thread['name']}')"):
            new_id = create_thread(name=f"Sister: {current_thread['name']}", parent_id=current_thread['parent_id'])
            st.session_state.current_thread_id = new_id
            st.rerun()
    else:
        # If current is root, sister = another root
        if st.button("👯 SISTER THREAD", key=btn2_key, use_container_width=True, help="Create another root thread"):
            new_id = create_thread()
            st.session_state.current_thread_id = new_id
            st.rerun()
    
    # Button 3: Subthread (child of current)
    btn3_key = "btn_subthread"
    if st.button("🌿 SUBTHREAD", key=btn3_key, use_container_width=True, help=f"Create a child thread under '{current_thread['name']}'"):
        # Create subthread with temporary name - will be auto-named when first message is sent
        new_id = create_thread(name="New Subthread", parent_id=current_thread['id'])
        st.session_state.current_thread_id = new_id
        st.rerun()
    
    # Style the navigation buttons to be more visible
    st.markdown(f"""
        <style>
            button[data-testid*="{btn1_key}"],
            button[data-testid*="{btn2_key}"],
            button[data-testid*="{btn3_key}"] {{
                background: rgba(0, 242, 255, 0.1) !important;
                border: 1px solid rgba(0, 242, 255, 0.3) !important;
                color: #00f2ff !important;
                font-weight: 500 !important;
                margin-bottom: 0.3rem !important;
            }}
            button[data-testid*="{btn1_key}"]:hover,
            button[data-testid*="{btn2_key}"]:hover,
            button[data-testid*="{btn3_key}"]:hover {{
                background: rgba(0, 242, 255, 0.2) !important;
                border-color: rgba(0, 242, 255, 0.5) !important;
            }}
        </style>
    """, unsafe_allow_html=True)

    st.markdown("""
        <div style="padding: 0.5rem; background: #2d2d30; border-bottom: 1px solid #3e3e42; margin: 0.5rem -1rem 0.5rem -1rem;">
            <div style="font-size: 0.75rem; color: #858585; text-transform: uppercase; letter-spacing: 1px;">Thread Hierarchy</div>
        </div>
    """, unsafe_allow_html=True)
    
    # Recursive rendering of thread tree
    # 1. Find root threads (no parent)
    root_threads = [t for t in st.session_state.threads.values() if not t['parent_id']]
    root_threads.sort(key=lambda x: x['created_at'], reverse=True)

    for root in root_threads:
        render_thread_recursive(root['id'], level=0)

    st.markdown("---")
    if st.button("🔴 PURGE ALL DATA", use_container_width=True):
        st.session_state.threads = {}
        st.session_state.current_thread_id = create_thread()
        st.rerun()

# -----------------------------------------------------------------------------
# MAIN UI & RENDER LOGIC
# -----------------------------------------------------------------------------

# --- SIDEBAR TOGGLE BUTTON (if sidebar is collapsed) ---
st.markdown("""
    <style>
        /* Force sidebar to be expanded and visible */
        [data-testid="stSidebar"] {
            visibility: visible !important;
            display: block !important;
            transform: translateX(0) !important;
        }
        
        /* Floating sidebar toggle button (always visible) */
        .sidebar-toggle-btn {
            position: fixed;
            left: 0;
            top: 50%;
            transform: translateY(-50%);
            z-index: 9999;
            background: rgba(0, 242, 255, 0.9) !important;
            color: #0a0e17 !important;
            border: 2px solid #00f2ff !important;
            border-radius: 0 8px 8px 0 !important;
            padding: 0.5rem 0.3rem !important;
            font-size: 1.2rem !important;
            cursor: pointer !important;
            box-shadow: 0 4px 12px rgba(0, 242, 255, 0.3) !important;
            transition: all 0.3s ease !important;
        }
        
        .sidebar-toggle-btn:hover {
            background: rgba(0, 242, 255, 1) !important;
            transform: translateY(-50%) translateX(5px) !important;
        }
    </style>
    <button class="sidebar-toggle-btn" onclick="toggleSidebar()" title="Toggle Sidebar">
        ☰
    </button>
    <script>
        function toggleSidebar() {
            const sidebar = document.querySelector('[data-testid="stSidebar"]');
            const toggleBtn = document.querySelector('button[kind="header"][data-testid="baseButton-header"]');
            if (toggleBtn) {
                toggleBtn.click();
            } else if (sidebar) {
                const isExpanded = sidebar.getAttribute('aria-expanded') === 'true';
                sidebar.setAttribute('aria-expanded', isExpanded ? 'false' : 'true');
                sidebar.style.transform = isExpanded ? 'translateX(-100%)' : 'translateX(0)';
            }
        }
        
        // Ensure sidebar is expanded on page load
        setTimeout(function() {
            const sidebar = document.querySelector('[data-testid="stSidebar"]');
            if (sidebar) {
                sidebar.setAttribute('aria-expanded', 'true');
                sidebar.style.display = 'block';
                sidebar.style.visibility = 'visible';
                sidebar.style.transform = 'translateX(0)';
            }
        }, 100);
    </script>
""", unsafe_allow_html=True)

# --- BREADCRUMB HEADER ---
parent_info = ""
if current_thread['parent_id']:
    parent = st.session_state.threads.get(current_thread['parent_id'])
    if parent:
        parent_info = f"<span style='opacity:0.5'>{parent['name']}</span> > "

st.markdown(f"""
    <div class="breadcrumb">
        {parent_info} <span>{current_thread['name']}</span>
    </div>
""", unsafe_allow_html=True)


# --- DISPLAY CONTEXT (From Parent) ---
# If this is a subthread, show we are pulling context
if current_thread['parent_id']:
    with st.expander("📡 INHERITED CONTEXT (LIVE LINKED)", expanded=False):
        ancestor_msgs = get_full_context_messages(current_thread['parent_id'])
        for msg in ancestor_msgs:
            st.markdown(f"**{msg['role'].upper()}:** {msg['content'][:100]}...")

# --- DISPLAY CURRENT THREAD MESSAGES ---
if not current_thread["messages"]:
    # Welcome message when chat is empty
    st.markdown("""
        <div style="text-align: center; padding: 3rem; color: #64748b;">
            <h2 style="color: #00f2ff; font-family: 'Syncopate', sans-serif; margin-bottom: 1rem;">🧬 AISteth Neural Billing</h2>
            <p style="font-size: 1.1rem; margin-bottom: 0.5rem;">Ask me anything about medical billing codes and use cases.</p>
            <p style="font-size: 0.9rem;">Type your question in the chat input below to get started.</p>
        </div>
    """, unsafe_allow_html=True)

for message in current_thread["messages"]:
    with st.chat_message(message["role"]):
        st.markdown(message["content"])
        if "sources" in message:
            # Render Sources (Clean)
            with st.expander("🔍 NEURAL SOURCES"):
                # Clean source rendering code inline
                html = '<div class="source-container">'
                for idx, src in enumerate(message["sources"]):
                    meta = src['metadata']
                    score = src['score']
                    content_text = ""
                    if meta.get('source') == 'csv':
                        content_text = f"**{meta.get('code')}** - {meta.get('amount')}"
                    else:
                        content_text = re.sub(r'<[^>]+>', '', meta.get('text', ''))[:200] + "..."
                    
                    html += f"""
                    <div class="source-item">
                        <div style="display:flex; justify-content:space-between; color:#94a3b8; font-size:0.7rem;">
                            <span>SOURCE {idx+1}</span>
                            <span class="match-tag">{score:.1%}</span>
                        </div>
                        <div style="margin-top:0.5rem; font-size:0.9rem; color:#e0e6ed;">{content_text}</div>
                    </div>
                    """
                html += '</div>'
                st.markdown(html, unsafe_allow_html=True)

# --- INPUT HANDLING ---
if prompt := st.chat_input("Input billing query..."):
    # 1. Append User Message to State
    current_thread["messages"].append({"role": "user", "content": prompt})
    
    # 2. Rerun immediately so the message appears in the loop above
    # This solves the "invisible answer" bug by forcing a refresh before processing
    st.rerun()

# --- PROCESSING (Runs after rerun if last message was user) ---
if current_thread["messages"] and current_thread["messages"][-1]["role"] == "user":
    last_user_msg = current_thread["messages"][-1]["content"]
    
    with st.chat_message("assistant"):
        message_placeholder = st.empty()
        
        try:
            # Retrieve
            with st.status("VECTOR SCAN...", expanded=True) as status:
                matches = st.session_state.agent.retrieve(last_user_msg)
                status.update(label="SCAN COMPLETE", state="complete", expanded=False)
            
            # Generate (Using Full Context)
            with st.spinner("NEURAL SYNTHESIS..."):
                full_context = get_full_context_messages(current_thread['id'])
                
                if st.session_state.agent.has_llm:
                    response_text = st.session_state.agent.generate_response(last_user_msg, matches, full_context)
                else:
                    response_text = "⚠️ OFFLINE MODE."
            
            message_placeholder.markdown(response_text)
            
            # Append Assistant Message FIRST (before any reruns)
            current_thread["messages"].append({
                "role": "assistant", 
                "content": response_text,
                "sources": matches
            })
            
            # Auto-Rename and Classify AFTER appending message (prevents infinite loop)
            # Only rename if still default name (including subthreads)
            if current_thread["name"] in ["New Consultation", "New Chat", "New Subthread"] or current_thread["name"].startswith("Sub: "):
                new_title = st.session_state.agent.generate_chat_title(last_user_msg)
                current_thread["name"] = new_title
                
                # Classify content and update emoji/color (only for root threads, not subthreads)
                if not current_thread.get('parent_id'):
                    classification = st.session_state.agent.classify_thread_content(last_user_msg)
                    current_thread["emoji"] = classification['emoji']
                    current_thread["color"] = classification['color']
                
                # Rerun only to update sidebar with new name and classification
                st.rerun()
            
        except Exception as e:
            st.error(f"ERROR: {e}")
