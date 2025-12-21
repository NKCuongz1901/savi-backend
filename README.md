## Giới thiệu dự án

**Savi Backend** là REST API cho ứng dụng quản lý chi tiêu cá nhân, xây dựng bằng **NestJS**, **Prisma** và **PostgreSQL**.  
Hệ thống hỗ trợ quản lý người dùng, ví, giao dịch thu/chi, danh mục (user & default), thiết lập hạn mức chi (budget) và phân tích chi tiêu bằng **Gemini AI**.

- **Tech stack chính**: NestJS, PostgreSQL, Prisma ORM, JWT Auth, Mailer, Cloudinary, Gemini.
- **Đối tượng sử dụng**: mobile/web app front-end hoặc các client khác gọi API qua HTTP.

---

## Cấu trúc thư mục chính

```bash
savi-backend/
  prisma/
    schema.prisma        # Định nghĩa schema database Prisma
    migrations/          # Các migration của Prisma
    seeds/               # Script seeding dữ liệu mẫu (user, category, default category)
    seed.ts              # Điểm vào để chạy seed

  src/
    main.ts              # Điểm vào NestJS
    app.module.ts        # Root module

    auth/                # Module xác thực (login, guard, strategy)
    user/                # Module người dùng (đăng ký, verify email, đổi mật khẩu, reset password)
    wallet/              # Module ví (tổng thu, tổng chi, số dư)
    transaction/         # Module giao dịch (thu/chi, filter, sửa/xóa)
    category/            # Default category (INCOME/EXPENSE mặc định)
    user-category/       # Category do user tự tạo
    budget-category/     # Hạn mức chi theo danh mục (budget)
    gemini/              # Tích hợp Gemini phân tích giao dịch
    mail/                # Gửi email (xác thực, reset mật khẩu)
    cloudinary/          # Upload ảnh (nếu giao dịch có ảnh)
    prisma/              # PrismaService (kết nối DB)
    utils/               # Hàm helper (hash password, random code, v.v.)

  package.json           # Scripts, dependencies
  tsconfig*.json         # Cấu hình TypeScript
  eslint.config.mjs      # ESLint config
```

---

## API chính

Các endpoint dưới đây đều là REST API, base URL mặc định: `http://localhost:3000` (theo config NestJS mặc định).

### Auth (`/auth`)

- **POST `/auth/login`**

  - **Body**: `{ email: string, password: string }` (qua `LocalAuthGuard`)
  - **Kết quả**: trả về access token JWT và thông tin user cơ bản.

- **GET `/auth/profile`**
  - **Auth**: `Authorization: Bearer <token>` (qua `JwtAuthGuard`)
  - **Kết quả**: thông tin user đang đăng nhập (payload từ JWT).

### User (`/user`)

- **POST `/user/create`**

  - **Mô tả**: Đăng ký tài khoản mới, hash password, tạo `Wallet`, gửi email chứa mã xác thực (`codeID`).
  - **Body** (`CreateUserDto`): `{ fullName, email, password }`.

- **POST `/user/verify`**

  - **Mô tả**: Xác thực email bằng mã `codeID` đã gửi và email tương ứng.
  - **Body**: `{ email: string; code: string }`.
  - **Logic**: tìm user theo `email + codeID + chưa hết hạn`, set `status = ACTIVE`, xoá `codeID` và `codeExpired`.

- **POST `/user/change-password`**

  - **Auth**: (thường gọi sau khi đăng nhập).
  - **Body**: `{ userEmail, oldPassword, newPassword }`.
  - **Mô tả**: Kiểm tra mật khẩu cũ, nếu đúng thì cập nhật mật khẩu mới (hash).

- **POST `/user/forgot-password`**

  - **Body**: `{ email }`.
  - **Mô tả**: Tạo code reset, lưu `codeID`, `codeExpired` và gửi email chứa code.

- **POST `/user/reset-password`**
  - **Body**: `{ email, code, newPassword }`.
  - **Mô tả**: Xác thực `email + code + chưa hết hạn`, sau đó cập nhật mật khẩu mới và xoá `codeID`, `codeExpired`.

### Wallet (`/wallet`)

- **GET `/wallet`**

  - **Auth**: JWT.
  - **Mô tả**: Lấy thông tin ví của user (totalIncome, totalExpense, totalBalance).

- **POST `/wallet`**
  - **Auth**: JWT.
  - **Mô tả**: Tạo ví cho user nếu chưa có (thường đã tạo khi đăng ký).

### Default Category (`/category`)

- **GET `/category/default`**
  - **Query**: `type?: 'INCOME' | 'EXPENSE'`.
  - **Mô tả**: Lấy danh sách category mặc định theo loại giao dịch.

### User Category (`/user-category`)

Tất cả endpoint dưới đây yêu cầu JWT.

- **POST `/user-category`**

  - **Body**: `CreateUserCategoryDto` (tên, type, v.v.).
  - **Mô tả**: Tạo danh mục thu/chi riêng cho user.

- **GET `/user-category`**

  - **Query**: `type?: TransactionType`.
  - **Mô tả**: Lấy tất cả danh mục của user, có thể filter theo `INCOME/EXPENSE`.

- **GET `/user-category/:id`**

  - **Mô tả**: Lấy chi tiết một danh mục của user.

- **PATCH `/user-category/:id`**

  - **Body**: `UpdateUserCategoryDto`.
  - **Mô tả**: Sửa thông tin danh mục.

- **DELETE `/user-category/:id`**
  - **Mô tả**: Xoá danh mục của user.

### Budget Category (`/budget-category`)

Tất cả endpoint yêu cầu JWT.

- **POST `/budget-category`**

  - **Body** (`CreateBudgetCategoryDto`): `{ userCategoryId? | defaultCategoryId?, amount, startDate, endDate }`.
  - **Mô tả**: Tạo hạn mức chi cho 1 danh mục (category của user hoặc default category) trong một khoảng thời gian.

- **GET `/budget-category`**

  - **Mô tả**: Lấy tất cả budget của user hiện tại.

- **GET `/budget-category/:budgetId/transactions`**

  - **Mô tả**: Lấy danh sách transaction (chi tiêu) thuộc budget này (lọc theo user, category/defaultCategory, date range).

- **PATCH `/budget-category/:id`**

  - **Body**: `UpdateBudgetCategoryDto`.
  - **Mô tả**: Cập nhật thông tin budget.

- **DELETE `/budget-category/:id`**
  - **Mô tả**: Xoá budget.

### Transaction (`/transaction`)

Tất cả endpoint yêu cầu JWT.

- **POST `/transaction`**

  - **Body** (`CreateTransactionDto`): thông tin giao dịch (type: INCOME/EXPENSE, amount, note, categoryId/defaultCategoryId, v.v.).
  - **Mô tả**: Tạo giao dịch mới, tự động cập nhật `Wallet` (totalIncome/Expense/Balance) và `usage` của budget (nếu là EXPENSE trong range budget).

- **POST `/transaction/ai-create`**

  - **Body**: `{ transcript: string }`.
  - **Mô tả**: Gửi đoạn text cho Gemini để phân tích và tự sinh giao dịch, sau đó lưu vào DB và cập nhật ví.

- **GET `/transaction/:userId/transactions`**

  - **Thực tế**: dùng `req.user.userId` (JWT), param `:userId` không dùng trực tiếp.
  - **Query** (filter):
    - `type?: 'INCOME' | 'EXPENSE'`
    - `createdAtStart?: string`, `createdAtEnd?: string`
    - `categoryId?: string`, `defaultCategoryId?: string`
  - **Mô tả**: Lấy danh sách giao dịch của user, có filter theo loại, thời gian, category.

- **GET `/transaction/:transactionId`**

  - **Mô tả**: Lấy chi tiết một giao dịch.

- **PATCH `/transaction/:transactionId`**

  - **Body**: `editTransactionDto`.
  - **Mô tả**: Sửa giao dịch, đồng thời điều chỉnh lại số liệu ví/budget nếu type/amount thay đổi.

- **DELETE `/transaction/:transactionId`**
  - **Mô tả**: Xoá giao dịch, hoàn lại số tiền về ví (ngược logic khi tạo) và cập nhật lại `usage` budget nếu cần.

### Gemini (`/gemini`)

- **GET `/gemini`**

  - **Mô tả**: Endpoint test, gọi `ConvertText` với nội dung mẫu.

- **GET `/gemini/analyze`**
  - **Auth**: JWT.
  - **Mô tả**: Phân tích các giao dịch của user bằng Gemini và trả về gợi ý/nhận xét.

---

## Cách chạy dự án

### 1. Cài đặt dependencies

```bash
npm install
```

### 2. Cấu hình biến môi trường

Tạo file `.env` ở thư mục gốc (nếu chưa có) với các nhóm cấu hình chính sau (tên biến tuỳ thuộc vào cấu hình thực tế của bạn):

- **Database**: URL kết nối PostgreSQL (thường dùng bởi Prisma, ví dụ `DATABASE_URL`).
- **JWT**: secret key, thời gian sống token.
- **Mail**: host, port, user, password để gửi email xác thực / reset password.
- **Cloudinary**: credentials để upload ảnh.
- **Gemini**: API key cho Gemini.

### 3. Migration & seed database (tuỳ chọn)

```bash
# Chạy migration Prisma (ví dụ)
npx prisma migrate deploy   # hoặc: npx prisma migrate dev

# Seed dữ liệu mẫu (user/category/defaultCategory)
npm run seed
```

### 4. Chạy server

```bash
# Development (watch mode)
npm run start:dev

# Production build
npm run build
npm run start:prod
```

---

## Lệnh hữu ích khác

- **Format code**:

```bash
npm run format
```

- **Lint**:

```bash
npm run lint
```

- **Test**:

```bash
# Unit tests
npm run test

# E2E tests
npm run test:e2e

# Coverage
npm run test:cov
```

---

## Ghi chú

- Hầu hết các API về giao dịch, ví, budget, user-category đều yêu cầu JWT (`Authorization: Bearer <token>`).
- Nên chạy seed (hoặc tạo dữ liệu tay) để có default categories và user mẫu trước khi test các flow giao dịch/budget.

---

1. Giai đoạn 1 — Làm Backend trước (MVP API + thiết kế DB song song)
   1.1 Mục tiêu chính

Xây dựng nền tảng backend ổn định để mobile có thể dùng ngay.

Hoàn thiện những API cốt lõi để đảm bảo app có thể chạy được bản đầu tiên.

Thiết kế database song song với lúc viết API (vừa làm vừa tối ưu).

1.2 Công việc thực hiện
Backend — MVP API
Làm trước các module quan trọng nhất:
(1) Auth Service

Đăng ký / đăng nhập (email + password).

Refresh token.

Middleware xác thực.

Lưu thông tin user cơ bản.

(2) Wallet Service

CRUD ví (create / update / delete).

Tổng số tiền hiện tại.

Liên kết với transaction khi cập nhật tiền.

(3) Category Service

Danh mục mặc định (ăn uống, di chuyển, hóa đơn…).

Danh mục riêng của từng user.

CRUD category.

(4) Transaction Service

Tạo giao dịch (thu/chi).

Edit, delete giao dịch.

Lấy lịch sử giao dịch theo ngày/tháng.

Tự động cập nhật wallet và budget khi:

create transaction

update transaction

delete transaction

(5) Budget Service

Tạo ngân sách theo danh mục.

Lấy ngân sách của từng tháng.

Cập nhật khi có giao dịch liên quan.

Thiết kế Database (song song với làm API)

Xác định schema cho User / Wallet / Category / Transaction / Budget.

Tối ưu quan hệ:

User → Wallet (1-n)

User → Category (1-n)

Wallet → Transaction (1-n)

Tối ưu chỉ mục cho truy vấn lịch sử giao dịch / filter theo ngày.

1.3 Kiểm thử Backend

Postman collection để test toàn bộ flow chính.

Tạo môi trường dev / stage để mobile trỏ vào test.

2. Giai đoạn 2 — Làm Mobile sau khi MVP API đã hoàn thành
   Mục tiêu

Xây dựng ứng dụng mobile sử dụng đúng các API đã ổn định ở giai đoạn 1.

Tạo ra phiên bản mobile có thể sử dụng thực tế (MVP).

Mobile MVP Flow

Màn hình đăng nhập → gọi Auth API.

Màn hình danh sách ví → Wallet API.

Tạo giao dịch thu/chi → Transaction API.

Lịch sử giao dịch theo ngày/tháng.

Tự động phản ánh sự thay đổi lên:

số dư ví,

ngân sách,

lịch sử giao dịch.

UI

Giao diện đơn giản.

Ưu tiên sự ổn định hơn hiệu ứng đẹp.

Chỉ cần đủ để test thực tế.

Test mobile

Kiểm thử với backend thật (stage).

Kiểm tra toàn bộ các case happy path.

3. Giai đoạn 3 — Xây dựng chức năng nâng cao & Gemini SDK
   Sau khi MVP Backend + Mobile đã chạy, bạn bắt đầu làm phần mở rộng.
   (1) Tích hợp AI với Gemini SDK

Phân tích chi tiêu hàng tháng → trả insight.

AI-generate transaction từ câu mô tả (VD: "Tối qua uống trà sữa 45k").

Retry + error handling khi vượt quota hoặc bị rate limit.

Lưu lịch sử phân tích để user xem lại.

(2) UX nâng cao

Bộ lọc nâng cao: theo ngày, ví, danh mục, phạm vi tiền.

Biểu đồ chi tiêu (pie chart / line chart).

Cảnh báo vượt ngân sách.

Upload hình ảnh hóa đơn khi tạo giao dịch.

Dark mode / animation.

(3) Chất lượng hệ thống

Logging & monitoring (Winston, Sentry).

Xử lý edge case:

Time zone,

concurrency khi update ví,

dữ liệu không đồng bộ.

Tối ưu truy vấn, caching nếu cần.

4. Nguyên tắc triển khai

Ưu tiên ship sớm: MVP backend trước → mobile chạy được → sau đó mới thêm AI & UI đẹp.

API phải backward-compatible: tránh phá mobile; nếu cần thay đổi lớn → versioning.

Mỗi tính năng đều có test tối thiểu: happy path + các lỗi thường gặp.

Luôn code backend trước mobile để tránh chồng chéo và giảm công việc sửa lại.
