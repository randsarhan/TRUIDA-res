# TRUIDA - Smart Biometric Identity System

A privacy-first biometric identity system for seamless airport passenger flow, inspired by Dubai Airport's Smart Tunnel technology.

## 🚀 Features

- **✅ Biometric Enrollment**: Face scanning via webcam + fingerprint simulation
- **✅ Multi-Checkpoint Verification**: Security, Immigration, and Boarding gates
- **✅ Privacy-Compliant**: SHA-256 hashing, no raw biometric storage
- **✅ Automatic Cleanup**: Data deletion after flight departure
- **✅ Staff Dashboard**: Real-time analytics and passenger tracking
- **✅ Kiosk Interface**: Touch-friendly airport kiosk design
- **✅ Flight Integration**: Passport and flight detail validation

## 🛠 Technology Stack

- **Frontend**: React 18 + TypeScript
- **UI Framework**: Tailwind CSS + shadcn/ui components
- **Biometrics**: Hugging Face Transformers (face detection)
- **Camera Access**: Browser MediaDevices API
- **Data Storage**: Browser localStorage with automatic cleanup
- **Build Tool**: Vite

## 📦 Installation & Setup

```bash
# Clone the repository
git clone <repository-url>

# Navigate to project directory
cd truida-system

# Install dependencies
npm install

# Start development server
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) to view the application.

## 🎯 Usage Guide

### 1. Passenger Enrollment
- Click "Passenger Enrollment" on the main menu
- Allow camera access for face scanning
- Upload fingerprint image (simulation)
- Enter passport number and flight details
- System generates unique biometric identity token

### 2. Checkpoint Verification
- **Security Checkpoint**: Initial biometric verification
- **Immigration**: Passport and biometric validation
- **Boarding Gate**: Final boarding clearance
- Each checkpoint re-scans face and matches stored identity

### 3. Staff Dashboard
- Real-time passenger statistics
- Checkpoint completion tracking
- Recent activity logs
- System health monitoring

## 🏗 System Architecture

```
┌─────────────────┐    ┌──────────────────┐    ┌─────────────────┐
│   Enrollment    │    │   Checkpoints    │    │ Staff Dashboard │
│     Station     │    │  (3 Stations)    │    │                 │
└─────────────────┘    └──────────────────┘    └─────────────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │   Biometric Utils   │
                    │   - Face Detection  │
                    │   - Hash Generation │
                    │   - Similarity Match│
                    └─────────────────────┘
                                 │
                    ┌─────────────────────┐
                    │    Data Store       │
                    │   - localStorage    │
                    │   - Auto Cleanup    │
                    │   - Staff Logs      │
                    └─────────────────────┘
```

## 🔒 Security & Privacy

- **No Raw Storage**: Biometric images are processed and immediately discarded
- **SHA-256 Hashing**: All biometric data is cryptographically hashed
- **Local Processing**: No biometric data leaves the device
- **Automatic Deletion**: Passenger data auto-deleted after flight departure
- **Minimal Data**: Only essential flight and identity information stored

## 📊 Data Flow

1. **Enrollment**: Face scan → Hash generation → Secure storage
2. **Verification**: Face re-scan → Hash comparison → Access decision
3. **Cleanup**: Flight departure → Automatic data deletion

## 🎨 UI/UX Features

- **Airport Kiosk Design**: Large buttons, high contrast, accessibility-focused
- **Real-time Feedback**: Instant biometric matching results
- **Dark/Light Mode**: Automatic theme switching
- **Responsive Design**: Works on tablets and touch screens
- **Progressive Enhancement**: Graceful degradation without camera access

## 🚀 Future Enhancements

- [ ] Integration with real airport systems
- [ ] NFT-based identity tokens
- [ ] Multi-language support
- [ ] Advanced biometric algorithms
- [ ] Cloud backend integration
- [ ] Mobile companion app
- [ ] Blockchain verification
- [ ] Integration with airline APIs

## 🧪 Development

### Project Structure
```
src/
├── components/
│   ├── ui/              # shadcn/ui components
│   ├── EnrollmentStation.tsx
│   ├── CheckpointStation.tsx
│   ├── StaffDashboard.tsx
│   └── MainMenu.tsx
├── lib/
│   ├── biometric-utils.ts    # Biometric processing
│   ├── data-store.ts         # Data management
│   └── utils.ts              # Utilities
└── pages/
    └── Index.tsx             # Main application
```

### Key Components
- **EnrollmentStation**: Handles passenger registration and biometric capture
- **CheckpointStation**: Manages verification at security, immigration, and boarding
- **StaffDashboard**: Provides analytics and system monitoring
- **BiometricUtils**: Core biometric processing and hashing functions
- **DataStore**: localStorage management with automatic cleanup

## 📄 License

This project is a prototype demonstration of biometric identity systems for educational and development purposes.

## 🤝 Contributing

This is a prototype project. For suggestions or improvements, please open an issue or submit a pull request.

---

**Disclaimer**: This is a demonstration prototype. Not intended for production use in real airport environments without proper security audits and compliance certifications.