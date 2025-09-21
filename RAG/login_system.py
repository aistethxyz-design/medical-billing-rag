import streamlit as st
import hashlib
import time
from datetime import datetime, timedelta

class LoginSystem:
    def __init__(self):
        # Simple user database (in production, use a real database)
        self.users = {
            "aistethxyz@gmail.com": {
                "password_hash": self._hash_password("bestaisteth"),
                "role": "admin",
                "name": "AI Steth Admin"
            },
            "admin": {
                "password_hash": self._hash_password("admin123"),
                "role": "admin",
                "name": "Administrator"
            },
            "doctor": {
                "password_hash": self._hash_password("doctor456"),
                "role": "doctor", 
                "name": "Dr. Smith"
            },
            "billing": {
                "password_hash": self._hash_password("billing789"),
                "role": "billing",
                "name": "Billing Specialist"
            }
        }
        
        # Session timeout (in minutes)
        self.session_timeout = 60
        
    def _hash_password(self, password: str) -> str:
        """Hash password using SHA-256"""
        return hashlib.sha256(password.encode()).hexdigest()
    
    def verify_login(self, username: str, password: str) -> bool:
        """Verify user credentials"""
        if username in self.users:
            password_hash = self._hash_password(password)
            return self.users[username]["password_hash"] == password_hash
        return False
    
    def get_user_info(self, username: str) -> dict:
        """Get user information"""
        return self.users.get(username, {})
    
    def is_session_valid(self) -> bool:
        """Check if current session is still valid"""
        if 'login_time' not in st.session_state:
            return False
        
        login_time = st.session_state.login_time
        current_time = datetime.now()
        
        # Check if session has expired
        if current_time - login_time > timedelta(minutes=self.session_timeout):
            self.logout()
            return False
        
        return True
    
    def login(self, username: str, password: str) -> bool:
        """Perform login and set session"""
        if self.verify_login(username, password):
            st.session_state.logged_in = True
            st.session_state.username = username
            st.session_state.login_time = datetime.now()
            st.session_state.user_info = self.get_user_info(username)
            return True
        return False
    
    def logout(self):
        """Clear session and logout user"""
        for key in ['logged_in', 'username', 'login_time', 'user_info']:
            if key in st.session_state:
                del st.session_state[key]
    
    def show_login_page(self):
        """Display login page"""
        st.set_page_config(
            page_title="Medical Billing RAG - Login",
            page_icon="🔐",
            layout="centered"
        )
        
        # Custom CSS for login page
        st.markdown("""
        <style>
        .login-container {
            max-width: 400px;
            margin: 0 auto;
            padding: 2rem;
            border: 1px solid #ddd;
            border-radius: 10px;
            box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
            background-color: #f8f9fa;
        }
        .login-title {
            text-align: center;
            color: #2c3e50;
            margin-bottom: 2rem;
        }
        .login-button {
            width: 100%;
            padding: 0.5rem;
            background-color: #3498db;
            color: white;
            border: none;
            border-radius: 5px;
            font-size: 1.1rem;
        }
        .error-message {
            color: #e74c3c;
            text-align: center;
            margin-top: 1rem;
        }
        .success-message {
            color: #27ae60;
            text-align: center;
            margin-top: 1rem;
        }
        </style>
        """, unsafe_allow_html=True)
        
        # Login form
        with st.container():
            st.markdown('<div class="login-container">', unsafe_allow_html=True)
            
            st.markdown('<h1 class="login-title">🏥 Medical Billing RAG System</h1>', unsafe_allow_html=True)
            st.markdown('<h2 class="login-title">🔐 Secure Login</h2>', unsafe_allow_html=True)
            
            with st.form("login_form"):
                username = st.text_input("👤 Username", placeholder="Enter your username")
                password = st.text_input("🔑 Password", type="password", placeholder="Enter your password")
                
                col1, col2, col3 = st.columns([1, 2, 1])
                with col2:
                    login_button = st.form_submit_button("🚀 Login", use_container_width=True)
                
                if login_button:
                    if username and password:
                        if self.login(username, password):
                            st.success("✅ Login successful! Redirecting...")
                            time.sleep(1)
                            st.rerun()
                        else:
                            st.error("❌ Invalid username or password")
                    else:
                        st.error("❌ Please enter both username and password")
            
            # Demo credentials
            st.markdown("---")
            st.markdown("### 🧪 Demo Credentials")
            st.markdown("""
            **Primary Admin Access:**
            - Username: `aistethxyz@gmail.com`
            - Password: `bestaisteth`
            
            **Admin Access:**
            - Username: `admin`
            - Password: `admin123`
            
            **Doctor Access:**
            - Username: `doctor`
            - Password: `doctor456`
            
            **Billing Access:**
            - Username: `billing`
            - Password: `billing789`
            """)
            
            st.markdown("</div>", unsafe_allow_html=True)
    
    def show_logout_button(self):
        """Show logout button in sidebar"""
        with st.sidebar:
            st.markdown("---")
            if st.button("🚪 Logout", use_container_width=True):
                self.logout()
                st.rerun()
            
            # Show session info
            if 'user_info' in st.session_state:
                user_info = st.session_state.user_info
                st.markdown(f"**Logged in as:** {user_info.get('name', 'Unknown')}")
                st.markdown(f"**Role:** {user_info.get('role', 'Unknown').title()}")
                
                # Show session time remaining
                if 'login_time' in st.session_state:
                    login_time = st.session_state.login_time
                    current_time = datetime.now()
                    time_remaining = self.session_timeout - (current_time - login_time).total_seconds() / 60
                    st.markdown(f"**Session expires in:** {int(time_remaining)} minutes")

def check_authentication():
    """Check if user is authenticated, show login page if not"""
    login_system = LoginSystem()
    
    # Check if user is logged in and session is valid
    if 'logged_in' not in st.session_state or not login_system.is_session_valid():
        login_system.show_login_page()
        return False, None
    
    return True, login_system
