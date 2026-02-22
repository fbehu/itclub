# 🛒 Student Course Purchase System - Implementation Guide

## Overview

The student course purchase system allows students to browse available courses, select groups, choose payment methods, and complete enrollment with automatic payment receipt generation.

## 📂 Files Created

### 1. **CoursePurchase.tsx** - Main purchase flow
- **Path**: `/src/pages/student/CoursePurchase.tsx`
- **Purpose**: Main page for students to purchase courses with 4-step wizard
- **Steps**:
  1. **Select Course** - Browse and choose a course
  2. **Select Group** - Choose a group for the selected course
  3. **Payment** - Select payment method and enter amount
  4. **Success** - Confirmation and payment receipt display

### 2. **MyEnrollments.tsx** - Student enrollments management
- **Path**: `/src/pages/student/MyEnrollments.tsx`
- **Purpose**: Display all student's purchased courses and payment history
- **Features**:
  - List of all student enrollments
  - Statistics (total courses, paid amount, debt, total payments)
  - Search/filter functionality
  - Detailed enrollment view modal with payment history

## 🔗 Routes Added

```tsx
// CoursePurchase route
/dashboard/student/course-purchase  → CoursePurchase component

// MyEnrollments route
/dashboard/student/my-enrollments   → MyEnrollments component
```

## 🎯 Main Features

### Step 1: Course Selection
```
GET /courses/
- Displays all active courses
- Shows monthly price, duration, and total price
- User selects a course to proceed
```

**Course Data**:
```json
{
  "id": 1,
  "name": "Matematika Rus",
  "description": "...",
  "monthly_price": "500000.00",
  "monthly_discount_price": "500000.00",
  "course_duration": 2,
  "groups_list": [1, 2, 3]
}
```

### Step 2: Group Selection
```
GET /groups/?course={course_id}
- Displays groups for selected course
- Shows teacher, schedule, room, student count
- User selects a group
```

**Group Data**:
```json
{
  "id": 1,
  "name": "Demo Guruh",
  "teacher": "O'qituvchi Ismi",
  "room": "Xona 1",
  "class_days": "Dushanba, Chorshanba",
  "start_time": "10:00",
  "end_time": "11:00",
  "student_count": 15
}
```

### Step 3: Payment
```
- Payment Method: Card (💳) or Cash (💵)
- Payment Amount: Input (max = monthly price)
- Confirmation dialog before submission
```

### Step 4: Enrollment Creation
```
POST /courses/enrollment/

Request Body:
{
  "student_id": "uuid",
  "course_id": 1,
  "group_id": 2,
  "payment_method": "card|cash",
  "payment_amount": "100000.00"
}

Response (EnrollmentDetailSerializer):
{
  "id": 9,
  "user_id": "uuid",
  "user_name": "Student Name",
  "course_name": "Matematika Rus",
  "course_description": "...",
  "course_duration": 2,
  "start_date": "2026-02-07",
  "end_date": null,
  "total_price": 1000000.0,
  "paid_amount": 100000.0,
  "debt": 900000.0,
  "monthly_payment": 500000.0,
  "paid_percentage": 10.0,
  "status": "active",
  "payments_history": [
    {
      "id": 1,
      "amount": 100000.0,
      "payment_type": "card",
      "payment_type_display": "Card",
      "note": "Dastlabki to'lov - Matematika Rus",
      "is_confirmed": true,
      "created_at": "2026-02-07T10:30:00+00:00"
    }
  ],
  "monthly_breakdown": [...]
}
```

## 📊 Student Enrollments Page (MyEnrollments)

### Features
- **Statistics Cards**:
  - Total courses purchased
  - Total paid amount
  - Total debt
  - Total payment receipts

- **Enrollments Table**:
  - Course name
  - Duration
  - Monthly price
  - Paid amount
  - Debt
  - Payment progress (visual bar)
  - Status badge

- **Detail Modal**:
  - Summary boxes (total, paid, debt, monthly)
  - Payment history with details
  - Payment type and confirmation status

- **Search/Filter**:
  - Search by course name or student name

## 🔐 Validation & Error Handling

### Frontend Validations
- ✅ Course selection required
- ✅ Group selection required
- ✅ Group must belong to selected course
- ✅ Payment amount > 0
- ✅ Payment amount ≤ monthly price
- ✅ Payment method required

### Error Messages (Uzbek)
```
"Barcha majburiy maydonlarni to'ldiring"
- All required fields must be filled

"To'lov miqdori 0 dan katta bo'lishi kerak"
- Payment amount must be greater than 0

"To'lov oylik narxdan (XXX so'm) oshmasligi kerak"
- Payment cannot exceed monthly price

"Bu student allaqachon shu kursga ro'yxatdan o'tgan"
- Student already enrolled (backend)

"Bu guruh ushbu kursga bog'lanmagan"
- Group doesn't belong to course (backend)
```

## 🎨 UI Components Used

- `Card`, `CardHeader`, `CardTitle`, `CardContent`
- `Button` (various variants: default, outline, ghost)
- `Input`, `Label`
- `Select`, `SelectTrigger`, `SelectValue`, `SelectContent`, `SelectItem`
- `Badge`
- `RadioGroup`, `RadioGroupItem`
- `Alert`, `AlertDescription`
- `AlertDialog` (for confirmation)
- `Table`, `TableHeader`, `TableBody`, `TableHead`, `TableRow`, `TableCell`

## 🎯 Lucide React Icons Used

```
- ShoppingCart     (main action)
- Users           (groups)
- Clock           (schedule)
- Building2       (room)
- CreditCard      (payment)
- ArrowLeft       (back button)
- CheckCircle2    (success)
- AlertCircle     (warning/info)
- Plus            (add)
- Eye             (view details)
- Loader2         (loading)
- Search          (search field)
- TrendingUp      (statistics)
- FileText        (documents)
```

## 📱 Responsive Design

- **Mobile**: Single column layout with full-width elements
- **Tablet**: 2-column layout for statistics
- **Desktop**: Multi-column grids for better visual hierarchy

## 🔄 Data Flow

```
1. Student navigates to /dashboard/student/course-purchase
2. Component loads:
   - GET /courses/ → Display courses
3. Student selects course:
   - GET /groups/?course={id} → Load groups
4. Student selects group + payment details:
   - Confirmation dialog
5. Student confirms:
   - POST /courses/enrollment/ → Create enrollment
   - Backend creates payment receipt automatically
6. Show success page with:
   - Enrollment details
   - Payment receipt (payments_history)
7. Navigation options:
   - View all enrollments → /dashboard/student/my-enrollments
   - Purchase another course → restart flow
   - Go to profile → /dashboard/profile
```

## 🚀 Navigation Integration

### Student Menu (DashboardLayout)
```
🛒 Kurs Sotib Olish        → /dashboard/student/course-purchase
📝 Mening Kurslarim         → /dashboard/student/my-enrollments (via MyEnrollments)
```

## ✅ Automatic Backend Features

When enrollment is created (`POST /courses/enrollment/`), the backend automatically:
1. ✅ Creates the enrollment record
2. ✅ Creates payment receipt (Payment record)
3. ✅ Calculates debt (total_price - paid_amount)
4. ✅ Marks payment as confirmed (is_confirmed: true)
5. ✅ Adds student to group
6. ✅ Returns complete enrollment with payments_history

## 📝 Example Workflow

### Scenario: Student Buys Course

1. **Navigate to Purchase**
   ```
   Student clicks "🛒 Kurs Sotib Olish" in menu
   → Opens CoursePurchase page
   ```

2. **Select Course**
   ```
   Available courses load:
   - Matematika Rus (500,000 so'm/oy, 2 oy)
   - Ingliz Tili (400,000 so'm/oy, 3 oy)
   
   Student clicks "Matematika Rus"
   ```

3. **Select Group**
   ```
   Groups for Matematika Rus load:
   - Demo Guruh (Dushanba, Chorshanba 10:00-11:00)
   - Group 2 (Juma, Shanba 14:00-15:00)
   
   Student selects "Demo Guruh"
   ```

4. **Enter Payment Details**
   ```
   - Payment method: 💳 Card
   - Payment amount: 100,000 so'm (dastlabki to'lov)
   - Total: 1,000,000 so'm
   - Debt: 900,000 so'm
   ```

5. **Confirmation**
   ```
   Dialog shows summary:
   - Kurs: Matematika Rus
   - Guruh: Demo Guruh
   - To'lov usuli: Karta
   - Miqdori: 100,000 so'm
   
   Student clicks "Sotib Olishni Tasdiqlash"
   ```

6. **Success Page**
   ```
   ✓ Muvaffaqiyatli Sotib Olindi!
   
   Enrollment #9 created:
   - Total: 1,000,000 so'm
   - Paid: 100,000 so'm
   - Debt: 900,000 so'm
   - Monthly: 500,000 so'm
   
   Payment receipt shown:
   - Amount: 100,000 so'm
   - Type: Card
   - Status: Tasdiqlangan ✓
   - Date: Feb 7, 2026
   
   Options:
   [Mening Kurslarim] [Boshqa Kurs Sotib Olish]
   ```

## 🔍 View All Enrollments

Student can view all their purchases via:
- **Menu**: Click on any course purchase section
- **Navigation**: `/dashboard/student/my-enrollments`
- **Stat Cards**: Shows summary of all enrollments

## 💾 Build Status

✅ **Build Successful**
- All components compiled
- No TypeScript errors
- Routes properly configured
- Icons properly imported

---

## 📌 Important Notes

1. **Monthly Price Logic**:
   - Frontend displays: `monthly_discount_price` as the per-month cost
   - Total = monthly price × duration months
   - Backend calculates and returns all totals

2. **Payment Validation**:
   - Initial payment cannot exceed monthly price
   - Debt = total_price - paid_amount
   - Students can pay remainder later

3. **Group Integration**:
   - Groups are filtered by course_id
   - Only groups belonging to the course are shown
   - Student is auto-added to selected group on enrollment

4. **Payment Receipt**:
   - Automatically created when enrollment is created
   - Payment type (card/cash) is stored
   - Includes default note: "Dastlabki to'lov - [Course Name]"
   - Is_confirmed = true by default

5. **Student Navigation**:
   - Profile page → My Enrollments
   - Top menu → Course Purchase
   - Can switch between courses and enrollments freely
