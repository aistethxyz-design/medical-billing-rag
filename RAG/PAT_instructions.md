# How to Create a Personal Access Token (PAT)

## Step-by-Step Instructions:

### 1. Go to GitHub Settings
- Open: https://github.com/settings/tokens
- Or click your profile → Settings → Developer settings → Personal access tokens → Tokens (classic)

### 2. Generate New Token
- Click "Generate new token (classic)"
- Give it a name: `Medical Billing RAG`
- Set expiration: No expiration (or whatever you prefer)

### 3. Select Scopes (Permissions)
Select these scopes:
- ✅ `repo` - Full control of private repositories
- ✅ `workflow` - Update GitHub Action workflows

### 4. Generate Token
- Click "Generate token"
- **COPY THE TOKEN IMMEDIATELY** (it starts with `ghp_` and is very long)
- **You won't be able to see it again!**

### 5. Use the Token
Once you have the token, tell me and I'll help you push your code to GitHub.

## Why Do You Need This?
- GitHub no longer accepts passwords for Git operations
- A PAT acts like a password but with specific permissions
- Your repository `aistethxyz-design/medical-billing-rag` needs this to push code

## Quick Alternative
If you prefer, you can also:
1. Go to GitHub.com
2. Sign in with your account
3. Follow the steps above

**Important**: Keep your PAT secure and never share it publicly!

