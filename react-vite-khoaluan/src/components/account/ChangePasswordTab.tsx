import { useState, useEffect } from "react";
import {
  Form,
  Button,
  Row,
  Col,
  Spinner,
  InputGroup,
  Alert,
  ListGroup,
  Modal, // Thêm Modal
} from "react-bootstrap";
import {
  BsEyeFill,
  BsEyeSlashFill,
  BsDeviceSsd, // Icon mới
  BsLaptop, // Icon mới
  BsPhone, // Icon mới
} from "react-icons/bs";
import { useAppSelector } from "@/redux/hooks";
import {
  callChangePassword,
  callSendOtpChangePassword,
  callVerifyOtpAndChangePassword,
} from "@/config/api";
import { notification } from "antd";
import { IBackendRes } from "@/types/backend"; // <-- Giả sử import này tồn tại
import instance from "@/config/axios-customize";

// === CÁC INTERFACE MỚI ===

// Interface cho một phiên đăng nhập
interface ISession {
  id: number;
  ipAddress: string;
  userAgent: string;
  lastUsedAt: string;
  createdAt: string;
  current: boolean;
}

// Interface cho response của access token (từ comment trong axios-customize.ts)
interface AccessTokenResponse {
  access_token: string;
}

// === CÁC HÀM API MỚI ===
// (Lý tưởng nhất là các hàm này nên ở trong @/config/api.ts,
// nhưng tôi thêm chúng ở đây để bạn dễ dàng sao chép)

/**
 * Lấy danh sách tất cả các phiên đăng nhập.
 */
const callGetSessions = (): Promise<IBackendRes<ISession[]>> => {
  return instance.get("/api/v1/auth/sessions");
};

/**
 * Đăng xuất một hoặc nhiều phiên bằng ID.
 * @param ids - Mảng các ID của phiên cần đăng xuất
 */
const callLogoutSessions = (ids: number[]): Promise<IBackendRes<any>> => {
  // Gửi ID trong body của request DELETE
  return instance.delete("/api/v1/auth/sessions", { data: { ids } });
};

/**
 * Chủ động gọi endpoint /refresh để lấy access token mới.
 * Interceptor trong axios-custumize.ts sẽ tự động lưu token mới.
 */
const callRefreshToken = (): Promise<IBackendRes<AccessTokenResponse>> => {
  // Thêm header 'x-no-retry' để ngăn interceptor 401
  // cố gắng refresh một request refresh (tránh vòng lặp vô hạn).
  return instance.get("/api/v1/auth/refresh", {
    headers: { [Symbol.for("x-no-retry")]: "true" },
  });
};

/**
 * Hàm hỗ trợ phân tích User Agent đơn giản.
 * @param ua - Chuỗi User Agent
 * @returns Object chứa icon và mô tả
 */
const parseUserAgent = (ua: string) => {
  let icon = <BsDeviceSsd />;
  let description = "Thiết bị không xác định";

  if (ua.includes("PostmanRuntime")) {
    description = "Postman API Client";
  } else if (
    ua.includes("Mobile") ||
    ua.includes("iPhone") ||
    ua.includes("Android")
  ) {
    icon = <BsPhone />;
    description = "Thiết bị di động";
  } else if (
    ua.includes("Windows") ||
    ua.includes("Macintosh") ||
    ua.includes("Linux")
  ) {
    icon = <BsLaptop />;
    description = "Máy tính";
  }

  // Cố gắng tìm trình duyệt
  let browser = "Trình duyệt không xác định";
  if (ua.includes("Chrome") && !ua.includes("Edg")) browser = "Chrome";
  else if (ua.includes("Safari") && !ua.includes("Chrome")) browser = "Safari";
  else if (ua.includes("Firefox")) browser = "Firefox";
  else if (ua.includes("Edg")) browser = "Edge";
  else if (ua.includes("Opera") || ua.includes("OPR")) browser = "Opera";

  if (description !== "Postman API Client") {
    description = `${browser} trên ${description}`;
  }

  return { icon, description };
};

// === COMPONENT CHÍNH ===

interface IAlert {
  show: boolean;
  variant: "success" | "danger";
  message: string;
}

const ChangePasswordTab = () => {
  const user = useAppSelector((state) => state.account.user);

  // === STATE GỐC ===
  const [oldPassword, setOldPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showOld, setShowOld] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [isOtpMode, setIsOtpMode] = useState(false);
  const [otpEmail, setOtpEmail] = useState(user.email);
  const [otpCode, setOtpCode] = useState("");
  const [newPasswordOtp, setNewPasswordOtp] = useState("");
  const [confirmPasswordOtp, setConfirmPasswordOtp] = useState("");
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [alert, setAlert] = useState<IAlert>({
    show: false,
    variant: "success",
    message: "",
  });
  const [countdown, setCountdown] = useState(0);
  const [isRequestingOtp, setIsRequestingOtp] = useState(false);

  // === STATE MỚI ===
  // Quản lý chế độ xem: 'change' (đổi mật khẩu) hoặc 'sessions' (quản lý phiên)
  const [viewMode, setViewMode] = useState<"change" | "sessions">("change");
  // State cho danh sách phiên
  const [sessions, setSessions] = useState<ISession[]>([]);
  const [isLoadingSessions, setIsLoadingSessions] = useState(false);
  // State cho modal xác nhận đăng xuất
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [sessionToLogout, setSessionToLogout] = useState<number[] | null>(null);
  const [logoutType, setLogoutType] = useState<"single" | "other">("single");
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  // Effect xử lý bộ đếm ngược (giữ nguyên)
  useEffect(() => {
    if (countdown <= 0) return;
    const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    return () => clearTimeout(timer);
  }, [countdown]);

  // === EFFECT MỚI ===
  // Tự động tải danh sách phiên khi chuyển sang view 'sessions'
  useEffect(() => {
    if (viewMode === "sessions") {
      fetchSessions();
    }
  }, [viewMode]);

  // === HÀM MỚI: Tải danh sách phiên ===
  const fetchSessions = async () => {
    setIsLoadingSessions(true);
    try {
      const res = await callGetSessions();
      if (res?.statusCode === 200 && Array.isArray(res.data)) {
        // Sắp xếp: thiết bị hiện tại lên đầu, sau đó theo lastUsedAt
        const sortedSessions = res.data.sort((a, b) => {
          if (a.current) return -1;
          if (b.current) return 1;
          return (
            new Date(b.lastUsedAt).getTime() - new Date(a.lastUsedAt).getTime()
          );
        });
        setSessions(sortedSessions);
      } else {
        notification.error({
          message: "Lỗi",
          description:
            res?.message ?? "Không thể tải danh sách phiên đăng nhập.",
        });
      }
    } catch (error: any) {
      notification.error({
        message: "Lỗi",
        description: error?.message ?? "Lỗi khi tải phiên đăng nhập.",
      });
    }
    setIsLoadingSessions(false);
  };

  // === HÀM MỚI: Xử lý đăng xuất, làm mới token và tải lại ===
  // === HÀM XỬ LÝ ĐĂNG XUẤT (ĐÃ CẬP NHẬT VỚI DELAY) ===
  const handleLogout = async () => {
    if (!sessionToLogout) return;

    setIsLoggingOut(true);
    try {
      // Bước 1: Gọi API đăng xuất
      const logoutRes = await callLogoutSessions(sessionToLogout);
      if (logoutRes?.statusCode !== 200) {
        throw new Error(logoutRes?.message ?? "Đăng xuất thất bại.");
      }

      notification.success({
        message: "Đăng xuất thành công.",
        description: "Đang làm mới phiên và tải lại danh sách...",
      });

      // Bước 2: Chủ động gọi refresh token
      let tokenSaved = false;
      try {
        const res = await callRefreshToken();
        if (res && res.data && res.data.access_token) {
          // **SỬA LỖI QUAN TRỌNG: Phải lưu token mới vào localStorage**
          window.localStorage.setItem("access_token", res.data.access_token);
          tokenSaved = true;
        } else {
          throw new Error(
            res?.message ?? "Làm mới token thành công nhưng không có token."
          );
        }
      } catch (refreshError: any) {
        notification.error({
          message: "Lỗi làm mới Token",
          description:
            refreshError?.message ??
            "Không thể chủ động làm mới token, đang thử tải lại...",
        });
        // Dù lỗi, vẫn thử tiếp, biết đâu interceptor 401 sẽ xử lý
      }

      // **YÊU CẦU CỦA BẠN: Thêm delay 2 giây**
      notification.info({
        message: "Đang đồng bộ phiên...",
        description: "Vui lòng chờ trong 2 giây.",
        duration: 2,
      });

      // Tạo một hàm delay dựa trên Promise
      const delay = (ms: number) =>
        new Promise((resolve) => setTimeout(resolve, ms));

      // Chờ 2 giây
      await delay(2000);

      // Bước 3: Tải lại danh sách phiên
      // Interceptor của axios BÂY GIỜ sẽ đọc token mới (từ Bước 2)
      // và máy chủ đã có 2s để đồng bộ.
      await fetchSessions();

      // Mọi thứ thành công, đóng modal và reset state
      setIsLoggingOut(false);
      setShowConfirmModal(false);
      setSessionToLogout(null);
    } catch (error: any) {
      notification.error({
        message: "Lỗi trong quá trình đăng xuất",
        description: error?.message ?? "Đã có lỗi xảy ra.",
      });
      // Đặt lại state ngay cả khi lỗi
      setIsLoggingOut(false);
      setShowConfirmModal(false);
      setSessionToLogout(null);
    }
  };

  // === HÀM MỚI: Mở modal xác nhận đăng xuất 1 thiết bị ===
  const promptLogoutSingle = (id: number) => {
    setSessionToLogout([id]);
    setLogoutType("single");
    setShowConfirmModal(true);
  };

  // === HÀM MỚI: Mở modal xác nhận đăng xuất các thiết bị khác ===
  const promptLogoutAllOther = () => {
    const otherIds = sessions.filter((s) => !s.current).map((s) => s.id);

    if (otherIds.length === 0) {
      notification.info({
        message: "Thông báo",
        description: "Không có thiết bị nào khác để đăng xuất.",
      });
      return;
    }

    setSessionToLogout(otherIds);
    setLogoutType("other");
    setShowConfirmModal(true);
  };

  // === HÀM CẬP NHẬT: handleSubmitWithOldPassword ===
  const handleSubmitWithOldPassword = async (
    e: React.FormEvent<HTMLFormElement>
  ) => {
    e.preventDefault();
    setAlert({ ...alert, show: false });

    if (newPassword !== confirmPassword) {
      setAlert({
        show: true,
        variant: "danger",
        message: "Mật khẩu mới không khớp!",
      });
      return;
    }

    setIsSubmitting(true);
    const res = await callChangePassword(oldPassword, newPassword);
    setIsSubmitting(false);

    if (res?.statusCode === 200) {
      notification.success({
        message: "Thành công!",
        description: res.message,
      });
      // Reset form
      setOldPassword("");
      setNewPassword("");
      setConfirmPassword("");

      // === LOGIC MỚI ===
      // Tự động chuyển sang view quản lý phiên
      setViewMode("sessions");
      // === KẾT THÚC LOGIC MỚI ===
    } else {
      notification.error({
        message: "Có lỗi xảy ra!",
        description: res?.message ?? "Không thể đổi mật khẩu.",
      });
    }
  };

  // Hàm handleRequestOtp (giữ nguyên)
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
    setIsRequestingOtp(false);

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
  };

  // === HÀM CẬP NHẬT: handleSubmitWithOtp ===
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
      otpEmail!,
      otpCode,
      newPasswordOtp
    );
    setIsVerifyingOtp(false);

    if (res?.statusCode === 200) {
      notification.success({
        message: "Thành công!",
        description: "Đổi mật khẩu thành công.",
      });

      // === LOGIC MỚI ===
      // Reset state OTP
      setOtpSent(false);
      setCountdown(0);
      setOtpEmail(user.email); // Reset về email mặc định
      setOtpCode("");
      setNewPasswordOtp("");
      setConfirmPasswordOtp("");
      // Tự động chuyển sang view quản lý phiên
      setViewMode("sessions");
      // Giữ isOtpMode = true để nút "Quay lại" (nếu có) từ sessions view biết đường về
      // Hoặc reset nó nếu muốn "Quay lại" từ sessions view luôn về form đổi mk chính
      setIsOtpMode(false); // Reset về trạng thái ban đầu
      // === KẾT THÚC LOGIC MỚI ===
    } else {
      notification.error({
        message: "Có lỗi xảy ra!",
        description: res?.message ?? "Mã OTP không hợp lệ hoặc đã hết hạn.",
      });
    }
  };

  // === HÀM CẬP NHẬT: renderDefaultForm ===
  const renderDefaultForm = () => (
    <Form onSubmit={handleSubmitWithOldPassword}>
      {alert.show && (
        <Alert
          variant={alert.variant}
          onClose={() => setAlert({ ...alert, show: false })}
          dismissible
        >
          {alert.message}
        </Alert>
      )}
      {/* ... (Các trường Form.Group cho Mật khẩu cũ, mới, xác nhận giữ nguyên) ... */}
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Mật khẩu cũ</Form.Label>
            <InputGroup>
              <Form.Control
                type={showOld ? "text" : "password"}
                value={oldPassword}
                onChange={(e) => setOldPassword(e.target.value)}
                required
              />
              <InputGroup.Text onClick={() => setShowOld(!showOld)}>
                {showOld ? <BsEyeSlashFill /> : <BsEyeFill />}
              </InputGroup.Text>
            </InputGroup>
          </Form.Group>
        </Col>
      </Row>
      <Row>
        <Col md={6}>
          <Form.Group className="mb-3">
            <Form.Label>Mật khẩu mới</Form.Label>
            <InputGroup>
              <Form.Control
                type={showNew ? "text" : "password"}
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
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
        disabled={isSubmitting}
        className="update-btn"
      >
        {isSubmitting ? (
          <>
            <Spinner as="span" animation="border" size="sm" /> &nbsp; Đang xử
            lý...
          </>
        ) : (
          "Lưu thay đổi"
        )}
      </Button>

      {/* === DIV CẬP NHẬT === */}
      <div className="mt-3 d-flex justify-content-between">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setIsOtpMode(true);
          }}
          className="text-primary"
          style={{ textDecoration: "none" }}
        >
          Quên mật khẩu?
        </a>

        {/* === LINK MỚI === */}
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            setViewMode("sessions");
          }}
          className="text-primary"
          style={{ textDecoration: "none" }}
        >
          Quản lý phiên đăng nhập
        </a>
        {/* === KẾT THÚC LINK MỚI === */}
      </div>
    </Form>
  );

  // === HÀM CẬP NHẬT: renderOtpForm ===
  const renderOtpForm = () => (
    <div>
      {!otpSent ? (
        // ... (Form gửi OTP giữ nguyên) ...
        <Form
          onSubmit={(e) => {
            e.preventDefault();
            handleRequestOtp();
          }}
        >
          <p>Vui lòng nhập email của bạn để nhận mã xác thực.</p>
          <Row>
            <Col md={8}>
              <Form.Group className="mb-3">
                <Form.Label>Email</Form.Label>
                <InputGroup>
                  <Form.Control
                    type="email"
                    value={otpEmail!}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    placeholder="Nhập email của bạn"
                    required
                  />
                  <Button
                    type="submit"
                    variant="primary"
                    disabled={isRequestingOtp}
                    className="update-btn"
                  >
                    {isRequestingOtp ? "Đang gửi..." : "Gửi mã"}
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
        </Form>
      ) : (
        // ... (Form nhập OTP và mật khẩu mới giữ nguyên) ...
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
            Một mã OTP đã được gửi tới email <strong>{otpEmail}</strong>. Vui
            lòng kiểm tra và nhập vào bên dưới.
          </p>
          <Row>
            <Col md={8}>
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
                    {countdown > 0
                      ? `Gửi lại sau (${countdown}s)`
                      : "Gửi lại mã"}
                  </Button>
                </InputGroup>
              </Form.Group>
            </Col>
          </Row>
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
          <Button variant="primary" type="submit" disabled={isVerifyingOtp}>
            {isVerifyingOtp ? "Đang xác thực..." : "Xác nhận và đổi mật khẩu"}
          </Button>
        </Form>
      )}

      {/* Nút "Quay lại" này chỉ quay lại form đổi mật khẩu chính */}
      <div className="mt-3">
        <a
          href="#"
          onClick={(e) => {
            e.preventDefault();
            // === LOGIC CẬP NHẬT ===
            // Chỉ cần tắt chế độ OTP là đủ
            setIsOtpMode(false);
            // Reset state liên quan đến OTP để nếu người dùng bấm "Quên mật khẩu" lần nữa
            // thì không bị sót lại state cũ (trừ email)
            setOtpSent(false);
            setCountdown(0);
            setOtpCode("");
            // === KẾT THÚC LOGIC CẬP NHẬT ===
          }}
          className="text-primary"
          style={{ textDecoration: "none" }}
        >
          Quay lại
        </a>
      </div>
    </div>
  );

  // === HÀM RENDER MỚI: Quản lý phiên đăng nhập ===
  const renderManageSessions = () => (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h5 className="mb-0">Quản lý phiên đăng nhập</h5>
          <p className="text-muted mb-0" style={{ fontSize: "0.9rem" }}>
            Các thiết bị đang đăng nhập vào tài khoản của bạn.
          </p>
        </div>
        <Button
          variant="outline-secondary"
          size="sm"
          onClick={() => setViewMode("change")}
          disabled={isLoggingOut}
        >
          Quay lại
        </Button>
      </div>

      <Button
        variant="danger"
        className="mb-3 update-btn" // Sử dụng class cũ cho đồng bộ
        onClick={promptLogoutAllOther}
        disabled={
          isLoadingSessions ||
          isLoggingOut ||
          sessions.filter((s) => !s.current).length === 0
        }
      >
        {isLoggingOut ? "..." : "Đăng xuất tất cả thiết bị khác"}
      </Button>

      {isLoadingSessions ? (
        <div className="text-center my-4">
          <Spinner animation="border" variant="primary" />
          <p className="mt-2 text-muted">Đang tải danh sách phiên...</p>
        </div>
      ) : sessions.length > 0 ? (
        <ListGroup variant="flush">
          {sessions.map((session) => {
            const { icon, description } = parseUserAgent(session.userAgent);
            return (
              <ListGroup.Item
                key={session.id}
                className="px-0 py-3 d-flex justify-content-between align-items-center"
              >
                <div className="d-flex align-items-center">
                  <span className="fs-3 me-3 text-muted">{icon}</span>
                  <div>
                    <strong className="d-block text-dark">
                      {description}
                      {session.current && (
                        <span
                          className="badge bg-success ms-2"
                          style={{
                            fontSize: "0.7rem",
                            verticalAlign: "middle",
                          }}
                        >
                          Thiết bị này
                        </span>
                      )}
                    </strong>
                    <small className="text-muted d-block">
                      IP: {session.ipAddress}
                    </small>
                    <small className="text-muted">
                      Hoạt động lần cuối:{" "}
                      {new Date(session.lastUsedAt).toLocaleString("vi-VN")}
                    </small>
                  </div>
                </div>
                <div>
                  {!session.current && (
                    <Button
                      variant="outline-danger"
                      size="sm"
                      onClick={() => promptLogoutSingle(session.id)}
                      disabled={isLoggingOut}
                    >
                      Đăng xuất
                    </Button>
                  )}
                </div>
              </ListGroup.Item>
            );
          })}
        </ListGroup>
      ) : (
        <p className="text-muted text-center">
          Không tìm thấy phiên đăng nhập nào.
        </p>
      )}

      {/* Modal xác nhận đăng xuất */}
      <Modal
        show={showConfirmModal}
        onHide={() => !isLoggingOut && setShowConfirmModal(false)}
        centered
      >
        <Modal.Header closeButton={!isLoggingOut}>
          <Modal.Title>Xác nhận đăng xuất</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {logoutType === "single"
            ? "Bạn có chắc chắn muốn đăng xuất khỏi thiết bị này không?"
            : `Bạn có chắc chắn muốn đăng xuất khỏi ${
                sessionToLogout?.length ?? 0
              } thiết bị khác không?`}
        </Modal.Body>
        <Modal.Footer>
          <Button
            variant="secondary"
            onClick={() => setShowConfirmModal(false)}
            disabled={isLoggingOut}
          >
            Hủy
          </Button>
          <Button
            variant="danger"
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? (
              <>
                <Spinner as="span" size="sm" animation="border" /> Đang xử lý...
              </>
            ) : (
              "Xác nhận"
            )}
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );

  // === HÀM RETURN CHÍNH (ĐÃ CẬP NHẬT) ===
  return (
    <div className="change-password-container p-3">
      {/* Thứ tự render:
        1. Nếu viewMode là 'sessions', render Quản lý phiên.
        2. Nếu không, kiểm tra isOtpMode:
           - Nếu isOtpMode là true, render Form OTP.
           - Nếu isOtpMode là false, render Form Đổi mật khẩu (mặc định).
      */}
      {viewMode === "sessions"
        ? renderManageSessions()
        : isOtpMode
          ? renderOtpForm()
          : renderDefaultForm()}
    </div>
  );
};

export default ChangePasswordTab;
