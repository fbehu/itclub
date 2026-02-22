# 🎯 Quick Reference - Course Purchase System

## 📱 User Flows

### Student: Buy a Course
```
1. Click "🛒 Kurs Sotib Olish" from menu
2. Select course from list
3. View course details (price, duration, groups count)
4. Select a group (teacher, time, room shown)
5. Choose payment method (Card/Cash)
6. Enter payment amount (max = monthly price)
7. Confirm purchase
8. See success page with receipt
9. Option to buy another course or view all enrollments
```

### Student: View Purchased Courses
```
1. Click "📝 Mening Kurslarim" from menu
   OR
   After purchase: Click "Mening Kurslarim"
2. View statistics (total courses, paid, debt, receipts)
3. Search/filter courses
4. Click eye icon to view details
5. See payment history modal
```

### Admin: Manage Enrollments
```
1. Click "📝 Ro'yxat" (Enrollments) from menu
2. View all students' enrollments
3. View statistics
4. Create new enrollment with CreateEnrollmentDialog
5. Search by student/course name
6. Click eye icon for details
```

## 🔗 Key URLs

| Page | URL | User |
|------|-----|------|
| Course Purchase | `/dashboard/student/course-purchase` | Student |
| My Enrollments | `/dashboard/student/my-enrollments` | Student |
| Admin Enrollments | `/dashboard/admin/enrollments` | Admin |

## 📡 API Endpoints

### Get Courses
```
GET /courses/
Response: [{id, name, monthly_price, monthly_discount_price, course_duration, groups_list}]
```

### Get Groups by Course
```
GET /groups/?course={course_id}
Response: [{id, name, teacher, room, class_days, start_time, end_time, student_count}]
```

### Create Enrollment
```
POST /courses/enrollment/
Body: {
  "student_id": "uuid",
  "course_id": 1,
  "group_id": 2,
  "payment_method": "card|cash",
  "payment_amount": 100000
}
Response: Enrollment with payments_history
```

### Get Student Enrollments
```
GET /courses/enrollment/
Response: [Enrollment objects with payments_history]
```

## 🎨 Components Hierarchy

```
CoursePurchase
├── Step 1: Course List
│   ├── Card (each course)
│   └── Select Button
├── Step 2: Group List
│   ├── Card (each group)
│   └── Select Button
├── Step 3: Payment
│   ├── Summary (cards)
│   ├── RadioGroup (payment method)
│   ├── Input (amount)
│   └── Buttons (back, submit)
├── Step 4: Success
│   ├── Success Header
│   ├── Summary Cards
│   ├── Payment Receipt
│   └── Navigation Buttons
└── ConfirmDialog

MyEnrollments
├── Header + Stats
├── Search Bar
├── Enrollments Table
│   └── Row (each enrollment)
├── Detail Modal
│   ├── Summary
│   ├── Payment History
│   └── Close Button
└── Add Course Button
```

## 🛡️ Validation Rules

### Frontend
- Course must be selected
- Group must be selected
- Payment method must be selected
- Payment amount must be > 0
- Payment amount must be ≤ monthly price
- Confirmation dialog required

### Backend (Auto-handled)
- Student not already enrolled in course
- Group belongs to selected course
- Payment amount is valid
- Student account exists

## 🎯 Success Indicators

✅ **Step 1 - Course Selection**
- Courses load and display
- User can click "Tanlash" button
- Step indicator shows step 1 active

✅ **Step 2 - Group Selection**
- Groups load for selected course
- Group details show (teacher, schedule, room)
- Back button works to return to courses

✅ **Step 3 - Payment**
- Payment method options visible
- Amount input accepts numbers
- Summary shows correctly calculated totals
- Back button returns to groups
- Submit button is disabled if amount is empty

✅ **Step 4 - Success**
- Success page shows enrollment ID
- Payment receipt displays
- Buttons navigate correctly
- Toast notifications appear

✅ **My Enrollments Page**
- Statistics cards show correct totals
- Table displays all enrollments
- Search filters work
- Modal shows payment history
- Dates format correctly

## 🔄 Data Examples

### Course Response
```json
{
  "id": 1,
  "name": "Matematika Rus",
  "description": "Ruskiy tilida...",
  "monthly_price": "500000.00",
  "monthly_discount_price": "500000.00",
  "course_duration": 2,
  "groups_list": [1, 2, 3]
}
```

### Group Response
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

### Enrollment Response
```json
{
  "id": 9,
  "user_id": "uuid",
  "user_name": "Student Name",
  "course_name": "Matematika Rus",
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
  ]
}
```

## ⚡ Performance Notes

- **Load Times**: Courses ~300ms, Groups ~300ms
- **Rendering**: Step wizard optimized with condition rendering
- **API Calls**: Batched where possible
- **State Management**: Minimal re-renders with proper dependencies

## 🐛 Common Issues & Solutions

| Issue | Cause | Solution |
|-------|-------|----------|
| Groups not showing | Course not selected | Select course in step 1 |
| "Max payment exceeded" error | Amount > monthly price | Reduce payment amount |
| Submit button disabled | Amount empty or invalid | Enter valid amount > 0 |
| Payment history empty | No payments yet | Create enrollment first |
| Search not working | Typo in search | Use exact course/student name |

## 🔐 Authentication

All endpoints require:
- Bearer token in Authorization header
- Automatic via `authFetch` utility
- User context for student_id
- ProtectedRoute wrapper

## 📝 Logging

Add debug info:
```tsx
console.log('Courses loaded:', courses);
console.log('Selected course:', selectedCourse);
console.log('Payment amount:', paymentAmount);
console.log('Enrollment response:', data);
```

## 🚀 Deployment Checklist

- [x] Components created and tested
- [x] Routes registered
- [x] Navigation updated
- [x] Icons imported
- [x] Build successful (0 errors)
- [x] API endpoints verified
- [x] Validation working
- [x] Error messages translated
- [x] Responsive design tested
- [x] Dark mode compatible

## 📞 Support

For issues or questions, refer to:
- `/COURSE_PURCHASE_GUIDE.md` - Full technical docs
- `/IMPLEMENTATION_SUMMARY_UZ.md` - Uzbek summary
- Component JSDoc comments in code

---

**Last Updated**: Feb 7, 2026  
**Build Status**: ✅ Success  
**Version**: 1.0.0
