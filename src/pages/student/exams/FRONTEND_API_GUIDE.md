# Exams API Frontend Guide

Bu hujjat `apps/exams` uchun frontend integratsiya yo'riqnomasi.

## 1) Base URL va autentifikatsiya

- API root: `/api/`
- Exams root: `/api/exams/`
- Auth login: `POST /api/auth/login/`
- Auth logout: `POST /api/auth/logout/`
- JWT header: `Authorization: Bearer <access_token>`
- Exam session uchun device header: `X-Device-Id: <unique_device_id>`
- Exam davom ettirish uchun session header: `X-Exam-Session-Key: <exam_session_key>`

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

Exam sozlamalarining ishlashi:
- `num_questions_to_show`: studentga ko'rsatiladigan savollar soni.
- `shuffled_questions=true`: barcha savollardan random va takrorlanmasdan `num_questions_to_show` ta tanlanadi.
- `shuffled_questions=false`: savollar `order` bo'yicha ketma-ket tanlanadi (`birinchi N ta`).
- `show_results_immediately=true`: submit qilganda natija statistikasi darhol qaytadi.
- `show_results_immediately=false`: submit qilganda faqat yakunlangan status qaytadi, natija keyin `student-exams` orqali olinadi.

## 2.1 Exams

- `GET /api/exams/`
- `POST /api/exams/`
- `GET /api/exams/{exam_id}/`
- `PUT /api/exams/{exam_id}/`
- `PATCH /api/exams/{exam_id}/`
- `DELETE /api/exams/{exam_id}/`
- `GET /api/exams/{exam_id}/questions/`

`GET /api/exams/` list javobida `questions` bo'lmaydi (faqat imtihon meta ma'lumotlari).
`GET /api/exams/{exam_id}/` ichida esa savollar keladi.
Student uchun `GET /api/exams/{exam_id}/questions/` faqat o'ziga biriktirilgan savollarni qaytaradi (imtihonni boshlab bo'lgandan keyin).

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
- `GET /api/exams/student-exams/{student_exam_id}/questions/` (faqat shu studentga biriktirilgan savollar)

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
  "answers": [],
  "assigned_question_ids": [55, 56, 57],
  "exam_session_key": "f6a9...sessionkey...",
  "session_replaced": false
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
- Student/anonymous uchun javob variantida `is_correct` yuborilmaydi.

- Authenticated (istalgan role: student/teacher/manager/admin):
- `exams/questions/answers` uchun create/update/delete ochiq.
- `GET /api/exams/` da:
- `is_staff=True` bo'lsa barcha examlar.
- aks holda foydalanuvchining `student_groups` ga biriktirilgan examlar.
- Teacher/sub_teacher/manager/admin uchun `is_correct` ko'rinadi.

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
3. Student exam boshlash: `POST /api/exams/student-exams/` (`exam` id bilan), `X-Device-Id` yuboring.
4. Javobdan `exam_session_key` ni oling.
5. Savollarni olishda `X-Exam-Session-Key` yuboring: `GET /api/exams/student-exams/{student_exam_id}/questions/`.
   Muqobil: `GET /api/exams/{exam_id}/questions/?student_exam_id={student_exam_id}` ham ishlaydi.
6. Har savolga javob yuborishda ham `X-Exam-Session-Key` yuboring: `POST /api/exams/student-answers/`.
7. Yakunida `POST /api/exams/student-exams/{id}/submit/` (`X-Exam-Session-Key` bilan).
8. `show_results_immediately=true` bo'lsa submit javobida natija statistikasi qaytadi: `correct_answers`, `wrong_answers`, `earned_points`, `max_points`, `percentage`, `passed`.
9. `show_results_immediately=false` bo'lsa submit javobida faqat yakunlangan holat (`status`, `completed_at`, `detail`) qaytadi.
10. Agar boshqa device shu examni ochsa, `session_replaced=true` bo'ladi va eski device 409 xato oladi.

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

- `409 Conflict` (sessiya boshqa device'ga o'tgan)

```json
{"detail": "Sessiya boshqa qurilmaga o'tgan. Imtihonni qayta ochib davom eting."}
```

## 6) Muhim texnik eslatmalar (integration risk)

- `StudentExam` yaratilganda backend random savollarni `StudentExamQuestion` ga biriktiradi.
- Frontend javob yuborishdan oldin `GET /api/exams/student-exams/{student_exam_id}/questions/` ishlatishi kerak.

- `answers[].is_correct` faqat teacher/sub_teacher/manager/admin uchun qaytadi.
- Student va anonymous foydalanuvchiga bu maydon yuborilmaydi.

- `Exam.status` default qiymati `draft`, lekin choices ichida `draft` yo'q.
- Frontend status yuborishda faqat quyidagilardan birini ishlatsin: `published`, `open`, `closed`, `expired`, `archived`.
