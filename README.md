<<<<<<< HEAD
📁 Digital Locker
A secure cloud-based file storage system that combines Firebase Firestore for metadata management with Supabase Storage for efficient file handling.

🚀 Features
🔐 Secure Authentication - JWT-based authentication with Firebase

📂 Folder Management - Create, organize, and manage folders

📄 File Management - Upload, download, and delete files

💾 Hybrid Storage - Metadata in Firestore, files in Supabase Storage

🖼️ Image Transformation - On-the-fly image optimization and resizing

📊 File Size Limits - Configurable upload limits (50MB Free / 500GB Pro)

🔄 Real-time Updates - Instant synchronization across devices

🔒 Private Buckets - Secure file storage with signed URLs

🏗️ Architecture
text
┌─────────────────────────────────────────────────────────────┐
│                      Digital Locker                         │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐    │
│  │  Frontend   │  │   Backend   │  │  Database/      │    │
│  │  (React)    │──│  (Node.js)  │──│  Storage Layer  │    │
│  └─────────────┘  └─────────────┘  └─────────────────┘    │
│                         │                    │              │
│                         ▼                    ▼              │
│                  ┌─────────────┐  ┌─────────────────┐    │
│                  │  Firebase   │  │    Supabase     │    │
│                  │  Firestore  │  │    Storage      │    │
│                  │             │  │                 │    │
│                  │ • Users     │  │ • File bytes    │    │
│                  │ • Folders   │  │ • Private       │    │
│                  │ • Metadata  │  │   buckets       │    │
│                  └─────────────┘  └─────────────────┘    │
│                                                             │
└─────────────────────────────────────────────────────────────┘
🛠️ Tech Stack
Backend
Node.js - Runtime environment

Express.js - Web framework

Firebase Admin SDK - Firestore database operations

Supabase JavaScript SDK - File storage operations

JWT - Authentication & authorization

Multer - File upload handling

Storage & Database
Firebase Firestore - User data, folders, file metadata

Supabase Storage - File bytes storage (private buckets)

Security
JWT Authentication - Secure token-based auth

Firebase Auth - User management

Row Level Security (RLS) - Supabase policies

CORS - Secure cross-origin requests

Environment Variables - Sensitive config protection

📋 Prerequisites
Node.js (v16+)

npm or yarn

Firebase Account (Free tier)

Supabase Account (Free tier)

🚀 Getting Started
1. Clone the Repository
bash
git clone https://github.com/yourusername/digital-locker.git
cd digital-locker
2. Install Dependencies
bash
# Backend
cd backend
npm install

# Frontend (if applicable)
cd ../frontend
npm install
3. Configure Environment Variables
Create a .env file in the backend directory:

env
# Server
PORT=5000
NODE_ENV=development

# JWT
JWT_SECRET=your_jwt_secret_here
JWT_EXPIRES_IN=7d

# Firebase Firestore
FIREBASE_PROJECT_ID=your_project_id
FIREBASE_CLIENT_EMAIL=your_client_email
FIREBASE_PRIVATE_KEY="your_private_key_with_escaped_newlines"

# Supabase Storage
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_BUCKET=locker-files

# Client Origins
CLIENT_ORIGIN=http://localhost:5173,https://your-app.vercel.app

# Upload Limits
MAX_UPLOAD_MB=15
4. Set Up Firebase Firestore
Go to Firebase Console

Create a new project or use existing

Navigate to Project Settings → Service Accounts

Click "Generate new private key"

Download the JSON file

Copy the project_id, client_email, and private_key to your .env

5. Set Up Supabase Storage
Create a Supabase account

Create a new project

Go to Settings → API and copy:

Project URL

Service role key (secret key)

Go to Storage → Create bucket:

Name: locker-files

Keep it private

Add the values to your .env

6. Run the Application
bash
# Backend
cd backend
npm run dev

# Server will start on http://localhost:5000
7. Verify Setup
You should see:

text
✅ Firestore reachable
✅ Supabase Storage bucket reachable: locker-files
Server running on port 5000
📁 Project Structure
text
digital-locker/
├── backend/
│   ├── config/
│   │   ├── firebase.js      # Firebase Firestore config
│   │   ├── supabase.js      # Supabase Storage config
│   │   └── multer.js        # File upload config
│   ├── middleware/
│   │   ├── auth.js          # JWT authentication
│   │   └── upload.js        # File upload handler
│   ├── routes/
│   │   ├── auth.js          # Authentication routes
│   │   ├── files.js         # File operations
│   │   └── folders.js       # Folder operations
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── fileController.js
│   │   └── folderController.js
│   ├── models/
│   │   ├── User.js
│   │   ├── File.js
│   │   └── Folder.js
│   ├── utils/
│   │   ├── validators.js
│   │   └── helpers.js
│   ├── .env                  # Environment variables
│   ├── server.js             # Entry point
│   └── package.json
├── frontend/                 # Frontend code (React)
│   ├── src/
│   └── package.json
├── .gitignore
├── README.md
└── LICENSE
🔒 Security Features
JWT Tokens - Stateless authentication

CORS Protection - Only allow trusted origins

Input Validation - Sanitize all user inputs

File Type Validation - Restrict allowed file types

Size Limits - Prevent oversized uploads

Private Storage - Files accessible only via signed URLs

Environment Variables - Sensitive data never exposed

📡 API Endpoints
Authentication
text
POST   /api/auth/register     - Register new user
POST   /api/auth/login        - Login user
POST   /api/auth/logout       - Logout user
GET    /api/auth/verify       - Verify token
Folders
text
POST   /api/folders           - Create folder
GET    /api/folders           - Get all folders
GET    /api/folders/:id       - Get folder by ID
PUT    /api/folders/:id       - Update folder
DELETE /api/folders/:id       - Delete folder
Files
text
POST   /api/files/upload      - Upload file
GET    /api/files             - Get all files
GET    /api/files/:id         - Get file by ID
GET    /api/files/:id/download - Download file
DELETE /api/files/:id         - Delete file
PUT    /api/files/:id/rename  - Rename file
🎯 Key Features Explained
Hybrid Storage Strategy
Firestore: Stores user data, folder structure, file metadata

Supabase: Stores actual file bytes in private buckets

Benefits: Cost-effective, scalable, better performance

File Upload Flow
User selects file

Backend validates file (type, size)

File uploaded to Supabase Storage

Metadata saved to Firestore

User receives file URL and metadata

Image Optimization
On-the-fly image transformation

Resize, compress, convert formats

Saves bandwidth and load times

🐛 Troubleshooting
Port Already in Use
bash
# Windows
netstat -ano | findstr :5000
taskkill /PID <PID> /F

# Linux/Mac
lsof -i :5000
kill -9 <PID>
Missing Dependencies
bash
npm install --legacy-peer-deps
Supabase Connection Issues
Verify bucket exists: locker-files

Check service role key (not anon key)

Ensure CORS settings are configured

Firestore Connection Issues
Verify service account has proper permissions

Check private key format (keep \n as literal)

Ensure project ID is correct

🚧 Roadmap
File sharing with public links

File versioning

Bulk upload/download

File preview (PDF, images, videos)

Search functionality

File encryption

Mobile app support

Team collaboration features

🤝 Contributing
Fork the repository

Create your feature branch (git checkout -b feature/AmazingFeature)

Commit your changes (git commit -m 'Add some AmazingFeature')

Push to the branch (git push origin feature/AmazingFeature)

Open a Pull Request

📝 License
This project is licensed under the MIT License - see the LICENSE file for details.

🙏 Acknowledgments
Firebase - Firestore database

Supabase - Storage solution

Node.js - Backend runtime

Express.js - Web framework

JWT - Authentication

📧 Contact
Your Name - @sakthinathan

Project Link: https://github.com/sakthinathan-viswanathan/digital-locker
=======
# Digital-locker
A secure cloud-based file storage system that combines Firebase Firebase for metadata management with Supabase Storage for efficient file handling.
>>>>>>> 3806f63c235d298640fd4ebd3711dcdeb5b0b6d5
