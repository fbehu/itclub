# 📱 REFERRAL SYSTEM - BACKEND API IMPLEMENTATION GUIDE

**Backend'chilar uchun to'liq qo'llanma**

---

## 🎯 QUICK REFERENCE

### Base URL
```
http://localhost:8000/api/referrals/
```

### Headers (Barcha request'larda)
```json
{
  "Authorization": "Bearer YOUR_TOKEN",
  "Content-Type": "application/json"
}
```

---

## 👤 STUDENT ENDPOINTS

### 1. Referral Code Ko'rish - `GET /my-referral/`

**Endpoint:**
```
GET http://localhost:8000/api/referrals/my-referral/
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "code": "john123",
  "student_username": "john",
  "total_referrals": 5,
  "referred_users": [
    {
      "id": 1,
      "username": "user1",
      "email": "user1@example.com",
      "full_name": "User One",
      "code_used": "john123",
      "created_at": "2026-02-15T10:30:00Z"
    },
    {
      "id": 2,
      "username": "user2",
      "email": "user2@example.com",
      "full_name": "User Two",
      "code_used": "john123",
      "created_at": "2026-02-16T14:20:00Z"
    }
  ],
  "created_at": "2026-01-01T08:00:00Z"
}
```

**Frontend Usage:**
```javascript
const getMyReferral = async (token) => {
  const response = await authFetch(API_ENDPOINTS.REFERRAL_ME, {
    method: 'GET'
  });
  return await response.json();
};
```

---

### 2. Balance Ko'rish - `GET /balance/`

**Endpoint:**
```
GET http://localhost:8000/api/referrals/balance/
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
{
  "total_referrals": 5,
  "total_money": 225000,
  "withdrawn_money": 100000,
  "available_money": 125000,
  "total_vouchers": 5,
  "used_vouchers": 1,
  "active_vouchers": 4,
  "given_rewards_count": 5
}
```

**Business Logic:**
- `total_referrals`: Jami taklif qilgan odamlar soni
- `total_money`: Jami pul (45,000 × taklif soni)
- `withdrawn_money`: Yechib olingan pul
- `available_money`: total_money - withdrawn_money
- `total_vouchers`: Jami vaucherlar
- `used_vouchers`: Ishlatilgan vaucherlar

---

### 3. Rewards Ro'yxati - `GET /my-rewards/`

**Endpoint:**
```
GET http://localhost:8000/api/referrals/my-rewards/
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "student_username": "john",
    "referred_user_username": "user1",
    "referred_user_full_name": "User One",
    "reward_type": "MONEY",
    "reward_type_display": "💰 Pul",
    "amount": 45000,
    "voucher_percent": null,
    "status": "GIVEN",
    "status_display": "Berilgan",
    "is_given": true,
    "created_at": "2026-02-15T10:30:00Z",
    "given_at": "2026-02-15T10:30:00Z"
  },
  {
    "id": 2,
    "student_username": "john",
    "referred_user_username": "user2",
    "referred_user_full_name": "User Two",
    "reward_type": "VOUCHER",
    "reward_type_display": "🎟️ Vaucher",
    "amount": null,
    "voucher_percent": 10,
    "status": "GIVEN",
    "status_display": "Berilgan",
    "is_given": true,
    "created_at": "2026-02-16T14:20:00Z",
    "given_at": "2026-02-16T14:20:00Z"
  }
]
```

**Status Types:**
- `GIVEN`: Reward berilgan (user eligible bo'ldi)
- `CLAIMED`: User claimed reward (pul yoki vaucher olingan)
- `PENDING`: Kutilmoqda (user hali 5 ta referral bo'lmadi)

---

### 4. Pul Yechib Olish So'rovi - `POST /request-withdrawal/`

**Endpoint:**
```
POST http://localhost:8000/api/referrals/request-withdrawal/
```

**Request Body:**
```json
{
  "amount": 50000
}
```

**Validation:**
- `amount` > 0
- `amount` <= available_money
- Max request per day/week (optional)

**Success Response (201):**
```json
{
  "id": 1,
  "student_username": "john",
  "student_full_name": "John Doe",
  "amount": 50000,
  "status": "PENDING",
  "status_display": "Kutilmoqda",
  "reason": null,
  "approved_by_username": null,
  "requested_at": "2026-02-19T15:30:00Z",
  "approved_at": null
}
```

**Error Response (400):**
```json
{
  "error": "Yetarli pul yo'q. Available: 125000"
}
```

**Error Cases:**
- Insufficient balance
- Negative amount
- Amount exceeds available balance
- Duplicate request (already pending)

---

### 5. Withdrawal So'rovlarni Ko'rish - `GET /my-withdrawals/`

**Endpoint:**
```
GET http://localhost:8000/api/referrals/my-withdrawals/
```

**Query Parameters (optional):**
```
?status=PENDING        # Filter by status
?status=APPROVED
?status=REJECTED
?status=COMPLETED
```

**Response (200):**
```json
[
  {
    "id": 1,
    "student_username": "john",
    "student_full_name": "John Doe",
    "amount": 50000,
    "status": "PENDING",
    "status_display": "Kutilmoqda",
    "reason": null,
    "approved_by_username": null,
    "requested_at": "2026-02-19T15:30:00Z",
    "approved_at": null
  },
  {
    "id": 2,
    "student_username": "john",
    "student_full_name": "John Doe",
    "amount": 75000,
    "status": "APPROVED",
    "status_display": "Tasdiqlangan",
    "reason": null,
    "approved_by_username": "admin",
    "requested_at": "2026-02-18T10:00:00Z",
    "approved_at": "2026-02-19T14:00:00Z"
  }
]
```

---

### 6. Vaucherlar Ko'rish - `GET /my-vouchers/`

**Endpoint:**
```
GET http://localhost:8000/api/referrals/my-vouchers/
```

**Response (200):**
```json
[
  {
    "id": 1,
    "code": "VCHR12345678",
    "student_username": "john",
    "discount_percent": 10,
    "is_used": false,
    "is_activated": false,
    "created_at": "2026-02-16T14:20:00Z",
    "activations": []
  },
  {
    "id": 2,
    "code": "VCHR87654321",
    "student_username": "john",
    "discount_percent": 10,
    "is_used": true,
    "is_activated": true,
    "created_at": "2026-02-15T10:30:00Z",
    "activations": [
      {
        "id": 1,
        "course_id": 5,
        "course_title": "Python Fundamentals",
        "activation_month": "2026-02",
        "activated_at": "2026-02-16T15:00:00Z"
      }
    ]
  }
]
```

---

### 7. Vaucherni Aktivlashtirish - `POST /activate-voucher/`

**Endpoint:**
```
POST http://localhost:8000/api/referrals/activate-voucher/
```

**Request Body:**
```json
{
  "voucher_id": 1,
  "course_id": 5,
  "activation_month": "2026-02"
}
```

**Validation:**
- Voucher must exist
- Voucher must belong to authenticated user
- Voucher must not be already activated
- Course must exist
- activation_month format: YYYY-MM

**Success Response (201):**
```json
{
  "id": 1,
  "voucher_code": "VCHR12345678",
  "course_id": 5,
  "course_title": "Python Fundamentals",
  "activation_month": "2026-02",
  "discount_percent": 10,
  "activated_at": "2026-02-19T16:30:00Z"
}
```

**Error Response (400):**
```json
{
  "error": "Vaucher already activated for this course"
}
```

---

## 🛡️ ADMIN ENDPOINTS

### 1. Student Qidirish - `GET /admin/search-student/`

**Endpoint:**
```
GET http://localhost:8000/api/referrals/admin/search-student/?search=john
```

**Query Parameters:**
```
search=john              # Username, email, full_name bo'yicha qidirysh
?limit=20              # Default: 10
?offset=0              # Pagination
```

**Headers:**
```
Authorization: Bearer {admin_token}
```

**Response (200):**
```json
[
  {
    "id": 1,
    "username": "john",
    "email": "john@example.com",
    "full_name": "John Doe",
    "total_referrals": 5,
    "total_money": 225000,
    "withdrawn_money": 100000,
    "available_money": 125000,
    "total_vouchers": 5,
    "used_vouchers": 1
  }
]
```

**Access Control:**
- Only staff/admin users
- Superuser only

---

### 2. Withdrawal Requests Ko'rish - `GET /admin/withdrawals/`

**Endpoint:**
```
GET http://localhost:8000/api/referrals/admin/withdrawals/?status=PENDING
```

**Query Parameters:**
```
?status=PENDING         # Filter by status
?status=APPROVED
?status=REJECTED
?status=COMPLETED
?limit=50
?offset=0
```

**Response (200):**
```json
[
  {
    "id": 1,
    "student_id": 5,
    "student_username": "john",
    "student_full_name": "John Doe",
    "student_email": "john@example.com",
    "amount": 50000,
    "status": "PENDING",
    "status_display": "Kutilmoqda",
    "reason": null,
    "approved_by_username": null,
    "requested_at": "2026-02-19T15:30:00Z",
    "approved_at": null
  }
]
```

---

### 3. Withdrawal Tasdiqlash - `POST /admin/withdrawals/{id}/approve/`

**Endpoint:**
```
POST http://localhost:8000/api/referrals/admin/withdrawals/1/approve/
```

**Request Body (Approve):**
```json
{
  "action": "approve"
}
```

**Request Body (Reject):**
```json
{
  "action": "reject",
  "reason": "Yetarli ma'lumot yo'q"
}
```

**Success Response (200 - Approve):**
```json
{
  "id": 1,
  "student_username": "john",
  "amount": 50000,
  "status": "APPROVED",
  "status_display": "Tasdiqlangan",
  "approved_by_username": "admin",
  "requested_at": "2026-02-19T15:30:00Z",
  "approved_at": "2026-02-20T10:00:00Z"
}
```

**Success Response (200 - Reject):**
```json
{
  "id": 1,
  "student_username": "john",
  "amount": 50000,
  "status": "REJECTED",
  "status_display": "Rad etilgan",
  "reason": "Yetarli ma'lumot yo'q",
  "approved_by_username": "admin",
  "requested_at": "2026-02-19T15:30:00Z",
  "approved_at": "2026-02-20T10:00:00Z"
}
```

**Business Logic:**
- When approved: Deduct from `available_money`, create Transaction record
- When rejected: Keep balance as is, add rejection reason
- Admin username automatically filled from request.user

---

### 4. Settings Ko'rish - `GET /admin/settings/`

**Endpoint:**
```
GET http://localhost:8000/api/referrals/admin/settings/
```

**Response (200):**
```json
{
  "id": 1,
  "money_per_referral": 45000,
  "voucher_discount_percent": 10,
  "min_referrals_for_reward": 5,
  "updated_by_username": "admin",
  "updated_at": "2026-01-15T10:00:00Z"
}
```

---

### 5. Settings Yangilash - `PUT /admin/settings/`

**Endpoint:**
```
PUT http://localhost:8000/api/referrals/admin/settings/
```

**Request Body:**
```json
{
  "money_per_referral": 50000,
  "voucher_discount_percent": 15,
  "min_referrals_for_reward": 5
}
```

**Validation:**
- `money_per_referral`: > 0
- `voucher_discount_percent`: 0-100
- `min_referrals_for_reward`: >= 1

**Success Response (200):**
```json
{
  "id": 1,
  "money_per_referral": 50000,
  "voucher_discount_percent": 15,
  "min_referrals_for_reward": 5,
  "updated_by_username": "admin",
  "updated_at": "2026-02-20T10:00:00Z"
}
```

**Important Note:**
- Settings apply to NEW rewards only
- Existing rewards NOT affected retroactively

---

## 📊 PUBLIC ENDPOINTS

### Leaderboard - `GET /leaderboard/`

**Endpoint:**
```
GET http://localhost:8000/api/referrals/leaderboard/
```

**Headers:**
```
Authorization: Bearer {token}
```

**Response (200):**
```json
[
  {
    "rank": 1,
    "student_id": 1,
    "student_username": "john",
    "student_full_name": "John Doe",
    "total_referrals": 10,
    "total_earnings": 450000,
    "total_vouchers": 10
  },
  {
    "rank": 2,
    "student_id": 2,
    "student_username": "jane",
    "student_full_name": "Jane Smith",
    "total_referrals": 8,
    "total_earnings": 360000,
    "total_vouchers": 8
  },
  {
    "rank": 3,
    "student_id": 3,
    "student_username": "bob",
    "student_full_name": "Bob Johnson",
    "total_referrals": 5,
    "total_earnings": 225000,
    "total_vouchers": 5
  }
]
```

**Calculation:**
- `total_referrals`: Count of referred users
- `total_earnings`: money_per_referral × total_referrals
- `total_vouchers`: Count of vouchers given
- Top 10 by referrals

---

## 🔐 CORE BUSINESS LOGIC

### Auto-Generate Referral Code
**When:** User registration or first access to referral page
**Format:** `{username}{random_digits}` (e.g., `john123`)
- Unique per user
- Can't be changed
- Case-insensitive recommended

### Auto-Generate Vouchers
**When:** User has >= min_referrals_for_reward
**Logic:**
```
For each new referral after reaching min:
  - Create VOUCHER reward record
  - Generate unique voucher code: {code}_{sequence}
  - Set discount_percent from settings
  - is_activated = false initially
```

### Calculate Total Money
**Formula:**
```
total_money = total_referrals × money_per_referral
available_money = total_money - withdrawn_money
```

### Eligibility Check
**When:** Check reward status
**Logic:**
```
if total_referrals >= min_referrals_for_reward:
  is_eligible = true
  available_rewards = total_referrals - (already_claimed_count)
else:
  is_eligible = false
  available_rewards = 0
```

---

## 🗄️ DATABASE SCHEMA (Reference)

### Referral Model
```python
class Referral(models.Model):
    student = ForeignKey(User)
    code = CharField(unique=True)
    created_at = DateTimeField(auto_now_add=True)
```

### Reward Model
```python
class Reward(models.Model):
    student = ForeignKey(User)
    referred_user = ForeignKey(User, related_name='referred_by')
    REWARD_TYPE_CHOICES = [('MONEY', 'Money'), ('VOUCHER', 'Voucher')]
    reward_type = CharField(choices=REWARD_TYPE_CHOICES)
    amount = IntegerField(null=True)  # for MONEY
    voucher_percent = IntegerField(null=True)  # for VOUCHER
    is_given = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
```

### Voucher Model
```python
class Voucher(models.Model):
    student = ForeignKey(User)
    code = CharField(unique=True)
    discount_percent = IntegerField()
    is_used = BooleanField(default=False)
    is_activated = BooleanField(default=False)
    created_at = DateTimeField(auto_now_add=True)
```

### VoucherActivation Model
```python
class VoucherActivation(models.Model):
    voucher = ForeignKey(Voucher)
    course = ForeignKey(Course)
    activation_month = CharField()  # YYYY-MM
    activated_at = DateTimeField(auto_now_add=True)
```

### Withdrawal Model
```python
class Withdrawal(models.Model):
    student = ForeignKey(User)
    amount = IntegerField()
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('COMPLETED', 'Completed')
    ]
    status = CharField(choices=STATUS_CHOICES)
    reason = TextField(null=True, blank=True)
    approved_by = ForeignKey(User, null=True, related_name='approved_withdrawals')
    requested_at = DateTimeField(auto_now_add=True)
    approved_at = DateTimeField(null=True)
```

### Settings Model
```python
class ReferralSettings(models.Model):
    money_per_referral = IntegerField(default=45000)
    voucher_discount_percent = IntegerField(default=10)
    min_referrals_for_reward = IntegerField(default=5)
    updated_by = ForeignKey(User)
    updated_at = DateTimeField(auto_now=True)
```

---

## ✅ IMPLEMENTATION CHECKLIST

### Database Models
- [ ] Referral model
- [ ] Reward model
- [ ] Voucher model
- [ ] VoucherActivation model
- [ ] Withdrawal model
- [ ] ReferralSettings model
- [ ] Transaction/History model (optional)

### Student Endpoints
- [ ] GET /my-referral/ - Show code & referred users
- [ ] GET /balance/ - Show money/voucher balance
- [ ] GET /my-rewards/ - List all rewards
- [ ] POST /request-withdrawal/ - Submit withdrawal request
- [ ] GET /my-withdrawals/ - View withdrawal history
- [ ] GET /my-vouchers/ - List vouchers
- [ ] POST /activate-voucher/ - Activate voucher

### Admin Endpoints
- [ ] GET /admin/search-student/ - Search students
- [ ] GET /admin/withdrawals/ - View withdrawal requests
- [ ] POST /admin/withdrawals/{id}/approve/ - Approve/reject withdrawal
- [ ] GET /admin/settings/ - View settings
- [ ] PUT /admin/settings/ - Update settings

### Public Endpoints
- [ ] GET /leaderboard/ - Top referrers

### Background Tasks (optional)
- [ ] Auto-generate referral code on user registration
- [ ] Auto-generate rewards when referral count changes
- [ ] Calculate leaderboard periodically

### Security
- [ ] Authenticate all requests
- [ ] Admin-only access for /admin/ endpoints
- [ ] Validate all input
- [ ] Prevent balance manipulation
- [ ] Log all admin actions

---

## 🧪 TESTING SCENARIOS

### Test Case 1: User Registration
```
1. User1 registers with code "john123" (from referrer)
2. Check: Reward created for referrer
3. Check: Referrer total_referrals incremented
```

### Test Case 2: Withdrawal Request
```
1. User has 225,000 available
2. Request withdrawal of 50,000
3. Check: Status = PENDING
4. Admin approves
5. Check: available_money = 175,000
```

### Test Case 3: Voucher Activation
```
1. User has 1 unused voucher
2. Activate for "Python Basics" course, "2026-02"
3. Check: is_activated = true
4. Check: VoucherActivation record created
```

### Test Case 4: Leaderboard
```
1. Get leaderboard
2. Check: Sorted by total_referrals DESC
3. Check: Top 10 only
4. Check: Calculations correct
```

---

## 🚀 DEPLOYMENT CHECKLIST

- [ ] All endpoints tested
- [ ] Error responses consistent
- [ ] Input validation working
- [ ] Database migrations ready
- [ ] Admin interface updated (if applicable)
- [ ] Documentation updated
- [ ] Staging deployment successful
- [ ] Load testing passed
- [ ] Security audit passed

---

**🔗 Frontend expects these exact responses!**

**Make sure to:**
1. ✅ Return correct field names and types
2. ✅ Use ISO 8601 datetime format
3. ✅ Return proper HTTP status codes
4. ✅ Include error messages in response
5. ✅ Handle edge cases gracefully
6. ✅ Test with frontend mock data expectations

---

**Created**: February 20, 2026  
**Version**: 1.0.0  
**Status**: Ready for Backend Implementation
