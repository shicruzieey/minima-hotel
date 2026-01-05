# Minima Hotel Hub

A modern hotel management system built with Next.js and Japanese minimalist design principles.

## 🏨 Overview

Minima Hotel Hub is a comprehensive hotel management platform that combines elegant design with powerful functionality. Built following Japanese minimalism aesthetics, it provides a seamless experience for hotel operations including Point of Sale (POS), inventory management, and guest services.

## ✨ Features

### Core Functionality
- **Point of Sale (POS) System** - Complete transaction management with payment processing
- **Inventory Management** - Real-time stock tracking and management
- **Dashboard Analytics** - Business insights and performance metrics
- **Guest Management** - Customer data and service history
- **Settings & Configuration** - System customization and preferences

### Design System
- **Japanese Minimalism** - Clean, focused interface with purposeful elements
- **8px Grid System** - Consistent spacing and alignment
- **Minimal Color Palette** - Black (#111111), grayscale, whitesmoke (#F7F7F7), accent-sand (#E6E1DA)
- **Typography** - Poppins headings, Roboto body text
- **Micro-interactions** - Subtle, purposeful animations

## 🛠 Technology Stack

- **Framework**: Next.js 14 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: shadcn/ui
- **Database**: Supabase
- **Authentication**: Custom auth implementation
- **State Management**: React hooks and context

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/shicruzieey/minima-hotel.git

# Navigate to the project directory
cd minima-hotel

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env

# Start the development server
npm run dev
```

### Environment Variables

Create a `.env` file with the following variables:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📁 Project Structure

```
minima-hotel/
├── app/                    # Next.js App Router
│   ├── (protected)/       # Protected routes with authentication
│   ├── login/             # Authentication page
│   └── layout.tsx         # Root layout
├── src/
│   ├── components/        # Reusable components
│   │   ├── layout/        # Layout components
│   │   ├── pos/           # POS-specific components
│   │   └── ui/            # shadcn/ui components
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   └── pages/             # Page components
├── public/                # Static assets
├── supabase/              # Database migrations and config
└── tailwind.config.ts     # Tailwind configuration
```

## 🎨 Design Guidelines

### Color System
- **Primary Black**: `#111111`
- **Grayscale**: `#333333`, `#666666`, `#999999`
- **Background**: `#F7F7F7` (whitesmoke)
- **Accent**: `#E6E1DA` (sand)

### Typography
- **Headings**: Poppins font family
- **Body**: Roboto font family
- **Sizes**: Responsive scaling with 8px baseline

### Spacing
- **Base Unit**: 8px grid
- **Section Spacing**: 96px (desktop), 64px (tablet), 48px (mobile)

## 🔐 Authentication

The application implements a protected route system:

1. **Public Routes**: `/login`
2. **Protected Routes**: All routes under `(protected)/` group
3. **Auth Flow**: Client-side authentication with localStorage persistence

## 📊 Features in Detail

### POS System
- Product catalog management
- Cart functionality with quantity controls
- Discount application
- Multiple payment methods
- Receipt generation
- Refund processing

### Dashboard
- Real-time analytics
- Revenue tracking
- Occupancy rates
- Performance metrics
- Interactive charts

### Inventory
- Stock level monitoring
- Product categorization
- Low stock alerts
- Supplier management

## 🚀 Deployment

### Vercel (Recommended)
1. Connect your GitHub repository to Vercel
2. Configure environment variables
3. Deploy automatically on push to main branch

### Manual Deployment
```bash
# Build for production
npm run build

# Start production server
npm start
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines
- Follow the existing code style and conventions
- Ensure all components adhere to the Japanese minimalism design system
- Test thoroughly before submitting PRs
- Update documentation as needed

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 📞 Support

For support and questions:
- Create an issue in this repository
- Contact: [shicruzieey](https://github.com/shicruzieey)

---

**Minima Hotel Hub** - Where elegance meets efficiency in hotel management.
