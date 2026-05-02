// src/pages/auth/login.tsx

import { useState, useEffect, useRef } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAppDispatch, useAppSelector } from "@/redux/hooks";
import { GoogleLogin } from "@react-oauth/google";

import {
  Container,
  Card,
  Form,
  Button,
  Spinner,
  InputGroup,
  Alert, // Import thêm Alert
  Row, // Import thêm Row
  Col, // Import thêm Col
} from "react-bootstrap";
import { BsEyeFill, BsEyeSlashFill } from "react-icons/bs";
import { FcGoogle } from "react-icons/fc";
import { message, notification } from "antd";

import styles from "styles/auth.module.scss";
// Import thêm các hàm gọi API cần thiết
import {
  callLogin,
  callLoginWithGoogle,
  callSendLoginOtp,
  callSendOtpChangePassword,
  callVerifyLoginOtp,
  callVerifyOtpAndChangePassword,
} from "@/config/api";
import { setUserLoginInfo } from "@/redux/slice/accountSlide";
import bg from "assets/top-bg.svg";

// Interface cho Alert (tương tự ChangePasswordTab)
interface IAlert {
  show: boolean;
  variant: "success" | "danger";
  message: string;
}

const LoginPage = () => {
  const googleLoginRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const dispatch = useAppDispatch();
  const isAuthenticated = useAppSelector(
    (state) => state.account.isAuthenticated
  );

  const location = useLocation();
  const params = new URLSearchParams(location.search);
  const callback = params.get("callback");

  // State cho chế độ xem (đăng nhập hoặc quên mật khẩu)
  const [isForgotPasswordMode, setIsForgotPasswordMode] = useState(false);
  const [isOtpKickMode, setIsOtpKickMode] = useState(false);

  const [loginCredentials, setLoginCredentials] = useState({
    username: "",
    password: "",
  });

  const [otpLoginCode, setOtpLoginCode] = useState(""); // OTP code
  const [isSendingLoginOtp, setIsSendingLoginOtp] = useState(false);
  const [isVerifyingLoginOtp, setIsVerifyingLoginOtp] = useState(false);
  const [loginOtpSent, setLoginOtpSent] = useState(false);
  const [loginCountdown, setLoginCountdown] = useState(0);

  // === State cho form Đăng nhập ===
  const [isSubmit, setIsSubmit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // === State cho form Quên Mật khẩu (lấy từ ChangePasswordTab) ===
  const [otpEmail, setOtpEmail] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [newPasswordOtp, setNewPasswordOtp] = useState("");
  const [confirmPasswordOtp, setConfirmPasswordOtp] = useState("");
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [alert, setAlert] = useState<IAlert>({
    show: false,
    variant: "success",
    message: "",
  });

  // Effect xử lý bộ đếm ngược
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // Effect xử lý chuyển hướng khi đã đăng nhập
  useEffect(() => {
    if (isAuthenticated) {
      navigate(callback || "/");
    }
  }, [isAuthenticated, navigate, callback]);

  // === Hàm xử lý cho form Đăng nhập ===
  const handleLogin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setIsSubmit(true);
    const form = event.currentTarget;
    const username = (form.elements.namedItem("username") as HTMLInputElement)
      .value;
    const password = (form.elements.namedItem("password") as HTMLInputElement)
      .value;

    // Vì đã có validateStatus, 'res' sẽ luôn có giá trị
    const res = await callLogin(username, password);
    setIsSubmit(false); // Tắt loading của nút "Đăng nhập"

    // 1. Đăng nhập thành công
    if (res?.data?.access_token) {
      localStorage.setItem("access_token", res.data.access_token);
      dispatch(setUserLoginInfo(res.data.user));
      message.success("Đăng nhập thành công");
      return; // Kết thúc hàm
    }

    // 2. XỬ LÝ LỖI ĐẦY THIẾT BỊ (429)
    if (res?.statusCode === 429) {
      // Lưu lại thông tin đăng nhập
      setLoginCredentials({ username, password });
      // Chuyển sang giao diện nhập OTP
      setIsOtpKickMode(true);
      // Reset trạng thái form OTP
      setLoginOtpSent(false);
      setOtpLoginCode("");

      // Gửi thông báo
      notification.error({
        message: "Đã đạt giới hạn thiết bị",
        description:
          "Vui lòng xác thực OTP để đăng nhập và đăng xuất thiết bị cũ nhất.",
      });

      // Tự động gọi API gửi OTP cho user
      handleSendLoginOtp(username);
      return; // Kết thúc hàm
    }

    // 3. Xử lý các lỗi đăng nhập khác (sai pass, v.v.)
    notification.error({
      message: `Lỗi ${res.statusCode}` || "Có lỗi xảy ra",
      description: res.message,
    });
  };

  useEffect(() => {
    if (loginCountdown <= 0) return;
    const timer = setTimeout(() => setLoginCountdown(loginCountdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [loginCountdown]);

  // === Hàm GỬI OTP cho LUỒNG LOGIN ===
  // (email được truyền vào từ handleLogin, hoặc lấy từ state khi Gửi lại)
  const handleSendLoginOtp = async (email?: string) => {
    const targetEmail = email || loginCredentials.username;
    if (!targetEmail) return;

    setIsSendingLoginOtp(true);
    const res = await callSendLoginOtp(targetEmail);
    setIsSendingLoginOtp(false);

    if (res?.statusCode === 200) {
      notification.success({
        message: "Thành công!",
        description: `Mã OTP đã được gửi đến email ${targetEmail}`,
      });
      setLoginOtpSent(true); // Hiển thị ô nhập OTP
      setLoginCountdown(60); // Bắt đầu đếm ngược
    } else {
      notification.error({
        message: "Có lỗi xảy ra!",
        description: res?.data?.message ?? "Không thể gửi mã OTP.",
      });
    }
  };

  // === Hàm XÁC THỰC OTP và ĐĂNG NHẬP ===
  const handleVerifyLoginOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsVerifyingLoginOtp(true);

    const res = await callVerifyLoginOtp({
      email: loginCredentials.username,
      password: loginCredentials.password,
      otpCode: otpLoginCode,
    });

    setIsVerifyingLoginOtp(false);

    // 1. Đăng nhập thành công (đã đá session cũ)
    if (res?.data?.access_token) {
      localStorage.setItem("access_token", res.data.access_token);
      dispatch(setUserLoginInfo(res.data.user));
      message.success(
        "Đăng nhập thành công! Thiết bị cũ nhất đã được đăng xuất."
      );
      // Tắt modal/giao diện OTP
      setIsOtpKickMode(false);
      // navigate sẽ tự động chạy (nhờ useEffect trên [isAuthenticated])
    }
    // 2. Lỗi (sai OTP, hết hạn, v.v.)
    else {
      notification.error({
        message: `Lỗi ${res.statusCode}` || "Có lỗi xảy ra!",
        description: res.message ?? "Xác thực OTP thất bại.",
      });
    }
  };

  // === Các hàm xử lý cho form Quên Mật khẩu (lấy từ ChangePasswordTab) ===
  const handleRequestOtp = async () => {
    if (!otpEmail) {
      notification.error({
        message: "Lỗi",
        description: "Vui lòng nhập địa chỉ email.",
      });
      return;
    }
    setIsRequestingOtp(true);
    const res = await callSendOtpChangePassword(otpEmail);

    if (res?.statusCode === 200) {
      notification.success({
        message: "Thành công!",
        description: `Mã OTP đã được gửi đến email ${otpEmail}`,
      });
      setOtpSent(true);
      setCountdown(60);
    } else {
      notification.error({
        message: "Có lỗi xảy ra!",
        description: res?.message ?? "Không thể gửi mã OTP.",
      });
    }
    setIsRequestingOtp(false);
  };

  const handleSubmitWithOtp = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (newPasswordOtp !== confirmPasswordOtp) {
      setAlert({
        show: true,
        variant: "danger",
        message: "Mật khẩu mới không khớp!",
      });
      return;
    }
    setAlert({ ...alert, show: false });
    setIsVerifyingOtp(true);
    const res = await callVerifyOtpAndChangePassword(
      otpEmail,
      otpCode,
      newPasswordOtp
    );
    setIsVerifyingOtp(false);

    if (res?.statusCode === 200) {
      notification.success({
        message: "Thành công!",
        description: "Đổi mật khẩu thành công. Vui lòng đăng nhập lại.",
      });
      // Reset state và quay về form đăng nhập
      setIsForgotPasswordMode(false);
      setOtpSent(false);
      setCountdown(0);
      setOtpEmail("");
      setOtpCode("");
      setNewPasswordOtp("");
      setConfirmPasswordOtp("");
    } else {
      notification.error({
        message: "Có lỗi xảy ra!",
        description: res?.message ?? "Mã OTP không hợp lệ hoặc đã hết hạn.",
      });
    }
  };

  // === Giao diện render ===

  const renderLoginForm = () => (
    <>
      <h2 className="text-center fw-bold mb-4">Đăng Nhập</h2>
      <Form onSubmit={handleLogin}>
        <Form.Group className="mb-3" controlId="formBasicEmail">
          <Form.Label>Email</Form.Label>

          <InputGroup>
            <Form.Control
              type="email"
              placeholder="Nhập email của bạn"
              name="username"
              required
            />
          </InputGroup>
        </Form.Group>
        <Form.Group className="mb-3" controlId="formBasicPassword">
          <Form.Label>Mật khẩu</Form.Label>
          <InputGroup>
            <Form.Control
              type={showPassword ? "text" : "password"}
              placeholder="Nhập mật khẩu"
              name="password"
              required
            />
            <InputGroup.Text
              onClick={() => setShowPassword(!showPassword)}
              className={styles["password-toggle-icon"]}
            >
              {showPassword ? <BsEyeSlashFill /> : <BsEyeFill />}
            </InputGroup.Text>
          </InputGroup>
        </Form.Group>

        <div className="d-flex justify-content-end mb-3">
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              setIsForgotPasswordMode(true);
            }}
            className="text-primary"
            style={{ textDecoration: "none", fontSize: "14px" }}
          >
            Quên mật khẩu?
          </a>
        </div>

        <Button
          variant="primary"
          type="submit"
          className="w-100 fw-semibold"
          disabled={isSubmit}
        >
          {isSubmit ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            "Đăng nhập"
          )}
        </Button>
      </Form>

      <div className="d-flex align-items-center my-4">
        <hr className="flex-grow-1" />
        <span className="mx-3 text-muted">Or</span>
        <hr className="flex-grow-1" />
      </div>

      <Button
        className={`w-100 fw-semibold d-flex align-items-center justify-content-center gap-2 ${styles["google-login-btn"]}`}
        onClick={() => {
          if (googleLoginRef.current) {
            const clickableElement =
              googleLoginRef.current.querySelector<HTMLElement>(
                '[role="button"]'
              );
            if (clickableElement) {
              clickableElement.click();
            }
          }
        }}
      >
        <FcGoogle size={22} />
        Đăng nhập với Google
      </Button>

      <div ref={googleLoginRef} style={{ display: "none" }}>
        {/* Google Login Component */}
        <GoogleLogin
          onSuccess={async (credentialResponse) => {
            if (credentialResponse.credential) {
              try {
                const res = await callLoginWithGoogle(
                  credentialResponse.credential
                );
                if (res?.data) {
                  localStorage.setItem("access_token", res.data.access_token);
                  dispatch(setUserLoginInfo(res.data.user));
                  message.success("Đăng nhập bằng Google thành công!");
                } else {
                  notification.error({
                    message: "Đăng nhập thất bại",
                    description:
                      res?.message ?? "Có lỗi xảy ra, vui lòng thử lại.",
                  });
                }
              } catch (error) {
                //...
              }
            }
          }}
          onError={() => {
            notification.error({
              message: "Đăng nhập Google thất bại",
            });
          }}
        />
      </div>

      <p className="text-center mt-4">
        Chưa có tài khoản?{" "}
        <Link to="/register" className={styles["register-link"]}>
          Đăng Ký
        </Link>
      </p>
    </>
  );

  const renderForgotPasswordForm = () => (
    <>
      <h2 className="text-center fw-bold mb-4">Quên Mật Khẩu</h2>
      {!otpSent ? (
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleRequestOtp();
          }}
        >
          <p>Vui lòng nhập email của bạn để nhận mã xác thực.</p>
          <Form.Group className="mb-3">
            <Form.Label>Email</Form.Label>
            <InputGroup>
              <Form.Control
                type="email"
                value={otpEmail}
                onChange={(e) => setOtpEmail(e.target.value)}
                placeholder="Nhập email của bạn"
                required
              />
              <Button
                type="submit"
                variant="primary"
                disabled={isRequestingOtp}
              >
                {isRequestingOtp ? "Đang gửi..." : "Gửi mã"}
              </Button>
            </InputGroup>
          </Form.Group>
        </Form>
      ) : (
        <Form onSubmit={handleSubmitWithOtp}>
          {alert.show && (
            <Alert
              variant={alert.variant}
              onClose={() => setAlert({ ...alert, show: false })}
              dismissible
            >
              {alert.message}
            </Alert>
          )}
          <p>
            Mã OTP đã được gửi tới <strong>{otpEmail}</strong>. Vui lòng kiểm
            tra và nhập vào bên dưới.
          </p>
          <Form.Group className="mb-3">
            <Form.Label>Mã OTP</Form.Label>
            <InputGroup>
              <Form.Control
                type="text"
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                placeholder="Nhập mã OTP"
                required
              />
              <Button
                variant="outline-secondary"
                onClick={handleRequestOtp}
                disabled={countdown > 0 || isRequestingOtp}
              >
                {countdown > 0 ? `Gửi lại sau (${countdown}s)` : "Gửi lại mã"}
              </Button>
            </InputGroup>
          </Form.Group>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Mật khẩu mới</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showNew ? "text" : "password"}
                    value={newPasswordOtp}
                    onChange={(e) => setNewPasswordOtp(e.target.value)}
                    required
                  />
                  <InputGroup.Text onClick={() => setShowNew(!showNew)}>
                    {showNew ? <BsEyeSlashFill /> : <BsEyeFill />}
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Xác nhận mật khẩu mới</Form.Label>
                <InputGroup>
                  <Form.Control
                    type={showConfirm ? "text" : "password"}
                    value={confirmPasswordOtp}
                    onChange={(e) => setConfirmPasswordOtp(e.target.value)}
                    required
                  />
                  <InputGroup.Text onClick={() => setShowConfirm(!showConfirm)}>
                    {showConfirm ? <BsEyeSlashFill /> : <BsEyeFill />}
                  </InputGroup.Text>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
          <Button
            variant="primary"
            type="submit"
            className="w-100"
            disabled={isVerifyingOtp}
          >
            {isVerifyingOtp ? "Đang xác thực..." : "Xác nhận đổi mật khẩu"}
          </Button>
        </Form>
      )}
      <div className="text-center mt-4">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setIsForgotPasswordMode(false);
            setAlert({ ...alert, show: false }); // Reset alert khi quay lại
          }}
          className={styles["register-link"]}
        >
          &larr; Quay lại Đăng nhập
        </a>
      </div>
    </>
  );

  const renderOtpKickForm = () => (
    <>
      <h2 className="text-center fw-bold mb-3">Xác thực Đăng nhập</h2>
      <Form onSubmit={handleVerifyLoginOtp}>
        <p className="text-center">
          Mã OTP đã được gửi tới <strong>{loginCredentials.username}</strong>.
          Vui lòng nhập mã để hoàn tất đăng nhập.
        </p>

        {/* Thông báo lỗi (nếu cần, tương tự form Quên mật khẩu) */}
        {/* {alert.show && (...)} */}

        <Form.Group className="mb-3">
          <Form.Label>Mã OTP</Form.Label>
          <InputGroup>
            <Form.Control
              type="text"
              value={otpLoginCode}
              onChange={(e) => setOtpLoginCode(e.target.value)}
              placeholder="Nhập mã OTP"
              required
            />
            <Button
              variant="outline-secondary"
              onClick={() => handleSendLoginOtp()} // Gửi lại
              disabled={loginCountdown > 0 || isSendingLoginOtp}
            >
              {isSendingLoginOtp
                ? "Đang gửi..."
                : loginCountdown > 0
                  ? `Gửi lại sau (${loginCountdown}s)`
                  : "Gửi lại mã"}
            </Button>
          </InputGroup>
        </Form.Group>

        <Button
          variant="primary"
          type="submit"
          className="w-100 fw-semibold"
          disabled={isVerifyingLoginOtp}
        >
          {isVerifyingLoginOtp ? (
            <Spinner as="span" animation="border" size="sm" />
          ) : (
            "Xác nhận & Đăng nhập"
          )}
        </Button>
      </Form>
      <div className="text-center mt-4">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setIsOtpKickMode(false); // Quay lại form đăng nhập
          }}
          className={styles["register-link"]}
        >
          &larr; Quay lại
        </a>
      </div>
    </>
  );

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
            {isForgotPasswordMode
              ? renderForgotPasswordForm()
              : isOtpKickMode
                ? renderOtpKickForm()
                : renderLoginForm()}
          </Card.Body>
        </Card>
      </div>
    </>
  );
};

export default LoginPage;
