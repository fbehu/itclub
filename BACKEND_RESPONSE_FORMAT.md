# 🔌 BACKEND RESPONSE FORMAT REFERENCE

**For Backend Developers**

This document shows exactly what responses the frontend expects from each API endpoint.

---

## 👤 STUDENT ENDPOINTS

### 1. GET `/referrals/my-referral/`

**Status Code**: `200 OK`

**Response Format**:
```json
{
  "code": "string (unique promo code)",
  "student_username": "string",
  "total_referrals": "number",
  "created_at": "ISO 8601 datetime string",
  "referred_users": [
    {
      "id": "number or string",
      "username": "string",
      "email": "string",
      "full_name": "string",
      "phone_number": "string (optional)",
      "photo": "string or null (URL)",
      "role": "STUDENT",
      "created_at": "ISO 8601 datetime string",
      "level": "string (optional)"
    }
  ]
}
```

**Example**:
```json
{
  "code": "john123",
  "student_username": "john_doe",
  "total_referrals": 5,
  "created_at": "2026-01-01T08:00:00Z",
  "referred_users": [
    {
      "id": 1,
      "username": "user1",
      "email": "user1@example.com",
      "full_name": "User One",
      "role": "STUDENT",
      "created_at": "2026-02-15T10:30:00Z"
    },
    {
      "id": 2,
      "username": "user2",
      "email": "user2@example.com",
      "full_name": "User Two",
      "role": "STUDENT",
      "created_at": "2026-02-16T14:20:00Z"
    }
  ]
}
```

---

### 2. GET `/referrals/reward-status/` OR `/referrals/balance/`

**Status Code**: `200 OK`

**Response Format**:
```json
{
  "eligible": "boolean",
  "total_referrals": "number",
  "min_required": "number",
  "available_rewards": "number",
  "progress": "string (e.g., '5/5')",
  "all_rewards_count": "number",
  "claimed_count": "number",
  "unclaimed_count": "number",
  "money_claimed": "number",
  "money_total": "number",
  "vouchers_claimed": "number",
  "total_vouchers": "number"
}
```

**Example**:
```json
{
  "eligible": true,
  "total_referrals": 5,
  "min_required": 5,
  "available_rewards": 5,
  "progress": "5/5",
  "all_rewards_count": 5,
  "claimed_count": 0,
  "unclaimed_count": 5,
  "money_claimed": 0,
  "money_total": 225000,
  "vouchers_claimed": 0,
  "total_vouchers": 5
}
```

---

### 3. GET `/referrals/my-vouchers/`

**Status Code**: `200 OK`

**Response Format**:
```json
[
  {
    "id": "number",
    "code": "string (unique voucher code)",
    "discount_percent": "number",
    "is_used": "boolean",
    "is_activated": "boolean",
    "activated_at": "ISO 8601 datetime or null",
    "activated_by_username": "string or null",
    "created_at": "ISO 8601 datetime",
    "usages": [
      {
        "id": "number",
        "course_title": "string",
        "used_at": "ISO 8601 datetime"
      }
    ]
  }
]
```

**Example**:
```json
[
  {
    "id": 1,
    "code": "VCHR12345678",
    "discount_percent": 10,
    "is_used": false,
    "is_activated": true,
    "activated_at": "2026-02-18T10:00:00Z",
    "activated_by_username": "admin",
    "created_at": "2026-02-16T14:20:00Z",
    "usages": []
  },
  {
    "id": 2,
    "code": "VCHR87654321",
    "discount_percent": 10,
    "is_used": true,
    "is_activated": true,
    "activated_at": "2026-02-15T09:00:00Z",
    "activated_by_username": "admin",
    "created_at": "2026-02-15T08:00:00Z",
    "usages": [
      {
        "id": 1,
        "course_title": "Python Fundamentals",
        "used_at": "2026-02-17T15:30:00Z"
      }
    ]
  }
]
```

---

### 4. POST `/referrals/claim-reward/`

**Request Body**:
```json
{
  "reward_type": "MONEY" or "VOUCHER"
}
```

**Success Response (200 OK)**:
```json
{
  "message": "string (success message)",
  "reward_id": "number",
  "amount": "number (only for MONEY)",
  "voucher_percent": "number (only for VOUCHER)"
}
```

**Error Response (400 Bad Request)**:
```json
{
  "error": "string (error message)",
  "message": "string (optional detailed message)"
}
```

---

### 5. POST `/referrals/activate-voucher/`

**Request Body**:
```json
{
  "voucher_code": "string",
  "course_id": "number (optional, if needed)",
  "activation_month": "YYYY-MM (optional, if needed)"
}
```

**Success Response (201 Created)**:
```json
{
  "id": "number",
  "voucher_code": "string",
  "course_title": "string (optional)",
  "activation_month": "YYYY-MM (optional)",
  "discount_percent": "number",
  "activated_at": "ISO 8601 datetime"
}
```

**Error Response (400 Bad Request)**:
```json
{
  "error": "Vaucher already activated" or "Vaucher not found"
}
```

---

## 🛡️ ADMIN ENDPOINTS

### 1. GET `/referrals/admin/settings/`

**Status Code**: `200 OK`

**Response Format**:
```json
{
  "id": "number",
  "money_per_referral": "number",
  "voucher_discount_percent": "number",
  "min_referrals_for_reward": "number",
  "updated_by_username": "string",
  "updated_at": "ISO 8601 datetime"
}
```

**Example**:
```json
{
  "id": 1,
  "money_per_referral": 45000,
  "voucher_discount_percent": 10,
  "min_referrals_for_reward": 5,
  "updated_by_username": "admin",
  "updated_at": "2026-02-20T10:00:00Z"
}
```

---

### 2. PUT `/referrals/admin/settings/`

**Request Body**:
```json
{
  "money_per_referral": "number",
  "voucher_discount_percent": "number",
  "min_referrals_for_reward": "number"
}
```

**Success Response (200 OK)**:
```json
{
  "id": "number",
  "money_per_referral": "number",
  "voucher_discount_percent": "number",
  "min_referrals_for_reward": "number",
  "updated_by_username": "string",
  "updated_at": "ISO 8601 datetime"
}
```

---

### 3. GET `/referrals/admin/student-search/?search=query`

**Status Code**: `200 OK`

**Response Format**:
```json
[
  {
    "user_id": "number or string",
    "username": "string",
    "email": "string",
    "phone": "string",
    "total_referred": "number",
    "money_balance": "number",
    "vouchers_count": "number",
    "claimed_money": "number",
    "claimed_vouchers": "number",
    "rewards": [
      {
        "id": "number",
        "type": "MONEY" or "VOUCHER",
        "amount": "number",
        "claimed": "boolean",
        "created_at": "date string"
      }
    ]
  }
]
```

**Example**:
```json
[
  {
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "+998901234567",
    "total_referred": 5,
    "money_balance": 125000,
    "vouchers_count": 3,
    "claimed_money": 100000,
    "claimed_vouchers": 2,
    "rewards": [
      {
        "id": 1,
        "type": "MONEY",
        "amount": 45000,
        "claimed": true,
        "created_at": "2026-02-15"
      },
      {
        "id": 2,
        "type": "VOUCHER",
        "amount": 10,
        "claimed": true,
        "created_at": "2026-02-16"
      }
    ]
  }
]
```

---

### 4. POST `/referrals/admin/withdraw/`

**Request Body**:
```json
{
  "user_id": "number or string",
  "amount": "number"
}
```

**Success Response (200 OK)**:
```json
{
  "id": "number",
  "student_username": "string",
  "student_full_name": "string",
  "amount": "number",
  "status": "COMPLETED" or "PENDING",
  "requested_at": "ISO 8601 datetime",
  "processed_at": "ISO 8601 datetime"
}
```

**Error Response (400 Bad Request)**:
```json
{
  "error": "Insufficient balance" or "User not found"
}
```

---

### 5. GET `/referrals/admin/vouchers/`

**Status Code**: `200 OK`

**Response Format**:
```json
[
  {
    "id": "number",
    "code": "string",
    "student_username": "string",
    "discount_percent": "number",
    "is_activated": "boolean",
    "activated_course": "string or null",
    "activated_month": "YYYY-MM or null",
    "created_at": "ISO 8601 datetime"
  }
]
```

---

### 6. POST `/referrals/admin/activate-voucher/`

**Request Body**:
```json
{
  "voucher_id": "number",
  "course_id": "number",
  "activation_month": "YYYY-MM"
}
```

**Success Response (201 Created)**:
```json
{
  "id": "number",
  "voucher_code": "string",
  "course_id": "number",
  "course_title": "string",
  "activation_month": "YYYY-MM",
  "discount_percent": "number",
  "activated_at": "ISO 8601 datetime"
}
```

---

### 7. GET `/referrals/admin/leaderboard/`

**Status Code**: `200 OK`

**Response Format**:
```json
[
  {
    "rank": "number",
    "user_id": "number or string",
    "username": "string",
    "email": "string",
    "phone": "string",
    "total_referrals": "number",
    "total_earnings": "number",
    "total_vouchers": "number"
  }
]
```

**Example**:
```json
[
  {
    "rank": 1,
    "user_id": 1,
    "username": "john_doe",
    "email": "john@example.com",
    "phone": "+998901234567",
    "total_referrals": 10,
    "total_earnings": 450000,
    "total_vouchers": 10
  },
  {
    "rank": 2,
    "user_id": 2,
    "username": "jane_smith",
    "email": "jane@example.com",
    "phone": "+998901234568",
    "total_referrals": 8,
    "total_earnings": 360000,
    "total_vouchers": 8
  }
]
```

---

## ⚠️ ERROR RESPONSES

All error responses should follow this format:

**400 Bad Request**:
```json
{
  "error": "User-friendly error message",
  "field": "field_name (optional)",
  "detail": "Technical details (optional)"
}
```

**401 Unauthorized**:
```json
{
  "error": "Authentication failed",
  "detail": "Token expired or invalid"
}
```

**404 Not Found**:
```json
{
  "error": "Resource not found",
  "resource": "User"
}
```

**500 Server Error**:
```json
{
  "error": "Internal server error",
  "request_id": "unique-id-for-debugging"
}
```

---

## 📝 IMPORTANT NOTES

1. **Date Format**: All dates must be ISO 8601 format: `YYYY-MM-DDTHH:mm:ssZ`
2. **Status Codes**: Use correct HTTP status codes (200, 201, 400, 401, 404, 500)
3. **Field Names**: Must match exactly (case-sensitive)
4. **null values**: Use `null` instead of empty string for optional fields
5. **Numbers**: Use actual numbers, not strings
6. **Booleans**: Use `true/false`, not `"true"/"false"`
7. **Arrays**: Return array even if empty `[]`

---

## ✅ VALIDATION CHECKLIST

Before deploying backend, verify:

- [ ] All response fields present
- [ ] All dates in ISO 8601 format
- [ ] All numbers are numbers (not strings)
- [ ] All booleans are true/false (not strings)
- [ ] Arrays returned even when empty
- [ ] Error messages user-friendly
- [ ] HTTP status codes correct
- [ ] Authentication working (Bearer token)
- [ ] CORS allowing frontend domain
- [ ] No hardcoded test data
- [ ] Database properly populated
- [ ] Pagination working (if applicable)

---

**Created**: February 20, 2026  
**Version**: 1.0  
**Status**: Ready for Backend Implementation
