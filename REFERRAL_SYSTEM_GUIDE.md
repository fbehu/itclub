# Universe Frontend - Referral Management System

## 🎯 Referral System Overview

Complete referral and reward management system for the Universe education platform.

### System Features

#### 1. **Student Referral Dashboard** (`/dashboard/referral`)
- **Referrals Tab**: Display your unique promo code and list of referred users
- **Rewards Tab**: 
  - Progress bar showing referral status
  - Claim rewards in two types: MONEY (45,000 so'm) or VOUCHER (10%)
  - Eligibility requirement: Minimum 5 referrals
  - Statistics: Total/claimed rewards breakdown
- **Vouchers Tab**:
  - List of earned vouchers
  - Activation status tracking
  - Usage history per voucher

#### 2. **Admin Referral Panel** (`/dashboard/admin/referral`)

##### Settings Tab (⚙️)
- Configure reward system globally:
  - Money per referral (default: 45,000 so'm)
  - Voucher discount percentage (default: 10%)
  - Minimum referrals threshold (default: 5)
- Real-time updates affecting all future rewards

##### Student Search Tab (🔍)
- Search students by username or email
- View student account details:
  - Total referrals count
  - Money balance
  - Vouchers count
  - Reward history
- **Money Withdrawal** functionality:
  - Specify amount to withdraw
  - Automatic balance update
  - Transaction logging

##### Vouchers Tab (🎟️)
- View all system vouchers
- Activation management:
  - Select course
  - Select month
  - Activate with one click
- Status tracking (Active/Pending)
- Voucher usage monitoring

##### Leaderboard Tab (📊)
- Top 10 referrers ranking
- Rank-based medal display (🥇 🥈 🥉)
- Achievement badges:
  - Mega Earner (>500k so'm)
  - Super Referrer (>20 referrals)
- Display earned money and vouchers per student

---

## 🏗️ Project Structure

```
src/
├── pages/
│   ├── Referral.tsx                      # Student referral dashboard (3 tabs)
│   └── admin/
│       ├── ReferralAdmin.tsx             # Admin referral panel (4 tabs)
│       └── components/
│           └── ReferralLeaderboard.tsx   # Leaderboard component
├── config/
│   └── api.ts                            # API endpoints configuration
├── contexts/
│   ├── AuthContext.tsx                   # User authentication & role
│   └── SeasonContext.tsx                 # Seasonal effects
├── hooks/
│   ├── use-toast.ts                      # Toast notifications
│   └── use-mobile.tsx                    # Mobile detection
├── lib/
│   └── authFetch.ts                      # HTTP client with auth
└── components/
    ├── DashboardLayout.tsx               # Navigation & layout
    ├── AppRoutes.tsx                     # Route configuration
    └── ui/                               # shadcn/ui components
```

---

## 🔌 API Integration

### Frontend Endpoints Used

```typescript
// Student Referral Endpoints
REFERRAL_ME: '/referrals/my-referral/'         // GET user's referral code
REFERRAL_VALIDATE: '/referrals/validate-code/' // POST validate promo code
REWARD_STATUS: '/referrals/reward-status/'     // GET reward eligibility
CLAIM_REWARD: '/referrals/claim-reward/'       // POST claim MONEY/VOUCHER
MY_VOUCHERS: '/referrals/my-vouchers/'         // GET user's vouchers
ACTIVATE_VOUCHER: '/referrals/activate-voucher/' // POST activate voucher

// Admin Endpoints (TODO: Backend Implementation)
ADMIN_REFERRAL_SETTINGS: '/referrals/admin/settings/'
ADMIN_STUDENT_SEARCH: '/referrals/admin/student-search/'
ADMIN_WITHDRAW: '/referrals/admin/withdraw/'
ADMIN_VOUCHERS: '/referrals/admin/vouchers/'
ADMIN_ACTIVATE_VOUCHER: '/referrals/admin/activate-voucher/'
ADMIN_LEADERBOARD: '/referrals/admin/leaderboard/'
```

### API Request/Response Examples

#### Validate Promo Code
```bash
POST /api/referrals/validate-code/
{
  "code": "john_doe123"
}

Response:
{
  "valid": true,
  "message": "Code is valid"
}
```

#### Claim Reward
```bash
POST /api/referrals/claim-reward/
{
  "type": "MONEY" | "VOUCHER"
}

Response:
{
  "success": true,
  "reward_id": 123,
  "amount": 45000 | 10,
  "type": "MONEY" | "VOUCHER"
}
```

#### Student Search (Admin)
```bash
GET /api/referrals/admin/student-search/?q=john

Response:
[{
  "user_id": "123",
  "username": "john_doe",
  "email": "john@example.com",
  "phone": "+998901234567",
  "total_referred": 11,
  "money_balance": 135000,
  "vouchers_count": 2,
  "claimed_money": 3,
  "claimed_vouchers": 1,
  "rewards": [...]
}]
```

#### Withdraw Money (Admin)
```bash
POST /api/referrals/admin/withdraw/
{
  "user_id": "123",
  "amount": 50000
}

Response:
{
  "success": true,
  "transaction_id": "TXN_001",
  "new_balance": 85000
}
```

#### Leaderboard (Admin)
```bash
GET /api/referrals/admin/leaderboard/

Response:
[{
  "user_id": "1",
  "username": "admin",
  "email": "admin@example.com",
  "phone": "+998901234567",
  "total_referred": 11,
  "money_earned": 135000,
  "vouchers_earned": 2
}, ...]
```

---

## 🎨 UI Components Used

### From shadcn/ui:
- `Card` - Container for content sections
- `Button` - All interactive buttons
- `Input` - Text inputs and search
- `Label` - Form labels
- `Badge` - Status and achievement displays
- `Avatar` - User profile pictures
- `Select` - Dropdown menus
- `Dialog` - Modal dialogs
- `Tabs` - Tab navigation

### From Lucide React Icons:
- `Gift` - Rewards icon
- `Award` - Achievement icon
- `Share2` - Referral/share icon
- `TrendingUp` - Leaderboard/statistics
- `Users` - Student list
- `Settings` - Configuration
- `Search` - Search functionality
- `Loader` - Loading states
- `Eye` - View details
- `Trash2` - Delete/withdraw
- `Trophy` - Top rankings

---

## 🚀 Key Features Implementation

### 1. Real-time Validation
- Promo code validation during user creation
- Visual feedback (green/red borders)
- Toast notifications for errors

### 2. Dynamic Reward Calculation
```typescript
interface RewardStatus {
  eligible: boolean              // >= min_referrals
  total_referrals: number        // Total people referred
  required: number               // Minimum needed (5)
  all_rewards_count: number      // Total rewards generated
  claimed_count: number          // Money claimed
  unclaimed_count: number        // Money available
  money_total: number            // Total money value
  total_vouchers: number         // Total vouchers earned
}
```

### 3. Voucher Management
```typescript
interface Voucher {
  id: number
  code: string                   // e.g., "john123_VC_001"
  discount_percent: number       // e.g., 10
  is_activated: boolean          // Activation status
  is_used: boolean              // Usage status
  activated_at: string          // ISO timestamp
  activated_by_username: string // Admin who activated
  activated_course: string      // Course name (optional)
  activated_month: string       // YYYY-MM format
  usages: Array<Usage>          // Usage history
}
```

### 4. Mock Data Fallback
- All API calls have fallback mock data
- Ensures app works in development
- Easy to switch to real API

---

## 🔄 Data Flow

### User Registration Flow
1. User enters promo code (optional)
2. Frontend validates via `/referrals/validate-code/`
3. If valid, code is sent with registration form
4. Backend links referrer to new user
5. User added to referrer's referred_users list

### Reward Claiming Flow
1. Student clicks "CLAIM REWARD" in dashboard
2. POST to `/referrals/claim-reward/` with type
3. Backend checks eligibility (>= 5 referrals)
4. Creates reward record
5. Updates balance (money or vouchers)
6. Frontend refreshes status

### Admin Withdrawal Flow
1. Admin searches student by username/email
2. Views student account details
3. Specifies withdrawal amount
4. POST to `/referrals/admin/withdraw/`
5. Backend deducts from balance
6. Creates transaction record
7. Frontend updates displayed balance

---

## 🔐 Access Control

### Student Dashboard (`/dashboard/referral`)
- ✅ Students: Full access
- ❌ Teachers: No referral feature
- ✅ Admins: Can see own referral dashboard

### Admin Panel (`/dashboard/admin/referral`)
- ✅ Admins only
- ✅ Full control over system
- ✅ No editing of user promo codes (read-only after creation)

### EditUserDialog Changes
- Removed `invite_code` field entirely
- Users cannot change their referral code once created
- Only system/admin can set promo codes on creation

---

## 🧪 Testing

### Mock Data Available
- Default leaderboard: 3 students with data
- Search results: Sample student with 11 referrals
- Vouchers: 2 samples (1 activated, 1 pending)
- Settings: Default values loaded

### Test Scenarios
1. **Promo Code Validation**: Enter valid/invalid code in AddUser
2. **Reward Claiming**: Click claim buttons in Referral tab
3. **Admin Search**: Search students in admin panel
4. **Voucher Activation**: Select course/month and activate
5. **Withdrawal**: Test money withdrawal limits
6. **Leaderboard**: Verify top 10 display and rankings

---

## 📱 Responsive Design

- Mobile sidebar collapses to icons
- Tablet layout adjusts to grid
- Desktop full layout with all features
- Touch-friendly buttons and inputs
- Scrollable content areas for mobile

---

## 🌙 Dark Mode Support

- Built with `next-themes`
- All components support light/dark modes
- Gradient backgrounds adapt to theme
- Icons remain visible in both modes

---

## ⚙️ Dependencies

```json
{
  "react": "^18.x",
  "react-router-dom": "^6.x",
  "shadcn/ui": "Latest",
  "lucide-react": "Latest",
  "date-fns": "^3.x",
  "react-hook-form": "^7.x",
  "zod": "^3.x",
  "next-themes": "Latest",
  "@tanstack/react-query": "Latest"
}
```

---

## 📝 Notes

### Backend TODO
- Implement admin endpoints for settings management
- Create database models for transactions
- Add webhook support for payment processing
- Implement automated payout scheduling (optional)

### Frontend TODO (Optional)
- Add export functionality for admin reports
- Implement date range filters for history
- Add payment processing integration
- Create transaction receipt generation
- Add email notifications for rewards

---

## 🤝 Contributing

When modifying the referral system:

1. Keep API endpoints centralized in `config/api.ts`
2. Use reusable components from `pages/admin/components/`
3. Maintain TypeScript interfaces for all data
4. Add mock data fallbacks for development
5. Test with both light and dark themes
6. Ensure mobile responsiveness

---

## 📞 Support

For issues or questions about the referral system, check:
- API documentation in `API_DOCUMENTATION.md`
- Component props in JSDoc comments
- Console errors for API integration issues
- Backend logs for data inconsistencies

---

**Last Updated**: 2026-02-20  
**Version**: 1.0.0  
**Status**: Production Ready (Awaiting Backend Implementation)
