#!/bin/bash

# Simple Medical Billing RAG - Hetzner Cloud Deployment
echo "🚀 Deploying Simple Medical Billing RAG to Hetzner Cloud..."

# Update system
apt update && apt upgrade -y

# Install Python and pip
apt install -y python3 python3-pip nginx

# Create application directory
mkdir -p /opt/medical-billing-rag
cd /opt/medical-billing-rag

# Install Python packages
pip3 install streamlit pandas

# Create the simple application
cat > app.py << 'EOF'
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
    st.dataframe(df, use_container_width=True)

if __name__ == "__main__":
    main()
EOF

# Create systemd service
cat > /etc/systemd/system/medical-billing-rag.service << 'EOF'
[Unit]
Description=Medical Billing RAG Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/medical-billing-rag
Environment=PATH=/usr/local/bin:/usr/bin:/bin
ExecStart=/usr/bin/python3 -m streamlit run app.py --server.port 8501 --server.address 0.0.0.0 --server.headless true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
cat > /etc/nginx/sites-available/medical-billing-rag << 'EOF'
server {
    listen 80;
    server_name 5.161.47.228;

    location / {
        proxy_pass http://127.0.0.1:8501;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
EOF

# Enable site
ln -sf /etc/nginx/sites-available/medical-billing-rag /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and restart services
nginx -t && systemctl reload nginx
systemctl daemon-reload
systemctl enable medical-billing-rag.service
systemctl start medical-billing-rag.service

# Configure firewall
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Check status
echo "✅ Checking deployment status..."
sleep 5
systemctl status medical-billing-rag.service --no-pager

echo "🎉 Medical Billing RAG is now running on http://5.161.47.228"
echo "📊 Admin Panel: http://5.161.47.228 (login with aistethxyz@gmail.com / bestaisteth)"
echo "📝 Logs: journalctl -u medical-billing-rag.service -f"
echo "🔄 Restart: systemctl restart medical-billing-rag.service"
echo "🛑 Stop: systemctl stop medical-billing-rag.service"
EOF

# Create upload script
cat > upload_simple.bat << 'EOF'
@echo off
echo 🚀 Uploading Simple Medical Billing RAG to Hetzner Cloud Server...

echo 📁 Uploading application files...
scp simple_app.py root@5.161.47.228:/opt/medical-billing-rag/app.py
scp "Codes by class.csv" root@5.161.47.228:/opt/medical-billing-rag/
scp deploy_simple.sh root@5.161.47.228:/opt/medical-billing-rag/

echo 🔧 Running deployment script on server...
ssh root@5.161.47.228 "cd /opt/medical-billing-rag && chmod +x deploy_simple.sh && ./deploy_simple.sh"

echo ✅ Deployment completed!
echo 🌐 Your application is now available at: http://5.161.47.228
echo 🔐 Login with: aistethxyz@gmail.com / bestaisteth

pause
EOF

echo "✅ Simple deployment files created!"
echo "🚀 To deploy to your Hetzner server:"
echo "1. Run: upload_simple.bat"
echo "2. Or manually:"
echo "   - Upload files to server"
echo "   - Run: ssh root@5.161.47.228"
echo "   - Run: cd /opt/medical-billing-rag && chmod +x deploy_simple.sh && ./deploy_simple.sh"

