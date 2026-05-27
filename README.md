# Hệ Thống Bầu Cử Trực Tuyến Ứng Dụng Công Nghệ Blockchain (Blockchain Voting App)

Dự án này là một ứng dụng Web phi tập trung (DApp) cung cấp một giải pháp bầu cử điện tử an toàn, minh bạch và không thể gian lận dựa trên công nghệ Blockchain. Thay vì sử dụng cơ sở dữ liệu truyền thống, các phiếu bầu sẽ được lưu trữ dưới dạng các Smart Contract trên chuỗi khối Ethereum, đảm bảo tính toàn vẹn của kết quả.

## ✨ Tính Năng Nổi Bật

* **Phân quyền người dùng rõ ràng**: Hỗ trợ 2 vai trò chính bao gồm Tổ chức (Admin) và Cử tri (Voter).
* **Quản lý bầu cử linh hoạt**: Ban tổ chức có thể tạo ra các cuộc bầu cử, thêm danh sách ứng cử viên, và cấp quyền cho cử tri.
* **Bỏ phiếu minh bạch**: Cử tri chỉ có quyền bỏ phiếu một lần duy nhất cho cuộc bầu cử mà họ được tham gia thông qua việc ký giao dịch trên MetaMask.
* **Theo dõi kết quả Real-time**: Kết quả kiểm phiếu được thể hiện trực quan trên bảng điều khiển ngay sau khi cuộc bầu cử kết thúc.
* **Tự động hoá thông báo**: Hệ thống tự động gửi email thông báo kết quả cho người chiến thắng cũng như toàn bộ cử tri khi cuộc bầu cử khép lại.

## 🛠 Công Nghệ Sử Dụng

* **Frontend**: Next.js, React, Semantic UI
* **Backend**: Node.js, Express.js
* **Cơ Sở Dữ Liệu**: MongoDB
* **Blockchain**: Solidity (Smart Contracts), Ganache (Mạng lưới test cục bộ), Web3.js / Ethers.js (Tương tác với Blockchain)
* **Khác**: Nodemailer (Gửi Email)

## 🚀 Hướng Dẫn Cài Đặt Và Khởi Chạy

### 1. Yêu cầu hệ thống
* Node.js (Phiên bản v22 hoặc tương đương)
* MongoDB đang chạy ở cổng mặc định `27017`
* Ganache UI đang chạy ở cổng `8545` (Network ID `1337`)
* Ví MetaMask extension cài đặt trên trình duyệt

### 2. Các bước cài đặt

**Bước 1: Clone dự án về máy**
```bash
git clone https://github.com/hunghung3012/voting-app.git
cd voting-app/BlockChainVoting
```

**Bước 2: Cài đặt các thư viện**
```bash
npm install
```

**Bước 3: Thiết lập môi trường**
Bạn cần có một file `.env` ở thư mục gốc (BlockChainVoting) với cấu hình như sau:
```
EMAIL=your-email@gmail.com
PASSWORD=your-app-password
```

**Bước 4: Biên dịch và triển khai Smart Contract**
Mở phần mềm Ganache UI, tạo một Workspace mới (New Workspace) và cấu hình Server chạy ở cổng `8545`, Network ID là `1337`.

Sau đó, mở Terminal tại thư mục dự án và tiến hành deploy Smart Contract lên Ganache:
```bash

```

**Bước 5: Khởi động Server Next.js**
```bash
npx kill-port 3000; $env:NODE_OPTIONS="--openssl-legacy-provider"; npm start
```

Vào trình duyệt và truy cập `http://localhost:3000` để sử dụng!
```bash
node Ethereum/deploy_ethers.js
npx kill-port 3000; $env:NODE_OPTIONS="--openssl-legacy-provider"; npm start
``
-
*Dự án được xây dựng nhằm mục đích tìm hiểu và ứng dụng công nghệ Blockchain trong thực tiễn.*

```
node Ethereum/deploy_ethers.js
```
