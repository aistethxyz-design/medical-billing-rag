#!/bin/bash

# Medical Billing RAG - Hetzner Cloud Deployment Script
# Run this on your Hetzner server: 5.161.47.228

echo "🚀 Starting Medical Billing RAG Deployment on Hetzner Cloud..."

# Update system
echo "📦 Updating system packages..."
apt update && apt upgrade -y

# Install Python and pip
echo "🐍 Installing Python and dependencies..."
apt install -y python3 python3-pip python3-venv nginx

# Create application directory
echo "📁 Setting up application directory..."
mkdir -p /opt/medical-billing-rag
cd /opt/medical-billing-rag

# Create virtual environment
echo "🔧 Creating Python virtual environment..."
python3 -m venv venv
source venv/bin/activate

# Install Python packages
echo "📦 Installing Python packages..."
pip install streamlit pandas numpy

# Create the application file
echo "📝 Creating application files..."
cat > app.py << 'EOF'
import streamlit as st
import pandas as pd
import numpy as np
import os
from datetime import datetime, timedelta
import hashlib
import time

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
    
    # Role-based interface
    if user_role == 'admin':
        # Admin interface
        tab1, tab2, tab3, tab4 = st.tabs(["🔍 Search & Analyze", "👥 User Management", "📊 Analytics", "⚙️ System Settings"])
        
        with tab1:
            st.header("🔍 Advanced Search & Analysis")
            search_query = st.text_input("Enter search query:", key="admin_search")
            if st.button("🔍 Search", key="admin_search_btn"):
                if search_query:
                    # Simple search
                    results = df[df['description'].str.contains(search_query, case=False, na=False)]
                    st.subheader(f"Found {len(results)} results")
                    for _, row in results.iterrows():
                        with st.expander(f"{row['code']} - {row['description']} - {row['amount']}"):
                            st.write(f"**Type:** {row['code_type']}")
                            st.write(f"**Description:** {row['description']}")
                            st.write(f"**Amount:** {row['amount']}")
        
        with tab2:
            st.header("👥 User Management")
            st.info("Admin can manage all users")
            users = [
                {"username": "aistethxyz@gmail.com", "role": "admin", "status": "Active"},
                {"username": "doctor", "role": "doctor", "status": "Active"},
                {"username": "billing", "role": "billing", "status": "Active"}
            ]
            for user in users:
                col1, col2, col3, col4 = st.columns([2, 1, 1, 1])
                with col1:
                    st.write(f"**{user['username']}** ({user['role']})")
                with col2:
                    st.write(user['status'])
                with col3:
                    if st.button("Edit", key=f"edit_{user['username']}"):
                        st.info("Edit functionality")
                with col4:
                    if st.button("View", key=f"view_{user['username']}"):
                        st.info("View user details")
        
        with tab3:
            st.header("📊 System Analytics")
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Total Users", "4")
            with col2:
                st.metric("Active Sessions", "1")
            with col3:
                st.metric("Total Codes", len(df))
            with col4:
                st.metric("System Status", "Online")
            
            # Revenue analytics
            st.subheader("Revenue Analysis")
            revenue_data = pd.DataFrame({
                'Code Type': ['Assessment', 'Critical Care', 'Procedure', 'Other'],
                'Count': [15, 8, 12, 5],
                'Revenue': [1125, 1200, 1020, 300]
            })
            st.bar_chart(revenue_data.set_index('Code Type'))
        
        with tab4:
            st.header("⚙️ System Settings")
            st.info("System configuration and management")
            if st.button("🔄 Restart System"):
                st.success("System restart initiated")
            if st.button("📊 Generate Report"):
                st.success("Report generated")
            if st.button("🔧 System Maintenance"):
                st.info("Maintenance mode activated")
    
    elif user_role == 'doctor':
        # Doctor interface
        tab1, tab2, tab3 = st.tabs(["🏥 Clinical Search", "📋 Patient Cases", "📊 Clinical Analytics"])
        
        with tab1:
            st.header("🏥 Clinical Search")
            search_query = st.text_input("Patient symptoms or condition:", key="doctor_search")
            if st.button("🔍 Clinical Search", key="doctor_search_btn"):
                if search_query:
                    results = df[df['description'].str.contains(search_query, case=False, na=False)]
                    st.subheader(f"Found {len(results)} clinical codes")
                    for _, row in results.iterrows():
                        st.write(f"**{row['code']}** - {row['description']} - {row['amount']}")
        
        with tab2:
            st.header("📋 Patient Cases")
            st.info("Manage patient cases and billing")
            cases = [
                {"id": "P001", "name": "John Smith", "condition": "Chest Pain", "status": "Active"},
                {"id": "P002", "name": "Sarah Johnson", "condition": "Fracture", "status": "Completed"}
            ]
            for case in cases:
                with st.expander(f"Patient {case['id']}: {case['name']} - {case['condition']}"):
                    st.write(f"**Status:** {case['status']}")
                    if st.button(f"View Details", key=f"case_{case['id']}"):
                        st.info("Patient details")
        
        with tab3:
            st.header("📊 Clinical Analytics")
            col1, col2, col3 = st.columns(3)
            with col1:
                st.metric("Patients Today", "12")
            with col2:
                st.metric("Cases Completed", "8")
            with col3:
                st.metric("Revenue Today", "$2,450")
    
    elif user_role == 'billing':
        # Billing interface
        tab1, tab2, tab3 = st.tabs(["💰 Revenue Search", "🇨🇦 Canadian Billing", "📈 Revenue Dashboard"])
        
        with tab1:
            st.header("💰 Revenue Search")
            search_query = st.text_input("Search for billing codes:", key="billing_search")
            min_revenue = st.number_input("Min Revenue", min_value=0, value=50, key="billing_min")
            if st.button("💰 Revenue Search", key="billing_search_btn"):
                if search_query:
                    results = df[df['description'].str.contains(search_query, case=False, na=False)]
                    st.subheader(f"Found {len(results)} revenue codes")
                    for _, row in results.iterrows():
                        st.write(f"**{row['code']}** - {row['description']} - {row['amount']}")
        
        with tab2:
            st.header("🇨🇦 Canadian Billing")
            st.info("Canadian billing code optimization")
            search_query = st.text_input("Medical condition:", key="billing_canadian")
            if st.button("🇨🇦 Search", key="billing_canadian_btn"):
                if search_query:
                    st.success("Canadian billing analysis completed")
                    st.write("**Primary Codes:** H152, G004")
                    st.write("**Add-on Codes:** Z107, F013")
        
        with tab3:
            st.header("📈 Revenue Dashboard")
            col1, col2, col3, col4 = st.columns(4)
            with col1:
                st.metric("Today's Revenue", "$3,450")
            with col2:
                st.metric("This Week", "$18,200")
            with col3:
                st.metric("This Month", "$67,800")
            with col4:
                st.metric("Growth", "+5.2%")
    
    else:
        # Default interface
        st.header("🔍 Search & Analyze Billing Codes")
        search_query = st.text_input("Enter your search query:", key="default_search")
        if st.button("🔍 Search", key="default_search_btn"):
            if search_query:
                results = df[df['description'].str.contains(search_query, case=False, na=False)]
                st.subheader(f"Found {len(results)} results")
                for _, row in results.iterrows():
                    st.write(f"**{row['code']}** - {row['description']} - {row['amount']}")

if __name__ == "__main__":
    main()
EOF

# Create systemd service
echo "⚙️ Creating systemd service..."
cat > /etc/systemd/system/medical-billing-rag.service << 'EOF'
[Unit]
Description=Medical Billing RAG Application
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/opt/medical-billing-rag
Environment=PATH=/opt/medical-billing-rag/venv/bin
ExecStart=/opt/medical-billing-rag/venv/bin/streamlit run app.py --server.port 8501 --server.address 0.0.0.0 --server.headless true
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
EOF

# Configure Nginx
echo "🌐 Configuring Nginx..."
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
echo "🔧 Starting services..."
nginx -t && systemctl reload nginx
systemctl daemon-reload
systemctl enable medical-billing-rag.service
systemctl start medical-billing-rag.service

# Configure firewall
echo "🔥 Configuring firewall..."
ufw allow 22/tcp
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

# Check status
echo "✅ Checking deployment status..."
sleep 5
systemctl status medical-billing-rag.service --no-pager
curl -f http://localhost:8501/_stcore/health && echo "✅ Application is healthy!"

echo "🎉 Medical Billing RAG is now running on http://5.161.47.228"
echo "📊 Admin Panel: http://5.161.47.228 (login with aistethxyz@gmail.com / bestaisteth)"
echo "📝 Logs: journalctl -u medical-billing-rag.service -f"
echo "🔄 Restart: systemctl restart medical-billing-rag.service"
echo "🛑 Stop: systemctl stop medical-billing-rag.service"

