# HUIT hỗ trợ đăng ký học phần

Tiện ích Chrome/Edge chạy trên https://dkhp.huit.edu.vn/DangKyHocPhan.

## Cài đặt

1. Mở chrome://extensions hoặc edge://extensions.
2. Bật Developer mode (Chế độ dành cho nhà phát triển).
3. Chọn Load unpacked (Tải tiện ích đã giải nén), chọn thư mục chứa manifest.json này.
4. Mở lại trang đăng ký HUIT. Nút HUIT • Công cụ xuất hiện góc phải.

## Sử dụng

Tự đăng nhập và nhập mã bảo vệ trên HUIT. Chọn đúng đợt và hình thức học.
Đặt giờ bắt đầu theo giờ máy. Mặc định 08:30 ngày 30/11/2026 dành cho lịch khóa 16 CNTT trong thông báo người dùng cung cấp.
Chọn Bắt đầu theo dõi. Trước giờ mở công cụ đếm ngược. Khi chưa có môn công cụ tải lại trang sau khoảng chờ đã đặt.
Khi có môn, công cụ lần lượt chọn từng môn, chờ thay đổi bảng lớp rồi đọc dữ liệu. Sau mỗi lượt hoàn tất, chờ khoảng thời gian đã đặt trước lượt tiếp theo.
Đặt 1 giây là khoảng nghỉ giữa các lượt hoàn tất, không đảm bảo mọi lớp được cập nhật trong một giây.
Giữ tab ở phía trước và máy hoạt động. Đợt/hình thức học được nhận diện từ nội dung trang và gắn vào dữ liệu.
Dừng theo dõi trước khi đổi đợt hoặc thao tác đăng ký.

Tìm môn/lớp, đánh dấu lớp cần giữ. Chọn Mở lớp để công cụ chọn môn và lớp tương ứng trên HUIT.
Kiểm tra lịch, chọn nhóm thực hành trên HUIT rồi bấm nút Đăng ký môn học của trường.
Kiểm tra bảng Lớp học phần đã đăng ký để xác nhận, đặc biệt nếu phản hồi bị chậm hoặc mất kết nối.

Số chỗ được tính từ Sĩ số tối đa trừ Đã đăng ký. Xem thời điểm đọc dưới mỗi lớp.
Dữ liệu và đánh dấu được lưu trong chrome.storage.local của tiện ích. Gỡ tiện ích sẽ xóa bộ nhớ của tiện ích.
Công cụ tự tiếp tục theo dõi sau tải lại trang nếu chưa bấm Dừng.

## Giới hạn cần kiểm tra khi đợt mở

Cấu trúc bảng được suy ra từ ảnh chụp người dùng. Cần xác minh nhãn cột và cơ chế chọn dòng trên trang thật.
Nếu chưa xác nhận được thay đổi bảng lớp trong 10 giây, công cụ ghi trạng thái lỗi và giữ dữ liệu cũ kèm thời điểm.
Một số cổng cập nhật bằng thay thế bảng hoặc thao tác đặc thù có thể cần chỉnh lại hàm loadClasses.
Công cụ chưa được kiểm thử với dữ liệu HUIT đang mở đăng ký. Chưa xác minh tải toàn bộ lớp hay giới hạn tốc độ của máy chủ.
Máy chủ có thể từ chối quyền truy cập, hết phiên hoặc yêu cầu đăng nhập lại. Kiểm tra thông báo trên trang nếu chưa có môn.

## Đăng ký tự động theo mã

Mỗi dòng nhập Mã HP, Mã LHP, nhóm thực hành (nếu có), phân cách bằng dấu phẩy hoặc khoảng trắng. Mỗi môn chỉ chọn một lớp. Giữ nguyên số 0 đầu mã. Bấm Lưu danh sách, chọn đúng đợt/hình thức trên HUIT, đặt giờ rồi bấm Bật tự đăng ký.
Công cụ chọn môn trước rồi chọn lớp, chờ chi tiết lớp cập nhật, chọn nhóm đã chỉ định và bấm Đăng ký môn học. Cần nhóm mà chưa nhập thì công cụ dừng để bổ sung.
Kết quả chỉ được xác nhận khi mã lớp xuất hiện trong bảng đã đăng ký. Ý định gửi được lưu trước khi bấm. Nếu mất phản hồi, công cụ dừng và giữ trạng thái chờ xác nhận qua tải lại trang. Kiểm tra trên HUIT trước khi lưu lại danh sách để thử gửi lại.
Nếu lớp đầy hoặc chưa thấy mã, công cụ thử lại ở lượt sau. Đã xác nhận tất cả lớp thì tự dừng. Nút Dừng ngắt cả chế độ đăng ký và theo dõi.
Bản này chưa kiểm thử thao tác gửi với máy chủ HUIT thật. Chi tiết DOM, ô nhóm và thông báo của trường có thể cần điều chỉnh khi mở đợt.
