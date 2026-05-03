// src/components/account/VipAccountTab.tsx

import { useEffect, useState } from "react";
import { useAppSelector } from "@/redux/hooks";
import {
  Button,
  Modal,
  ListGroup,
  Card,
  Alert,
  Spinner,
} from "react-bootstrap";
// SỬA ĐỔI Ở ĐÂY: Thay Crown bằng AwardFill
import { AwardFill, Gem } from "react-bootstrap-icons";
import { callCreateVipPaymentUrl } from "@/config/api";
import { toast } from "react-toastify";

const VipAccountTab = () => {
  const user = useAppSelector((state) => state.account.user);
  const [showBenefitsModal, setShowBenefitsModal] = useState(false);
  const [isCreatingUrl, setIsCreatingUrl] = useState(false);
  const [countdown, setCountdown] = useState<string>("");

  // THÊM MỚI: useEffect để tính toán và cập nhật countdown
  useEffect(() => {
    if (user.vip && user.vipExpiryDate) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiryTime = new Date(user.vipExpiryDate!).getTime();
        const distance = expiryTime - now;

        if (distance < 0) {
          setCountdown("Tài khoản VIP của bạn đã hết hạn.");
          clearInterval(interval);
          return;
        }

        const days = Math.floor(distance / (1000 * 60 * 60 * 24));
        const hours = Math.floor(
          (distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
        );
        const minutes = Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60));
        const seconds = Math.floor((distance % (1000 * 60)) / 1000);

        setCountdown(
          `Thời gian còn lại: ${days} ngày ${hours} giờ ${minutes} phút ${seconds} giây`
        );
      }, 1000);

      // Cleanup function để xóa interval khi component unmount
      return () => clearInterval(interval);
    }
  }, [user.vip, user.vipExpiryDate]);

  const handleRegisterVip = async () => {
    setIsCreatingUrl(true);
    try {
      const res = await callCreateVipPaymentUrl();
      const paymentUrl = res?.data?.url;

      if (paymentUrl) {
        window.location.href = paymentUrl;
      } else {
        throw new Error("Không nhận được URL thanh toán từ máy chủ.");
      }
    } catch (error) {
      toast.error("Có lỗi xảy ra, không thể tạo yêu cầu thanh toán.");
      setIsCreatingUrl(false);
    }
  };

  return (
    <div className="vip-account-container p-3">
      <Card>
        <Card.Header as="h5" className="d-flex align-items-center">
          <Gem size={24} className="me-2 text-warning" />
          Quản lý tài khoản VIP
        </Card.Header>
        <Card.Body className="text-center">
          {user.vip ? (
            <Alert variant="success">
              <Alert.Heading>
                {/* SỬA ĐỔI Ở ĐÂY: Dùng AwardFill thay cho Crown */}
                <AwardFill size={30} className="me-2" />
                Bạn đang là thành viên VIP!
              </Alert.Heading>
              <p>
                Cảm ơn bạn đã đồng hành. Hãy tận hưởng những đặc quyền dành
                riêng cho thành viên VIP.
              </p>
              {/* SỬA ĐỔI: Hiển thị countdown */}
              {countdown && (
                <p
                  className="mb-0 fw-bold"
                  style={{
                    color: countdown.startsWith("Tài khoản")
                      ? "red"
                      : "inherit",
                  }}
                >
                  {countdown}
                </p>
              )}
            </Alert>
          ) : (
            <>
              <Card.Title>Nâng cấp lên tài khoản VIP</Card.Title>
              <Card.Text>
                Mở khóa toàn bộ tiềm năng của bạn với các quyền lợi độc quyền
                dành cho thành viên VIP.
              </Card.Text>
            </>
          )}

          <div className="d-flex justify-content-center gap-2 mt-4">
            {!user.vip && (
              <Button
                variant="primary"
                className="update-btn"
                size="lg"
                onClick={handleRegisterVip}
                disabled={isCreatingUrl}
              >
                {isCreatingUrl ? (
                  <>
                    <Spinner as="span" animation="border" size="sm" /> &nbsp;
                    Đang xử lý...
                  </>
                ) : (
                  "Đăng ký VIP ngay"
                )}
              </Button>
            )}
            <Button
              variant="outline-primary"
              size="lg"
              onClick={() => setShowBenefitsModal(true)}
              className="view-vip"
            >
              Xem quyền lợi VIP
            </Button>
          </div>
        </Card.Body>
      </Card>

      <Modal
        show={showBenefitsModal}
        onHide={() => setShowBenefitsModal(false)}
        centered
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <Gem size={22} className="me-2 text-warning" />
            Quyền lợi tài khoản VIP
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>Khi trở thành thành viên VIP, bạn sẽ nhận được:</p>
          <ListGroup variant="flush">
            <ListGroup.Item>
              ✨ **Hồ sơ nổi bật:** CV của bạn sẽ được ưu tiên hiển thị cho nhà
              tuyển dụng.
            </ListGroup.Item>
            <ListGroup.Item>
              🚀 **Ứng tuyển không giới hạn:** Gửi CV đến bất kỳ công việc nào
              bạn muốn.
            </ListGroup.Item>
            <ListGroup.Item>
              📊 **Phân tích CV chuyên sâu:** Nhận báo cáo chi tiết về điểm
              mạnh, điểm yếu của CV.
            </ListGroup.Item>
            <ListGroup.Item>
              📞 **Hỗ trợ ưu tiên:** Các yêu cầu của bạn sẽ được xử lý nhanh
              chóng.
            </ListGroup.Item>
            <ListGroup.Item>
              뱃 **Huy hiệu VIP:** Huy hiệu đặc biệt trên ảnh đại diện của bạn,
              tạo sự khác biệt.
            </ListGroup.Item>
          </ListGroup>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={() => setShowBenefitsModal(false)}>
            Đóng
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default VipAccountTab;
