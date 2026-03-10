# Exams API Frontend Guide

Bu hujjat `apps/exams` uchun frontend integratsiya yo'riqnomasi.

## 1) Base URL va autentifikatsiya

- API root: `/api/`
- Exams root: `/api/exams/`
- Auth login: `POST /api/auth/login/`
- Auth logout: `POST /api/auth/logout/`
- JWT header: `Authorization: Bearer <access_token>`

### Login request

`POST /api/auth/login/`

```json
{
  "username_or_phone": "998901234567",
  "password": "your_password"
}
```

### Login response (200)

```json
{
  "refresh": "<jwt_refresh>",
  "access": "<jwt_access>",
  "user": {
    "id": "uuid",
    "username": "john",
    "first_name": "John",
    "last_name": "Doe",
    "phone_number": "998901234567",
    "role": "student",
    "student_groups": [{"id": 1, "name": "A1"}],
    "teaching_groups": []
  }
}
```

## 2) Endpointlar (Exams)

## 2.1 Exams

- `GET /api/exams/`
- `POST /api/exams/`
- `GET /api/exams/{exam_id}/`
- `PUT /api/exams/{exam_id}/`
- `PATCH /api/exams/{exam_id}/`
- `DELETE /api/exams/{exam_id}/`
- `GET /api/exams/{exam_id}/questions/`

### `POST /api/exams/` body

```json
{
  "title": "Math Midterm",
  "description": "Algebra + Geometry",
  "subject": "Matematika",
  "hashtag": "#math",
  "group_ids": [1, 2],
  "start_date": "2026-03-11T09:00:00Z",
  "end_date": "2026-03-11T10:00:00Z",
  "duration_minutes": 60,
  "passing_score": 60,
  "question_score": 5,
  "total_points": 100,
  "num_questions_to_show": 20,
  "status": "published",
  "show_results_immediately": false,
  "shuffled_questions": true
}
```

### Exam response (qisqa ko'rinish)

```json
{
  "id": 10,
  "title": "Math Midterm",
  "description": "Algebra + Geometry",
  "subject": "Matematika",
  "hashtag": "#math",
  "created_by": "user-uuid",
  "created_by_username": "teacher1",
  "groups": [
    {
      "id": 1,
      "name": "A1"
    }
  ],
  "start_date": "2026-03-11T09:00:00Z",
  "end_date": "2026-03-11T10:00:00Z",
  "duration_minutes": 60,
  "passing_score": 60,
  "question_score": 5,
  "total_points": 100,
  "num_questions_to_show": 20,
  "status": "published",
  "show_results_immediately": false,
  "shuffled_questions": true,
  "questions": [],
  "created_at": "2026-03-10T08:00:00Z",
  "updated_at": "2026-03-10T08:00:00Z"
}
```

## 2.2 Questions

- `GET /api/exams/questions/`
- `POST /api/exams/questions/`
- `GET /api/exams/questions/{question_id}/`
- `PUT /api/exams/questions/{question_id}/`
- `PATCH /api/exams/questions/{question_id}/`
- `DELETE /api/exams/questions/{question_id}/`
- Filter: `GET /api/exams/questions/?exam_id={exam_id}`

### `POST /api/exams/questions/` body

```json
{
  "exam": 10,
  "text": "2 + 2 = ?",
  "question_type": "multiple_choice",
  "order": 1,
  "explanation": "Simple arithmetic"
}
```

### Question response (qisqa)

```json
{
  "id": 55,
  "exam": 10,
  "text": "2 + 2 = ?",
  "question_type": "multiple_choice",
  "order": 1,
  "explanation": "Simple arithmetic",
  "image": null,
  "answers": [
    {
      "id": 101,
      "question": 55,
      "text": "4",
      "is_correct": true,
      "order": 1
    }
  ],
  "created_at": "2026-03-10T08:10:00Z",
  "updated_at": "2026-03-10T08:10:00Z"
}
```

## 2.3 Answers

- `GET /api/exams/answers/`
- `POST /api/exams/answers/`
- `GET /api/exams/answers/{answer_id}/`
- `PUT /api/exams/answers/{answer_id}/`
- `PATCH /api/exams/answers/{answer_id}/`
- `DELETE /api/exams/answers/{answer_id}/`
- Filter: `GET /api/exams/answers/?question_id={question_id}`

### `POST /api/exams/answers/` body

```json
{
  "question": 55,
  "text": "4",
  "is_correct": true,
  "order": 1
}
```

## 2.4 Student Exams

- `GET /api/exams/student-exams/` (faqat o'ziniki)
- `POST /api/exams/student-exams/` (exam boshlash)
- `GET /api/exams/student-exams/{student_exam_id}/`
- `PUT /api/exams/student-exams/{student_exam_id}/`
- `PATCH /api/exams/student-exams/{student_exam_id}/`
- `DELETE /api/exams/student-exams/{student_exam_id}/`
- `POST /api/exams/student-exams/{student_exam_id}/submit/`

### `POST /api/exams/student-exams/` body

```json
{
  "exam": 10
}
```

### StudentExam response (qisqa)

```json
{
  "id": 77,
  "student": "user-uuid",
  "student_username": "student1",
  "exam": 10,
  "exam_title": "Math Midterm",
  "started_at": "2026-03-10T09:00:00Z",
  "completed_at": null,
  "status": "in_progress",
  "score": null,
  "passed": null,
  "answers": []
}
```

## 2.5 Student Answers

- `GET /api/exams/student-answers/` (faqat o'ziniki)
- `POST /api/exams/student-answers/`
- `GET /api/exams/student-answers/{student_answer_id}/`
- `PUT /api/exams/student-answers/{student_answer_id}/`
- `PATCH /api/exams/student-answers/{student_answer_id}/`
- `DELETE /api/exams/student-answers/{student_answer_id}/`

### `POST /api/exams/student-answers/` body

Multiple choice uchun:

```json
{
  "student_exam": 77,
  "question": 55,
  "selected_answer": 101,
  "text_answer": ""
}
```

Short/essay uchun:

```json
{
  "student_exam": 77,
  "question": 56,
  "selected_answer": null,
  "text_answer": "My text answer"
}
```

### StudentAnswer response

```json
{
  "id": 500,
  "student_exam": 77,
  "question": 55,
  "selected_answer": 101,
  "text_answer": "",
  "points_earned": null,
  "answered_at": "2026-03-10T09:10:00Z"
}
```

## 3) Role va permissionlar (hozirgi kod bo'yicha)

- `ExamViewSet`, `QuestionViewSet`, `AnswerViewSet`: `IsAuthenticatedOrReadOnly`
- `StudentExamViewSet`, `StudentAnswerViewSet`: `IsAuthenticated`

### Real ishlash holati

- Anonymous (`token` yo'q):
- `GET /api/exams/` da faqat `status='published'` examlar ko'rinadi.
- `questions` va `answers` endpointlaridan o'qish mumkin.

- Authenticated (istalgan role: student/teacher/manager/admin):
- `exams/questions/answers` uchun create/update/delete ochiq.
- `GET /api/exams/` da:
- `is_staff=True` bo'lsa barcha examlar.
- aks holda foydalanuvchining `student_groups` ga biriktirilgan examlar.

- Student exams:
- Faqat login bo'lgan user o'zi uchun ko'radi.
- `POST /student-exams/` da tekshiruvlar bor:
- exam mavjudligi,
- user exam groupga tegishliligi,
- vaqt oralig'i,
- oldin topshirgan-topshirmagani.

- Student answers:
- Faqat login bo'lgan user o'zi uchun ko'radi.
- `POST /student-answers/` da tekshiruvlar bor:
- `student_exam` userga tegishli,
- exam vaqti tugamagan,
- question shu student_exam ga biriktirilgan.

## 4) Frontend uchun tavsiya etilgan flow

## 4.1 Student flow

1. Login qiling va `access` tokenni saqlang.
2. `GET /api/exams/` bilan available examlar ro'yxatini oling.
3. Student exam boshlash: `POST /api/exams/student-exams/` (`exam` id bilan).
4. Savollarni olish:
- agar examdagi savollar soni `num_questions_to_show` dan kichik/yoki teng bo'lsa `GET /api/exams/questions/?exam_id={exam_id}` ishlatish mumkin.
5. Har savolga javob yuborish: `POST /api/exams/student-answers/`.
6. Yakunida `POST /api/exams/student-exams/{id}/submit/`.

## 4.2 Teacher/Admin flow

1. `POST /api/exams/` bilan exam yarating (`group_ids` bilan).
2. `POST /api/exams/questions/` bilan savollar kiriting.
3. `POST /api/exams/answers/` bilan variantlar kiriting.
4. `GET /api/exams/{exam_id}/questions/` orqali tekshirib oling.

## 5) Xatolik formatlari (misollar)

- `400 Bad Request`

```json
{"detail": "Exam ID talab qilinadi"}
```

- `403 Forbidden`

```json
{"detail": "Siz bu imtihonni qabul qila olmaysiz. Guruhingiz tanlangan emas"}
```

- `404 Not Found`

```json
{"detail": "Imtihon topilmadi"}
```

## 6) Muhim texnik eslatmalar (integration risk)

- `StudentExam` yaratilganda backend random savollarni `StudentExamQuestion` ga biriktiradi, lekin shu biriktirilgan savollarni beradigan alohida endpoint hozir yo'q.
- Natija: frontend `questions/?exam_id=` bilan hamma savolni olsa, random tanlanganidan tashqaridagiga javob yuborganda `403` olishi mumkin.

- `Question` javobida `answers[].is_correct` ochiq qaytadi.
- Bu studentga to'g'ri javobni oldindan ko'rsatib yuboradi.

- `Exam.status` default qiymati `draft`, lekin choices ichida `draft` yo'q.
- Frontend status yuborishda faqat quyidagilardan birini ishlatsin: `published`, `open`, `closed`, `expired`, `archived`.

## 7) Frontenddagi real integratsiya (joriy kod)

Quyidagi oqim hozir frontendda ishlatilmoqda:

1. Imtihonlar ro'yxati: `GET /api/exams/`
2. Imtihonni boshlash: `POST /api/exams/student-exams/` (`{ "exam": examId }`)
3. Savollarni olish: `GET /api/exams/{exam_id}/questions/`
4. Javob yuborish: `POST /api/exams/student-answers/`
5. Yakuniy topshirish: `POST /api/exams/student-exams/{student_exam_id}/submit/`
6. Natijalar ro'yxati: `GET /api/exams/student-exams/` (frontend `submitted/graded` statuslarni ko'rsatadi)
7. Natija detail: `GET /api/exams/student-exams/{student_exam_id}/`

### 7.1 Imtihonni boshlash (real misol)

```ts
const response = await authFetch(API_ENDPOINTS.STUDENT_EXAMS, {
  method: 'POST',
  body: JSON.stringify({ exam: exam.id }),
});
const data = await response.json();
// data.id => studentExamId
```

### 7.2 Savollarni olish (real misol)

```ts
const questionResponse = await authFetch(API_ENDPOINTS.EXAM_QUESTIONS(examId));
const questionData = await questionResponse.json();
```

### 7.3 Har bir savol javobini yuborish (real misol)

```ts
await authFetch(API_ENDPOINTS.STUDENT_ANSWERS, {
  method: 'POST',
  body: JSON.stringify({
    student_exam: studentExamId,
    question: questionId,
    selected_answer: selectedAnswerId,
    text_answer: '',
  }),
});
```

### 7.4 Imtihonni yakunlash (real misol)

```ts
await authFetch(API_ENDPOINTS.STUDENT_EXAM_SUBMIT(studentExamId), {
  method: 'POST',
  body: JSON.stringify({}),
});
```
