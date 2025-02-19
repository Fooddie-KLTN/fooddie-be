<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://coveralls.io/github/nestjs/nest?branch=master" target="_blank"><img src="https://coveralls.io/repos/github/nestjs/nest/badge.svg?branch=master#9" alt="Coverage" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

# 🚀 NestJS Application

## 📌 Giới thiệu
Đây là một ứng dụng được xây dựng với [NestJS](https://nestjs.com/), sử dụng kiến trúc module-based để tổ chức code. Ứng dụng hỗ trợ các tính năng như xác thực người dùng, quản lý quyền (role & permission), và cung cấp nền tảng học và xử lý dữ liệu với PostgreSQL.

## 📂 Cấu trúc thư mục
```
📦 src
├── 📂 auth           # Xác thực người dùng (Login, Guards)
│   ├── auth.controller.ts
│   ├── auth.module.ts
│   ├── firebase.service.ts
│   ├── firebase-auth.guard.ts
├── 📂 users          # Quản lý người dùng
│   ├── users.controller.ts
│   ├── users.module.ts
│   ├── users.service.ts
│   ├── dto/
├── 📂 roles          # Quản lý role và permission
│   ├── roles.controller.ts
│   ├── roles.module.ts
│   ├── roles.service.ts
│   ├── dto/
├── ...                # Các đối tượng còn lại
├── 📂 entities       # Chứa các entity sử dụng TypeORM
│   ├── user.entity.ts
│   ├── role.entity.ts
│   ├── permission.entity.ts
│   └── ...           # Các entity còn lại
├── 📂 common         # Chứa các helper chung như decorators, guards, interceptors
│   ├── decorators/
│   ├── guards/
│   ├── interceptors/
│   ├── filters/
├── app.module.ts    # Module chính
├── main.ts          # Entry point
└── config/          # Chứa file cấu hình chung như database, env
```

---

## 🛠 Cài đặt

### **1️⃣ Yêu cầu hệ thống**
- [Node.js](https://nodejs.org/) >= 16
- [PostgreSQL](https://www.postgresql.org/) >= 12
- [Docker](https://www.docker.com/) (tuỳ chọn, nếu muốn chạy bằng Docker)

### **2️⃣ Clone dự án**
```bash
git clone https://github.com/WuanDuc/edutech.git
cd be
```

### **3️⃣ Cài đặt dependencies**
```bash
npm install
```

### **4️⃣ Cấu hình môi trường**
Tạo file `.env` từ file mẫu `.env.example`
```bash
cp .env.example .env
```
Mở `.env` và chỉnh sửa thông tin phù hợp:
> **Note:** 
> - Chỉnh sửa cấu hình trong file `.env` để phù hợp với môi trường phát triển của bạn.
> - Đảm bảo rằng bạn đã cài đặt tất cả các yêu cầu hệ thống trước khi tiến hành cài đặt.
> - Nếu bạn gặp bất kỳ vấn đề nào trong quá trình cài đặt, hãy kiểm tra lại các bước hoặc tham khảo tài liệu chính thức của các công cụ được sử dụng.
![image](https://github.com/user-attachments/assets/eb8d16c1-ae2c-4a68-9b7a-818c2fc11a66)
![image](https://github.com/user-attachments/assets/c6e12d27-df2a-4336-8ba2-b51ec9ab9b36)
![image](https://github.com/user-attachments/assets/dfefdd52-c95a-43aa-a9aa-2f7108275835)
![image](https://github.com/user-attachments/assets/cc26798a-65e0-43c9-b287-0b045576ffb7)
![image](https://github.com/user-attachments/assets/38e292fd-9f2e-4fd8-9065-d4fe3824e703)
![image](https://github.com/user-attachments/assets/d6e93c8b-bf92-4b25-929e-69c0a0762568)

```
PORT=3000
DATABASE_HOST=localhost
DATABASE_PORT=5432
DATABASE_USER=your_user
DATABASE_PASSWORD=your_password
DATABASE_NAME=your_database
JWT_SECRET=your_secret_key
JWT_EXPIRATION=3600s

#Firebase configuration
FIREBASE_TYPE=service_account
FIREBASE_PROJECT_ID=
FIREBASE_PRIVATE_KEY_ID=
FIREBASE_PRIVATE_KEY="
FIREBASE_CLIENT_EMAIL=
FIREBASE_CLIENT_ID=
FIREBASE_AUTH_URI=
FIREBASE_TOKEN_URI=
FIREBASE_AUTH_PROVIDER_X509_CERT_URL=
FIREBASE_CLIENT_X509_CERT_URL=
FIREBASE_UNIVERSE_DOMAIN=googleapis.com
```

### **5️⃣ Chạy ứng dụng**
#### **👉 Chạy bằng Node.js**
```bash
npm run start:dev
```
#### **👉 Chạy bằng Docker**
```bash
docker-compose up --build
```

---

## 🚀 Sử dụng

### **2️⃣ Đăng ký tài khoản admin**
Có sẵn tài khoản mặc định: 
```json
  "username": "adminadmin",
  "password": "admin"
```
Dùng Postman hoặc cURL để gửi request:
```json
POST /auth/register
{
  "username": "admin",
  "password": "123456"
}
```

### **3️⃣ Đăng nhập để lấy token**
```json
POST /auth/login
{
  "username": "admin",
  "password": "123456"
}
```
Response:
```json
{
  "access_token": "your_token_here"
}
```
Sử dụng `access_token` để gọi các API khác bằng cách thêm vào Header:
```
Authorization: Bearer your_token_here
```

### **4️⃣ Tạo role mới**
```json
POST /role
Headers: { "Authorization": "Bearer your_token_here" }
Body:
{
  "name": "Manager",
  "permissions": [
    "permission.role.write",
    "permission.user.read"
  ]
}
```

---

## 📜 Các lệnh hữu ích

| Lệnh | Chức năng |
|------|----------|
| `npm run start` | Chạy ứng dụng ở chế độ production |
| `npm run start:dev` | Chạy ứng dụng ở chế độ development |
| `npm run build` | Build ứng dụng |
| `npm run migration:generate --name init` | Tạo migration mới |
| `npm run migration:run` | Chạy migration |
| `npm run migration:revert` | Hoàn tác migration |
| `npm run test` | Chạy test |

---

## 📌 Ghi chú
- Mọi thay đổi về **entity** cần phải chạy **migration** để cập nhật database.
- Khi sửa đổi `.env`, cần restart server để áp dụng thay đổi.
- Luôn kiểm tra **permissions** khi gọi API cần xác thực.

---

## 🤝 Đóng góp
1. Fork repository
2. Tạo branch mới (`git checkout -b feature-branch`)
3. Commit thay đổi (`git commit -m "Thêm tính năng mới"`)
4. Push lên GitHub (`git push origin feature-branch`)
5. Tạo Pull Request

---

## 📧 Liên hệ
Nếu có câu hỏi hoặc lỗi, vui lòng tạo **Issue** hoặc liên hệ qua email: `univerbachtuoc@gmail.com`.

---

**Chúc bạn code vui vẻ! 🚀**

