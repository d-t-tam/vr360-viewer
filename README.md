# VR 360° Viewer

Ứng dụng xem panorama 360 độ bằng Three.js và Vite. Dự án cung cấp trải nghiệm khám phá không gian ảo với hotspot điều hướng giữa hai cảnh, zoom bằng lăn chuột và hiển thị thông tin từng scene.

## Tính năng

- Hiển thị ảnh panorama 360° trên mặt cầu nội bộ
- Kéo chuột / chạm để xoay nhìn quanh
- Cuộn chuột để zoom (điều chỉnh trường nhìn)
- Điều khiển bằng bàn phím: `ArrowLeft`, `ArrowRight`, `ArrowUp`, `ArrowDown`
- Hotspot tương tác dẫn đến scene tiếp theo
- Popup thông tin cho các scene có dữ liệu
- Hiệu ứng chuyển cảnh mượt mà và hotspot nhấp nháy

## Yêu cầu

- Node.js >= 18
- npm hoặc pnpm

## Cài đặt

1. Mở terminal tại thư mục dự án
2. Cài đặt dependencies:

```bash
npm install
```

## Chạy dự án

```bash
npm run dev
```

Sau đó mở địa chỉ hiển thị trên terminal (mặc định thường là `http://localhost:5173`).

## Cấu trúc dự án

- `index.html` — HTML chính tải app và UI cơ bản
- `main.js` — logic Three.js, tải texture, hotspot, điều khiển và render
- `package.json` — cấu hình dự án và script
- `public/` — chứa ảnh panorama và tài nguyên tĩnh

## Thêm hoặc cập nhật ảnh panorama

Để thay đổi cảnh 360°, hãy thêm ảnh vào thư mục `public/` và cập nhật mảng `SCENES` trong `main.js`:

- `texture` — đường dẫn đến ảnh panorama
- `hotspots` — vị trí, cảnh đích và nhãn của điểm chuyển cảnh

Ví dụ hiện tại sử dụng:

- `/temple360.jpg`
- `/temple360_2.png`

## Điều khiển

- Kéo chuột để xoay
- Cuộn để zoom in/out
- Click vào hotspot để chuyển scene
- Nhấn nút `ℹ️` để mở popup thông tin scene

## Lưu ý

- Dự án dùng `three` và `vite` để render WebGL và phục vụ tệp trong môi trường phát triển.
- Nếu ảnh không hiển thị, kiểm tra lại tên tệp trong `main.js` và thư mục `public/`.

---

**VR 360° Viewer** là một mẫu dự án đơn giản để triển khai trải nghiệm panorama 360 độ với hotspot tương tác.
