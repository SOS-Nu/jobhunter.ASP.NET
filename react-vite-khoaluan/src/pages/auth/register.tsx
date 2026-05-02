// src/pages/auth/register.tsx

import { useState, useEffect } from "react"; // Thêm useEffect
import { Link, useNavigate } from "react-router-dom";
import { Card, Form, Button, Spinner } from "react-bootstrap";
import { message, notification } from "antd";
import { IUser } from "@/types/backend";
import { callRegister, callSendOtp } from "@/config/api";
import styles from "styles/auth.module.scss";
import { FaArrowLeft } from "react-icons/fa";
import bg from "assets/top-bg.svg";

const RegisterPage = () => {
  const navigate = useNavigate();
  const [isSubmit, setIsSubmit] = useState(false);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<IUser | null>(null);
  const [otp, setOtp] = useState("");

  // ================================================================
  // ====> STATE MỚI ĐỂ ĐẾM NGƯỢC (60 giây) <====
  const [countdown, setCountdown] = useState(60);
  // ================================================================

  // Xử lý khi gửi OTP
  const handleSendOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmit(true);
    try {
      const form = event.currentTarget;
      const data = new FormData(form);
      const formValues = Object.fromEntries(data.entries());
      const userData: IUser = {
        name: formValues.name as string,
        email: formValues.email as string,
        password: formValues.password as string,
        age: +(formValues.age as string),
        gender: formValues.gender as string,
        address: formValues.address as string,
      };

      if (!userData.email || !userData.name || !userData.password) {
        notification.error({
          message: "Vui lòng điền đầy đủ thông tin bắt buộc.",
        });
        setIsSubmit(false);
        return;
      }
      setFormData(userData);
      const res = await callSendOtp(userData.email);

      if (res && res.message) {
        message.success("Mã OTP đã được gửi đến email của bạn!");
        setStep(2);
      } else {
        notification.error({
          message: "Phản hồi không hợp lệ",
          description:
            res?.message || "Không nhận được phản hồi thành công từ máy chủ.",
        });
      }
    } catch (error: any) {
      notification.error({
        message: "Có lỗi xảy ra",
        description:
          error?.response?.data?.message ||
          "Không thể gửi OTP, vui lòng thử lại.",
      });
    } finally {
      setIsSubmit(false);
    }
  };

  // Xử lý khi hoàn tất đăng ký
  const handleCompleteRegistration = async (
    event: React.FormEvent<HTMLFormElement>
  ) => {
    event.preventDefault();
    if (!formData || !otp) {
      notification.error({
        message: "Dữ liệu không hợp lệ hoặc thiếu mã OTP.",
      });
      return;
    }
    setIsSubmit(true);
    const { name, email, password, age, gender, address } = formData;
    try {
      const res = await callRegister(
        name!,
        email!,
        password as string,
        age!,
        gender!,
        address!,
        otp
      );
      if (res?.data?.id) {
        message.success("Đăng ký tài khoản thành công!");
        navigate("/login");
      } else {
        notification.error({
          message: "Có lỗi xảy ra",
          description: Array.isArray(res.message)
            ? res.message[0]
            : res.message,
          duration: 5,
        });
      }
    } catch (error: any) {
      notification.error({
        message: "Có lỗi xảy ra",
        description:
          error?.response?.data?.message ||
          "Đăng ký thất bại, vui lòng thử lại.",
      });
    } finally {
      setIsSubmit(false);
    }
  };

  // ================================================================
  // ====> EFFECT ĐỂ QUẢN LÝ ĐỒNG HỒ ĐẾM NGƯỢC <====
  useEffect(() => {
    // Chỉ chạy khi đang ở bước 2
    if (step !== 2) return;

    // Reset lại đồng hồ mỗi khi vào bước 2
    setCountdown(60);

    // Tạo một interval chạy mỗi giây
    const timer = setInterval(() => {
      setCountdown((prevCountdown) => prevCountdown - 1);
    }, 1000);

    // Hàm dọn dẹp: xóa interval khi component bị unmount hoặc step thay đổi
    return () => clearInterval(timer);
  }, [step]); // Phụ thuộc vào step, sẽ chạy lại khi step thay đổi

  // ====> EFFECT ĐỂ XỬ LÝ KHI HẾT GIỜ <====
  useEffect(() => {
    if (countdown <= 0 && step === 2) {
      // Dừng lại ở 0
      setCountdown(0);

      notification.error({
        message: "Mã OTP đã hết hạn!",
        description: "Vui lòng thử lại từ đầu.",
      });
      // Tự động quay về bước 1
      setStep(1);
    }
  }, [countdown, step]); // Phụ thuộc vào countdown
  // ================================================================

  return (
    <>
      <div
        style={{
          backgroundImage: `url(${bg})`,
          width: "100%",
          height: 500,
          position: "absolute",
          top: 0,
          backgroundRepeat: "repeat",
          zIndex: 0,
        }}
      ></div>
      <div
        className={`${styles["login-page-bootstrap"]} vh-100 d-flex align-items-center justify-content-center`}
      >
        <Card className={styles["login-card"]}>
          <Card.Body>
            {step === 2 && (
              <Form onSubmit={handleCompleteRegistration}>
                <div
                  onClick={() => setStep(1)}
                  className="d-flex align-items-center gap-2 mb-4"
                  style={{ cursor: "pointer" }}
                >
                  <FaArrowLeft /> <span>Quay lại</span>
                </div>
                <h3 className="text-center fw-bold mb-2">Xác thực OTP</h3>
                <p className="text-center text-muted mb-4">
                  Một mã xác thực đã được gửi đến email <br />
                  <strong style={{ color: "#333" }}>{formData?.email}</strong>
                </p>
                <Form.Group className="mb-3" controlId="otp">
                  <Form.Label>Mã OTP</Form.Label>
                  <Form.Control
                    type="text"
                    placeholder="Nhập 6 chữ số"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    required
                  />
                </Form.Group>

                {/* ====> HIỂN THỊ ĐỒNG HỒ ĐẾM NGƯỢC <==== */}
                <div className="text-center text-muted mb-3">
                  {countdown > 0 ? (
                    <span>
                      Mã OTP sẽ hết hạn trong{" "}
                      <strong style={{ color: "red" }}>{countdown}</strong>{" "}
                      giây.
                    </span>
                  ) : (
                    <span style={{ color: "red" }}>Mã OTP đã hết hạn!</span>
                  )}
                </div>

                <Button
                  variant="primary"
                  type="submit"
                  className="w-100 fw-semibold"
                  disabled={isSubmit || countdown <= 0}
                >
                  {isSubmit ? (
                    <Spinner as="span" animation="border" size="sm" />
                  ) : (
                    "Hoàn tất đăng ký"
                  )}
                </Button>
              </Form>
            )}

            {step === 1 && (
              <>
                <h2 className="text-center fw-bold mb-4">Đăng Ký Tài Khoản</h2>
                <Form onSubmit={handleSendOtp}>
                  <Form.Group className="mb-3">
                    <Form.Label>Họ tên</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nhập họ tên"
                      name="name"
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Email</Form.Label>
                    <Form.Control
                      type="email"
                      placeholder="Nhập email"
                      name="email"
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Mật khẩu</Form.Label>
                    <Form.Control
                      type="password"
                      placeholder="Nhập mật khẩu"
                      name="password"
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Tuổi</Form.Label>
                    <Form.Control
                      type="number"
                      placeholder="Nhập tuổi"
                      name="age"
                      required
                    />
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Giới tính</Form.Label>
                    <Form.Select name="gender" required defaultValue="">
                      <option value="" disabled>
                        Chọn giới tính
                      </option>
                      <option value="MALE">Nam</option>
                      <option value="FEMALE">Nữ</option>
                      <option value="OTHER">Khác</option>
                    </Form.Select>
                  </Form.Group>
                  <Form.Group className="mb-3">
                    <Form.Label>Địa chỉ</Form.Label>
                    <Form.Control
                      type="text"
                      placeholder="Nhập địa chỉ"
                      name="address"
                      required
                    />
                  </Form.Group>
                  <Button
                    variant="primary"
                    type="submit"
                    className="w-100 fw-semibold"
                    disabled={isSubmit}
                  >
                    {isSubmit ? (
                      <Spinner as="span" animation="border" size="sm" />
                    ) : (
                      "Lấy mã OTP"
                    )}
                  </Button>
                  <div className="text-center mt-4">
                    Đã có tài khoản?{" "}
                    <Link to="/login" className={styles["register-link"]}>
                      Đăng Nhập
                    </Link>
                  </div>
                </Form>
              </>
            )}
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default RegisterPage;
