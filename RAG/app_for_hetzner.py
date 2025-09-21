import streamlit as st
import pandas as pd
import hashlib

# Set page config
st.set_page_config(
    page_title="Medical Billing RAG Assistant",
    page_icon="🏥",
    layout="wide"
)

# Simple login system
def hash_password(password):
    return hashlib.sha256(password.encode()).hexdigest()

def check_login(username, password):
    users = {
        "aistethxyz@gmail.com": {
            "password": hash_password("bestaisteth"),
            "role": "admin",
            "name": "AI Steth Admin"
        },
        "admin": {
            "password": hash_password("admin123"),
            "role": "admin", 
            "name": "Administrator"
        },
        "doctor": {
            "password": hash_password("doctor456"),
            "role": "doctor",
            "name": "Dr. Smith"
        },
        "billing": {
            "password": hash_password("billing789"),
            "role": "billing",
            "name": "Billing Specialist"
        }
    }
    
    if username in users and users[username]["password"] == hash_password(password):
        return True, users[username]
    return False, None

# Load billing codes
@st.cache_data
def load_billing_codes():
    try:
        df = pd.read_csv('Codes by class.csv')
        return df
    except:
        # Fallback data if CSV not found
        return pd.DataFrame({
            'code': ['H152', 'G004', 'Z107', 'F013', 'H153', 'G005', 'Z108', 'F014'],
            'description': [
                'Comprehensive Assessment', 
                'Critical Care', 
                'Incision & Drainage', 
                'Fracture Reduction',
                'Emergency Assessment',
                'Critical Care Extended',
                'Surgical Procedure',
                'Orthopedic Treatment'
            ],
            'amount': ['$75.00', '$150.00', '$85.00', '$120.00', '$65.00', '$200.00', '$95.00', '$140.00'],
            'code_type': ['Assessment', 'Critical Care', 'Procedure', 'Procedure', 'Assessment', 'Critical Care', 'Procedure', 'Procedure']
        })

def main():
    # Check if user is logged in
    if 'logged_in' not in st.session_state:
        st.session_state.logged_in = False
    
    if not st.session_state.logged_in:
        # Login page
        st.title("🏥 Medical Billing RAG Assistant")
        st.markdown("**Secure Login Required**")
        
        col1, col2, col3 = st.columns([1, 2, 1])
        with col2:
            with st.form("login_form"):
                st.subheader("🔐 Login")
                username = st.text_input("Username", placeholder="Enter your username")
                password = st.text_input("Password", type="password", placeholder="Enter your password")
                submit_button = st.form_submit_button("Login", type="primary")
                
                if submit_button:
                    if username and password:
                        success, user_info = check_login(username, password)
                        if success:
                            st.session_state.logged_in = True
                            st.session_state.user_info = user_info
                            st.session_state.username = username
                            st.rerun()
                        else:
                            st.error("❌ Invalid username or password")
                    else:
                        st.error("❌ Please enter both username and password")
            
            # Demo credentials
            st.markdown("---")
            st.markdown("### 🧪 Demo Credentials")
            st.markdown("""
            **Primary Admin:**
            - Username: `aistethxyz@gmail.com`
            - Password: `bestaisteth`
            
            **Admin:**
            - Username: `admin`
            - Password: `admin123`
            
            **Doctor:**
            - Username: `doctor`
            - Password: `doctor456`
            
            **Billing:**
            - Username: `billing`
            - Password: `billing789`
            """)
        
        return
    
    # Main application
    user_role = st.session_state.user_info['role']
    user_name = st.session_state.user_info['name']
    
    # Header with logout
    col1, col2, col3 = st.columns([3, 1, 1])
    with col1:
        st.title("🏥 Medical Billing RAG Assistant")
        st.success(f"Welcome back, {user_name}! ({user_role.title()} Access)")
    with col2:
        if st.button("🔄 Refresh"):
            st.rerun()
    with col3:
        if st.button("🚪 Logout"):
            st.session_state.logged_in = False
            st.session_state.user_info = None
            st.session_state.username = None
            st.rerun()
    
    # Load data
    df = load_billing_codes()
    
    # Search functionality
    st.header("🔍 Search Billing Codes")
    search_query = st.text_input("Enter your search query:", key="search_input")
    
    if st.button("🔍 Search", key="search_button"):
        if search_query:
            # Simple search
            results = df[df['description'].str.contains(search_query, case=False, na=False)]
            st.subheader(f"Found {len(results)} results")
            
            if len(results) > 0:
                for _, row in results.iterrows():
                    with st.expander(f"{row['code']} - {row['description']} - {row['amount']}"):
                        st.write(f"**Type:** {row['code_type']}")
                        st.write(f"**Description:** {row['description']}")
                        st.write(f"**Amount:** {row['amount']}")
            else:
                st.warning("No results found. Try a different search term.")
        else:
            st.warning("Please enter a search query.")
    
    # Role-based features
    if user_role == 'admin':
        st.header("👑 Admin Features")
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Total Users", "4")
        with col2:
            st.metric("Total Codes", len(df))
        with col3:
            st.metric("System Status", "Online")
        
        st.subheader("User Management")
        users = [
            {"username": "aistethxyz@gmail.com", "role": "admin", "status": "Active"},
            {"username": "doctor", "role": "doctor", "status": "Active"},
            {"username": "billing", "role": "billing", "status": "Active"}
        ]
        for user in users:
            st.write(f"**{user['username']}** ({user['role']}) - {user['status']}")
    
    elif user_role == 'doctor':
        st.header("👨‍⚕️ Doctor Features")
        st.info("Clinical-focused billing code search")
        
        col1, col2, col3 = st.columns(3)
        with col1:
            st.metric("Patients Today", "12")
        with col2:
            st.metric("Cases Completed", "8")
        with col3:
            st.metric("Revenue Today", "$2,450")
    
    elif user_role == 'billing':
        st.header("💼 Billing Features")
        st.info("Revenue-focused billing code search")
        
        col1, col2, col3, col4 = st.columns(4)
        with col1:
            st.metric("Today's Revenue", "$3,450")
        with col2:
            st.metric("This Week", "$18,200")
        with col3:
            st.metric("This Month", "$67,800")
        with col4:
            st.metric("Growth", "+5.2%")
    
    # Show all codes
    st.header("📋 All Billing Codes")
    st.dataframe(df, width='stretch')

if __name__ == "__main__":
    main()
